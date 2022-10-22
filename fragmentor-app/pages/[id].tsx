import type { NextPage } from "next";
import { useEffect, useMemo, useState } from "react";
import styles from "../styles/Home.module.css";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { FragmentorClient } from "../../js/dist/js/src/index";
import { PublicKey } from "@solana/web3.js";

const Home: NextPage = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [vaults, setVaults] = useState<string[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>("");
  const [fragments, setFragments] = useState<
    { originalNft: string; fragments: string[] }[]
  >([]);

  const fragmentorClient = useMemo(
    () => new FragmentorClient(connection),
    [connection]
  );

  useEffect(() => {
    setVaults([]);
    setFragments([]);

    (async () => {
      const ownerVaults = await fragmentorClient.fetchVaultsByOwner(
        new PublicKey("HoW3qWigARorwqGMLU9xRppdwMHVNwvdrAFbUV7TDeDL")
      );
      setVaults(ownerVaults.map((e) => e.pubkey.toBase58()));
    })();
  }, [connection, fragmentorClient]);

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
