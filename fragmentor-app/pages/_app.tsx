import type { AppProps } from 'next/app';

import { useMemo } from 'react';
import 'styles/globals.css';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import Navbar from 'components/Navbar';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { clusterApiUrl } from '@solana/web3.js';
import Footer from 'components/Footer';
import { QueryClient, QueryClientProvider } from 'react-query';

require('@solana/wallet-adapter-react-ui/styles.css');

function MyApp({ Component, pageProps }: AppProps) {
  const endpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('devnet');

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

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
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Navbar />
            <Toaster />
            <Head>
              <title>Fragmentor App</title>
              <meta name="description" content="Fragmentor App" />
              <link rel="icon" href="/ico.webp" />
            </Head>
            <div className="mt-20 flex">
              <Component {...pageProps} />
            </div>
            <Footer />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
