import _ from 'lodash';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import matchPath from '../utils/matchPath';
import { Modal as BsModal } from 'react-bootstrap';
import { useClient } from '../utils/client';

// accounts
import ChangeAccountModal from './accounts/ChangeAccountModal';
import ChangePasswordModal from './accounts/ChangePasswordModal';
import ConfirmAccountModal from './accounts/ConfirmAccountModal';
import EditProfileModal from './accounts/EditProfileModal';
import ResetPasswordModal from './accounts/ResetPasswordModal';
import SignInModal from './accounts/SignInModal';
import SignOutModal from './accounts/SignOutModal';
import SignUpModal from './accounts/SignUpModal';
import WithdrawModal from './accounts/WithdrawModal';

// courses
import CourseEditModal from './courses/CourseEditModal';
import LessonEditModal from './courses/LessonEditModal';
import QuestionEditModal from './courses/QuestionEditModal';
import SectionEditModal from './courses/SectionEditModal';

// home
import CheckoutModal from './CheckoutModal';
import ContactModal from './ContactModal';
import SponsorModal from './SponsorModal';


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
    const routes = useMemo(() => {
        return [
            {
                pattern: `${ModalPathPrefix}/contact`,
                modal: ContactModal
            },
            {
                pattern: `${ModalPathPrefix}/sponsor`,
                modal: SponsorModal
            },
            {
                pattern: `${ModalPathPrefix}/accounts/signup`,
                modal: SignUpModal
            },
            {
                pattern: `${ModalPathPrefix}/accounts/signin`,
                modal: SignInModal
            },
            {
                pattern: `${ModalPathPrefix}/accounts/signout`,
                modal: SignOutModal
            },
            {
                pattern: `${ModalPathPrefix}/accounts/profile/edit`,
                modal: EditProfileModal,
                authenticate: true
            },
            {
                pattern: `${ModalPathPrefix}/accounts/password/change`,
                modal: ChangePasswordModal,
                authenticate: true
            },
            {
                pattern: `${ModalPathPrefix}/accounts/account/change`,
                modal: ChangeAccountModal,
                authenticate: true
            },
            {
                pattern: `${ModalPathPrefix}/accounts/confirm`,
                modal: ConfirmAccountModal
            },
            {
                pattern: `${ModalPathPrefix}/accounts/password/reset`,
                modal: ResetPasswordModal
            },
            {
                pattern: `${ModalPathPrefix}/accounts/withdraw`,
                modal: WithdrawModal,
                authenticate: true
            },
            {
                pattern: [`${ModalPathPrefix}/courses/:action(add)`, `${ModalPathPrefix}/courses/:courseId/:action(edit|delete)`],
                modal: CourseEditModal,
                authenticate: true,
            },
            {
                pattern: [`${ModalPathPrefix}/courses/:courseId/sections/:action(add)`, `${ModalPathPrefix}/courses/:courseId/sections/:sectionId/:action(edit|delete)`],
                modal: SectionEditModal,
                authenticate: true,
            },
            {
                pattern: [`${ModalPathPrefix}/courses/:courseId/sections/:sectionId/lessons/:action(add)`, `${ModalPathPrefix}/courses/:courseId/sections/:sectionId/lessons/:lessonId/:action(edit|delete)`],
                modal: LessonEditModal,
                authenticate: true,
            },
            {
                pattern: [`${ModalPathPrefix}/courses/:courseId/sections/:sectionId/lessons/:lessonId/questions/:action(add)`, `${ModalPathPrefix}/courses/:courseId/sections/:sectionId/lessons/:lessonId/questions/:questionId/:action(edit|delete)`],
                modal: QuestionEditModal,
                authenticate: true,
            },
            {
                pattern: `${ModalPathPrefix}/checkout`,
                modal: CheckoutModal,
            },
        ];
    }, []);
    const router = useRouter();
    const [route, setRoute] = useState(null);

    const [modalProps, setModalProps] = useState(DefaultModalProps);

    const modal = {
        close: () => {
            setModalProps((modalProps) => ({ ...modalProps, show: false }));
            setRoute(null);
        },
        open: (url, abort = true) => {
            const abortRouteChange = (url) => { throw `Route change to "${url}" was aborted (this error can be safely ignored).`; };

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
                    const ModalBody = currentRoute.modal;

                    const updateModalProps = (modalProps) => setModalProps(_modalProps => ({ ..._modalProps, ...modalProps }))

                    setModalProps(() => ({ ...DefaultModalProps, ...(ModalBody.getModalProps && ModalBody.getModalProps() || {}), show: true, onHide: () => modal.close() }));

                    setRoute({ ...currentRoute, component: (<ModalBody {...{ route: currentRoute, modal, updateModalProps }} />) });
                }

                if (abort) abortRouteChange(url);
            }
            else {
                modal.close();
            }

            return currentRoute != null;
        },
    };

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