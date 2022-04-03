import httpProxyMiddleware from "next-http-proxy-middleware";
import * as https from 'https';

const handleProxyInit = (proxy) => {
    /**
     * Check the list of bindable events in the `http-proxy` specification.
     * @see https://www.npmjs.com/package/http-proxy#listening-for-proxy-events
     */
    proxy.on('proxyReq', (proxyReq, req, res) => {

    });
    proxy.on('proxyRes', (proxyRes, req, res) => {

    });
};

export default (req, res) => {

    return httpProxyMiddleware(req, res, {
        target: process.env.NEXT_PUBLIC_SERVER_API,
        onProxyInit: handleProxyInit,
        agent: new https.Agent({ rejectUnauthorized: false }),
        pathRewrite: [{
            patternStr: '^/api/new',
            replaceStr: '/v2'
          }, {
            patternStr: '^/api',
            replaceStr: ''
          }],
    });
}

export const config = {
    api: {
      // Enable `externalResolver` option in Next.js
      externalResolver: true,
    },
  }
  