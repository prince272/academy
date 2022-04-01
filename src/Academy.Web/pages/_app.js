import '../styles/fonts/inter.css';
import '../styles/theme.css';
import '../styles/app.css';

import App from 'next/app';
import Head from 'next/head';
import { DefaultSeo } from 'next-seo';
import _ from 'lodash';
import { Toaster } from 'react-hot-toast';
import { ClientProvider, createHttpClient } from '../utils/client';
import { DialogProvider } from '../utils/dialog';
import { AppSettingsProvider } from '../utils/appSettings';

import { SSRProvider } from 'react-bootstrap';
import { EventDispatcherProvider } from '../utils/eventDispatcher';
import ErrorView from '../components/ErrorView';

import { Dropdown, Nav, Navbar, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import Link from 'next/link';
import { useClient } from '../utils/client';
import { cleanObject } from '../utils/helpers';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useRef, useState, } from 'react';

import { DefaultModalProps, ModalPathPrefix, ModalProvider, useModal } from '../modals';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { SvgAppWordmark, SvgFacebookLogo, SvgInstagramLogo, SvgLinkedinLogo, SvgTwitterLogo, SvgYoutubeLogo, SvgBitCube, SvgBitCubes } from '../resources/images/icons';
import { BsPersonFill, BsHeartFill } from 'react-icons/bs';
import { useAppSettings } from '../utils/appSettings';
import { useEventDispatcher } from '../utils/eventDispatcher';
import { useDialog } from '../utils/dialog';
import LoadingBar from 'react-top-loading-bar';

const BitInfoDialog = () => {
  const appSettings = useAppSettings();
  const client = useClient();
  const dialog = useDialog();
  const { opended, close, params } = dialog;

  return (
    <Modal {...DefaultModalProps} size="sm" show={opended} onHide={() => close()}>
      <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
      <Modal.Body>
        <div className="text-center mb-5">
          <div className="h5 mb-0">Your bits</div>
        </div>
        <div className="text-center">
          <div className="d-inline-flex align-items-center my-3"><div className="svg-icon-sm"><SvgBitCubes /></div><div className="ms-2 h2 mb-0">{client.user.bits}</div></div>
          <div className="text-muted">Use them to unlock practice features. Keep learning every day to collect more!</div>
        </div>
        <hr />
        <div className="h6 mb-3">How you may earn or lose bits:</div>
        <div className="vstack gap-2">
          {Object.entries(appSettings.course.bitRules).map(([bitValue, bitRule]) => {
            return (
              <div key={bitRule.type} className="hstack gap-3 justify-content-between align-items-center text-nowrap">
                <div className="text-muted">{bitRule.description}</div>
                <div className="fw-bold text-nowrap">{(bitRule.value <= 0 ? "" : "+") + bitRule.value} {bitRule.value == 1 ? 'Bit' : 'Bits'}</div>
              </div>
            );
          })}
        </div>
      </Modal.Body>
    </Modal>
  );
};

const Header = () => {
  const client = useClient();
  const router = useRouter();
  const appSettings = useAppSettings();
  const dialog = useDialog();
  const permitted = (client.user && (client.user.roles.some(role => role == 'admin') || (client.user.roles.some(role => role == 'teacher'))));

  const [expanded, setExpanded] = useState(false);
  return (

    <Navbar id="header" collapseOnSelect expanded={expanded} onToggle={(toggle) => setExpanded(toggle)} bg="white" variant="light" expand="md" className={`fixed-top shadow-sm ${client.loading ? 'd-none' : ''}`}>
      <div className="container">
        <Link href="/" passHref>
          <Navbar.Brand className="me-auto" onClick={() => { setExpanded(false); }}>
            <div className="svg-icon"><SvgAppWordmark style={{ width: "auto", height: "2.5rem" }} /></div>
          </Navbar.Brand>
        </Link>

        <Nav.Item className="ms-auto me-2 order-md-3">
          <button type="button" className="btn btn-outline-secondary btn-no-focus border-0 p-2" onClick={() => {
            setExpanded(false);
            router.replace({ pathname: `${ModalPathPrefix}/sponsor` })
          }}>Made with <span className="svg-icon svg-icon-sm d-inline-block text-danger me-2 heart"><BsHeartFill /></span></button>
        </Nav.Item>

        <Navbar.Toggle className="ms-0" />

        <Navbar.Collapse className="flex-grow-0">
          <Nav>
            <Nav.Item>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="border-0 p-2">Courses</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Link href={{ pathname: "/courses" }} passHref><Dropdown.Item>All</Dropdown.Item></Link>
                  {appSettings.course.subjects.map((subject => (
                    <Link key={subject.value} href={{ pathname: "/courses", query: { subject: subject.value } }} passHref><Dropdown.Item>{subject.name}</Dropdown.Item></Link>
                  )))}
                </Dropdown.Menu>
              </Dropdown>
            </Nav.Item>
            <Nav.Item>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="border-0 p-2">Resources</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Header>How it works</Dropdown.Header>
                  <Link href="/teach" passHref><Dropdown.Item>For teachers</Dropdown.Item></Link>
                  <Link href="/" passHref><Dropdown.Item>For students</Dropdown.Item></Link>
                  <Dropdown.Header>Who we are</Dropdown.Header>
                  <Link href="/contact" passHref><Dropdown.Item>Contact Us</Dropdown.Item></Link>
                  <Link href="/about" passHref><Dropdown.Item>About Us</Dropdown.Item></Link>

                </Dropdown.Menu>
              </Dropdown>
            </Nav.Item>
            {client.user ? (
              <>
                <Nav.Item className="">
                  <button className="btn btn-outline-secondary btn-no-focus border-0 p-2" onClick={() => {
                    setExpanded(false);
                    dialog.open({}, BitInfoDialog);
                  }}>
                    <div className="d-inline-flex align-items-center"><div className="svg-icon svg-icon-xs"><SvgBitCube /></div><div className="ms-1">{client.user.bits}</div></div>
                  </button>
                </Nav.Item>
                <Nav.Item>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" className="border-0 px-2 py-1">
                      <div className="d-flex align-items-center justify-content-center">

                        {client.user.avatar ?
                          (<Image className="rounded-pill" priority unoptimized loader={({ src }) => src} src={client.user.avatar.url} width={32} height={32} objectFit="cover" alt={`${client.user.firstName} ${client.user.lastName}`} />) :
                          (
                            <div className="rounded-pill d-flex align-items-center justify-content-center bg-light text-dark" style={{ width: "32px", height: "32px" }}>
                              <div className="svg-icon svg-icon-xs d-inline-block" ><BsPersonFill /></div>
                            </div>
                          )}
                        <div className="ms-2 text-start lh-1">
                          <div className="lh-sm">{client.user.firstName}</div>
                          {permitted && (<div className="text-small text-primary"><span>{appSettings.currency.symbol}</span> <span>{client.user.balance}</span></div>)}
                        </div>
                      </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                      <Link href={`${ModalPathPrefix}/accounts/profile/edit`} passHref><Dropdown.Item>Edit profile</Dropdown.Item></Link>
                      <Link href={`${ModalPathPrefix}/accounts/email/change`} passHref><Dropdown.Item>Change email</Dropdown.Item></Link>
                      <Link href={`${ModalPathPrefix}/accounts/phoneNumber/change`} passHref><Dropdown.Item>Change phone number</Dropdown.Item></Link>
                      <Link href={`${ModalPathPrefix}/accounts/password/change`} passHref><Dropdown.Item>Change password</Dropdown.Item></Link>
                      {permitted && (<Link href={`${ModalPathPrefix}/accounts/withdraw`} passHref><Dropdown.Item>Withdraw</Dropdown.Item></Link>)}
                      <Dropdown.Divider />
                      <Link href={`${ModalPathPrefix}/accounts/signout`} passHref><Dropdown.Item>Sign out</Dropdown.Item></Link>
                    </Dropdown.Menu>
                  </Dropdown>
                </Nav.Item>
              </>
            ) : (
              <>
                <Nav.Item>
                  <button type="button" className="btn btn-outline-secondary border-0 p-2 mb-2 mb-md-0" onClick={() => {
                    setExpanded(false);
                    router.replace({ pathname: `${ModalPathPrefix}/accounts/signin`, query: cleanObject({ returnUrl: router.asPath }) })
                  }}>Sign in</button>
                </Nav.Item>
                <Nav.Item>
                  <button type="button" className="btn btn-primary border-0 p-2" onClick={() => {
                    setExpanded(false);
                    router.replace({ pathname: `${ModalPathPrefix}/accounts/signup`, query: cleanObject({ returnUrl: router.asPath }) })
                  }}>Sign up</button>
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
  const componentId = useMemo(() => _.uniqueId('Component'), []);
  const modal = useModal();
  const router = useRouter();
  const client = useClient();
  const [pageLoading, setPageLoading] = useState(true);
  const eventDispatcher = useEventDispatcher();
  const loadingBarRef = useRef(null);
  const [loadingBarColor, setLoadingBarColor] = useState(null);

  useEffect(() => {

    const handleSigninComplete = (state) => {
      toast.success('Sign in successful.', { id: componentId });

      const returnUrl = state?.returnUrl || '/';
      router.replace(returnUrl);
    };

    const handleSigninError = () => {
      toast.error('Unable to sign in to account.', { id: componentId });
    };

    const handleSignoutComplete = (state) => {
      toast.success('Sign out successful.', { id: componentId });
      const returnUrl = state?.returnUrl;
      if (returnUrl != null) router.replace(returnUrl);
    };

    const handleSignoutError = () => {
      toast.error('Unable to sign out from account.', { id: componentId });
    };

    eventDispatcher.on('signinComplete', handleSigninComplete);
    eventDispatcher.on('signinError', handleSigninError);

    eventDispatcher.on('signoutComplete', handleSignoutComplete);
    eventDispatcher.on('signoutError', handleSignoutError);

    return () => {
      eventDispatcher.off('signinComplete', handleSigninComplete);
      eventDispatcher.off('signinError', handleSigninError);

      eventDispatcher.off('signoutComplete', handleSignoutComplete);
      eventDispatcher.off('signoutError', handleSignoutError);
    };
  }, [client, router]);

  const handleRouteStart = (url, { shallow }) => {

    try {

      const location = new URL(url, window.location.origin);
      if (location.pathname.toLowerCase().startsWith(ModalPathPrefix)) {
        modal.open(location.href, true);
      }
      else {
        if (!shallow)
          modal.close();
        setPageLoading(true);
        loadingBarRef.current.continuousStart();
      }
    }
    catch (ex) {
      loadingBarRef.current.complete();
      setPageLoading(false);
      throw ex;
    }
  };

  const handleRouteComplete = () => {
    loadingBarRef.current.complete();
    setPageLoading(false);
  };

  useEffect(() => {
    router.events.on('routeChangeStart', handleRouteStart);
    router.events.on('routeChangeComplete', handleRouteComplete);
    router.events.on('routeChangeError', handleRouteComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteStart);
      router.events.off('routeChangeComplete', handleRouteComplete);
      router.events.off('routeChangeError', handleRouteComplete);
    }
  }, [modal, router]);

  useEffect(() => setLoadingBarColor(getComputedStyle(document.body).getPropertyValue('--bs-primary')), []);

  useEffect(() => {

    const location = window.location;
    if (location.pathname.toLowerCase().startsWith(ModalPathPrefix)) {
      modal.open(location.href, false);
      router.replace("/", undefined, { shallow: true });
    }
    setPageLoading(false);
  }, []);

  return (
    <>
      <LoadingBar color={loadingBarColor} ref={loadingBarRef} />
      {children}
      {(client.loading || pageLoading) && (<div className="position-fixed top-50 start-50 translate-middle bg-light w-100 h-100 zi-3"><Loader /></div>)}
    </>
  );
};

const Footer = () => {
  const appSettings = useAppSettings();

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
          <div className="mb-3">Copyright © {new Date().getFullYear()} Academy of Ours. All rights reserved</div>
          <div className="hstack gap-2 d-inline-flex mb-3">
            {appSettings.company.facebookLink && (
              <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Check out our facebook</Tooltip>}>
                <a href={appSettings.company.facebookLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                  <span className="svg-icon svg-icon-xs"><SvgFacebookLogo /></span>
                </a>
              </OverlayTrigger>
            )}
            {appSettings.company.instagramLink && (
              <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Join our instagram</Tooltip>}>
                <a href={appSettings.company.instagramLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                  <span className="svg-icon svg-icon-xs"><SvgInstagramLogo /></span>
                </a>
              </OverlayTrigger>
            )}
            {appSettings.company.linkedinLink && (
              <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Follow us on Linkedin</Tooltip>}>
                <a href={appSettings.company.linkedinLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                  <span className="svg-icon svg-icon-xs"><SvgLinkedinLogo /></span>
                </a>
              </OverlayTrigger>
            )}
            {appSettings.company.twitterLink && (
              <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>See what we tweet about</Tooltip>}>
                <a href={appSettings.company.linkedinLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                  <span className="svg-icon svg-icon-xs"><SvgTwitterLogo /></span>
                </a>
              </OverlayTrigger>
            )}
            {appSettings.company.youtubeLink && (
              <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Watch our Youtube</Tooltip>}>
                <a href={appSettings.company.youtubeLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
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

export default function MyApp({ Component, pageProps, appSettings, error }) {

  const pageSettings = Object.assign({}, {
    showHeader: true,
    showFooter: true
  }, Component.getPageSettings && Component.getPageSettings() || {});

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </Head>
      <DefaultSeo
        titleTemplate="%s | Academy Of Ours"
        defaultTitle="Academy Of Ours"
        description="Academy of Ours is an e-learning platform that helps you to learn a variety of courses and concepts through interactive checkpoints, lessons, and videos."
        openGraph={{
          type: 'website',
          locale: 'en_IE',
          url: 'https://www.url.ie/',
          site_name: 'Academy Of Ours',
        }}
      />
      {!error ? (
        <SSRProvider>
          <EventDispatcherProvider>
            <AppSettingsProvider {...{ appSettings }}>
              <ClientProvider>
                <DialogProvider>
                  <ModalProvider>
                    <div className={`${pageSettings.showHeader ? 'pt-8' : ''} ${pageSettings.showFooter ? 'pb-8' : ''} position-relative`}>
                      {pageSettings.showHeader && <Header />}
                      <Body>
                        <Component {...pageProps} />
                      </Body>
                      {pageSettings.showFooter && <Footer />}
                    </div>
                    <Toaster position="top-center" reverseOrder={true} toastOptions={{
                      className: 'bg-light text-dark',
                    }} />
                  </ModalProvider>
                </DialogProvider>
              </ClientProvider>
            </AppSettingsProvider>
          </EventDispatcherProvider>
        </SSRProvider>
      ) : (<ErrorView {...{ error, asPage: true }} />)}
    </>
  );
}

MyApp.getInitialProps = async (appContext) => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  const httpClient = createHttpClient({ throwIfError: false });
  const httpResult = (await httpClient.get('/', { cache: true }));

  if (httpResult.error) {
    const error = httpResult.error;
    return { ...appProps, error };
  }

  const appSettings = httpResult.data;
  return { ...appProps, appSettings };
};