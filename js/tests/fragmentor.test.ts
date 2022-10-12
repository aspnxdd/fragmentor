import * as anchor from "@project-serum/anchor";
import { Fragmentor } from "../../target/types/fragmentor";
import {
  createMintNftInstruction,
  MintNftInstructionAccounts,
} from "../src/generated/instructions/mintNft";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import {
  getMasterEdition,
  getMetadata,
  TOKEN_METADATA_PROGRAM_ID,
} from "./utils";

describe("fragmentor", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Fragmentor as anchor.Program<Fragmentor>;

  it("Mint NFTs", async () => {
    const wallet = anchor.Wallet.local();

    const lamports: number =
      await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    const mintKey = anchor.web3.Keypair.generate();

    const ata = await getAssociatedTokenAddress(
      mintKey.publicKey,
      wallet.publicKey
    );

    const mint_tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      createInitializeMintInstruction(
        mintKey.publicKey,
        0,
        wallet.publicKey,
        wallet.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        ata,
        wallet.publicKey,
        mintKey.publicKey
      )
    );

    await provider?.sendAndConfirm?.(mint_tx, [mintKey, wallet.payer]);

    const metadataAddress = await getMetadata(mintKey.publicKey);
    const masterEdition = await getMasterEdition(mintKey.publicKey);

    const accounts: MintNftInstructionAccounts = {
      mintAuthority: wallet.publicKey,
      mint: mintKey.publicKey,
      tokenAccount: ata,
      tokenProgram: TOKEN_PROGRAM_ID,
      metadata: metadataAddress,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      masterEdition,
    };

    const ix = createMintNftInstruction(accounts, {
      mintKey: mintKey.publicKey,
    });

    const tx = new anchor.web3.Transaction().add(ix);
    const sig = await program?.provider?.sendAndConfirm?.(tx, [wallet.payer]);

    console.log("Your transaction signature", sig);
  });
});
