import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Keypair } from '@solana/web3.js'
import { buildMintNftIxs } from 'fragmentor'
import useTransaction from './useTransaction'

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

  // @TODO - mint multiple nft in 1 tx
  async function mintNft(): Promise<PublicKey | undefined> {
    if (!publicKey || !connection) {
      return
    }
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    const nftKp = Keypair.generate()
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
  }

  return { mintNft }
}
