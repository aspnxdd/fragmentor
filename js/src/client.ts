import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  type AccountInfo,
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  AccountMeta,
  Keypair,
  TransactionInstruction,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";
import {
  getMasterEdition,
  getMetadata,
  getVaultAuthPda,
  getWholeNftPda,
  getWholeNftThronePda,
  TOKEN_METADATA_PROGRAM_ID,
} from "./pda";
import { Vault, VaultArgs } from "./generated/accounts/Vault";
import { WholeNft } from "./generated/accounts/WholeNft";
import {
  ClaimInstructionAccounts,
  createClaimInstruction,
} from "./generated/instructions/claim";
import {
  createFragmentInstruction,
  FragmentInstructionAccounts,
} from "./generated/instructions/fragment";
import {
  createInitVaultInstruction,
  InitVaultInstructionAccounts,
} from "./generated/instructions/initVault";
import {
  createUnfragInstruction,
  UnfragInstructionAccounts,
} from "./generated/instructions/unfrag";
import {
  MintNftInstructionAccounts,
  createMintNftInstruction,
} from "./generated";

type Replace<T, U extends PropertyKey, V> = Omit<T, U> & {
  [K in U]: V;
};

export class FragmentorClient {
  private readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  static buildInitVaultIx(owner: PublicKey, vault?: PublicKey) {
    const initVaultIxAccs: InitVaultInstructionAccounts = {
      creator: owner,
      payer: owner,
      vault: vault ?? Keypair.generate().publicKey,
      systemProgram: SystemProgram.programId,
    };
    return createInitVaultInstruction(initVaultIxAccs);
  }

  async fetchVaultsByOwner(owner: PublicKey) {
    return await Vault.gpaBuilder()
      .addFilter("owner", owner)
      .run(this.connection);
  }

  static deserializeVault(
    account: AccountInfo<Buffer>
  ): [Replace<VaultArgs, "boxes", number>, number] {
    const [_data, n] = Vault.deserialize(account.data);
    const data = { ..._data } as Replace<VaultArgs, "boxes", number>;
    data.boxes = (_data.boxes as BN).toNumber();
    return [data, n];
  }

  static buildInitFragmentIx(
    owner: PublicKey,
    vault: PublicKey,
    mintToFragment: PublicKey,
    mintSource: PublicKey,
    fragments: PublicKey[]
  ) {
    const [wholeNftThronePDA] = getWholeNftThronePda(mintToFragment, vault);
    const [vaultAuthPDA, vaultAuthPDABump] = getVaultAuthPda(vault);
    const [wholeNftPDA] = getWholeNftPda(mintToFragment, vault);
    const fragmentIxAccs: FragmentInstructionAccounts = {
      mint: mintToFragment,
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: owner,
      systemProgram: SystemProgram.programId,
      fragmenter: owner,
      mintSource,
      rent: SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      //this authority is an account derived from the vault address that is the owner of the ATA holding the whole NFT
      authority: vaultAuthPDA,
      vault,
      wholeNft: wholeNftPDA,
    };
    return createFragmentInstruction(fragmentIxAccs, {
      bumpAuth: vaultAuthPDABump,
      originalNft: mintToFragment,
      fragmentedNfts: [...fragments],
    });
  }

  async fetchWholeNftByOriginalMint(mint: PublicKey) {
    return await WholeNft.gpaBuilder()
      .addFilter("originalMint", mint)
      .run(this.connection);
  }

  async fetchWholeNftsByVault(vault: PublicKey) {
    return await WholeNft.gpaBuilder()
      .addFilter("vault", vault)
      .run(this.connection);
  }

  static deserializeWholeNft(account: AccountInfo<Buffer>) {
    return WholeNft.deserialize(account.data);
  }

  static buildInitUnfragmentIx(
    owner: PublicKey,
    vault: PublicKey,
    mintToUnfragment: PublicKey,
    fragmentsMints: PublicKey[],
    fragmentsSources: PublicKey[]
  ) {
    const [wholeNftThronePDA] = getWholeNftThronePda(mintToUnfragment, vault);
    const [vaultAuthPDA, vaultAuthPDABump] = getVaultAuthPda(vault);
    const [wholeNftPDA] = getWholeNftPda(mintToUnfragment, vault);

    const remainingAccounts: AccountMeta[] = [];

    for (const fragment of fragmentsMints) {
      remainingAccounts.push({
        pubkey: fragment,
        isWritable: true,
        isSigner: false,
      });
    }

    for (const fragmentSource of fragmentsSources) {
      remainingAccounts.push({
        pubkey: fragmentSource,
        isWritable: true,
        isSigner: false,
      });
    }

    const unfragAccs: UnfragInstructionAccounts = {
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: owner,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA,
      vault: vault,
      wholeNft: wholeNftPDA,
      anchorRemainingAccounts: remainingAccounts,
    };

    return createUnfragInstruction(unfragAccs, {
      bumpAuth: vaultAuthPDABump,
      fragmentedNfts: [...fragmentsMints],
    });
  }

  static splitArrayIntoChunks<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [] as T[][];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  static buildInitClaimIx(
    owner: PublicKey,
    vault: PublicKey,
    mintToClaim: PublicKey,
    mintDestAcc: PublicKey
  ) {
    const [wholeNftThronePDA, wholeNftThronePDABump] = getWholeNftThronePda(
      mintToClaim,
      vault
    );
    const [vaultAuthPDA, vaultAuthPDABump] = getVaultAuthPda(vault);
    const [wholeNftPDA, wholeNftPDABump] = getWholeNftPda(mintToClaim, vault);

    const claimIxAccs: ClaimInstructionAccounts = {
      tokenProgram: TOKEN_PROGRAM_ID,
      payer: owner,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      wholeNftThrone: wholeNftThronePDA,
      authority: vaultAuthPDA,
      vault: vault,
      wholeNft: wholeNftPDA,
      mint: mintToClaim,
      mintDestAcc,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    };

    return createClaimInstruction(claimIxAccs, {
      bumpAuth: vaultAuthPDABump,
      bumpWholeNft: wholeNftPDABump,
      bumpWholeNftThrone: wholeNftThronePDABump,
    });
  }
}

export async function buildMintNftIxs(
  connection: Connection,
  owner: PublicKey,
  mintKey: PublicKey
): Promise<TransactionInstruction[]> {
  const lamports = await connection.getMinimumBalanceForRentExemption(
    MINT_SIZE
  );

  const ata = await getAssociatedTokenAddress(mintKey, owner);

  const ixs = [
    SystemProgram.createAccount({
      fromPubkey: owner,
      newAccountPubkey: mintKey,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
      lamports,
    }),
    createInitializeMintInstruction(mintKey, 0, owner, owner),
    createAssociatedTokenAccountInstruction(owner, ata, owner, mintKey),
  ];

  const metadataAddress = await getMetadata(mintKey);
  const masterEdition = await getMasterEdition(mintKey);

  const accounts: MintNftInstructionAccounts = {
    mintAuthority: owner,
    mint: mintKey,
    tokenAccount: ata,
    tokenProgram: TOKEN_PROGRAM_ID,
    metadata: metadataAddress,
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    payer: owner,
    systemProgram: SystemProgram.programId,
    masterEdition,
  };

  const ix = createMintNftInstruction(accounts, {
    mintKey: mintKey,
  });
  ixs.push(ix);
  return ixs;
}
