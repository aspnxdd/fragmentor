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
createErrorFromNameLookup.set('MintAccsMismatch', () => new MintAccsMismatchError())

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
createErrorFromNameLookup.set('AtaAccsMismatch', () => new AtaAccsMismatchError())

/**
 * MetadataAccsMismatch: 'MetadataAccs mismatch'
 *
 * @category Errors
 * @category generated
 */
export class MetadataAccsMismatchError extends Error {
  readonly code: number = 0x1773
  readonly name: string = 'MetadataAccsMismatch'
  constructor() {
    super('MetadataAccs mismatch')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, MetadataAccsMismatchError)
    }
  }
}

createErrorFromCodeLookup.set(0x1773, () => new MetadataAccsMismatchError())
createErrorFromNameLookup.set('MetadataAccsMismatch', () => new MetadataAccsMismatchError())

/**
 * EditionAccsMismatch: 'EditionAccs mismatch'
 *
 * @category Errors
 * @category generated
 */
export class EditionAccsMismatchError extends Error {
  readonly code: number = 0x1774
  readonly name: string = 'EditionAccsMismatch'
  constructor() {
    super('EditionAccs mismatch')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, EditionAccsMismatchError)
    }
  }
}

createErrorFromCodeLookup.set(0x1774, () => new EditionAccsMismatchError())
createErrorFromNameLookup.set('EditionAccsMismatch', () => new EditionAccsMismatchError())

/**
 * UnknownInstruction: 'unknown instruction called'
 *
 * @category Errors
 * @category generated
 */
export class UnknownInstructionError extends Error {
  readonly code: number = 0x1775
  readonly name: string = 'UnknownInstruction'
  constructor() {
    super('unknown instruction called')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, UnknownInstructionError)
    }
  }
}

createErrorFromCodeLookup.set(0x1775, () => new UnknownInstructionError())
createErrorFromNameLookup.set('UnknownInstruction', () => new UnknownInstructionError())

/**
 * NotAllFragmentsDestroyed: 'Not all fragments have been destroyed'
 *
 * @category Errors
 * @category generated
 */
export class NotAllFragmentsDestroyedError extends Error {
  readonly code: number = 0x1776
  readonly name: string = 'NotAllFragmentsDestroyed'
  constructor() {
    super('Not all fragments have been destroyed')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, NotAllFragmentsDestroyedError)
    }
  }
}

createErrorFromCodeLookup.set(0x1776, () => new NotAllFragmentsDestroyedError())
createErrorFromNameLookup.set('NotAllFragmentsDestroyed', () => new NotAllFragmentsDestroyedError())

/**
 * AllFragmentsDestroyed: 'All fragments have been destroyed'
 *
 * @category Errors
 * @category generated
 */
export class AllFragmentsDestroyedError extends Error {
  readonly code: number = 0x1777
  readonly name: string = 'AllFragmentsDestroyed'
  constructor() {
    super('All fragments have been destroyed')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, AllFragmentsDestroyedError)
    }
  }
}

createErrorFromCodeLookup.set(0x1777, () => new AllFragmentsDestroyedError())
createErrorFromNameLookup.set('AllFragmentsDestroyed', () => new AllFragmentsDestroyedError())

/**
 * TooManyFragments: 'Too many fragments, max 20'
 *
 * @category Errors
 * @category generated
 */
export class TooManyFragmentsError extends Error {
  readonly code: number = 0x1778
  readonly name: string = 'TooManyFragments'
  constructor() {
    super('Too many fragments, max 20')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, TooManyFragmentsError)
    }
  }
}

createErrorFromCodeLookup.set(0x1778, () => new TooManyFragmentsError())
createErrorFromNameLookup.set('TooManyFragments', () => new TooManyFragmentsError())

/**
 * NotAllFragments: 'You need to have all the fragments'
 *
 * @category Errors
 * @category generated
 */
export class NotAllFragmentsError extends Error {
  readonly code: number = 0x1779
  readonly name: string = 'NotAllFragments'
  constructor() {
    super('You need to have all the fragments')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, NotAllFragmentsError)
    }
  }
}

createErrorFromCodeLookup.set(0x1779, () => new NotAllFragmentsError())
createErrorFromNameLookup.set('NotAllFragments', () => new NotAllFragmentsError())

/**
 * YouAreTheClaimer: 'You are the claimer'
 *
 * @category Errors
 * @category generated
 */
export class YouAreTheClaimerError extends Error {
  readonly code: number = 0x177a
  readonly name: string = 'YouAreTheClaimer'
  constructor() {
    super('You are the claimer')
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, YouAreTheClaimerError)
    }
  }
}

createErrorFromCodeLookup.set(0x177a, () => new YouAreTheClaimerError())
createErrorFromNameLookup.set('YouAreTheClaimer', () => new YouAreTheClaimerError())

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
