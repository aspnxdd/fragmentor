'use client'
import type { NextPage } from 'next'

import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import useMintNft from '../hooks/useMint'
import Vault from '../components/Vault'
import Fragment from '../components/Fragment'
import useVaults from '../hooks/useVaults'
import useFragments from '../hooks/useFragments'
import { useMemo, useState } from 'react'
import Toggler from '../components/Toggler'

const Home: NextPage = () => {
  const [viewOnlyMine, setViewOnlyMine] = useState(false)
  const { publicKey } = useWallet()
  const { mintNft } = useMintNft()
  const { claimNft, createVault, selectedVault, setSelectedVault, fetchVaults } = useVaults()

  const { fetchFragments, unfragmentNft } = useFragments(selectedVault)

  const allVaults = useMemo(() => fetchVaults.data ?? [], [fetchVaults.data])
  const fragments = useMemo(() => fetchFragments.data ?? [], [fetchFragments.data])

  const myVaults = useMemo(() => {
    if (!publicKey) return allVaults
    return allVaults.filter((vault) => vault.owner.equals(publicKey))
  }, [allVaults, publicKey])

  return (
    <main className="m-10 flex flex-col gap-4 mt-24">
      <div className="flex gap-4">
        <button className="btn-primary" onClick={createVault}>
          Create vault
        </button>
        <button className="btn-primary" onClick={() => mintNft()}>
          Mint random NFT
        </button>
      </div>
      <h1 className="text-xl font-bold flex items-center gap-6">
        Vaults:
        <Toggler setChange={setViewOnlyMine}>
          <span className="ms-3 text-base font-medium text-gray-900 dark:text-gray-300">
            View only my vaults
          </span>
        </Toggler>
      </h1>
      <div className="flex flex-wrap gap-4 flex-col">
        {(viewOnlyMine ? myVaults : allVaults).map((vault) => (
          <Vault key={vault.address.toBase58()} setSelectedVault={setSelectedVault} vault={vault} />
        ))}
        <div>
          {selectedVault ? (
            <>
              <h1 className="text-xl font-bold mb-4 ">
                Selected vault: {selectedVault?.toBase58()}
              </h1>
              <Link href={`/${selectedVault.toBase58()}`} className="btn-primary my-4">
                Fragment NFT
              </Link>
            </>
          ) : null}
          <div className="flex flex-wrap gap-6">
            {fragments.map((fragment) => (
              <Fragment
                claimNft={claimNft}
                fragment={fragment}
                unfragmentNft={unfragmentNft}
                key={fragment.fragments[0].mint.toBase58()}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Home
