import httpProxyMiddleware from 'next-http-proxy-middleware';

// pages/api/[...all].js
export const config = {
    api: {
        // Enable `externalResolver` option in Next.js
        externalResolver: true,
    },
}

export default (req, res) => (
    httpProxyMiddleware(req, res, {
        // You can use the `http-proxy` option
        target: process.env.NEXT_PUBLIC_SERVER_URL,
        // In addition, you can use the `pathRewrite` option provided by `next-http-proxy-middleware`
        pathRewrite: [{
            patternStr: '^/api/new',
            replaceStr: '/v2'
        }, {
            patternStr: '^/api',
            replaceStr: ''
        }],
    })
);