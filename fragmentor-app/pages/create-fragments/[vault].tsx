/* eslint-disable @next/next/no-img-element */
import type { NextPage } from 'next';
import type { Nft } from '@metaplex-foundation/js';

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { MetaplexClient } from 'lib/metaplex';
import { trimAddress } from 'lib/utils';
import useFragments from 'hooks/useFragments';
import { useQueryClient } from 'react-query';
import useFetchNfts from 'hooks/useFetchNfts';
import { useRouter } from 'next/router';

const MyNftsPopup = lazy(() => import('components/MyNftsPopup'));

const CreateFragment: NextPage = () => {
  const { query } = useRouter();
  const [popupOpen, setPopupOpen] = useState(false);
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const {
    createFragments,
    fragmentParts,
    fragments,
    selectedNft,
    setFragmentParts,
    setSelectedNft,
    setFragments,
  } = useFragments(query.vault);
  const queryClient = useQueryClient();
  const fetchNftsQuery = useFetchNfts();

  const nfts = useMemo(() => fetchNftsQuery.data ?? [], [fetchNftsQuery.data]);

  const metaplexClient = useMemo(() => new MetaplexClient(connection), [connection]);

  useEffect(() => {
    if (!publicKey || !metaplexClient) {
      return;
    }
    queryClient.refetchQueries('fetchNfts');
  }, [connection, metaplexClient, publicKey, fragments, queryClient]);

  const selectedNftImage = useMemo(
    () => nfts.find((nft) => nft.mint.address.toBase58() === selectedNft)?.json?.image,
    [nfts, selectedNft],
  );

  function handleClickOnNft(nft: Nft) {
    setSelectedNft(nft.mint.address.toBase58());
    setPopupOpen(false);
    setFragments([]);
  }
  
  function handleCreateFragments() {
    if (!selectedNft) {
      return;
    }
    createFragments(new PublicKey(selectedNft));
  }

  return (
    <div className="m-10 flex flex-col gap-4">
      <button
        className="w-fit bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
        onClick={() => setPopupOpen(true)}
      >
        Select NFT
      </button>
      <Suspense fallback={<></>}>
        <MyNftsPopup
          popupOpen={popupOpen}
          handleClickOnNft={handleClickOnNft}
          nfts={nfts}
          setPopupOpen={setPopupOpen}
        />
      </Suspense>
      <form className="flex flex-col w-fit gap-3">
        <label>Fragment parts</label>
        <input
          type="number"
          placeholder="4"
          max="20"
          className="p-2 border-2 border-gray-400 rounded-lg"
          onChange={(e) => setFragmentParts(Number(e.target.value))}
        />
      </form>
      {selectedNft ? (
        <>
          <h2>Selected NFT</h2>
          <div>
            <figure>
              <img src={selectedNftImage} alt={selectedNft} width="110" />
              <figcaption>{selectedNft}</figcaption>
            </figure>
          </div>
        </>
      ) : null}
      <button
        className={`w-fit bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800 disabled:bg-gray-500`}
        disabled={!selectedNft}
        onClick={handleCreateFragments}
      >
        {`Create ${fragmentParts} Fragments`}
      </button>
      {fragments.length > 0 ? (
        <div>
          <h2>Fragments</h2>
          <div className="flex flex-wrap gap-4">
            {fragments.map((fragment) => {
              const fragmentImage = nfts.find((e) => e.mint.address.toBase58() === fragment)?.json
                ?.image;
              return (
                <figure key={fragment}>
                  <img src={fragmentImage} alt={fragment} width="110" />
                  <figcaption>{trimAddress(fragment)}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CreateFragment;
