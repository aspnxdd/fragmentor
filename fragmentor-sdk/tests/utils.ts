import * as anchor from '@project-serum/anchor'
import {
  MINT_SIZE,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token'
import { SystemProgram, PublicKey, Keypair, Transaction } from '@solana/web3.js'
import { Fragmentor } from '../../target/types/fragmentor'
import {
  MintNftInstructionAccounts,
  createMintNftInstruction,
} from '../src/generated/instructions/mintNft'
import path from 'path'

export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
)

export const getMetadata = async (mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  )[0]
}

export const getMasterEdition = async (
  mint: anchor.web3.PublicKey,
): Promise<anchor.web3.PublicKey> => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0]
}

process.env.ANCHOR_PROVIDER_URL = 'http://localhost:8899'
process.env.ANCHOR_WALLET = path.join(process.cwd() + '/..' + '/wallet.json')

anchor.setProvider(anchor.AnchorProvider.env())
export const provider = anchor.getProvider()
export const program = anchor.workspace.Fragmentor as anchor.Program<Fragmentor>
export const wallet = anchor.Wallet.local()

export async function buildMintNftIx(): Promise<
  [anchor.web3.Keypair, anchor.web3.TransactionInstruction]
> {
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE)

  const mintKey = anchor.web3.Keypair.generate()

  const ata = await getAssociatedTokenAddress(mintKey.publicKey, wallet.publicKey)

  const mint_tx = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintKey.publicKey,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
      lamports,
    }),
    createInitializeMintInstruction(mintKey.publicKey, 0, wallet.publicKey, wallet.publicKey),
    createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      ata,
      wallet.publicKey,
      mintKey.publicKey,
    ),
  )

  await provider?.sendAndConfirm?.(mint_tx, [mintKey, wallet.payer])

  const metadataAddress = await getMetadata(mintKey.publicKey)
  const masterEdition = await getMasterEdition(mintKey.publicKey)

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
  }

  const ix = createMintNftInstruction(accounts, {
    title: 'test',
    uri: 'test',
    symbol: 'sy',
  })

  return [mintKey, ix]
}

export async function transferMint(mint: PublicKey, to: PublicKey, signer: Keypair) {
  const destAta = await getAssociatedTokenAddress(mint, to)
  const sourceAta = await getAssociatedTokenAddress(mint, wallet.publicKey)
  const ix1 = createAssociatedTokenAccountInstruction(signer.publicKey, destAta, to, mint)

  const ix2 = createTransferCheckedInstruction(sourceAta, mint, destAta, signer.publicKey, 1, 0)
  const t1 = new Transaction().add(ix1)
  const t2 = new Transaction().add(ix2)
  await program?.provider?.sendAndConfirm?.(t1, [signer])
  await program?.provider?.sendAndConfirm?.(t2, [signer])
  return destAta
}
