import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Oidc, { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { AsyncLocker } from './helpers';
import queryString from 'qs';
import { useSessionState, withAsync } from './hooks';
import { useEventDispatcher } from './eventDispatcher';
import axios from 'axios';
import * as https from 'https';

const http = axios.create();

const createHttpClient = (defaultConfig, ctx) => {

    defaultConfig = Object.assign({}, {
        baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
        paramsSerializer: params => {
            return queryString.stringify(params)
        },
        headers: ctx?.req?.headers?.cookie ? { cookie: ctx.req.headers.cookie } : undefined,
        withCredentials: true,
        httpsAgent: typeof window === 'undefined' ? new https.Agent({ rejectUnauthorized: false }) : undefined
    }, defaultConfig);

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
                                message: 'Please check your internet connection and try again.',
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

    let [clientSettings, setClientSettings] = withAsync(useSessionState(null, `client-${clientId}`));

    const asyncLocker = useMemo(() => new AsyncLocker());
    const userManagerRef = useRef(null);
    let [user, setUser] = withAsync(useState(null));
    let [userContext, setUserContext] = withAsync(useState(null));
    const [initialized, setInitialized] = useState(false);

    const disablePopup = true;

    const httpClient = createHttpClient({
        headers: (() => {
            const accessToken = userContext?.access_token;
            const headers = {
                'Authorization': accessToken ? `Bearer ${accessToken}` : ''
            }
            return headers;
        })(),
        throwIfError: false
    });

    const loadUserManager = async () => {
        const lock = asyncLocker.createLock();
        try {
            await lock.promise;

            if (!userManagerRef.current) {
                clientSettings = clientSettings || await (async () => {
                    return {
                        ...await setClientSettings((await httpClient.get(`/_configuration/${clientId}`, { throwIfError: true })).data),
                    };
                })();

                const userManager = new UserManager({
                    ...clientSettings,
                    automaticSilentRenew: true,
                    includeIdTokenInSilentRenew: true,
                    loadUserInfo: false,
                    userStore: new WebStorageStateStore({
                        prefix: 'web'
                    }),
                    prompt: 'login',
                    monitorSession: true
                });

                userManagerRef.current = userManager;
            }

            return userManagerRef.current;
        }
        finally {
            lock.release();
        }
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

    const getReturnUrl = (state) => {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('returnUrl');
        if (fromQuery && !fromQuery.startsWith(`${window.location.origin}/`)) {
            // This is an extra check to prevent open redirects.
            throw new Error("Invalid return url. The return url needs to have the same origin as the current page.")
        }
        return (state && state.returnUrl) || fromQuery || `${window.location.origin}`;
    };

    const reloadUser = async () => {
        const currentUser = (await httpClient.get(`/accounts/profile`, { throwIfError: true })).data.data;
        await setUser(currentUser);
    };

    const updateUser = (state) => {
        setUser(_user => ({ ..._user, ...state }));
    };

    const signin = async (state) => {
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
    };

    const signout = async (state) => {
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
    };

    const initialize = async () => {
        try {
            let userManager = null
            try { userManager = await loadUserManager(); }
            catch (ex) { console.error(ex); return; }

            const currentURL = new URL(window.location.href);
            const signinURL = new URL(clientSettings.redirect_uri);
            const signoutURL = new URL(clientSettings.post_logout_redirect_uri);

            if (currentURL.pathname == signinURL.pathname) {
                try {
                    const context = await userManager.signinCallback();

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
            }
            else if (currentURL.pathname == signoutURL.pathname) {
                try {
                    const context = await userManager.signoutCallback();
                    router.replace(getReturnUrl(context?.state));
                }
                catch (callbackError) {
                    console.error("Signout callback authentication error: ", callbackError);
                }
            }
            else {
                try {
                    const context = await userManager.signinSilent();
                    await loadUserContext(context);
                }
                catch (silentError) {
                    console.error("Silent authentication error: ", silentError);
                }
            }
        }
        finally {
            setInitialized(true);
        }
    };

    return {
        clientSettings,
        accessToken: userContext?.access_token,
        user: user,
        reloadUser,
        updateUser,
        signin,
        signout,
        initialize,
        initialized,
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