import * as anchor from "@project-serum/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export class NodeWallet {
  wallet: anchor.Wallet;
  conn: Connection;
  constructor(conn: Connection, wallet: anchor.Wallet) {
    this.wallet = wallet;
    this.conn = conn;
  }

  async createFundedWallet(lamports: number = 20 * LAMPORTS_PER_SOL): Promise<Keypair> {
    const wallet = Keypair.generate();
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.wallet.publicKey,
        toPubkey: wallet.publicKey,
        lamports,
      })
    );
    await sendAndConfirmTransaction(this.conn, tx, [this.wallet.payer]);
    return wallet;
  }
}
