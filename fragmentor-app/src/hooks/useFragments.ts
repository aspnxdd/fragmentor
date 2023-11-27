import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { type FragmentData, FragmentorClient } from 'fragmentor-sdk'
import { toastProgramErrorMessage } from '../lib/utils'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useMintNft from './useMint'
import useTransaction from './useTransaction'
import useFetchNfts from './useFetchNfts'
import { useQuery } from 'react-query'

type Fragments = { originalNft: string; fragments: FragmentData[] }

const DEFAULT_FRAGMENT_PARTS = 4

export default function useFragments(_selectedVault: PublicKey | null | string) {
  const { connection } = useConnection()
  const [selectedNft, setSelectedNft] = useState<string | null>(null)
  const { publicKey, signTransaction } = useWallet()
  const [fragmentParts, setFragmentParts] = useState(DEFAULT_FRAGMENT_PARTS)
  const [fragments, setFragments] = useState<string[]>([])
  const { sendAndConfirmTx } = useTransaction()
  const { mintNft } = useMintNft()
  const { fetchNftsQuery } = useFetchNfts()
  const fragmentorClient = useMemo(() => new FragmentorClient(connection), [connection])

  const selectedVault =
    typeof _selectedVault === 'string'
      ? new PublicKey(_selectedVault)
      : _selectedVault instanceof PublicKey
      ? _selectedVault
      : null

  async function createFragments(mintToFragment: PublicKey) {
    let lastToast: string | null = null
    try {
      if (!publicKey || !connection || !signTransaction || !selectedVault || fragmentParts <= 0) {
        return
      }
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const fragments: PublicKey[] = []

      for (let i = 0; i < fragmentParts; i++) {
        const fragmentPubkey = await mintNft({ shouldRefetchNfts: false, shouldToast: false })

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
        await fetchNftsQuery.refetch()
      }

      if (lastToast) {
        setTimeout(() => toast.dismiss(lastToast!), 2000)
      }

      const ata = getAssociatedTokenAddressSync(mintToFragment, publicKey)

      const ix = FragmentorClient.buildInitFragmentIx(
        publicKey,
        selectedVault,
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
      toast.success('Fragments created')
    } catch (err) {
      toastProgramErrorMessage(err)
      console.error(err)
      if (lastToast) {
        toast.dismiss(lastToast)
      }
    }
  }

  const fetchFragments = useQuery(
    ['fetchFragments', selectedVault?.toBase58()],
    async () => {
      if (!selectedVault) {
        return
      }
      const fragments: Fragments[] = []
      const wholeNfts = await fragmentorClient.fetchWholeNftsByVault(selectedVault)
      for (const wholeNft of wholeNfts) {
        const [wholeNftData] = FragmentorClient.deserializeWholeNft(wholeNft.account)
        const frags = wholeNftData.fragments.map(({ isBurned, mint }) => {
          return { mint, isBurned }
        })
        fragments.push({ originalNft: wholeNftData.originalMint.toBase58(), fragments: frags })
      }
      return fragments
    },
    {
      enabled: !!selectedVault,
    },
  )

  async function unfragmentNft(unfragmentMint: PublicKey, fragments: FragmentData[]) {
    let lastToast: string | null = null
    try {
      if (!publicKey || !connection || !signTransaction || !selectedVault) {
        return
      }

      // only those that are not already burned
      const fragmentChunks = FragmentorClient.splitArrayIntoChunks(
        fragments.reduce((acc, fragment) => {
          if (fragment.isBurned) {
            return acc
          }
          return [...acc, fragment.mint]
        }, [] as PublicKey[]),
        4,
      )

      if (fragmentChunks.length === 0) {
        return toast.error('All fragments have been already burned')
      }

      for (let i = 0; i < fragmentChunks.length; ++i) {
        const fragmentChunk = fragmentChunks[i]
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

        const fragmentSources = fragmentChunk.map((mint) => {
          return getAssociatedTokenAddressSync(mint, publicKey)
        })

        const ix = FragmentorClient.buildInitUnfragmentIx(
          publicKey,
          selectedVault,
          unfragmentMint,
          fragmentChunk,
          fragmentSources,
        )

        await sendAndConfirmTx({
          blockhash,
          lastValidBlockHeight,
          ixs: [ix],
          signers: [],
        })

        const toastId = toast.success(
          `NFT unfragmented instruction (${i + 1}/${fragmentChunks.length})`,
          {
            duration: Infinity,
          },
        )
        if (lastToast) {
          toast.dismiss(lastToast)
        }
        lastToast = toastId
      }
      if (lastToast) {
        setTimeout(() => toast.dismiss(lastToast!), 2000)
      }

      toast.success('NFT unfragmented successfully')
      await fetchFragments.refetch()
    } catch (err) {
      toastProgramErrorMessage(err)
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
    fetchFragments,
    unfragmentNft,
  }
}
