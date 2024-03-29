/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * Arguments used to create {@link Vault}
 * @category Accounts
 * @category generated
 */
export type VaultArgs = {
  owner: web3.PublicKey
  authority: web3.PublicKey
  authoritySeed: web3.PublicKey
  authorityBumpSeed: number[] /* size: 1 */
  boxes: beet.bignum
}

export const vaultDiscriminator = [211, 8, 232, 43, 2, 152, 117, 119]
/**
 * Holds the data for the {@link Vault} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class Vault implements VaultArgs {
  private constructor(
    readonly owner: web3.PublicKey,
    readonly authority: web3.PublicKey,
    readonly authoritySeed: web3.PublicKey,
    readonly authorityBumpSeed: number[] /* size: 1 */,
    readonly boxes: beet.bignum,
  ) {}

  /**
   * Creates a {@link Vault} instance from the provided args.
   */
  static fromArgs(args: VaultArgs) {
    return new Vault(
      args.owner,
      args.authority,
      args.authoritySeed,
      args.authorityBumpSeed,
      args.boxes,
    )
  }

  /**
   * Deserializes the {@link Vault} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(accountInfo: web3.AccountInfo<Buffer>, offset = 0): [Vault, number] {
    return Vault.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link Vault} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig,
  ): Promise<Vault> {
    const accountInfo = await connection.getAccountInfo(address, commitmentOrConfig)
    if (accountInfo == null) {
      throw new Error(`Unable to find Vault account at ${address}`)
    }
    return Vault.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey('FRAGFu59MRwy5KeEMnbzsUPa2JkwLVsaP7WbhF2r2Yh'),
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, vaultBeet)
  }

  /**
   * Deserializes the {@link Vault} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [Vault, number] {
    return vaultBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link Vault} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return vaultBeet.serialize({
      accountDiscriminator: vaultDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link Vault}
   */
  static get byteSize() {
    return vaultBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link Vault} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment,
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(Vault.byteSize, commitment)
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link Vault} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === Vault.byteSize
  }

  /**
   * Returns a readable version of {@link Vault} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      owner: this.owner.toBase58(),
      authority: this.authority.toBase58(),
      authoritySeed: this.authoritySeed.toBase58(),
      authorityBumpSeed: this.authorityBumpSeed,
      boxes: (() => {
        const x = <{ toNumber: () => number }>this.boxes
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const vaultBeet = new beet.BeetStruct<
  Vault,
  VaultArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['owner', beetSolana.publicKey],
    ['authority', beetSolana.publicKey],
    ['authoritySeed', beetSolana.publicKey],
    ['authorityBumpSeed', beet.uniformFixedSizeArray(beet.u8, 1)],
    ['boxes', beet.u64],
  ],
  Vault.fromArgs,
  'Vault',
)
