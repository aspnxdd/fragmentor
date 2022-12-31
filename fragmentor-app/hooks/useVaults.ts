import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { IVault, FragmentorClient, FragmentData } from 'fragmentor';
import { getErrorMessage } from 'lib/utils';
import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import useFetchNfts from './useFetchNfts';
import useTransaction from './useTransaction';
import { useQueryClient } from 'react-query';

type Fragments = { originalNft: string; fragments: FragmentData[] };

export default function useVaults() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [vaults, setVaults] = useState<(IVault & { address: PublicKey })[]>([]);
  const [selectedVault, setSelectedVault] = useState<PublicKey | null>(null);
  const [fragments, setFragments] = useState<Fragments[]>([]);
  const sendAndConfirmTx = useTransaction();

  const queryClient = useQueryClient();

  const fragmentorClient = useMemo(() => new FragmentorClient(connection), [connection]);

  async function createVault() {
    try {
      if (!publicKey || !connection) {
        return;
      }
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const vaultKp = Keypair.generate();
      const ix = FragmentorClient.buildInitVaultIx(publicKey, vaultKp.publicKey);

      await sendAndConfirmTx({
        blockhash,
        lastValidBlockHeight,
        ixs: [ix],
        signers: [vaultKp],
      });
      toast.success('Vault created successfully');
      await fetchVaults();
    } catch (err) {
      getErrorMessage(err);
      console.error(err);
    }
  }

  async function fetchVaults() {
    if (!publicKey || !connection) {
      return;
    }
    const ownerVaults = await fragmentorClient.fetchVaultsByOwner(publicKey);
    setVaults(
      ownerVaults.map((ownerVault) => {
        const [vault] = FragmentorClient.deserializeVault(ownerVault.account);
        return { ...vault, address: ownerVault.pubkey };
      }),
    );
  }

  async function fetchFragments() {
    if (!selectedVault) {
      return;
    }

    setFragments([]);
    const wholeNfts = await fragmentorClient.fetchWholeNftsByVault(selectedVault);
    for (let wholeNft of wholeNfts) {
      const [wholeNftData] = FragmentorClient.deserializeWholeNft(wholeNft.account);
      let frags = wholeNftData.fragments.map(({ isBurned, mint }) => {
        return { mint, isBurned };
      });
      setFragments((prev) => [
        ...prev,
        { originalNft: wholeNftData.originalMint.toBase58(), fragments: frags },
      ]);
    }
  }

  async function unfragmentNft(unfragmentMint: PublicKey, fragments: FragmentData[]) {
    let lastToast: string | null = null;
    try {
      if (!publicKey || !connection || !signTransaction || !selectedVault) {
        return;
      }

      // only those that are not already burned
      const fragmentChunks = FragmentorClient.splitArrayIntoChunks(
        fragments.reduce((acc, fragment) => {
          if (fragment.isBurned) {
            return acc;
          }
          return [...acc, fragment.mint];
        }, [] as PublicKey[]),
        4,
      );

      if (fragmentChunks.length === 0) {
        return toast.error('All fragments have been already burned');
      }

      for (let i = 0; i < fragmentChunks.length; ++i) {
        const fragmentChunk = fragmentChunks[i];
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

        const fragmentSources = fragmentChunk.map((mint) => {
          return getAssociatedTokenAddressSync(mint, publicKey);
        });

        const ix = FragmentorClient.buildInitUnfragmentIx(
          publicKey,
          selectedVault,
          unfragmentMint,
          fragmentChunk,
          fragmentSources,
        );

        await sendAndConfirmTx({
          blockhash,
          lastValidBlockHeight,
          ixs: [ix],
          signers: [],
        });

        const toastId = toast.success(
          `NFT unfragmented instruction (${i + 1}/${fragmentChunks.length})`,
          {
            duration: Infinity,
          },
        );
        if (lastToast) {
          toast.dismiss(lastToast);
        }
        lastToast = toastId;
      }
      if (lastToast) {
        setTimeout(() => toast.dismiss(lastToast!), 2000);
      }

      toast.success('NFT unfragmented successfully');
      await fetchFragments();
    } catch (err) {
      getErrorMessage(err);
      if (lastToast) {
        toast.dismiss(lastToast);
      }
    }
  }

  async function claimNft(mint: PublicKey) {
    try {
      if (!publicKey || !connection || !signTransaction || !selectedVault) {
        return;
      }

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const mintDestAcc = getAssociatedTokenAddressSync(mint, publicKey);
      const ix = FragmentorClient.buildInitClaimIx(publicKey, selectedVault, mint, mintDestAcc);
      await sendAndConfirmTx({
        blockhash,
        lastValidBlockHeight,
        ixs: [ix],
        signers: [],
      });
      toast.success('NFT claimed');

      await fetchFragments();
      await queryClient.refetchQueries('fetchNfts');
    } catch (err) {
      getErrorMessage(err);
      console.error(err);
    }
  }

  return {
    vaults,
    selectedVault,
    setSelectedVault,
    createVault,
    fetchVaults,
    fragments,
    fetchFragments,
    unfragmentNft,
    claimNft,
    setFragments,
    setVaults,
  };
}
