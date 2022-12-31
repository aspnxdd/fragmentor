/* eslint-disable @next/next/no-img-element */
import { type FC, useEffect, useMemo, useState, lazy, Suspense } from 'react';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import useFetchNfts from '../hooks/useFetchNfts';
import { MetaplexClient } from '../lib/metaplex';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from 'react-query';

const MyNftsPopup = lazy(() => import('./MyNftsPopup'));

const Navbar: FC = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const fetchNftsQuery = useFetchNfts();
  const metaplexClient = useMemo(() => new MetaplexClient(connection), [connection]);

  const nfts = useMemo(() => fetchNftsQuery.data ?? [], [fetchNftsQuery.data]);

  useEffect(() => {
    if (!publicKey || !metaplexClient) {
      return;
    }
    queryClient.refetchQueries('fetchNfts');
  }, [connection, metaplexClient, publicKey, queryClient]);

  return (
    <nav className="w-screen fixed top-0 left-0 flex justify-between items-center bg-slate-300">
      <Link href="/">
        <a className="ml-10 flex gap-4">
          <Image src="/ico.webp" width="60" height="50" alt="icon" />
          <h1 className="text-5xl cursor-pointer">Fragmentor </h1>
        </a>
      </Link>
      <div className="flex items-center content-center">
        <button
          className="bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
          onClick={() => setPopupOpen(true)}
        >
          Show NFTs
        </button>
        <Suspense fallback={<></>}>
          <MyNftsPopup popupOpen={popupOpen} nfts={nfts} setPopupOpen={setPopupOpen} />
        </Suspense>
        <div className="m-4">
          <WalletMultiButton
            style={{
              backgroundColor: 'rgb(8 145 178)',
              fontFamily: 'inherit',
              marginRight: '1rem',
            }}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
