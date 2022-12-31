import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, Transaction, TransactionInstruction } from '@solana/web3.js';

type SendAndConfirmParams = {
  blockhash: string;
  lastValidBlockHeight: number;
  ixs: TransactionInstruction[];
  signers: Keypair[];
};

const MAX_RETRIES = 3;

export default function useTransaction() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  async function sendAndConfirmTx({
    blockhash,
    lastValidBlockHeight,
    ixs,
    signers,
  }: SendAndConfirmParams) {
    const tx = new Transaction({
      feePayer: publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(...ixs);
    if (signers.length > 0) {
      tx.sign(...signers);
    }
    const sig = await sendTransaction(tx, connection, {
      maxRetries: MAX_RETRIES,
    });

    await connection.confirmTransaction({
      signature: sig,
      blockhash,
      lastValidBlockHeight,
    });
  }

  return sendAndConfirmTx;
}
