import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  type AccountInfo,
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  AccountMeta,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import { getVaultAuthPda, getWholeNftPda, getWholeNftThronePda } from "./pda";
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

type Replace<T, U extends PropertyKey, V> = Omit<T, U> & {
  [K in U]: V;
};

export class FragmentorClient {
  private readonly connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  static buildInitVaultIx(owner: PublicKey, vault: PublicKey) {
    const initVaultIxAccs: InitVaultInstructionAccounts = {
      creator: owner,
      payer: owner,
      vault: vault,
      systemProgram: SystemProgram.programId,
    };
    return createInitVaultInstruction(initVaultIxAccs);
  }

  async fetchVaultsByOwner(owner: PublicKey, vault: PublicKey) {
    return await Vault.gpaBuilder()
      .addFilter("owner", owner)
      .addFilter("authoritySeed", vault)
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
