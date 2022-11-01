/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";

import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  FragmentorClient,
  buildMintNftIxs,
  type FragmentData,
  type IVault,
} from "fragmentor/dist/js/src";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import useFetchNfts from "hooks/useFetchNfts";
import toast from "react-hot-toast";
import { getErrorMessage } from "lib/utils";
import Link from "next/link";

const URI = "https://arweave.net/0m6rZv0Nim4277-wLTPtSTP2NIB_0zvrtTFoHcSeqTo";

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [vaults, setVaults] = useState<(IVault & { address: PublicKey })[]>([]);
  const [selectedVault, setSelectedVault] = useState<PublicKey | null>(null);
  const fetchNfts = useFetchNfts();
  const [fragments, setFragments] = useState<
    { originalNft: string; fragments: FragmentData[] }[]
  >([]);

  const fragmentorClient = useMemo(
    () => new FragmentorClient(connection),
    [connection]
  );

  async function createVault() {
    try {
      if (!publicKey || !connection) return;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const vaultKp = Keypair.generate();
      const ix = FragmentorClient.buildInitVaultIx(
        publicKey,
        vaultKp.publicKey
      );

      const tx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(ix);
      tx.sign(...[vaultKp]);
      const sig = await sendTransaction(tx, connection);

      await connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight,
      });
      toast.success("Vault created successfully");
      fetchVaults();
    } catch (err) {
      getErrorMessage(err);
      console.error(err);
    }
  }

  async function mintNft(): Promise<PublicKey | undefined> {
    if (!publicKey || !connection) return;
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const nftKp = Keypair.generate();
    const ixs = await buildMintNftIxs(
      connection,
      publicKey,
      nftKp.publicKey,
      "b",
      URI,
      "symb"
    );

    const tx = new Transaction({
      feePayer: publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(...ixs);
    tx.sign(...[nftKp]);
    const sig = await sendTransaction(tx, connection);

    await connection.confirmTransaction({
      signature: sig,
      blockhash,
      lastValidBlockHeight,
    });
    toast.success("NFT minted");
    fetchNfts();
    return nftKp.publicKey;
  }

  async function fetchVaults() {
    if (!publicKey || !connection) return;
    const ownerVaults = await fragmentorClient.fetchVaultsByOwner(
      new PublicKey(publicKey?.toBase58()!)
    );
    setVaults(
      ownerVaults.map((e) => {
        const [vault] = FragmentorClient.deserializeVault(e.account);
        return { ...vault, address: e.pubkey };
      })
    );
  }

  useEffect(() => {
    setVaults([]);
    setFragments([]);

    fetchVaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, fragmentorClient, publicKey]);

  async function fetchFragments() {
    if (!selectedVault) return;

    setFragments([]);
    const wholeNfts = await fragmentorClient.fetchWholeNftsByVault(
      selectedVault
    );
    for (let wholeNft of wholeNfts) {
      const [wholeNftData] = FragmentorClient.deserializeWholeNft(
        wholeNft.account
      );
      let frags = wholeNftData.fragments.map((o) => {
        return { mint: o.mint, isBurned: o.isBurned };
      });
      setFragments((prev) => [
        ...prev,
        { originalNft: wholeNftData.originalMint.toBase58(), fragments: frags },
      ]);
    }
  }

  useEffect(() => {
    if (!selectedVault) return;
    fetchFragments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, fragmentorClient, selectedVault]);

  async function unfragmentNft(
    unfragmentMint: PublicKey,
    fragments: FragmentData[]
  ) {
    let lastToast: string | null = null;
    try {
      if (!publicKey || !connection || !signTransaction || !selectedVault)
        return;

      // only those that are not already burned
      const fragmentChunks = FragmentorClient.splitArrayIntoChunks(
        fragments.reduce((acc, e) => {
          if (e.isBurned) return acc;
          return [...acc, e.mint];
        }, [] as PublicKey[]),
        4
      );
      if (fragmentChunks.length === 0) {
        toast.error("All fragments have been already burned");
        return;
      }
      for (let i = 0; i < fragmentChunks.length; ++i) {
        const fragmentChunk = fragmentChunks[i];
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        const fragmentSources = fragmentChunk.map((e) => {
          return getAssociatedTokenAddressSync(e, publicKey);
        });

        const ix = FragmentorClient.buildInitUnfragmentIx(
          publicKey,
          selectedVault,
          unfragmentMint,
          fragmentChunk,
          fragmentSources
        );

        const tx = new Transaction({
          feePayer: publicKey,
          blockhash,
          lastValidBlockHeight,
        }).add(ix);

        const sig = await sendTransaction(tx, connection);

        await connection.confirmTransaction({
          signature: sig,
          blockhash,
          lastValidBlockHeight,
        });
        const toastId = toast.success(
          `NFT unfragmented instruction (${i + 1}/${fragmentChunks.length})`,
          {
            duration: Infinity,
          }
        );
        if (lastToast) toast.dismiss(lastToast);
        lastToast = toastId;
      }
      if (lastToast) setTimeout(() => toast.dismiss(lastToast!), 2000);

      toast.success("NFT unfragmented successfully");
      fetchFragments();
    } catch (err) {
      getErrorMessage(err);
      console.error(err);
      if (lastToast) toast.dismiss(lastToast);
    }
  }

  async function claimNft(mint: PublicKey) {
    try {
      if (!publicKey || !connection || !signTransaction || !selectedVault)
        return;

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const mintDestAcc = getAssociatedTokenAddressSync(mint, publicKey);
      const ix = FragmentorClient.buildInitClaimIx(
        publicKey,
        selectedVault,
        mint,
        mintDestAcc
      );
      const tx = new Transaction({
        feePayer: publicKey,
        blockhash,
        lastValidBlockHeight,
      }).add(ix);
      const sig = await sendTransaction(tx, connection);

      await connection.confirmTransaction({
        signature: sig,
        blockhash,
        lastValidBlockHeight,
      });
      toast.success("NFT claimed");

      fetchFragments();
      fetchNfts();
    } catch (err) {
      getErrorMessage(err);
      console.error(err);
    }
  }

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
        {vaults.map((vault) => {
          return (
            <div
              className="border border-cyan-700  bg-gray-100 p-2 px-4 font-semibold text-lg rounded-lg flex flex-col"
              key={vault.address.toBase58()}
              onClick={() => setSelectedVault(vault.address)}
            >
              <h2 className="text-gray-700">
                Vault:{" "}
                <span className="font-normal text-black">
                  {vault.address.toBase58()}
                </span>
              </h2>
              <h2 className="text-gray-700">
                Owner:{" "}
                <span className="font-normal text-black">
                  {vault.owner.toBase58()}
                </span>
              </h2>
              <h2 className="text-gray-700">
                Boxes:{" "}
                <span className="font-normal text-black">{vault.boxes}</span>
              </h2>
            </div>
          );
        })}
        <div>
          <h1 className="text-xl font-bold">
            Selected vault: {selectedVault?.toBase58()}
          </h1>
          {selectedVault && (
            <Link href={`/create-fragments/${selectedVault?.toBase58()}`}>
              <div className="bg-cyan-600 text-white p-2 px-4 my-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800 w-fit">
                Fragment NFT
              </div>
            </Link>
          )}
          <div className="flex flex-wrap gap-6">
            {fragments.map((fragment, i) => {
              return (
                <div
                  key={fragment.originalNft}
                  className="border border-cyan-700  bg-gray-100 p-2 px-4 text-lg rounded-lg flex flex-col w-[43rem]"
                >
                  <h3>
                    <strong>Original NFT:</strong> {fragment.originalNft}
                  </h3>
                  <button
                    className="bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
                    onClick={() =>
                      unfragmentNft(
                        new PublicKey(fragment.originalNft),
                        fragment.fragments
                      )
                    }
                  >
                    Unfragment
                  </button>
                  {fragment.fragments.map((f, l) => {
                    return (
                      <div key={f.mint.toBase58()}>
                        <strong>Fragment {l + 1}:</strong> {f.mint.toBase58()}
                        {f.isBurned ? "🔥️" : "❌️"}
                      </div>
                    );
                  })}
                  <button
                    className="bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
                    onClick={() =>
                      claimNft(new PublicKey(fragment.originalNft))
                    }
                  >
                    Claim
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
