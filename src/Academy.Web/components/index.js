import { Dropdown, Nav, Navbar, OverlayTrigger, Tooltip, Popover } from 'react-bootstrap';
import Link from 'next/link';
import { useClient } from '../utils/client';
import { cleanObject } from '../utils/helpers';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState, } from 'react';

import _ from 'lodash';
import { Toaster } from 'react-hot-toast';

import { ModalPathPrefix, ModalProvider, useModal } from '../modals';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { SvgAppWordmark, SvgFacebookLogo, SvgInstagramLogo, SvgLinkedinLogo, SvgTwitterLogo, SvgYoutubeLogo, SvgBitCube, SvgBitCubes } from '../resources/images/icons';
import { BsPerson, BsPersonFill } from 'react-icons/bs';
import { useSettings } from '../utils/settings';

const Header = () => {
    const client = useClient();
    const router = useRouter();
    const settings = useSettings();

    return (
        <Navbar id="header" collapseOnSelect bg="white" variant="light" expand="md" className="fixed-top shadow-sm">
            <div className="container">
                <Link href="/" passHref>
                    <Navbar.Brand className="me-auto">
                        <div className="svg-icon"><SvgAppWordmark style={{ width: "auto", height: "2.5rem" }} /></div>
                    </Navbar.Brand>
                </Link>

                {client.user && (
                    <>
                        <Nav.Item className=" me-2 order-md-3">
                            <OverlayTrigger trigger="click" rootClose placement="bottom" overlay={(popoverProps) => (
                                <Popover {...popoverProps} arrowProps={{ style: { display: "none" } }}>
                                    <Popover.Body>
                                        <div className="text-center">
                                            <div className="h5 mb-0">Your bits</div>
                                            <div className="d-inline-flex align-items-center my-3"><div className="svg-icon-sm"><SvgBitCubes /></div><div className="ms-2 h5 mb-0">{client.user.bits}</div></div>
                                            <div className="text-center text-muted small">Use them to unlock practice features. Keep learning every day to collect more!</div>
                                        </div>

                                        <hr />
                                        <div className="h6 mb-3">How to earn more bits:</div>
                                        <div className="vstack gap-2 small">
                                            {settings.currency.bitRules.map((bitRule) => {

                                                return (
                                                    <div key={bitRule.type} className="hstack gap-3 justify-content-between align-items-center text-nowrap">
                                                        <div className="text-muted">{bitRule.description}</div>
                                                        <div className="fw-bold text-nowrap">{bitRule.value} {bitRule.value > 1 ? 'Bits' : 'Bit'}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Popover.Body>
                                </Popover>

                            )}>
                                <button className="btn btn-outline-secondary btn-no-focus border-0 p-2">
                                    <div className="d-inline-flex align-items-center"><div className="svg-icon svg-icon-xs"><SvgBitCube /></div><div className="ms-1">{client.user.bits}</div></div>
                                </button>
                            </OverlayTrigger>
                        </Nav.Item>
                    </>
                )}
                <Navbar.Toggle className="ms-0" />

                <Navbar.Collapse className="flex-grow-0">
                    <Nav>
                        <Nav.Item>
                            <Link href="/courses"><a className="btn btn-outline-secondary btn-no-focus border-0 p-2">Courses</a></Link>
                        </Nav.Item>
                        {client.user ? (
                            <>
                                <Nav.Item>
                                    <Dropdown>
                                        <Dropdown.Toggle variant="outline-secondary" className="border-0 p-2">
                                            <div className="d-flex align-items-center justify-content-center">

                                                {client.user.avatarUrl ?
                                                    (<Image className="rounded-pill" priority unoptimized loader={({ src }) => src} src={client.user.avatarUrl} width={32} height={32} objectFit="cover" alt={`${client.user.firstName} ${client.user.lastName}`} />) :
                                                    (
                                                        <div className="rounded-pill d-flex align-items-center justify-content-center bg-light text-dark" style={{ width: "32px", height: "32px" }}>
                                                            <div className="svg-icon svg-icon-xs d-inline-block" ><BsPersonFill /></div>
                                                        </div>
                                                    )}
                                                <div className="ms-2">{client.user.firstName}</div>
                                            </div>
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            <Link href={`${ModalPathPrefix}/accounts/settings`} passHref><Dropdown.Item>Settings</Dropdown.Item></Link>
                                            <Dropdown.Divider />
                                            <Link href={`${ModalPathPrefix}/accounts/signout`} passHref><Dropdown.Item>Sign out</Dropdown.Item></Link>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Nav.Item>
                            </>
                        ) : (
                            <>
                                <Nav.Item>
                                    <button type="button" className="btn btn-outline-secondary border-0 p-2 mb-2 mb-lg-0" onClick={() => router.replace({ pathname: `${ModalPathPrefix}/accounts/signin`, query: cleanObject({ returnUrl: router.asPath }) })}>Sign in</button>
                                </Nav.Item>
                                <Nav.Item>
                                    <button type="button" className="btn btn-primary border-0 p-2" onClick={() => router.replace({ pathname: `${ModalPathPrefix}/accounts/signup`, query: cleanObject({ returnUrl: router.asPath }) })}>Sign up</button>
                                </Nav.Item>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </div>
        </Navbar>
    );
};

const Body = ({ children }) => {

    const modal = useModal();
    const router = useRouter();
    const client = useClient();
    const [pageLoading, setPageLoading] = useState(true);
    const modalUrlRef = useRef(null);

    useEffect(() => {

        const handleSigninComplete = (state) => {
            toast.success('Sign in successful.');

            const returnUrl = state?.returnUrl || '/';
            router.replace(returnUrl);
        };

        const handleSigninError = () => {
            toast.error('Unable to sign in to account.');
        };

        const handleSignoutComplete = (state) => {
            toast.success('Sign out successful.');
            const returnUrl = state?.returnUrl;
            if (returnUrl != null) router.replace(returnUrl);
        };

        const handleSignoutError = () => {
            toast.error('Unable to sign out from account.');
        };

        client.events.on('signinComplete', handleSigninComplete);
        client.events.on('signinError', handleSigninError);

        client.events.on('signoutComplete', handleSignoutComplete);
        client.events.on('signoutError', handleSignoutError);

        return () => {
            client.events.off('signinComplete', handleSigninComplete);
            client.events.off('signinError', handleSigninError);

            client.events.off('signoutComplete', handleSignoutComplete);
            client.events.off('signoutError', handleSignoutError);
        };
    }, [client, router]);

    useEffect(() => {

        const handleRouteStart = (url) => {
            try {
                setPageLoading(true);
                modal.open(url);
            }
            catch (ex) {
                setPageLoading(false);
                throw ex;
            }
        };

        const handleRouteComplete = () => {
            setPageLoading(false);
        };

        router.events.on('routeChangeStart', handleRouteStart);
        router.events.on('routeChangeComplete', handleRouteComplete);
        router.events.on('routeChangeError', handleRouteComplete);

        return () => {
            router.events.off('routeChangeStart', handleRouteStart);
            router.events.off('routeChangeComplete', handleRouteComplete);
            router.events.off('routeChangeError', handleRouteComplete);
        }
    }, [modal, router]);

    useEffect(() => {
        if (window.location.pathname.toLowerCase().startsWith(ModalPathPrefix)) {
            modalUrlRef.current = window.location.href;
            router.replace('/');
        }
    }, []);

    useEffect(() => {
        if (!client.loading && !modal.loading) {
            if (modalUrlRef.current != null)
                modal.open(modalUrlRef.current, {}, false);
        }
    }, [client.loading, modal.loading]);

    useEffect(() => { setPageLoading(false); }, []);

    return (
        <>
            {children}
            {(client.loading || modal.loading) && (
                <Loader className="position-fixed top-50 start-50 translate-middle bg-white" style={{ zIndex: 2000 }} />
            )}
        </>
    );
};

const Footer = () => {
    const settings = useSettings();

    return (
        <footer id="footer" className="text-center bg-dark text-white py-2">
            <div className="container pt-4">
                <div className="hstack gap-3 d-inline-flex flex-wrap justify-content-center">
                    <Link href="/"><a className="link-light">Home</a></Link>
                    <Link href="/courses"><a className="link-light">Courses</a></Link>
                    <Link href="/terms"><a className="link-light">Terms of Service</a></Link>
                    <Link href="/privacy"><a className="link-light">Privacy Policy</a></Link>
                    <Link href="/contact"><a className="link-light">Contact Us</a></Link>
                    <Link href="/about"><a className="link-light">About Us</a></Link>
                </div>
            </div>
            <div>
                <div className="container d-flex flex-wrap justify-content-center justify-content-md-between py-3">
                    <div className="mb-3">Copyright © 2021 - 2022 Academy of ours. All rights reserved</div>
                    <div className="hstack gap-2 d-inline-flex mb-3">
                        {settings.company.facebookLink && (
                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Check out our facebook</Tooltip>}>
                                <a href={settings.company.facebookLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                    <span className="svg-icon svg-icon-xs"><SvgFacebookLogo /></span>
                                </a>
                            </OverlayTrigger>
                        )}
                        {settings.company.instagramLink && (
                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Join our instagram</Tooltip>}>
                                <a href={settings.company.instagramLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                    <span className="svg-icon svg-icon-xs"><SvgInstagramLogo /></span>
                                </a>
                            </OverlayTrigger>
                        )}
                        {settings.company.linkedinLink && (
                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Follow us on Linkedin</Tooltip>}>
                                <a href={settings.company.linkedinLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                    <span className="svg-icon svg-icon-xs"><SvgLinkedinLogo /></span>
                                </a>
                            </OverlayTrigger>
                        )}
                        {settings.company.twitterLink && (
                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>See what we tweet about</Tooltip>}>
                                <a href={settings.company.linkedinLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                    <span className="svg-icon svg-icon-xs"><SvgTwitterLogo /></span>
                                </a>
                            </OverlayTrigger>
                        )}
                        {settings.company.youtubeLink && (
                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Watch our Youtube</Tooltip>}>
                                <a href={settings.company.youtubeLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                    <span className="svg-icon svg-icon-xs"><SvgYoutubeLogo /></span>
                                </a>
                            </OverlayTrigger>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export { Header, Body, Footer };