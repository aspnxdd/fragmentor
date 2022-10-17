/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

type ErrorWithCode = Error & { code: number }
type MaybeErrorWithCode = ErrorWithCode | null | undefined

const createErrorFromCodeLookup: Map<number, () => ErrorWithCode> = new Map()
const createErrorFromNameLookup: Map<string, () => ErrorWithCode> = new Map()

/**
 * NftsMismatch: 'Nfts mismatch'
 *
 * @category Errors
 * @category generated
 */
export class NftsMismatchError extends Error {
  readonly code: number = 0x1770
  readonly name: string = 'NftsMismatch'
  constructor() {
    super('Nfts mismatch')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, NftsMismatchError)
    }
  }
}

createErrorFromCodeLookup.set(0x1770, () => new NftsMismatchError())
createErrorFromNameLookup.set('NftsMismatch', () => new NftsMismatchError())

/**
 * MintAccsMismatch: 'MintAccs mismatch'
 *
 * @category Errors
 * @category generated
 */
export class MintAccsMismatchError extends Error {
  readonly code: number = 0x1771
  readonly name: string = 'MintAccsMismatch'
  constructor() {
    super('MintAccs mismatch')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, MintAccsMismatchError)
    }
  }
}

createErrorFromCodeLookup.set(0x1771, () => new MintAccsMismatchError())
createErrorFromNameLookup.set(
  'MintAccsMismatch',
  () => new MintAccsMismatchError()
)

/**
 * AtaAccsMismatch: 'AtaAccs mismatch'
 *
 * @category Errors
 * @category generated
 */
export class AtaAccsMismatchError extends Error {
  readonly code: number = 0x1772
  readonly name: string = 'AtaAccsMismatch'
  constructor() {
    super('AtaAccs mismatch')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, AtaAccsMismatchError)
    }
  }
}

createErrorFromCodeLookup.set(0x1772, () => new AtaAccsMismatchError())
createErrorFromNameLookup.set(
  'AtaAccsMismatch',
  () => new AtaAccsMismatchError()
)

/**
 * UnknownInstruction: 'unknown instruction called'
 *
 * @category Errors
 * @category generated
 */
export class UnknownInstructionError extends Error {
  readonly code: number = 0x1773
  readonly name: string = 'UnknownInstruction'
  constructor() {
    super('unknown instruction called')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, UnknownInstructionError)
    }
  }
}

createErrorFromCodeLookup.set(0x1773, () => new UnknownInstructionError())
createErrorFromNameLookup.set(
  'UnknownInstruction',
  () => new UnknownInstructionError()
)

/**
 * Attempts to resolve a custom program error from the provided error code.
 * @category Errors
 * @category generated
 */
export function errorFromCode(code: number): MaybeErrorWithCode {
  const createError = createErrorFromCodeLookup.get(code)
  return createError != null ? createError() : null
}

/**
 * Attempts to resolve a custom program error from the provided error name, i.e. 'Unauthorized'.
 * @category Errors
 * @category generated
 */
export function errorFromName(name: string): MaybeErrorWithCode {
  const createError = createErrorFromNameLookup.get(name)
  return createError != null ? createError() : null
}
