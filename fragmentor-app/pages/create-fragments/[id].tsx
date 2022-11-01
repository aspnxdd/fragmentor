/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";

import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { FragmentorClient, buildMintNftIxs } from "fragmentor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useAtomValue } from "jotai";
import Popup from "components/Popup";
import useFetchNfts from "hooks/useFetchNfts";
import { MetaplexClient } from "lib/metaplex";
import { walletNftsAtom } from "states";
import { getErrorMessage } from "lib/utils";

const URI = "https://arweave.net/0m6rZv0Nim4277-wLTPtSTP2NIB_0zvrtTFoHcSeqTo"

const CreateFragment: NextPage = () => {
  const { query } = useRouter();
  const vault = query.id;
  const [popupOpen, setPopupOpen] = useState(false);
  const fetchNfts = useFetchNfts();
  const { connection } = useConnection();
  const nfts = useAtomValue(walletNftsAtom);
  const [selectedNft, setSelectedNft] = useState<string | null>(null);
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [fragmentParts, setFragmentParts] = useState(4);
  const [fragments, setFragments] = useState<string[]>([]);
  const metaplexClient = useMemo(
    () => new MetaplexClient(connection),
    [connection]
  );

  useEffect(() => {
    if (!publicKey || !metaplexClient) return;
    fetchNfts();
  }, [connection, fetchNfts, metaplexClient, publicKey, fragments]);

  // @TODO - mint multiple nft in 1 tx
  async function mintNft(): Promise<PublicKey | undefined> {
    if (!publicKey || !connection) return;
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const nftKp = Keypair.generate();
    const ixs = await buildMintNftIxs(connection, publicKey, nftKp.publicKey, "b", URI, "symb");

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
    return nftKp.publicKey;
  }

  async function createFragments(mintToFragment: PublicKey) {
    let lastToast: string | null = null;
    try {
      if (
        !publicKey ||
        !connection ||
        !signTransaction ||
        !vault ||
        fragmentParts <= 0
      )
        return;
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      const ata = getAssociatedTokenAddressSync(mintToFragment, publicKey);
      const fragments: PublicKey[] = [];

      for (let i = 0; i < fragmentParts; i++) {
        const res = await mintNft();
        if (!res) return;
        const fragmentPubkey = res;
        if (fragmentPubkey) fragments.push(fragmentPubkey);
        const toastId = toast.success(
          `Minting fragment ${i + 1} of ${fragmentParts}...`,
          {
            duration: Infinity,
          }
        );
        if (lastToast) toast.dismiss(lastToast);
        lastToast = toastId;

        setFragments((prev) => [...prev, fragmentPubkey.toBase58()]);
      }
      if (lastToast) setTimeout(() => toast.dismiss(lastToast!), 2000);

      const ix = FragmentorClient.buildInitFragmentIx(
        publicKey,
        new PublicKey(vault),
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
      setSelectedNft(null);
      toast.success("Fragments created");
    } catch (err) {
      getErrorMessage(err);
      console.error(err);
      if (lastToast) toast.dismiss(lastToast);
    }
  }

  return (
    <div className="m-10 flex flex-col gap-4">
      <button
        className="w-fit bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
        onClick={() => setPopupOpen(true)}
      >
        Select NFT
      </button>
      <Popup
        show={popupOpen}
        onClose={() => setPopupOpen(false)}
        title="My NFTs"
      >
        <div className="flex flex-wrap">
          {nfts.map((e) => {
            return (
              <figure
                key={e.mint.address.toBase58()}
                onClick={() => {
                  setSelectedNft(e.mint.address.toBase58());
                  setPopupOpen(false);
                  setFragments([]);
                }}
              >
                <img
                  src={e.json?.image}
                  alt={e.mint.address.toBase58()}
                  width="110"
                />
                <figcaption>{e.name}</figcaption>
                <figcaption>{e.mint.address.toBase58()}</figcaption>
              </figure>
            );
          })}
        </div>
      </Popup>
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
      {selectedNft && (
        <>
          <h2>Selected NFT</h2>
          <div>
            <figure>
              <img
                src={
                  nfts.find((e) => e.mint.address.toBase58() === selectedNft)
                    ?.json?.image
                }
                alt={selectedNft}
                width="110"
              />
              <figcaption>{selectedNft}</figcaption>
            </figure>
          </div>
        </>
      )}
      <button
        className={`w-fit bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800 disabled:bg-gray-500`}
        disabled={!selectedNft}
        onClick={() => createFragments(new PublicKey(selectedNft!))}
      >
        {`Create ${fragmentParts} Fragments`}
      </button>
      {fragments.length > 0 && (
        <div>
          <h2>Fragments</h2>
          <div className="flex flex-wrap">
            {fragments.map((fragment) => {
              return (
                <figure key={fragment}>
                  <img
                    src={
                      nfts.find((e) => e.mint.address.toBase58() === fragment)
                        ?.json?.image
                    }
                    alt={fragment}
                    width="110"
                  />
                  <figcaption>{fragment}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateFragment;
