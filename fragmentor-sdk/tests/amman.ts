import { Amman } from '@metaplex-foundation/amman-client'

import { PROGRAM_ADDRESS } from '../src/generated'

export const amman = Amman.instance({
  knownLabels: { [PROGRAM_ADDRESS]: 'Candy Guard' },
  log: console.log,
  errorResolver: undefined,
})
