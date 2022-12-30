import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, Transaction, TransactionInstruction } from "@solana/web3.js";

type A = {
  blockhash: string;
  lastValidBlockHeight: number;
  ixs: TransactionInstruction[];
  signers: Keypair[];
};

export default function useTransaction() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  async function sendAndConfirmTx({
    blockhash,
    lastValidBlockHeight,
    ixs,
    signers,
  }: A) {
    const tx = new Transaction({
      feePayer: publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(...ixs);
    if (signers.length > 0) {
      tx.sign(...signers);
    }
    const sig = await sendTransaction(tx, connection, {
      maxRetries: 3,
    });

    await connection.confirmTransaction({
      signature: sig,
      blockhash,
      lastValidBlockHeight,
    });
  }

  return sendAndConfirmTx;
}
