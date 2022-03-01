import _ from 'lodash';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import matchPath from '../utils/matchPath';
import { Modal as BsModal } from 'react-bootstrap';
import { useClient } from '../utils/client';

const DefaultModalProps = {
    centered: true,
    scrollable: true,
    size: 'md',
    fullscreen: 'sm-down',
    contentClassName: '',
    backdrop: 'static',
    animation: false
};

const ModalPathPrefix = "/modal";

const ModalContext = createContext({});

const useModalProvider = () => {
    const client = useClient();

    const router = useRouter();
    const [route, setRoute] = useState(null);
    const routesRef = useRef([]);
    const [loading, setLoading] = useState(true);

    const [modalProps, setModalProps] = useState(DefaultModalProps);

    const modal = {
        loading,
        close: () => {
            setModalProps((modalProps) => ({ ...modalProps, show: false }));
            setRoute(null);
        },
        open: (url, state, abort = true) => {
            const abortRouteChange = (url) => { throw `Route change to "${url}" was aborted (this error can be safely ignored).`; };

            const routes = routesRef.current;
            const currentRoute = routes.map(route => {
                const location = new URL(url, window.location.origin);
                const match = matchPath(location.pathname, { path: route.pattern, exact: true, strict: true });
                const query = { ...Object.fromEntries(location.searchParams), ...match?.params };
                return { ...route, match, query, url: location.href };
            }).filter(route => route.match != null)[0];

            if (currentRoute != null) {

                // Todo: navigations with state parameter would have it's value as null since redirecting
                // to sign in does not carry the state along.
                if (currentRoute.authenticate && !client.user) {
                    router.replace({ pathname: `${ModalPathPrefix}/accounts/signin`, query: { returnUrl: currentRoute.url } });
                }
                else {
                    const ModalBody = currentRoute.module.default;

                    const updateModalProps = (modalProps) => setModalProps(_modalProps => ({ ..._modalProps, ...modalProps }))

                    setModalProps(() => ({ ...DefaultModalProps, ...(ModalBody.getModalProps && ModalBody.getModalProps() || {}), show: true, onHide: () => modal.close() }));

                    setRoute({ ...currentRoute, component: (<ModalBody {...{ route: currentRoute, modal, updateModalProps, ...state }} />) });
                }

                if (abort) abortRouteChange(url);
            }
            else {
                modal.close();
            }

            return currentRoute != null;
        },
    };

    useEffect(() => {
        (async () => {
            const routes = [
                {
                    pattern: `${ModalPathPrefix}/contact`,
                    promise: import('./ContactModal')
                },
                {
                    pattern: `${ModalPathPrefix}/sponsor`,
                    promise: import('./SponsorModal')
                },
                {
                    pattern: `${ModalPathPrefix}/accounts/signup`,
                    promise: import('./accounts/SignUpModal')
                },
                {
                    pattern: `${ModalPathPrefix}/accounts/signin`,
                    promise: import('./accounts/SignInModal')
                },
                {
                    pattern: `${ModalPathPrefix}/accounts/signout`,
                    promise: import('./accounts/SignOutModal')
                },
                {
                    pattern: `${ModalPathPrefix}/accounts/settings`,
                    promise: import('./accounts/SettingsModal'),
                    authenticate: true
                },
                {
                    pattern: `${ModalPathPrefix}/accounts/confirm`,
                    promise: import('./accounts/ConfirmAccountModal')
                },
                {
                    pattern: `${ModalPathPrefix}/accounts/password/reset`,
                    promise: import('./accounts/ResetPasswordModal')
                },
                {
                    pattern: [`${ModalPathPrefix}/courses/:action(add)`, `${ModalPathPrefix}/courses/:courseId/:action(edit|delete)`],
                    promise: import('./courses/CourseEditModal'),
                    authenticate: true,
                },
                {
                    pattern: [`${ModalPathPrefix}/courses/:courseId/sections/:action(add)`, `${ModalPathPrefix}/courses/:courseId/sections/:sectionId/:action(edit|delete)`],
                    promise: import('./courses/SectionEditModal'),
                    authenticate: true,
                },
                {
                    pattern: [`${ModalPathPrefix}/courses/:courseId/sections/:sectionId/lessons/:action(add)`, `${ModalPathPrefix}/courses/:courseId/sections/:sectionId/lessons/:lessonId/:action(edit|delete)`],
                    promise: import('./courses/LessonEditModal'),
                    authenticate: true,
                },
                {
                    pattern: [`${ModalPathPrefix}/courses/:courseId/sections/:sectionId/lessons/:lessonId/questions/:action(add)`, `${ModalPathPrefix}/courses/:courseId/sections/:sectionId/lessons/:lessonId/questions/:questionId/:action(edit|delete)`],
                    promise: import('./courses/QuestionEditModal'),
                    authenticate: true,
                },
                {
                    pattern: `${ModalPathPrefix}/courses/:courseId/sections/:sectionId/lessons/:lessonId`,
                    promise: import('./courses/LessonViewModal'),
                    authenticate: true,
                },
                {
                    pattern: `${ModalPathPrefix}/payments/:paymentId/debit`,
                    promise: import('./payments/PaymentDebitModal'),
                },
            ];

            for (const route of routes) {
                const module = await route.promise;
                delete route.promise;

                route.module = module;
            }

            routesRef.current = routes;

            setLoading(false);
        })();

    }, []);

    const Modal = (<BsModal {...modalProps}>{(route?.component || (<></>))}</BsModal>);

    return { Modal, modal }
}

const ModalProvider = ({ children }) => {

    const { modal, Modal } = useModalProvider();

    return (
        <ModalContext.Provider value={modal}>
            {children}
            {Modal}
        </ModalContext.Provider>
    )
}

const ModalConsumer = ({ children }) => {
    return (
        <ModalContext.Consumer>
            {context => {
                if (context === undefined) {
                    throw new Error('ModalConsumer must be used within a ModalProvider')
                }
                return children(context)
            }}
        </ModalContext.Consumer>
    )
}

const useModal = () => {
    return useContext(ModalContext);
};

export { ModalProvider, ModalConsumer, useModal, ModalPathPrefix, DefaultModalProps };