import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head>
          {/* https://kirazhang.com/posts/nextjs-custom-fonts */}

          <meta charSet="utf-8" />

          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="mask-icon" color="#166fe5" href="/favicon/safari-pinned-tab.svg" />
          <link rel="shortcut icon" href="/favicon/favicon.ico" />
          <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
          <meta name="msapplication-TileColor" content="#166fe5" />
          <meta name="theme-color" content="#ffffff"></meta>
        </Head>
        <body className="bg-light">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument;