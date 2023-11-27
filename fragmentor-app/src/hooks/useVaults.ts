import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Keypair } from '@solana/web3.js'
import { FragmentorClient } from 'fragmentor-sdk'
import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useQuery } from 'react-query'
import useTransaction from './useTransaction'
import { toastProgramErrorMessage } from '../lib/utils'
import useFetchNfts from './useFetchNfts'
import useFragments from './useFragments'

export default function useVaults() {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const [selectedVault, setSelectedVault] = useState<PublicKey | null>(null)
  const { sendAndConfirmTx } = useTransaction()
  const { fetchFragments } = useFragments(selectedVault)
  const { fetchNftsQuery } = useFetchNfts()

  const fragmentorClient = useMemo(() => new FragmentorClient(connection), [connection])

  async function createVault() {
    try {
      if (!publicKey || !connection) {
        return
      }
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const vaultKp = Keypair.generate()
      const ix = FragmentorClient.buildInitVaultIx(publicKey, vaultKp.publicKey)

      await sendAndConfirmTx({
        blockhash,
        lastValidBlockHeight,
        ixs: [ix],
        signers: [vaultKp],
      })
      toast.success('Vault created successfully')
      await fetchVaults.refetch()
    } catch (err) {
      toastProgramErrorMessage(err)
      console.error(err)
    }
  }

  const fetchVaults = useQuery(
    ['fetchVaults', publicKey?.toBase58()],
    async () => {
      if (!publicKey || !connection) {
        return
      }
      const ownerVaults = await fragmentorClient.fetchVaultsByOwner(publicKey)
      return ownerVaults.map((ownerVault) => {
        const [vault] = FragmentorClient.deserializeVault(ownerVault.account)
        return { ...vault, address: ownerVault.pubkey }
      })
    },
    {
      enabled: !!publicKey && !!connection,
    },
  )

  async function claimNft(mint: PublicKey) {
    try {
      if (!publicKey || !connection || !signTransaction || !selectedVault) {
        return
      }

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const mintDestAcc = getAssociatedTokenAddressSync(mint, publicKey)
      const ix = FragmentorClient.buildInitClaimIx(publicKey, selectedVault, mint, mintDestAcc)
      await sendAndConfirmTx({
        blockhash,
        lastValidBlockHeight,
        ixs: [ix],
        signers: [],
      })
      toast.success('NFT claimed')
      await fetchFragments.refetch()
      await fetchVaults.refetch()
      await fetchNftsQuery.refetch()
    } catch (err) {
      toastProgramErrorMessage(err)
      console.error(err)
    }
  }

  return {
    selectedVault,
    setSelectedVault,
    createVault,
    fetchVaults,
    claimNft,
  }
}
