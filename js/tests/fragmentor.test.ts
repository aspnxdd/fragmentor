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
import { WholeNft } from "../src/generated/accounts/WholeNft";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
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

    const vault = Keypair.generate();

    // account holding the whole nft account data
    const [wholeNftPDA, wholeNftPDABump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("whole_nft"),
        mintKey.publicKey.toBytes(),
        vault.publicKey.toBytes(),
      ],
      program.programId
    );

    // vault auth that will manage tokens in n out
    // the vault auth is the owner of the token account holding the original nft
    const [vaultAuthPDA, vaultAuthPDABump] = PublicKey.findProgramAddressSync(
      [Buffer.from(vault.publicKey.toBytes())],
      program.programId
    );

    // token account holding the original nft
    const [wholeNftThronePDA, wholeNftThronePDABump] =
      PublicKey.findProgramAddressSync(
        [
          Buffer.from("whole_nft_throne"),
          mintKey.publicKey.toBytes(),
          vault.publicKey.toBytes(),
        ],
        program.programId
      );

    console.log({ wholeNftThronePDA: wholeNftThronePDA.toBase58() });
    console.log({ vaultAuthPDA: vaultAuthPDA.toBase58() });
    console.log({ wholeNftPDA: wholeNftPDA.toBase58() });
    console.log({ wholeNftThronePDABump: wholeNftThronePDABump });
    console.log({ vaultAuthPDABump: vaultAuthPDABump });
    console.log({ wholeNftPDABump: wholeNftPDABump });
    console.log({ vault: vault.publicKey.toBase58() });

    const initVaultIxAccs: InitVaultInstructionAccounts = {
      creator: wallet.publicKey,
      payer: wallet.publicKey,
      vault: vault.publicKey,
      systemProgram: SystemProgram.programId,
    };

    const tx1 = new anchor.web3.Transaction().add(
      createInitVaultInstruction(initVaultIxAccs)
    );

    await program?.provider?.sendAndConfirm?.(tx1, [vault]);

    const fragmentIxAccs: FragmentInstructionAccounts = {
      mint: mintKey.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      fragmenter: wallet.publicKey,
      mintSource: mintAta,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,

      //this authority is an account derived from the vault address that is the owner of the ATA holding the whole NFT
      authority: vaultAuthPDA,
      vault: vault.publicKey,
      wholeNft: wholeNftPDA,
    };

    console.log({vaultAuthPDA: vaultAuthPDA.toBase58()})

    const tx = new anchor.web3.Transaction().add(
      createFragmentInstruction(fragmentIxAccs, {
        bumpAuth: vaultAuthPDABump,
        originalNft: mintKey.publicKey,
        fragmentedNfts: [fragment1.publicKey, fragment2.publicKey],
      })
    );
    await program?.provider?.sendAndConfirm?.(tx, [wallet.payer]);

    Vault.gpaBuilder()
      .addFilter("owner", wallet.publicKey)
      .run(provider.connection)
      .then((vaults) => {
        vaults.forEach((acc) => {
          const [vaultData] = Vault.deserialize(acc.account.data);
          console.log("Vault", vaultData.pretty());
          const owner = vaultData.owner.toBase58();
          assert.equal(owner, wallet.publicKey.toBase58());
          const authority = vaultData.authority.toBase58();
          assert.equal(authority, vaultAuthPDA.toBase58());
          const authoritySeed = vaultData.authoritySeed.toBase58();
          assert.equal(authoritySeed, vault.publicKey.toBase58());
          const boxes = vaultData.boxes;
          assert.equal(boxes, 1);
        });
      });

    WholeNft.gpaBuilder()
      .addFilter("originalMint", mintKey.publicKey)
      .run(provider.connection)
      .then((wholeNfts) => {
        wholeNfts.forEach((acc) => {
          const [wholeNft] = WholeNft.deserialize(acc.account.data);
          console.log(
            "WholeNft fragments",
            wholeNft.fragments.map((x) => x.toBase58())
          );
          console.log(
            "WholeNft originalMint",
            wholeNft.originalMint.toBase58()
          );
          console.log("WholeNft parts", wholeNft.parts);
          const _fragment1 = wholeNft.fragments[0].toBase58();
          const _fragment2 = wholeNft.fragments[1].toBase58();
          assert.equal(fragment1.publicKey.toBase58(), _fragment1);
          assert.equal(fragment2.publicKey.toBase58(), _fragment2);
          const originalMint = wholeNft.originalMint.toBase58();
          assert.equal(originalMint, mintKey.publicKey.toBase58());
          const parts = wholeNft.parts;
          assert.equal(parts, 2);
        });
      });
  });
});
