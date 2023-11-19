import * as anchor from '@project-serum/anchor'

import { getAssociatedTokenAddress } from '@solana/spl-token'
import { Keypair, Transaction } from '@solana/web3.js'
import { buildMintNftIx, program, provider, transferMint, wallet } from './utils'
import { getVaultAuthPda } from '../src/pda'
import { FragmentorClient } from '../src/client'
import { describe, beforeAll, expect, it, assert } from 'vitest'

describe('fragmentor', async () => {
  let mintKey: anchor.web3.Keypair
  let fragment1: anchor.web3.Keypair
  let fragment2: anchor.web3.Keypair
  let fragment3: anchor.web3.Keypair
  let fragment4: anchor.web3.Keypair
  let fragment5: anchor.web3.Keypair
  let fragment6: anchor.web3.Keypair
  let fragment7: anchor.web3.Keypair

  let destAtaMint1: anchor.web3.PublicKey
  let destAtaFrag1: anchor.web3.PublicKey
  let destAtaFrag2: anchor.web3.PublicKey
  let destAtaFrag3: anchor.web3.PublicKey
  let destAtaFrag4: anchor.web3.PublicKey
  let destAtaFrag5: anchor.web3.PublicKey
  let destAtaFrag6: anchor.web3.PublicKey
  let destAtaFrag7: anchor.web3.PublicKey

  const secondWallet = Keypair.generate()
  const vault = Keypair.generate()
  const fragmentorClient = new FragmentorClient(provider.connection)

  beforeAll(async () => {
    const [_mintKey, ix00] = await buildMintNftIx()
    const [_fragment1, ix01] = await buildMintNftIx()
    const [_fragment2, ix02] = await buildMintNftIx()
    const [_fragment3, ix03] = await buildMintNftIx()
    const [_fragment4, ix04] = await buildMintNftIx()
    const [_fragment5, ix05] = await buildMintNftIx()
    const [_fragment6, ix06] = await buildMintNftIx()
    const [_fragment7, ix07] = await buildMintNftIx()

    mintKey = _mintKey
    fragment1 = _fragment1
    fragment2 = _fragment2
    fragment3 = _fragment3
    fragment4 = _fragment4
    fragment5 = _fragment5
    fragment6 = _fragment6
    fragment7 = _fragment7

    // max can jam 5 ixs into 1 tx
    const t1 = new Transaction().add(ix00, ix01, ix02, ix03)
    const t2 = new Transaction().add(ix04, ix05, ix06, ix07)
    await program?.provider?.sendAndConfirm?.(t1, [wallet.payer])
    await program?.provider?.sendAndConfirm?.(t2, [wallet.payer])

    console.log({ secondWallet: secondWallet.publicKey.toBase58() })
    await provider.connection.requestAirdrop(secondWallet.publicKey, 1e9)

    destAtaMint1 = await transferMint(mintKey.publicKey, secondWallet.publicKey, wallet.payer)
    destAtaFrag1 = await transferMint(fragment1.publicKey, secondWallet.publicKey, wallet.payer)
    destAtaFrag2 = await transferMint(fragment2.publicKey, secondWallet.publicKey, wallet.payer)
    destAtaFrag3 = await transferMint(fragment3.publicKey, secondWallet.publicKey, wallet.payer)
    destAtaFrag4 = await transferMint(fragment4.publicKey, secondWallet.publicKey, wallet.payer)
    destAtaFrag5 = await transferMint(fragment5.publicKey, secondWallet.publicKey, wallet.payer)
    destAtaFrag6 = await transferMint(fragment6.publicKey, secondWallet.publicKey, wallet.payer)
    destAtaFrag7 = await transferMint(fragment7.publicKey, secondWallet.publicKey, wallet.payer)
  }, Infinity)

  it('Can init vault', async () => {
    // console.log({ wholeNftThronePDA: wholeNftThronePDA.toBase58() });
    // console.log({ vaultAuthPDA: vaultAuthPDA.toBase58() });
    // console.log({ wholeNftPDA: wholeNftPDA.toBase58() });
    // console.log({ wholeNftThronePDABump: wholeNftThronePDABump });
    // console.log({ vaultAuthPDABump: vaultAuthPDABump });
    // console.log({ wholeNftPDABump: wholeNftPDABump });
    // console.log({ vault: vault.publicKey.toBase58() });
    const [vaultAuthPDA] = getVaultAuthPda(vault.publicKey)
    console.log({ vaultAuthPDA: vaultAuthPDA.toBase58(), vaultpkey: vault.publicKey.toBase58() })

    const ix = FragmentorClient.buildInitVaultIx(wallet.publicKey, vault.publicKey)
    const tx = new anchor.web3.Transaction().add(ix)

    await program?.provider?.sendAndConfirm?.(tx, [vault])
    console.log('vault created')

    const vaults = await fragmentorClient.fetchVaultsByOwner(wallet.publicKey)
    expect(vaults.length).to.greaterThan(0)
    const acc = vaults.find((e) =>
      FragmentorClient.deserializeVault(e.account)[0].authoritySeed.equals(vault.publicKey),
    )!
    expect(acc).toBeDefined()

    const [vaultData] = FragmentorClient.deserializeVault(acc.account)
    const owner = vaultData.owner.toBase58()
    expect(owner).to.equal(wallet.publicKey.toBase58())
    expect(vaultData.boxes).to.equal(0)
  })

  it('Can fragment original NFT into 6 fragments', async () => {
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
      ],
    )
    const tx1 = new anchor.web3.Transaction().add(ix)

    await program?.provider?.sendAndConfirm?.(tx1, [secondWallet])

    const vaults = await fragmentorClient.fetchVaultsByOwner(wallet.publicKey)
    expect(vaults.length).to.greaterThan(0)
    const acc = vaults.find((e) =>
      FragmentorClient.deserializeVault(e.account)[0].authoritySeed.equals(vault.publicKey),
    )!
    expect(acc).toBeDefined()

    const { boxes } = FragmentorClient.deserializeVault(acc.account)[0]

    expect(boxes).to.equal(1)

    const wholeNfts = await fragmentorClient.fetchWholeNftByOriginalMint(mintKey.publicKey)
    for (const acc of wholeNfts) {
      const [wholeNft] = FragmentorClient.deserializeWholeNft(acc.account)

      const _fragment1 = wholeNft.fragments[0].mint
      const _fragment2 = wholeNft.fragments[1].mint
      const _fragment3 = wholeNft.fragments[2].mint
      const _fragment4 = wholeNft.fragments[3].mint
      const _fragment5 = wholeNft.fragments[4].mint
      const _fragment6 = wholeNft.fragments[5].mint
      expect(fragment1.publicKey.equals(_fragment1))
      expect(fragment2.publicKey.equals(_fragment2))
      expect(fragment3.publicKey.equals(_fragment3))
      expect(fragment4.publicKey.equals(_fragment4))
      expect(fragment5.publicKey.equals(_fragment5))
      expect(fragment6.publicKey.equals(_fragment6))
      const originalMint = wholeNft.originalMint.toBase58()
      expect(originalMint).to.equal(mintKey.publicKey.toBase58())
      const parts = wholeNft.fragments.length
      expect(parts).to.equal(6)
      {
        // check that the original NFT is still owned by the original owner
        const response = await provider.connection.getParsedTokenAccountsByOwner(
          secondWallet.publicKey,
          {
            mint: mintKey.publicKey,
          },
        )
        const tokenAmount = response.value[0].account.data.parsed.info.tokenAmount.amount

        expect(tokenAmount).to.equal('0')
      }
      {
        // check that the fragments are owned by the fragmentor vault PDA
        const [vaultAuthPDA] = getVaultAuthPda(vault.publicKey)
        const response = await provider.connection.getParsedTokenAccountsByOwner(vaultAuthPDA, {
          mint: mintKey.publicKey,
        })
        const tokenAmount = response.value[0].account.data.parsed.info.tokenAmount.amount

        expect(tokenAmount).to.equal('1')
      }
    }
  })
  it('Cannot unfagment if wallet does not own fragments', async () => {
    const thirdWallet = Keypair.generate()
    const ix = FragmentorClient.buildInitUnfragmentIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      [fragment1.publicKey, fragment2.publicKey, fragment3.publicKey],
      [destAtaFrag1, destAtaFrag2, destAtaFrag3],
    )
    const tx1 = new anchor.web3.Transaction().add(ix)

    await expect(program?.provider?.sendAndConfirm?.(tx1, [thirdWallet])).to.rejects.toThrow(
      `unknown signer: ${thirdWallet.publicKey.toBase58()}`,
    )
  })
  it('Can unfragment first 3/6 fragments', async () => {
    const ix1 = FragmentorClient.buildInitUnfragmentIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      [fragment1.publicKey, fragment2.publicKey, fragment3.publicKey],
      [destAtaFrag1, destAtaFrag2, destAtaFrag3],
    )

    // max can jam 7 fragments into a single transaction
    const tx1 = new Transaction().add(ix1)

    await program?.provider?.sendAndConfirm?.(tx1, [secondWallet])

    const wholeNfts = await fragmentorClient.fetchWholeNftByOriginalMint(mintKey.publicKey)

    for (const acc of wholeNfts) {
      const [wholeNft] = FragmentorClient.deserializeWholeNft(acc.account)

      const burnedNfts = wholeNft.fragments.filter((f) => f.isBurned)

      console.log('wholeNft', wholeNft.pretty())
      assert.equal(burnedNfts.length, 3)
      assert.equal(wholeNft.originalMint.toBase58(), mintKey.publicKey.toBase58())
    }
  })
  it('Attempt to claim original NFT (whole NFT throne) throws error 0x1776 (Not all fragments have been destroyed)', async () => {
    const mintDestAta = await getAssociatedTokenAddress(mintKey.publicKey, secondWallet.publicKey)

    const ix1 = FragmentorClient.buildInitClaimIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      mintDestAta,
    )
    const tx = new anchor.web3.Transaction().add(ix1)
    await expect(program?.provider?.sendAndConfirm?.(tx, [secondWallet])).to.rejects.toThrow(
      '0x1776',
    )

    const response = await provider.connection.getParsedTokenAccountsByOwner(
      secondWallet.publicKey,
      {
        mint: mintKey.publicKey,
      },
    )
    const tokenAmount = response.value[0].account.data.parsed.info.tokenAmount.amount

    expect(tokenAmount).to.equal('0')
  })
  it('Can unfragment remaining 3/6 fragments and all fragments are burned', async () => {
    const ix2 = FragmentorClient.buildInitUnfragmentIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      [fragment4.publicKey, fragment5.publicKey, fragment6.publicKey],
      [destAtaFrag4, destAtaFrag5, destAtaFrag6],
    )

    const tx2 = new Transaction().add(ix2)

    await program?.provider?.sendAndConfirm?.(tx2, [secondWallet])

    const wholeNfts = await fragmentorClient.fetchWholeNftByOriginalMint(mintKey.publicKey)

    for (const acc of wholeNfts) {
      const [wholeNft] = FragmentorClient.deserializeWholeNft(acc.account)

      const burnedNfts = wholeNft.fragments.filter((f) => f.isBurned)

      console.log('wholeNft', wholeNft.pretty())
      assert.equal(burnedNfts.length, 6)
      assert.equal(wholeNft.originalMint.toBase58(), mintKey.publicKey.toBase58())
    }
  })

  it('Can claim original NFT (whole NFT throne) once all the fragments have been unfragmented', async () => {
    const mintDestAta = await getAssociatedTokenAddress(mintKey.publicKey, secondWallet.publicKey)

    const ix1 = FragmentorClient.buildInitClaimIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      mintDestAta,
    )
    const tx = new anchor.web3.Transaction().add(ix1)
    await program?.provider?.sendAndConfirm?.(tx, [secondWallet])

    const response = await provider.connection.getParsedTokenAccountsByOwner(
      secondWallet.publicKey,
      {
        mint: mintKey.publicKey,
      },
    )
    const tokenAmount = response.value[0].account.data.parsed.info.tokenAmount.amount

    expect(tokenAmount).to.equal('1')

    const vaults = await fragmentorClient.fetchVaultsByOwner(wallet.publicKey)
    expect(vaults.length).to.greaterThan(0)
    const acc = vaults.find((e) =>
      FragmentorClient.deserializeVault(e.account)[0].authoritySeed.equals(vault.publicKey),
    )!
    expect(acc).toBeDefined()

    const [vaultData] = FragmentorClient.deserializeVault(acc?.account)
    const owner = vaultData.owner.toBase58()
    expect(owner).to.equal(wallet.publicKey.toBase58())
    expect(vaultData.boxes).to.equal(0)
  })
  it('Cannot claim original NFT (whole NFT throne) - fails after it is claimed', async () => {
    const mintDestAta = await getAssociatedTokenAddress(mintKey.publicKey, secondWallet.publicKey)

    const ix1 = FragmentorClient.buildInitClaimIx(
      secondWallet.publicKey,
      vault.publicKey,
      mintKey.publicKey,
      mintDestAta,
    )
    const tx = new anchor.web3.Transaction().add(ix1)
    await expect(program?.provider?.sendAndConfirm?.(tx, [secondWallet])).to.rejects.toThrow(
      '0xbc4',
    )
  })
})
