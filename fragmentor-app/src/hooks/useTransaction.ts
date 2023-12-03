import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, Transaction, TransactionInstruction } from '@solana/web3.js'

type SendAndConfirmParams = {
  ixs: TransactionInstruction[]
  signers: Keypair[]
}

const MAX_RETRIES = 3

export default function useTransaction() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  async function sendAndConfirmTx({ ixs, signers }: SendAndConfirmParams) {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    const tx = new Transaction({
      feePayer: publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(...ixs)
    if (signers.length > 0) {
      tx.sign(...signers)
    }
    const signature = await sendTransaction(tx, connection, {
      maxRetries: MAX_RETRIES,
    })
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    })
  }

  return { sendAndConfirmTx }
}
