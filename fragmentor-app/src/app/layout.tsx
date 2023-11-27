'use client'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import Navbar from '../components/Navbar'
import { Toaster } from 'react-hot-toast'
import Head from 'next/head'
import { clusterApiUrl } from '@solana/web3.js'
import Footer from '../components/Footer'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useMemo } from 'react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'

require('@solana/wallet-adapter-react-ui/styles.css')

const inter = Inter({ subsets: ['latin'] })
const endpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('devnet')
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    },
  },
})

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Fragmentor App',
  url: 'http://fragmentor-app.vercel.app/',
  description:
    'Fragmentor App - Fragment Solana NFTs into multiple pieces and create a new NFT from them.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'New York Street 123',
    addressLocality: 'New York',
    addressRegion: 'NY',
    postalCode: '10021',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-401-555-1212',
    contactType: 'Customer service',
  },
  image: 'http://fragmentor-app.vercel.app/ico.webp',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [
      /**
       * Wallets that implement either of these standards will be available automatically.
       *
       *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
       *     (https://github.com/solana-mobile/mobile-wallet-adapter)
       *   - Solana Wallet Standard
       *     (https://github.com/solana-labs/wallet-standard)
       *
       * If you wish to support a wallet that supports neither of those standards,
       * instantiate its legacy wallet adapter here. Common legacy adapters can be found
       * in the npm package `@solana/wallet-adapter-wallets`.
       */
      new PhantomWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  return (
    <html lang="en">
      <Head>
        <title>Fragmentor App</title>
        <meta name="description" content="Fragmentor App" />
        <link rel="icon" href="/ico.webp" />
      </Head>
      <head>
        <title>Fragmentor App</title>
        <meta
          name="description"
          content="Fragmentor App - Fragment Solana NFTs into multiple pieces and create a new NFT from them."
        />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="googlebot" content="index,follow" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Fragmentor App - Fragment Solana NFTs into multiple pieces"
        />
        <meta
          property="og:description"
          content="Fragmentor App - Fragment Solana NFTs into multiple pieces and create a new NFT from them."
        />
        <meta name="google-site-verification" content="x" />
        <meta property="og:url" content="permalink" />
        <link rel="canonical" href="http://fragmentor-app.vercel.app/" />

        <script type="application/ld+json"></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        ></script>
      </head>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <body className={inter.className}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <Navbar />
                <Toaster />
                {children}
                <Footer />
              </WalletModalProvider>
            </WalletProvider>
          </body>
        </ConnectionProvider>
      </QueryClientProvider>
    </html>
  )
}