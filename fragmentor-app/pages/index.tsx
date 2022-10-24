import type { NextPage } from "next";
import { useEffect, useMemo, useState } from "react";
import styles from "../styles/Home.module.css";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { FragmentorClient, buildMintNftIxs } from "../../js/dist/js/src/index";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { MetaplexClient } from "../lib/metaplex";
import { Nft } from "@metaplex-foundation/js";
import {
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [vaults, setVaults] = useState<string[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>("");
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [fragments, setFragments] = useState<
    { originalNft: string; fragments: string[] }[]
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
  }

  useEffect(() => {
    if (!publicKey || !metaplexClient) return;
    metaplexClient.getNFTsByOwner(publicKey).then((e) => e && setNfts(e));
  }, [connection, metaplexClient, publicKey]);

  async function mintNft() {
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

    return nftKp.publicKey;
  }

  async function createFragments(mintToFragment: PublicKey) {
    if (!publicKey || !connection || !signTransaction) return;
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const ata = getAssociatedTokenAddressSync(mintToFragment, publicKey);
    const fragments: PublicKey[] = [];
    for (let i = 0; i < 2; i++) {
      const fragmentPubkey = await mintNft();
      if (fragmentPubkey) fragments.push(fragmentPubkey);
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
    // const t = await signTransaction(tx);
    const sig = await sendTransaction(tx, connection);

    await connection.confirmTransaction({
      signature: sig,
      blockhash,
      lastValidBlockHeight,
    });
  }

  useEffect(() => {
    setVaults([]);
    setFragments([]);

    (async () => {
      if (!publicKey || !connection) return;
      const ownerVaults = await fragmentorClient.fetchVaultsByOwner(
        new PublicKey(publicKey?.toBase58()!)
      );
      setVaults(ownerVaults.map((e) => e.pubkey.toBase58()));
    })();
  }, [connection, fragmentorClient, publicKey]);

  useEffect(() => {
    if (!selectedVault) return;
    setFragments([]);

    (async () => {
      const e = await fragmentorClient.fetchWholeNftsByVault(
        new PublicKey(selectedVault)
      );
      for (let i of e) {
        const [z] = FragmentorClient.deserializeWholeNft(i.account);
        let frags = z.fragments.map((o) => o.mint.toBase58());
        setFragments((prev) => [
          ...prev,
          { originalNft: z.originalMint.toBase58(), fragments: frags },
        ]);
      }
    })();
  }, [connection, fragmentorClient, selectedVault]);

  return (
    <div className={styles.container}>
      <h1>your vaults:</h1>
      <button onClick={createVault}>Create vault</button>
      <button onClick={mintNft}>mint nft</button>
      {nfts.map((e) => {
        return (
          <figure key={e.mint.address.toBase58()}>
            <img src={e.json?.image} />
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
                  {fragment.fragments.map((f, l) => {
                    return (
                      <div key={f}>
                        fragment {l + 1}: {f}
                      </div>
                    );
                  })}
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
