import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { FragmentorClient } from 'fragmentor'
import { toastProgramErrorMessage } from 'lib/utils'
import { useState } from 'react'
import toast from 'react-hot-toast'
import useMintNft from './useMint'
import useTransaction from './useTransaction'

export default function useFragments(vault: string | string[] | undefined) {
  const { connection } = useConnection()
  const [selectedNft, setSelectedNft] = useState<string | null>(null)
  const { publicKey, signTransaction } = useWallet()
  const [fragmentParts, setFragmentParts] = useState(4)
  const [fragments, setFragments] = useState<string[]>([])
  const sendAndConfirmTx = useTransaction()
  const mintNft = useMintNft()

  async function createFragments(mintToFragment: PublicKey) {
    let lastToast: string | null = null
    try {
      if (!publicKey || !connection || !signTransaction || !vault || fragmentParts <= 0) {
        return
      }
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const ata = getAssociatedTokenAddressSync(mintToFragment, publicKey)
      const fragments: PublicKey[] = []

      for (let i = 0; i < fragmentParts; i++) {
        const fragmentPubkey = await mintNft()

        if (fragmentPubkey) {
          fragments.push(fragmentPubkey)
        } else {
          return
        }

        const toastId = toast.success(`Minting fragment ${i + 1} of ${fragmentParts}...`, {
          duration: Infinity,
        })

        if (lastToast) {
          toast.dismiss(lastToast)
        }
        lastToast = toastId

        setFragments((prev) => [...prev, fragmentPubkey.toBase58()])
      }

      if (lastToast) {
        setTimeout(() => toast.dismiss(lastToast!), 2000)
      }

      const ix = FragmentorClient.buildInitFragmentIx(
        publicKey,
        new PublicKey(vault),
        mintToFragment,
        ata,
        fragments,
      )

      await sendAndConfirmTx({
        blockhash,
        lastValidBlockHeight,
        ixs: [ix],
        signers: [],
      })

      setSelectedNft(null)
      toast.success('Fragments created')
    } catch (err) {
      toastProgramErrorMessage(err)
      console.error(err)
      if (lastToast) {
        toast.dismiss(lastToast)
      }
    }
  }

  return {
    selectedNft,
    setSelectedNft,
    fragmentParts,
    setFragmentParts,
    createFragments,
    fragments,
    setFragments,
  }
}
