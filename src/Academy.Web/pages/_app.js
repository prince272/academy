import '../styles/fonts/inter.css';
import '../styles/theme.css';
import '../styles/app.css';

import App from 'next/app';
import Head from 'next/head';

import _ from 'lodash';
import { Toaster } from 'react-hot-toast';
import { ClientProvider, createHttpClient } from '../utils/client';
import { ModalProvider } from '../modals';
import { DialogProvider } from '../utils/dialog';
import { Header, Body, Footer } from '../components';
import { AppSettingsProvider } from '../utils/appSettings';

import { SSRProvider } from 'react-bootstrap';
import { EventDispatcherProvider } from '../utils/eventDispatcher';
import ErrorPage from '../components/ErrorPage';

export default function MyApp({ Component, pageProps, appSettings, error }) {

  if (error) {
    return (<ErrorPage {...{ error }} />)
  }


  const pageSettings = Object.assign({}, {
    showHeader: true,
    showFooter: true
  }, Component.getPageSettings && Component.getPageSettings() || {});

  return (
    <>
      <Head>
        <title>Academy - Home</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </Head>
      <SSRProvider>
        <EventDispatcherProvider>
          <AppSettingsProvider {...{ appSettings }}>
            <ClientProvider>
              <DialogProvider>
                <ModalProvider>
                  <div className="pt-8 pb-5 position-relative">
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
    </>
  );
}

MyApp.getInitialProps = async (appContext) => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  const httpClient = createHttpClient({ throwIfError: false });
  const httpResult = (await httpClient.get('/'));

  if (httpResult.error) {
    const error = httpResult.error;
    return { ...appProps, error };
  }

  const appSettings = httpResult.data;
  return { ...appProps, appSettings };
};