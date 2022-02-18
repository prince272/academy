import '../styles/fonts/inter.css';
import '../styles/theme.css';
import '../styles/app.css';

import App from 'next/app';
import Head from 'next/head';

import _ from 'lodash';
import { Toaster } from 'react-hot-toast';
import { ClientProvider } from '../utils/client';
import { ModalProvider } from '../modals';
import { DialogProvider } from '../utils/dialog';
import { Header, Body, Footer } from '../components';
import { SettingsProvider } from '../utils/settings';

import queryString from 'qs';
import * as https from 'https';
import * as fs from 'fs';

import axios from 'axios';

export default function MyApp({ Component, pageProps, settings }) {

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
      <SettingsProvider {...{ settings }}>
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
      </SettingsProvider>
    </>
  );
}

MyApp.getInitialProps = async (appContext) => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  appProps.settings = (await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}`, { httpsAgent })).data.data
  return { ...appProps };
};