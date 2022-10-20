import * as anchor from "@project-serum/anchor";

import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Keypair, Transaction } from "@solana/web3.js";
import {
  buildMintNftIx,
  program,
  provider,
  transferMint,
  wallet,
} from "./utils";
import { expect, assert } from "chai";
import { getVaultAuthPda } from "../src/pda";
import { FragmentorClient } from "../src/client";

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
  const fragmentorClient = new FragmentorClient(provider.connection);

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
    const [vaultAuthPDA] = getVaultAuthPda(vault.publicKey);

    const ix = FragmentorClient.buildInitVaultIx(
      wallet.publicKey,
      vault.publicKey
    );
    const tx1 = new anchor.web3.Transaction().add(ix);

    await program?.provider?.sendAndConfirm?.(tx1, [vault]);
    console.log("vault created");

    const vaults = await fragmentorClient.fetchVaultsByOwner(wallet.publicKey);

    expect(vaults.length).to.equal(1);

    const acc = vaults[0];

    const [vaultData] = FragmentorClient.deserializeVault(acc.account);
    const owner = vaultData.owner.toBase58();
    expect(owner).to.equal(wallet.publicKey.toBase58());
    const authority = vaultData.authority.toBase58();
    expect(authority).to.equal(vaultAuthPDA.toBase58());
    const authoritySeed = vaultData.authoritySeed.toBase58();
    expect(authoritySeed).to.equal(vault.publicKey.toBase58());
    const boxes = vaultData.boxes;
    expect(boxes).to.equal(0);
  });

  it("Init Fragment", async () => {
    const ix = FragmentorClient.buildInitFragmentIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      destAtaMint1,
      [
        fragment1.publicKey,
        fragment2.publicKey,
        fragment3.publicKey,
        fragment4.publicKey,
        fragment5.publicKey,
        fragment6.publicKey,
      ]
    );
    const tx1 = new anchor.web3.Transaction().add(ix);

    await program?.provider?.sendAndConfirm?.(tx1, [secondWallet]);

    const wholeNfts = await fragmentorClient.fetchWholeNftByOriginalMint(
      mintKey.publicKey
    );

    for (const acc of wholeNfts) {
      const [wholeNft] = FragmentorClient.deserializeWholeNft(acc.account);

      const _fragment1 = wholeNft.fragments[0].toBase58();
      const _fragment2 = wholeNft.fragments[1].toBase58();
      const _fragment3 = wholeNft.fragments[2].toBase58();
      const _fragment4 = wholeNft.fragments[3].toBase58();
      const _fragment5 = wholeNft.fragments[4].toBase58();
      const _fragment6 = wholeNft.fragments[5].toBase58();
      expect(fragment1.publicKey.toBase58()).to.equal(_fragment1);
      expect(fragment2.publicKey.toBase58()).to.equal(_fragment2);
      expect(fragment3.publicKey.toBase58()).to.equal(_fragment3);
      expect(fragment4.publicKey.toBase58()).to.equal(_fragment4);
      expect(fragment5.publicKey.toBase58()).to.equal(_fragment5);
      expect(fragment6.publicKey.toBase58()).to.equal(_fragment6);
      const originalMint = wholeNft.originalMint.toBase58();
      expect(originalMint).to.equal(mintKey.publicKey.toBase58());
      const parts = wholeNft.parts;
      expect(parts).to.equal(6);
    }
  });

  it("Init unfragment", async () => {
    const ix1 = FragmentorClient.buildInitUnfragmentIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      [fragment1.publicKey, fragment2.publicKey, fragment3.publicKey],
      [destAtaFrag1, destAtaFrag2, destAtaFrag3]
    );
    const ix2 = FragmentorClient.buildInitUnfragmentIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      [fragment4.publicKey, fragment5.publicKey, fragment6.publicKey],
      [destAtaFrag4, destAtaFrag5, destAtaFrag6]
    );

    // max can jam 7 fragments into a single transaction
    const tx1 = new Transaction().add(ix1, ix2);

    await program?.provider?.sendAndConfirm?.(tx1, [secondWallet]);

    const wholeNfts = await fragmentorClient.fetchWholeNftByOriginalMint(
      mintKey.publicKey
    );

    for (const acc of wholeNfts) {
      const [wholeNft] = FragmentorClient.deserializeWholeNft(acc.account);

      console.log("wholeNft", wholeNft.pretty());
      assert.equal(wholeNft.fragments.length, 0);
      assert.equal(wholeNft.parts, 0);
      assert.equal(
        wholeNft.originalMint.toBase58(),
        mintKey.publicKey.toBase58()
      );
    }
  });
  it("claim nft", async () => {
    const [vaultAuthPDA, vaultAuthPDABump] = getVaultAuthPda(vault.publicKey);

    const mintDestAta = await getAssociatedTokenAddress(
      mintKey.publicKey,
      secondWallet.publicKey
    );

    const ix1 = FragmentorClient.buildInitClaimIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      mintDestAta
    );
    const tx = new anchor.web3.Transaction().add(ix1);
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

    const vaults = await fragmentorClient.fetchVaultsByOwner(wallet.publicKey);

    expect(vaults.length).to.equal(1);

    const acc = vaults[0];

    const [vaultData] = FragmentorClient.deserializeVault(acc.account);
    const owner = vaultData.owner.toBase58();
    expect(owner).to.equal(wallet.publicKey.toBase58());
    const authority = vaultData.authority.toBase58();
    expect(authority).to.equal(vaultAuthPDA.toBase58());
    const authoritySeed = vaultData.authoritySeed.toBase58();
    expect(authoritySeed).to.equal(vault.publicKey.toBase58());
    const boxes = vaultData.boxes;
    expect(boxes).to.equal(0);
  });
});
