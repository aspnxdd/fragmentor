import * as anchor from "@project-serum/anchor";
import { Fragmentor } from "../../target/types/fragmentor";

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
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { buildMintNftIx, program, provider, transferMint, wallet } from "./utils";
import { assert } from "chai";

describe("fragmentor", () => {
  
  it("Mint NFTs", async () => {
    const [mintKey, mintAta, ix00] = await buildMintNftIx();
    const [fragment1, fragment1ata, ix01] = await buildMintNftIx();
    const [fragment2, fragment2ata, ix02] = await buildMintNftIx();
    const [fragment3, fragment3ata, ix03] = await buildMintNftIx();
    const [fragment4, fragment4ata, ix04] = await buildMintNftIx();
    const [fragment5, fragment5ata, ix05] = await buildMintNftIx();
    const [fragment6, fragment6ata, ix06] = await buildMintNftIx();
    const [fragment7, fragment7ata, ix07] = await buildMintNftIx();

    // max can jam 5 ixs into 1 tx
    const t1 = new Transaction().add(ix00, ix01, ix02, ix03, ix04);
    const t2 = new Transaction().add(ix05, ix06, ix07);
    await program?.provider?.sendAndConfirm?.(t1, [wallet.payer]);
    await program?.provider?.sendAndConfirm?.(t2, [wallet.payer]);

    const secondWallet = Keypair.generate();
    console.log({ secondWallet: secondWallet.publicKey.toBase58() });
    await provider.connection.requestAirdrop(secondWallet.publicKey, 1e9);

    const destAtaMint1 = await transferMint(
      mintKey.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    const destAtaFrag1 = await transferMint(
      fragment1.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    const destAtaFrag2 = await transferMint(
      fragment2.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    const destAtaFrag3 = await transferMint(
      fragment3.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    const destAtaFrag4 = await transferMint(
      fragment4.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    const destAtaFrag5 = await transferMint(
      fragment5.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    const destAtaFrag6 = await transferMint(
      fragment6.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    const destAtaFrag7 = await transferMint(
      fragment7.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );

    console.log("nfts trasnferred");

    const vault = Keypair.generate();

    // account holding the whole nft account data
    const [wholeNftPDA, wholeNftPDABump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("whole_nft"),
        mintKey.publicKey.toBytes(),
        vault.publicKey.toBytes(),
      ],
      program?.programId
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
    console.log("vault created");
    await program?.provider?.sendAndConfirm?.(tx1, [vault]);

    const fragmentIxAccs: FragmentInstructionAccounts = {
      mint: mintKey.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: secondWallet.publicKey,
      systemProgram: SystemProgram.programId,
      fragmenter: secondWallet.publicKey,
      mintSource: destAtaMint1,
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
        fragmentedNfts: [
          fragment1.publicKey,
          fragment2.publicKey,
          fragment3.publicKey,
          fragment4.publicKey,
          fragment5.publicKey,
          fragment6.publicKey,
          // fragment7.publicKey,
        ],
      })
    );
    await program?.provider?.sendAndConfirm?.(tx, [secondWallet]);

    console.log("fragments done");

    Vault.gpaBuilder()
      .addFilter("owner", wallet.publicKey)
      .run(provider.connection)
      .then((vaults) => {
        vaults.forEach((acc) => {
          const [vaultData] = Vault.deserialize(acc.account.data);
          console.log("Vault", vaultData.pretty());
          const owner = vaultData.owner.toBase58();
          assert.equal(owner, secondWallet.publicKey.toBase58());
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

    const remainingAccounts: anchor.web3.AccountMeta[] = [];
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
      pubkey: destAtaFrag1,
      isWritable: true,
      isSigner: false,
    });
    remainingAccounts.push({
      pubkey: destAtaFrag2,
      isWritable: true,
      isSigner: false,
    });
    remainingAccounts.push({
      pubkey: destAtaFrag3,
      isWritable: true,
      isSigner: false,
    });

    const remainingAccounts2: anchor.web3.AccountMeta[] = [];
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
      pubkey: destAtaFrag4,
      isWritable: true,
      isSigner: false,
    });
    remainingAccounts2.push({
      pubkey: destAtaFrag5,
      isWritable: true,
      isSigner: false,
    });
    remainingAccounts2.push({
      pubkey: destAtaFrag6,
      isWritable: true,
      isSigner: false,
    });

    const remainingAccounts3: anchor.web3.AccountMeta[] = [];
    remainingAccounts3.push({
      pubkey: fragment7.publicKey,
      isWritable: true,
      isSigner: false,
    });

    remainingAccounts3.push({
      pubkey: destAtaFrag7,
      isWritable: true,
      isSigner: false,
    });

    const unfragAccs: UnfragInstructionAccounts = {
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: secondWallet.publicKey,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA,
      vault: vault.publicKey,
      wholeNft: wholeNftPDA,
      anchorRemainingAccounts: remainingAccounts,
    };

    const unfragAccs2: UnfragInstructionAccounts = {
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: secondWallet.publicKey,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA,
      vault: vault.publicKey,
      wholeNft: wholeNftPDA,
      anchorRemainingAccounts: remainingAccounts2,
    };

    const unfragAccs3: UnfragInstructionAccounts = {
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: secondWallet.publicKey,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA,
      vault: vault.publicKey,
      wholeNft: wholeNftPDA,
      anchorRemainingAccounts: remainingAccounts3,
    };

    // max can jam 7 fragments into a single transaction
    const tx2 = new anchor.web3.Transaction().add(
      createUnfragInstruction(unfragAccs, {
        bumpAuth: vaultAuthPDABump,
        fragmentedNfts: [
          fragment1.publicKey,
          fragment2.publicKey,
          fragment3.publicKey,
        ],
      })
    );
    tx2.add(
      createUnfragInstruction(unfragAccs2, {
        bumpAuth: vaultAuthPDABump,
        fragmentedNfts: [
          fragment4.publicKey,
          fragment5.publicKey,
          fragment6.publicKey,
        ],
      })
    );
    // tx2.add(
    //   createUnfragInstruction(unfragAccs3, {
    //     bumpAuth: vaultAuthPDABump,
    //     fragmentedNfts: [fragment7.publicKey],
    //   })
    // );
    console.log({tx2});
    await program?.provider?.sendAndConfirm?.(tx2, [secondWallet]);

    WholeNft.gpaBuilder()
      .addFilter("originalMint", mintKey.publicKey)
      .run(provider.connection)
      .then((wholeNfts) => {
        wholeNfts.forEach((acc) => {
          const [wholeNft] = WholeNft.deserialize(acc.account.data);

          console.log("wholeNft", wholeNft.pretty());
          assert.equal(wholeNft.fragments.length, 0);
          assert.equal(wholeNft.parts, 0);
          assert.equal(
            wholeNft.originalMint.toBase58(),
            mintKey.publicKey.toBase58()
          );
        });
      });
  });
});
