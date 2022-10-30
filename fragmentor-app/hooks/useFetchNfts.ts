import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useSetAtom } from "jotai";
import { useMemo, useCallback } from "react";
import { MetaplexClient } from "../lib/metaplex";
import { walletNftsAtom } from "../states";

export default function useFetchNfts() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const setNfts = useSetAtom(walletNftsAtom);

  const metaplexClient = useMemo(
    () => new MetaplexClient(connection),
    [connection]
  );

  const fetchNfts = useCallback(() => {
    if (!publicKey) return;
    metaplexClient.getNFTsByOwner(publicKey).then((e) => e && setNfts(e));
  }, [publicKey, metaplexClient, setNfts]);

  return fetchNfts;
}
