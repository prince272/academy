import '../styles/fonts/inter.css';
import '../styles/theme.css';
import '../styles/app.css';

import App from 'next/app';
import Head from 'next/head';
import { DefaultSeo } from 'next-seo';
import _ from 'lodash';
import { Toaster } from 'react-hot-toast';
import { ClientProvider, createHttpClient } from '../utils/client';
import { ModalProvider } from '../modals';
import { DialogProvider } from '../utils/dialog';
import { Header, Body, Footer } from '../components';
import { AppSettingsProvider } from '../utils/appSettings';

import { SSRProvider } from 'react-bootstrap';
import { EventDispatcherProvider } from '../utils/eventDispatcher';
import ErrorView from '../components/ErrorView';

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
      ) : (<ErrorView {...{ error, asPage: true }} />)}
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