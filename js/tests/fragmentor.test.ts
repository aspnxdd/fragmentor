import * as anchor from "@project-serum/anchor";

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
import {
  createClaimInstruction,
  ClaimInstructionAccounts,
} from "../src/generated/instructions/claim";
import { Vault } from "../src/generated/accounts/Vault";
import { WholeNft } from "../src/generated/accounts/WholeNft";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import {
  buildMintNftIx,
  program,
  provider,
  transferMint,
  wallet,
} from "./utils";
import { expect, assert } from "chai";
import { getVaultAuthPda, getWholeNftPda, getWholeNftThronePda } from "./pda";

describe("fragmentor", async () => {
  let mintKey: anchor.web3.Keypair;
  let fragment1: anchor.web3.Keypair;
  let fragment2: anchor.web3.Keypair;
  let fragment3: anchor.web3.Keypair;
  let fragment4: anchor.web3.Keypair;
  let fragment5: anchor.web3.Keypair;
  let fragment6: anchor.web3.Keypair;
  let fragment7: anchor.web3.Keypair;

  let destAtaMint1: anchor.web3.PublicKey;
  let destAtaFrag1: anchor.web3.PublicKey;
  let destAtaFrag2: anchor.web3.PublicKey;
  let destAtaFrag3: anchor.web3.PublicKey;
  let destAtaFrag4: anchor.web3.PublicKey;
  let destAtaFrag5: anchor.web3.PublicKey;
  let destAtaFrag6: anchor.web3.PublicKey;
  let destAtaFrag7: anchor.web3.PublicKey;

  const secondWallet = Keypair.generate();
  const vault = Keypair.generate();

  before("Mint and transfer NFTs", async () => {
    const [_mintKey, ix00] = await buildMintNftIx();
    const [_fragment1, ix01] = await buildMintNftIx();
    const [_fragment2, ix02] = await buildMintNftIx();
    const [_fragment3, ix03] = await buildMintNftIx();
    const [_fragment4, ix04] = await buildMintNftIx();
    const [_fragment5, ix05] = await buildMintNftIx();
    const [_fragment6, ix06] = await buildMintNftIx();
    const [_fragment7, ix07] = await buildMintNftIx();

    mintKey = _mintKey;
    fragment1 = _fragment1;
    fragment2 = _fragment2;
    fragment3 = _fragment3;
    fragment4 = _fragment4;
    fragment5 = _fragment5;
    fragment6 = _fragment6;
    fragment7 = _fragment7;

    // max can jam 5 ixs into 1 tx
    const t1 = new Transaction().add(ix00, ix01, ix02, ix03, ix04);
    const t2 = new Transaction().add(ix05, ix06, ix07);
    await program?.provider?.sendAndConfirm?.(t1, [wallet.payer]);
    await program?.provider?.sendAndConfirm?.(t2, [wallet.payer]);

    console.log({ secondWallet: secondWallet.publicKey.toBase58() });
    await provider.connection.requestAirdrop(secondWallet.publicKey, 1e9);

    destAtaMint1 = await transferMint(
      mintKey.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    destAtaFrag1 = await transferMint(
      fragment1.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    destAtaFrag2 = await transferMint(
      fragment2.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    destAtaFrag3 = await transferMint(
      fragment3.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    destAtaFrag4 = await transferMint(
      fragment4.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    destAtaFrag5 = await transferMint(
      fragment5.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    destAtaFrag6 = await transferMint(
      fragment6.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
    destAtaFrag7 = await transferMint(
      fragment7.publicKey,
      secondWallet.publicKey,
      wallet.payer
    );
  });

  it("Init Vault", async () => {
    // console.log({ wholeNftThronePDA: wholeNftThronePDA.toBase58() });
    // console.log({ vaultAuthPDA: vaultAuthPDA.toBase58() });
    // console.log({ wholeNftPDA: wholeNftPDA.toBase58() });
    // console.log({ wholeNftThronePDABump: wholeNftThronePDABump });
    // console.log({ vaultAuthPDABump: vaultAuthPDABump });
    // console.log({ wholeNftPDABump: wholeNftPDABump });
    // console.log({ vault: vault.publicKey.toBase58() });
    const [vaultAuthPDA, vaultAuthPDABump] = getVaultAuthPda(
      mintKey.publicKey,
      vault.publicKey
    );
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
    console.log("vault created");

    Vault.gpaBuilder()
      .addFilter("owner", wallet.publicKey)
      .run(provider.connection)
      .then((vaults) => {
        vaults.forEach((acc) => {
          const [vaultData] = Vault.deserialize(acc.account.data);
          console.log("Vault", vaultData.pretty());
          const owner = vaultData.owner.toBase58();
          expect(owner).to.eq(secondWallet.publicKey.toBase58());
          const authority = vaultData.authority.toBase58();
          expect(authority).to.eq(vaultAuthPDA.toBase58());
          const authoritySeed = vaultData.authoritySeed.toBase58();
          expect(authoritySeed).to.eq(vault.publicKey.toBase58());
          const boxes = vaultData.boxes;
          expect(boxes).to.eq(0);
        });
      });
  });

  it("Init Fragment", async () => {
    const [wholeNftThronePDA, wholeNftThronePDABump] = getWholeNftThronePda(
      mintKey.publicKey,
      vault.publicKey
    );
    const [vaultAuthPDA, vaultAuthPDABump] = getVaultAuthPda(
      mintKey.publicKey,
      vault.publicKey
    );
    const [wholeNftPDA, wholeNftPDABump] = getWholeNftPda(
      mintKey.publicKey,
      vault.publicKey
    );

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
          expect(fragment1.publicKey.toBase58()).eq(_fragment1);
          assert.equal(fragment2.publicKey.toBase58(), _fragment2);
          const originalMint = wholeNft.originalMint.toBase58();
          assert.equal(originalMint, mintKey.publicKey.toBase58());
          const parts = wholeNft.parts;
          assert.equal(parts, 2);
        });
      });
  });

  it("Init unfragment", async () => {
    const [wholeNftThronePDA] = getWholeNftThronePda(
      mintKey.publicKey,
      vault.publicKey
    );
    const [vaultAuthPDA, vaultAuthPDABump] = getVaultAuthPda(
      mintKey.publicKey,
      vault.publicKey
    );
    const [wholeNftPDA] = getWholeNftPda(mintKey.publicKey, vault.publicKey);

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
  it("claim nft", async () => {
    const [wholeNftThronePDA, wholeNftThronePDABump] = getWholeNftThronePda(
      mintKey.publicKey,
      vault.publicKey
    );
    const [vaultAuthPDA, vaultAuthPDABump] = getVaultAuthPda(
      mintKey.publicKey,
      vault.publicKey
    );
    const [wholeNftPDA, wholeNftPDABump] = getWholeNftPda(
      mintKey.publicKey,
      vault.publicKey
    );

    const mintDestAta = await getAssociatedTokenAddress(
      mintKey.publicKey,
      secondWallet.publicKey
    );

    const claimIxAccs: ClaimInstructionAccounts = {
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: secondWallet.publicKey,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA,
      vault: vault.publicKey,
      wholeNft: wholeNftPDA,
      mint: mintKey.publicKey,
      mintDestAcc: mintDestAta,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    const tx = new anchor.web3.Transaction().add(
      createClaimInstruction(claimIxAccs, {
        bumpAuth: vaultAuthPDABump,
        bumpWholeNft: wholeNftPDABump,
        bumpWholeNftThrone: wholeNftThronePDABump,
      })
    );
    await program?.provider?.sendAndConfirm?.(tx, [secondWallet]);

    const response = await provider.connection.getParsedTokenAccountsByOwner(
      secondWallet.publicKey,
      {
        mint: mintKey.publicKey,
      }
    );
    const tokenAmount =
      response.value[0].account.data.parsed.info.tokenAmount.amount;
    
    expect(tokenAmount).to.equal("1");

    const vaults = await Vault.gpaBuilder()
      .addFilter("owner", wallet.publicKey)
      .run(provider.connection);
    for (const acc of vaults) {
      const [vaultData] = Vault.deserialize(acc.account.data);
      const owner = vaultData.owner.toBase58();
      expect(owner).to.equal(secondWallet.publicKey.toBase58());
      const authority = vaultData.authority.toBase58();
      expect(authority).to.equal(vaultAuthPDA.toBase58());
      const authoritySeed = vaultData.authoritySeed.toBase58();
      expect(authoritySeed).to.equal(vault.publicKey.toBase58());
      const boxes = (vaultData.boxes as anchor.BN).toNumber();
      expect(boxes).to.equal(0);
    }
  });
});
