/* eslint-disable @next/next/no-img-element */
import { type FC, useEffect, useMemo, useState } from "react";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Popup from "./Popup";
import useFetchNfts from "../hooks/useFetchNfts";
import { MetaplexClient } from "../lib/metaplex";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useAtomValue } from "jotai";
import { walletNftsAtom } from "../states";
import Link from "next/link";
import Image from "next/image";
const Navbar: FC = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const fetchNfts = useFetchNfts();
  const { connection } = useConnection();
  const nfts = useAtomValue(walletNftsAtom);
  const { publicKey } = useWallet();
  const metaplexClient = useMemo(
    () => new MetaplexClient(connection),
    [connection]
  );

  useEffect(() => {
    if (!publicKey || !metaplexClient) return;
    fetchNfts();
  }, [connection, fetchNfts, metaplexClient, publicKey]);

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

        <Popup
          show={popupOpen}
          onClose={() => setPopupOpen(false)}
          title="My NFTs"
        >
          <div className="flex flex-wrap mt-10">
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
                </figure>
              );
            })}
          </div>
        </Popup>
        <div className="m-4">
          <WalletMultiButton
            style={{
              backgroundColor: "rgb(8 145 178)",
              fontFamily: "inherit",
              marginRight: "1rem",
            }}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
