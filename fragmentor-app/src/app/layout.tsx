'use client'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { Toaster } from 'react-hot-toast'
import Head from 'next/head'
import { clusterApiUrl } from '@solana/web3.js'
import { QueryClient, QueryClientProvider } from 'react-query'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HeadWrapper from '../components/HeadWrapper'

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
      retryDelay: undefined,
      staleTime: Infinity,
      retryOnMount: false,
      refetchIntervalInBackground: false,
    },
  },
})

const wallets = [new PhantomWalletAdapter()]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <title>Fragmentor App</title>
        <meta name="description" content="Fragmentor App" />
        <link rel="icon" href="/ico.webp" />
      </Head>
      <HeadWrapper />
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <body className={inter.className}>
              <WalletModalProvider>
                <Navbar />
                <Toaster />
                {children}
                <Footer />
              </WalletModalProvider>
            </body>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </html>
  )
}
