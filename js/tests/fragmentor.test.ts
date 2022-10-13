import * as anchor from "@project-serum/anchor";
import { Fragmentor } from "../../target/types/fragmentor";
import {
  createMintNftInstruction,
  MintNftInstructionAccounts,
} from "../src/generated/instructions/mintNft";
import {
  createFragmentInstruction,
  FragmentInstructionAccounts,
} from "../src/generated/instructions/fragment";
import {
  createInitVaultInstruction,
  InitVaultInstructionAccounts,
} from "../src/generated/instructions/initVault";
import { Vault } from "../src/generated/accounts/Vault";
import { FragmentedMints } from "../src/generated/accounts/FragmentedMints";
import { WholeNft } from "../src/generated/accounts/WholeNft";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getMasterEdition,
  getMetadata,
  TOKEN_METADATA_PROGRAM_ID,
} from "./utils";
import { assert } from "chai";

describe("fragmentor", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Fragmentor as anchor.Program<Fragmentor>;

  it("Mint NFTs", async () => {
    console.log("MINT");
    const wallet = anchor.Wallet.local();
    async function mintNft(): Promise<
      [anchor.web3.Keypair, anchor.web3.PublicKey]
    > {
      const lamports: number =
        await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

      const mintKey = anchor.web3.Keypair.generate();

      const ata = await getAssociatedTokenAddress(
        mintKey.publicKey,
        wallet.publicKey
      );

      console.log({ ata });

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
      await program?.provider?.sendAndConfirm?.(tx, [wallet.payer]);

      return [mintKey, ata];
    }

    const [mintKey, mintAta] = await mintNft();
    const [fragment1] = await mintNft();
    const [fragment2] = await mintNft();

    const [wholeNftPDA, wholeNftPDABump] = PublicKey.findProgramAddressSync(
      [Buffer.from("whole_nft"), mintKey.publicKey.toBytes()],
      program.programId
    );

    const [fragmentedMintsPDA, fragmentedMintsPDABump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("fragments"), mintKey.publicKey.toBytes()],
        program.programId
      );

    const [vaultPDA, vaultPDABump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), wallet.publicKey.toBytes()],
      program.programId
    );

    const [vaultAuthPDA, vaultAuthPDABump] = PublicKey.findProgramAddressSync(
      [Buffer.from(vaultPDA.toBytes())],
      program.programId
    );

    const [wholeNftThronePDA, wholeNftThronePDABump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("whole_nft_throne"), vaultPDA.toBytes()],
        program.programId
      );

    console.log({ wholeNftThronePDA: wholeNftThronePDA.toBase58() });
    console.log({ vaultPDA: vaultPDA.toBase58() });
    console.log({ vaultAuthPDA: vaultAuthPDA.toBase58() });
    console.log({ fragmentedMintsPDA: fragmentedMintsPDA.toBase58() });
    console.log({ wholeNftPDA: wholeNftPDA.toBase58() });
    console.log({ wholeNftThronePDABump: wholeNftThronePDABump });
    console.log({ vaultPDABump: vaultPDABump });
    console.log({ vaultAuthPDABump: vaultAuthPDABump });
    console.log({ fragmentedMintsPDABump: fragmentedMintsPDABump });
    console.log({ wholeNftPDABump: wholeNftPDABump });
        
    const acs: InitVaultInstructionAccounts = {
      creator: wallet.publicKey,
      payer: wallet.publicKey,
      vault: vaultPDA,
      systemProgram: SystemProgram.programId,
    };

    const tx1 = new anchor.web3.Transaction().add(
      createInitVaultInstruction(acs)
    );

    await program?.provider?.sendAndConfirm?.(tx1, [wallet.payer]);

    (await Vault.gpaBuilder().run(provider.connection)).forEach((e) => {
      const [a] = Vault.deserialize(e.account.data);
      console.log("a", a.pretty());
    });

    const accs: FragmentInstructionAccounts = {
      mint: mintKey.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      wholeNft: wholeNftPDA,
      fragmentedMints: fragmentedMintsPDA,
      fragmenter: wallet.publicKey,
      mintSource: mintAta,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA, // change
      vault: vaultPDA,
    };

    const tx = new anchor.web3.Transaction().add(
      createFragmentInstruction(accs, {
        bumpAuth: vaultAuthPDABump,
        originalNft: mintKey.publicKey,
        fragmentedNfts: [fragment1.publicKey, fragment2.publicKey],
      })
    );

    await program?.provider?.sendAndConfirm?.(tx, [wallet.payer]);
  });
});
