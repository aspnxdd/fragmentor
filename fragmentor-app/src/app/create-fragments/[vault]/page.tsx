/* eslint-disable @next/next/no-img-element */
'use client'
import type { NextPage } from 'next'
import type { Nft } from '@metaplex-foundation/js'

import { Suspense, useMemo, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useParams } from 'next/navigation'
import { trimAddress } from '../../../lib/utils'
import useFragments from '../../../hooks/useFragments'
import useFetchNfts from '../../../hooks/useFetchNfts'
import dynamic from 'next/dynamic'

const MyNftsPopup = dynamic(() => import('../../../components/MyNftsPopup'))

const CreateFragment: NextPage = () => {
  const { vault } = useParams()
  const [popupOpen, setPopupOpen] = useState(false)
  const {
    createFragments,
    fragmentParts,
    fragments,
    selectedNft,
    setFragmentParts,
    setSelectedNft,
    setFragments,
  } = useFragments(Array.isArray(vault) ? vault[0] : vault)
  const { fetchNftsQuery } = useFetchNfts()

  const nfts = fetchNftsQuery.data ?? []

  const selectedNftImage = useMemo(
    () => nfts.find((nft) => nft.mint.address.toBase58() === selectedNft)?.json?.image,
    [nfts, selectedNft],
  )

  function handleClickOnNft(nft: Nft) {
    setSelectedNft(nft.mint.address.toBase58())
    setPopupOpen(false)
    setFragments([])
  }

  async function handleCreateFragments() {
    if (!selectedNft) {
      return
    }
    await createFragments(new PublicKey(selectedNft))
    setFragments([])
    setSelectedNft(null)
    await fetchNftsQuery.refetch()
  }

  return (
    <div className="m-10 flex flex-col gap-4 mt-24">
      <button
        className="w-fit bg-teal-600 text-white p-2 px-4 border-0 font-semibold  rounded-lg transition-colors duration-100 ease-in-out hover:bg-teal-800"
        onClick={() => setPopupOpen(true)}
      >
        Select NFT
      </button>
      <Suspense fallback={<></>}>
        <MyNftsPopup
          popupOpen={popupOpen}
          handleClickOnNft={handleClickOnNft}
          nfts={nfts}
          setPopupOpen={setPopupOpen}
        />
      </Suspense>
      <form className="flex flex-col w-fit gap-3">
        <label>Fragment Parts</label>
        <input
          type="number"
          placeholder="4"
          max="20"
          className="p-2 border-2 border-gray-400 rounded-lg"
          onChange={(e) => setFragmentParts(Number(e.target.value))}
        />
      </form>
      {selectedNft ? (
        <>
          <h2>Selected NFT</h2>
          <div>
            <figure>
              <img src={selectedNftImage} alt={selectedNft} width="110" />
              <figcaption>{selectedNft}</figcaption>
            </figure>
          </div>
        </>
      ) : null}
      <button
        className="w-fit bg-teal-600 text-white p-2 px-4 border-0 font-semibold  rounded-lg transition-colors duration-100 ease-in-out hover:bg-teal-800 disabled:bg-gray-500"
        disabled={!selectedNft}
        onClick={handleCreateFragments}
      >
        {`Create ${fragmentParts} Fragments`}
      </button>
      {fragments.length > 0 ? (
        <div>
          <h2>Fragments</h2>
          <div className="flex flex-wrap gap-4">
            {fragments.map((fragment) => {
              const fragmentImage = nfts.find((e) => e.mint.address.toBase58() === fragment)?.json
                ?.image
              return (
                <figure key={fragment}>
                  <img src={fragmentImage} alt={fragment} width="110" />
                  <figcaption>{trimAddress(fragment)}</figcaption>
                </figure>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default CreateFragment
