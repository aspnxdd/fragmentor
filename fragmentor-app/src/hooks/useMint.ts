import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Keypair } from '@solana/web3.js'
import { buildMintNftIxs } from 'fragmentor-sdk'
import useTransaction from './useTransaction'
import toast from 'react-hot-toast'
import { trimAddress } from '../lib/utils'
import useFetchNfts from './useFetchNfts'

const URI = 'https://arweave.net/0m6rZv0Nim4277-wLTPtSTP2NIB_0zvrtTFoHcSeqTo'

const NFT_PARAMS = {
  title: 'Test NFT',
  symbol: 'TEST',
  uri: URI,
}

export default function useMintNft() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const { sendAndConfirmTx } = useTransaction()
  const { fetchNftsQuery } = useFetchNfts()

  // @TODO - mint multiple nft in 1 tx
  async function mintNft(
    { shouldRefetchNfts, shouldToast } = {
      shouldRefetchNfts: true,
      shouldToast: true,
    },
  ): Promise<PublicKey | undefined> {
    if (!publicKey || !connection) {
      return
    }

    const nftKp = Keypair.generate()
    const nftPubkey = trimAddress(nftKp.publicKey.toBase58())
    const promise = (async () => {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const ixs = await buildMintNftIxs(
        connection,
        publicKey,
        nftKp.publicKey,
        NFT_PARAMS.title,
        NFT_PARAMS.uri,
        NFT_PARAMS.symbol,
      )

      await sendAndConfirmTx({
        blockhash,
        lastValidBlockHeight,
        ixs,
        signers: [nftKp],
      })
      return nftKp.publicKey
    })()
    if (shouldToast) {
      await toast.promise(
        promise,
        {
          loading: `Minting NFT to ${nftPubkey}`,
          success: (data) => `Successfully minted to ${trimAddress(data.toBase58())}`,
          error: (err) => `This just happened: ${err.toString()}`,
        },
        {
          style: {
            minWidth: '250px',
          },
          success: {
            duration: 3000,
            icon: '🔥',
          },
          loading: {
            icon: '⏳',
          },
          error: {
            duration: 5000,
            icon: '👎',
          },
        },
      )
    } else {
      await promise
    }
    if (shouldRefetchNfts) {
      await fetchNftsQuery.refetch()
    }
    return nftKp.publicKey
  }

  return { mintNft }
}
