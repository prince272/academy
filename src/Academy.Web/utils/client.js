import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Oidc, { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { AsyncLocker } from './helpers';
import queryString from 'qs';
import { useSessionState, withAsync } from './hooks';
import { useEventDispatcher } from './eventDispatcher';
import axios from 'axios';
import * as https from 'https';
import { setupCache, buildMemoryStorage } from 'axios-cache-interceptor';

const http = axios.create();
setupCache(http, { storage: buildMemoryStorage() });

const createHttpClient = (defaultConfig) => {

    const serverSide = typeof window === 'undefined';

    defaultConfig = Object.assign({}, {
        baseURL: process.env.NEXT_PUBLIC_CLIENT_API,
        paramsSerializer: params => {
            return queryString.stringify(params)
        },
        withCredentials: true,
        cache: false,
    }, defaultConfig);

    if (serverSide) defaultConfig.httpsAgent = new https.Agent({ rejectUnauthorized: false });

    const request = async (config) => {
        config = Object.assign({}, defaultConfig, config);
        const { throwIfError, ...requestConfig } = config;

        if (throwIfError) {
            return (await http.request(requestConfig));
        }
        else {
            try {
                return (await http.request(requestConfig)).data;
            }
            catch (ex) {
                console.error(ex);

                if (ex.response) {
                    // client received an error response (5xx, 4xx)
                    return ex.response.data;
                }
                else {

                    if (ex.message === "Network Error") {
                        return {
                            error: {
                                message: 'Unable to access the network',
                                status: -1,
                                details: {},
                                reason: 'Network Error'
                            }
                        };
                    }
                    else {
                        return {
                            error: {
                                message: 'Oops! Something went wrong!',
                                status: 503,
                                details: {},
                                reason: ex.request ? 'ClientSide Error' : 'Unknown Error'
                            }
                        };
                    }
                }
            }
        }
    };

    return {
        get: async (url, config) => await request({ ...config, method: 'get', url }),
        delete: async (url, config) => await request({ ...config, method: 'delete', url }),
        post: async (url, data, config) => await request({ ...config, method: 'post', url, data }),
        put: async (url, data, config) => await request({ ...config, method: 'put', url, data }),
        patch: async (url, data, config) => await request({ ...config, method: 'patch', url, data }),
        request: async (config) => await request(config)
    };
};

const useClientProvider = () => {
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    const router = useRouter();
    const eventDispatcher = useEventDispatcher();

    const [loading, setLoading] = useState(true);
    let [clientSettings, setClientSettings] = withAsync(useSessionState(null, `client-${clientId}`));

    const userManagerLocker = useMemo(() => new AsyncLocker());
    const userManagerRef = useRef(null);
    let [user, setUser] = withAsync(useState(null));
    let [userContext, setUserContext] = withAsync(useState(null));

    const disablePopup = true;

    const httpClient = createHttpClient({
        headers: (() => {
            const accessToken = userContext?.access_token;
            const headers = {
                ...(!accessToken ? {} : { 'Authorization': `Bearer ${accessToken}` })
            }
            return headers;
        })(),
        throwIfError: false
    });

    const loadUserManager = async () => {
        const lock = userManagerLocker.createLock();
        try {
            await lock.promise;

            if (!userManagerRef.current) {
                clientSettings = clientSettings || await (async () => {
                    return {
                        ...await setClientSettings((await httpClient.get(`/clients/${clientId}`, { throwIfError: true })).data),
                        authority: process.env.NEXT_PUBLIC_CLIENT_API
                    };
                })();

                const userManager = new UserManager({
                    ...clientSettings,
                    automaticSilentRenew: false,
                    includeIdTokenInSilentRenew: false,
                    loadUserInfo: false,
                    userStore: new WebStorageStateStore({
                        prefix: 'web'
                    }),
                    monitorSession: true
                });

                const context = await userManager.getUser();
                if (context) await loadUserContext(context);

                userManager.events.addUserSignedOut(handleUserSignedOut);
                userManagerRef.current = userManager;
            }

            return userManagerRef.current;
        }
        finally {
            lock.release();
        }
    };

    const unloadUserManager = () => {
        if (userManagerRef.current != null) {
            const userManager = userManagerRef.current;
            userManager.events.removeUserSignedOut(handleUserSignedOut);
        }

        userManagerRef.current = null;
    };

    const loadUserContext = async (context) => {
        const currentUser = (await httpClient.get(`/accounts/profile`, { throwIfError: true })).data.data;
        await setUser(currentUser);
        await setUserContext(context);
    };

    const unloadUserContext = async () => {
        await setUser(null);
        await setUserContext(null);
    };

    const handleUserSignedOut = async () => {
        await unloadUserContext();
    };

    const getReturnUrl = (state) => {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('returnUrl');
        if (fromQuery && !fromQuery.startsWith(`${window.location.origin}/`)) {
            // This is an extra check to prevent open redirects.
            throw new Error("Invalid return url. The return url needs to have the same origin as the current page.")
        }
        return (state && state.returnUrl) || fromQuery || `${window.location.origin}`;
    };

    useEffect(() => {

        (async () => {
            try {
                await loadUserManager();
            }
            catch (ex) { console.error(ex); }

            setLoading(false);
        })();

        return () => unloadUserManager();
    }, []);

    return {
        loading,
        clientSettings,

        accessToken: userContext?.access_token,

        user: user,
        reloadUser: async () => {
            const currentUser = (await httpClient.get(`/accounts/profile`, { throwIfError: true })).data.data;
            await setUser(currentUser);
        },
        updateUser: (state) => {
            setUser(_user => ({ ..._user, ...state }));
        },
        signin: async (state) => {
            let userManager = null
            try { userManager = await loadUserManager(); }
            catch (ex) { console.error(ex); eventDispatcher.emit('signinError', state); return; }

            eventDispatcher.emit('signinStart', state);

            try {
                const context = await userManager.signinSilent({ state });
                await loadUserContext(context);
                eventDispatcher.emit('signinComplete', state);
            }
            catch (silentError) {

                console.error("Silent authentication error: ", silentError);

                try {
                    if (disablePopup) throw new Error('Popup authentication disabled.');

                    const context = await userManager.signinPopup({ state });
                    await loadUserContext(context);
                    eventDispatcher.emit('signinComplete', state);
                }
                catch (popupError) {
                    console.error("Popup authentication error: ", popupError);

                    try {
                        await userManager.signinRedirect({ state });
                    }
                    catch (redirectError) {
                        console.error("Redirect authentication error: ", redirectError);

                        eventDispatcher.emit('signinError', state);
                    }
                }
            }
        },

        signinCallback: async () => {
            let userManager = null
            try { userManager = await loadUserManager(); }
            catch (ex) { console.error(ex); return; }

            const currentUrl = window.location.href;
            try {
                const context = await userManager.signinCallback(currentUrl);

                // Signin with redirect usually provides a user context.
                // Consider notifing user context state manager and the events.
                if (context) {
                    await loadUserContext(context);
                    eventDispatcher.emit('signinComplete', context.state);
                }

                router.replace(getReturnUrl(context?.state));
            }
            catch (callbackError) {
                console.error("Signin callback authentication error: ", callbackError);
            }
        },

        signout: async (state) => {
            let userManager = null
            try { userManager = await loadUserManager(); }
            catch (ex) { console.error(ex); eventDispatcher.emit('signoutError', state); return; }

            eventDispatcher.emit('signoutStart', state);

            try {
                if (disablePopup) throw new Error('Popup authentication disabled.');

                await userManager.signoutPopup({ state });
                unloadUserContext();
                eventDispatcher.emit('signoutComplete', state);
            }
            catch (popupError) {
                console.error("Popup authentication error: ", popupError);

                try {
                    await userManager.signoutRedirect({ state });
                }
                catch (redirectError) {
                    console.error("Redirect authentication error: ", redirectError);

                    eventDispatcher.emit('signoutError', state);
                }
            }
        },

        signoutCallback: async () => {
            let userManager = null
            try { userManager = await loadUserManager(); }
            catch (ex) { console.error(ex); return; }

            const currentUrl = window.location.href;
            try {
                const context = await userManager.signoutCallback(currentUrl);
                router.replace(getReturnUrl(context?.state));
            }
            catch (callbackError) {
                console.error("Signout callback authentication error: ", callbackError);
            }
        },

        ...httpClient
    };
};

const ClientContext = createContext({});

const ClientProvider = ({ children }) => {

    const value = useClientProvider();

    return (
        <ClientContext.Provider value={value}>
            {children}
        </ClientContext.Provider>
    )
}

const ClientConsumer = ({ children }) => {
    return (
        <ClientContext.Consumer>
            {context => {
                if (context === undefined) {
                    throw new Error('ClientConsumer must be used within a ClientProvider.')
                }
                return children(context)
            }}
        </ClientContext.Consumer>
    )
}

const useClient = () => {
    return useContext(ClientContext);
};

export { ClientProvider, ClientConsumer, useClient, createHttpClient };