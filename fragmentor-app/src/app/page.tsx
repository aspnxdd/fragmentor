'use client'
import type { NextPage } from 'next'

import Link from 'next/link'
import useMintNft from '../hooks/useMint'
import Vault from '../components/Vault'
import Fragment from '../components/Fragment'
import useVaults from '../hooks/useVaults'
import useFragments from '../hooks/useFragments'

const Home: NextPage = () => {
  const { mintNft } = useMintNft()
  const { claimNft, createVault, selectedVault, setSelectedVault, fetchVaults } = useVaults()

  const { fetchFragments, unfragmentNft } = useFragments(selectedVault)

  const vaults = fetchVaults.data ?? []
  const fragments = fetchFragments.data ?? []

  return (
    <div className="m-10 flex flex-col gap-4 mt-24">
      <div className="flex gap-4">
        <button className="btn-primary" onClick={createVault}>
          Create vault
        </button>
        <button className="btn-primary" onClick={() => mintNft()}>
          Mint random NFT
        </button>
      </div>
      <h1 className="text-xl font-bold">Your vaults:</h1>
      <div className="flex flex-wrap gap-4 flex-col">
        {vaults.map((vault) => (
          <Vault key={vault.address.toBase58()} setSelectedVault={setSelectedVault} vault={vault} />
        ))}
        <div>
          {selectedVault ? (
            <>
              <h1 className="text-xl font-bold mb-4 ">
                Selected vault: {selectedVault?.toBase58()}
              </h1>
              <div className="my-4">
                <Link href={`/${selectedVault.toBase58()}`} className="btn-primary">
                  Fragment NFT
                </Link>
              </div>
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
    </div>
  )
}

export default Home
