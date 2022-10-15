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
import {
  createUnfragInstruction,
  UnfragInstructionAccounts,
} from "../src/generated/instructions/unfrag";
import { Vault } from "../src/generated/accounts/Vault";
import { WholeNft } from "../src/generated/accounts/WholeNft";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
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
    async function buildMintNftIx(): Promise<
      [
        anchor.web3.Keypair,
        anchor.web3.PublicKey,
        anchor.web3.TransactionInstruction
      ]
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

      return [mintKey, ata, ix];
    }

    const [mintKey, mintAta, ix00] = await buildMintNftIx();
    const [fragment1, fragment1ata, ix01] = await buildMintNftIx();
    const [fragment2, fragment2ata, ix02] = await buildMintNftIx();
    const [fragment3, fragment3ata, ix03] = await buildMintNftIx();

    // await program?.provider?.sendAndConfirm?.(ix, [wallet.payer]);

    const [fragment4, fragment4ata, ix04] = await buildMintNftIx();
    const [fragment5, fragment5ata, ix05] = await buildMintNftIx();
    const [fragment6, fragment6ata, ix06] = await buildMintNftIx();
    const [fragment7, fragment7ata, ix07] = await buildMintNftIx();
    const [fragment8, fragment8ata, ix08] = await buildMintNftIx();
    const [fragment9, fragment9ata, ix09] = await buildMintNftIx();

    // max can jam 5 ixs into 1 tx
    const t1 = new Transaction().add(ix00, ix01, ix02, ix03, ix04);
    const t2 = new Transaction().add(ix05, ix06, ix07, ix08, ix09);
    await program?.provider?.sendAndConfirm?.(t1, [wallet.payer]);
    await program?.provider?.sendAndConfirm?.(t2, [wallet.payer]);

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

    // console.log({ wholeNftThronePDA: wholeNftThronePDA.toBase58() });
    // console.log({ vaultAuthPDA: vaultAuthPDA.toBase58() });
    // console.log({ wholeNftPDA: wholeNftPDA.toBase58() });
    // console.log({ wholeNftThronePDABump: wholeNftThronePDABump });
    // console.log({ vaultAuthPDABump: vaultAuthPDABump });
    // console.log({ wholeNftPDABump: wholeNftPDABump });
    // console.log({ vault: vault.publicKey.toBase58() });

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

    const tx = new anchor.web3.Transaction().add(
      createFragmentInstruction(fragmentIxAccs, {
        bumpAuth: vaultAuthPDABump,
        originalNft: mintKey.publicKey,
        fragmentedNfts: [fragment1.publicKey, fragment2.publicKey, fragment3.publicKey, fragment4.publicKey, fragment5.publicKey, fragment6.publicKey, fragment7.publicKey, ],
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

      const remainingAccounts:anchor.web3.AccountMeta[] = [];
      remainingAccounts.push({
        pubkey: fragment1.publicKey,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: fragment2.publicKey,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: fragment3.publicKey,
        isWritable: true,
        isSigner: false,
      });

      remainingAccounts.push({
        pubkey: fragment1ata,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: fragment2ata,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts.push({
        pubkey: fragment3ata,
        isWritable: true,
        isSigner: false,
      });

      const remainingAccounts2:anchor.web3.AccountMeta[] = [];
      remainingAccounts2.push({
        pubkey: fragment4.publicKey,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts2.push({
        pubkey: fragment5.publicKey,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts2.push({
        pubkey: fragment6.publicKey,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts2.push({
        pubkey: fragment4ata,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts2.push({
        pubkey: fragment5ata,
        isWritable: true,
        isSigner: false,
      });
      remainingAccounts2.push({
        pubkey: fragment6ata,
        isWritable: true,
        isSigner: false,
      });

      const remainingAccounts3:anchor.web3.AccountMeta[] = [];
      remainingAccounts3.push({
        pubkey: fragment7.publicKey,
        isWritable: true,
        isSigner: false,
      });

      remainingAccounts3.push({
        pubkey: fragment7ata,
        isWritable: true,
        isSigner: false,
      });

    const unfragAccs: UnfragInstructionAccounts = {
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA,
      vault: vault.publicKey,
      wholeNft: wholeNftPDA,
      anchorRemainingAccounts: remainingAccounts,
    }

    const unfragAccs2: UnfragInstructionAccounts = {
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA,
      vault: vault.publicKey,
      wholeNft: wholeNftPDA,
      anchorRemainingAccounts: remainingAccounts2,
    }

    const unfragAccs3: UnfragInstructionAccounts = {
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA,
      vault: vault.publicKey,
      wholeNft: wholeNftPDA,
      anchorRemainingAccounts: remainingAccounts3,
    }

    // max can jam 7 fragments into a single transaction
    const tx2 = new anchor.web3.Transaction().add(
      createUnfragInstruction(unfragAccs, {
        bumpAuth: vaultAuthPDABump,
        fragmentedNfts: [fragment1.publicKey, fragment2.publicKey, fragment3.publicKey, ],
      })
    );
      tx2.add(
      createUnfragInstruction(unfragAccs2, {
        bumpAuth: vaultAuthPDABump,
        fragmentedNfts: [fragment4.publicKey, fragment5.publicKey, fragment6.publicKey, ],
      })
    )
    tx2.add(
      createUnfragInstruction(unfragAccs3, {
        bumpAuth: vaultAuthPDABump,
        fragmentedNfts: [fragment7.publicKey, ],
      })
    )
    await program?.provider?.sendAndConfirm?.(tx2, [wallet.payer]);

    WholeNft.gpaBuilder()
      .addFilter("originalMint", mintKey.publicKey)
      .run(provider.connection)
      .then((wholeNfts) => {
        wholeNfts.forEach((acc) => {
          const [wholeNft] = WholeNft.deserialize(acc.account.data);

          console.log("wholeNft", wholeNft.pretty());
          assert.equal(wholeNft.fragments.length, 0);
          assert.equal(wholeNft.parts, 0);
          assert.equal(wholeNft.originalMint.toBase58(), mintKey.publicKey.toBase58());

        });
      });
  });
});
