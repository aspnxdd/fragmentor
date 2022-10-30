/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";

import { useEffect, useMemo, useState } from "react";
import styles from "../styles/Home.module.css";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  FragmentorClient,
  buildMintNftIxs,
  type FragmentData,
  type IVault,
  errorFromCode,
} from "fragmentor/dist/js/src";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import useFetchNfts from "../hooks/useFetchNfts";
import toast from "react-hot-toast";
import { getErrorMessage, getProgramErrorNumber } from "../lib/utils";

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [vaults, setVaults] = useState<(IVault & { address: PublicKey })[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>("");
  const fetchNfts = useFetchNfts();
  const [popupOpen, setPopupOpen] = useState(false);
  const [fragments, setFragments] = useState<
    { originalNft: string; fragments: FragmentData[] }[]
  >([]);

  const fragmentorClient = useMemo(
    () => new FragmentorClient(connection),
    [connection]
  );

  async function createVault() {
    try{

      if (!publicKey || !connection) return;
      const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
      const vaultKp = Keypair.generate();
      const ix = FragmentorClient.buildInitVaultIx(publicKey, vaultKp.publicKey);
      
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
      toast("Vault created successfully");
      fetchVaults();
    }
    catch(err){
      getErrorMessage(err);
      console.error(err);
    }
  }

  async function mintNft(): Promise<[PublicKey, PublicKey] | undefined> {
    if (!publicKey || !connection) return;
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const nftKp = Keypair.generate();
    const nftKp2 = Keypair.generate();
    const ixs = await buildMintNftIxs(connection, publicKey, nftKp.publicKey);
    const ixs2 = await buildMintNftIxs(connection, publicKey, nftKp2.publicKey);

    const tx = new Transaction({
      feePayer: publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(...ixs, ...ixs2);
    tx.sign(...[nftKp, nftKp2]);
    const sig = await sendTransaction(tx, connection);

    await connection.confirmTransaction({
      signature: sig,
      blockhash,
      lastValidBlockHeight,
    });
    toast("NFT minted");
    fetchNfts();
    return [nftKp.publicKey, nftKp2.publicKey];
  }

  async function createFragments(mintToFragment: PublicKey) {
    if (!publicKey || !connection || !signTransaction) return;
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const ata = getAssociatedTokenAddressSync(mintToFragment, publicKey);
    const fragments: PublicKey[] = [];
    for (let i = 0; i < 2; i++) {
      const res = await mintNft();
      if (!res) return;
      const [fragmentPubkey1, fragmentPubkey2] = res;
      if (fragmentPubkey1) fragments.push(fragmentPubkey1);
      if (fragmentPubkey2) fragments.push(fragmentPubkey2);
    }

    const ix = FragmentorClient.buildInitFragmentIx(
      publicKey,
      new PublicKey(selectedVault),
      mintToFragment,
      ata,
      fragments
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

    fetchFragments();
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
  }, [connection, fragmentorClient, publicKey]);

  async function fetchFragments() {
    setFragments([]);
    const e = await fragmentorClient.fetchWholeNftsByVault(
      new PublicKey(selectedVault)
    );
    for (let i of e) {
      const [z] = FragmentorClient.deserializeWholeNft(i.account);
      let frags = z.fragments.map((o) => {
        return { mint: o.mint, isBurned: o.isBurned };
      });
      setFragments((prev) => [
        ...prev,
        { originalNft: z.originalMint.toBase58(), fragments: frags },
      ]);
    }
  }

  useEffect(() => {
    if (!selectedVault) return;
    fetchFragments();
  }, [connection, fragmentorClient, selectedVault]);

  async function unfragmentNft(
    unfragmentMint: PublicKey,
    fragments: PublicKey[]
  ) {
    try {
      if (!publicKey || !connection || !signTransaction) return;

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const fragmentSources = fragments.map((e) => {
        return getAssociatedTokenAddressSync(e, publicKey);
      });

      const ix = FragmentorClient.buildInitUnfragmentIx(
        publicKey,
        new PublicKey(selectedVault),
        unfragmentMint,
        fragments,
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
      toast("NFT unfragmented");

      fetchFragments();
    } catch (err) {
      getErrorMessage(err);
      console.error(err);
    }
  }

  async function claimNft(mint: PublicKey) {
    try {
      if (!publicKey || !connection || !signTransaction) return;

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const mintDestAcc = getAssociatedTokenAddressSync(mint, publicKey);
      const ix = FragmentorClient.buildInitClaimIx(
        publicKey,
        new PublicKey(selectedVault),
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
      toast("NFT claimed");

      fetchFragments();
      fetchNfts();
    } catch (err) {
      getErrorMessage(err);
      console.error(err);
    }
  }

  return (
    <div className={styles.container}>
      <h1>Your vaults:</h1>

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
        Mint nft
      </button>
      <div>
        {vaults.map((vault) => {
          return (
            <div
              className="bg-cyan-700 p-2 px-4 border-0 font-semibold text-lg rounded-lg"
              key={vault.address.toBase58()}
              onClick={() => setSelectedVault(vault.address.toBase58())}
            >
              <h2>
                Vault: {vault.address.toBase58()} [{vault.boxes}]
              </h2>
              <h2>Owner: {vault.owner.toBase58()}</h2>

              {fragments.map((fragment, i) => {
                return (
                  <div key={i}>
                    <h3>original mint: {fragment.originalNft}</h3>
                    <button
                      className="bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
                      onClick={() =>
                        unfragmentNft(
                          new PublicKey(fragment.originalNft),
                          fragment.fragments.map((o) => o.mint)
                        )
                      }
                    >
                      Unfragment
                    </button>
                    {fragment.fragments.map((f, l) => {
                      return (
                        <div key={f.mint.toBase58()}>
                          fragment {l + 1}: {f.mint.toBase58()} -{" "}
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
          );
        })}
      </div>
    </div>
  );
};

export default Home;
