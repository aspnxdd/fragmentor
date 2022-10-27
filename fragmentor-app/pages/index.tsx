/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import type { Nft } from "@metaplex-foundation/js";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "../styles/Home.module.css";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  FragmentorClient,
  buildMintNftIxs,
  FragmentData,
} from "fragmentor/dist/js/src";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { MetaplexClient } from "../lib/metaplex";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [vaults, setVaults] = useState<string[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>("");
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [fragments, setFragments] = useState<
    { originalNft: string; fragments: FragmentData[] }[]
  >([]);

  const fragmentorClient = useMemo(
    () => new FragmentorClient(connection),
    [connection]
  );

  const metaplexClient = useMemo(
    () => new MetaplexClient(connection),
    [connection]
  );

  async function createVault() {
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

    fetchVaults();
  }

  const fetchNfts = useCallback(() => {
    if (!publicKey) return;
    metaplexClient.getNFTsByOwner(publicKey).then((e) => e && setNfts(e));
  }, [publicKey, metaplexClient]);

  useEffect(() => {
    if (!publicKey || !metaplexClient) return;
    fetchNfts();
  }, [connection, fetchNfts, metaplexClient, publicKey]);

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
      new PublicKey(vaults[0]),
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
    setVaults(ownerVaults.map((e) => e.pubkey.toBase58()));
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

    fetchFragments();
  }

  async function claimNft(mint: PublicKey) {
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

    fetchFragments();
    fetchNfts();
  }

  return (
    <div className={styles.container}>
      <h1>your vaults:</h1>
      <button onClick={createVault}>Create vault</button>
      <button onClick={mintNft}>mint nft</button>
      {nfts.map((e) => {
        return (
          <figure key={e.mint.address.toBase58()}>
            <img
              src={e.json?.image}
              alt={e.mint.address.toBase58()}
              width="110"
            />
            <figcaption>{e.name}</figcaption>
            <figcaption>{e.mint.address.toBase58()}</figcaption>
            <button onClick={() => createFragments(e.mint.address)}>
              Fragment NFT
            </button>
          </figure>
        );
      })}

      {vaults.map((vault) => {
        return (
          <div key={vault} onClick={() => setSelectedVault(vault)}>
            <h2>Vault: {vault}</h2>
            {fragments.map((fragment, i) => {
              return (
                <div key={i}>
                  <h3>original mint: {fragment.originalNft}</h3>
                  <button
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
                    onClick={() =>
                      claimNft(new PublicKey(fragment.originalNft))
                    }
                  >
                    claim
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Home;
