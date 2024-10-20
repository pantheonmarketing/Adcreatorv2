import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Remove the Anton font link */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}