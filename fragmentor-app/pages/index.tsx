/* eslint-disable @next/next/no-img-element */
import type { NextPage } from 'next';

import { useEffect, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FragmentorClient } from 'fragmentor';

import Link from 'next/link';
import useMintNft from 'hooks/useMint';
import Vault from 'components/Vault';
import Fragment from 'components/Fragment';
import useVaults from 'hooks/useVaults';

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const mintNft = useMintNft();
  const {
    claimNft,
    createVault,
    fetchFragments,
    fetchVaults,
    fragments,
    selectedVault,
    setSelectedVault,
    unfragmentNft,
    vaults,
    setFragments,
    setVaults,
  } = useVaults();

  const fragmentorClient = useMemo(() => new FragmentorClient(connection), [connection]);

  useEffect(() => {
    setVaults([]);
    setFragments([]);
    fetchVaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, fragmentorClient, publicKey]);

  useEffect(() => {
    if (!selectedVault) {
      return;
    }
    fetchFragments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, fragmentorClient, selectedVault]);

  return (
    <div className="m-10 flex flex-col gap-4">
      <div className="flex gap-4">
        <button
          className="bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
          onClick={createVault}
        >
          Create vault
        </button>
        <button
          className="bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
          onClick={mintNft}
        >
          Mint random NFT
        </button>
      </div>
      <h1 className="text-xl font-bold">Your vaults:</h1>
      <div className="flex flex-wrap gap-4 flex-col">
        {vaults.map((vault) => (
          <Vault key={vault.address.toBase58()} setSelectedVault={setSelectedVault} vault={vault} />
        ))}
        <div>
          <h1 className="text-xl font-bold">Selected vault: {selectedVault?.toBase58()}</h1>
          {selectedVault ? (
            <Link href={`/create-fragments/${selectedVault?.toBase58()}`}>
              <div className="bg-cyan-600 cursor-pointer text-white p-2 px-4 my-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800 w-fit">
                Fragment NFT
              </div>
            </Link>
          ) : null}
          <div className="flex flex-wrap gap-6">
            {fragments.map((fragment) => {
              return (
                <Fragment
                  claimNft={claimNft}
                  fragment={fragment}
                  unfragmentNft={unfragmentNft}
                  key={fragment.fragments[0].mint.toBase58()}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
