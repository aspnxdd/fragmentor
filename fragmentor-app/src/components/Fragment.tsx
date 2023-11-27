import type { FC } from 'react'
import type { FragmentData } from 'fragmentor'

import { PublicKey } from '@metaplex-foundation/js'

type Props = {
  fragment: { originalNft: string; fragments: FragmentData[] }
  unfragmentNft: (originalNft: PublicKey, fragments: FragmentData[]) => void
  claimNft: (originalNft: PublicKey) => void
}

const Fragment: FC<Props> = ({ fragment, unfragmentNft, claimNft }) => {
  function handleUnfragmentNft() {
    unfragmentNft(new PublicKey(fragment.originalNft), fragment.fragments)
  }

  function handleClaimNft() {
    claimNft(new PublicKey(fragment.originalNft))
  }

  return (
    <div
      key={fragment.originalNft}
      className="bg-gray-100 p-2 px-4  rounded-lg flex flex-col w-[43rem] shadow1"
    >
      <h3>
        <strong>Original NFT:</strong> {fragment.originalNft}
      </h3>
      <button
        className="btn-primary"
        onClick={handleUnfragmentNft}
      >
        Unfragment
      </button>
      {fragment.fragments.map((f, index) => {
        return (
          <div key={f.mint.toBase58()}>
            <strong>Fragment {index + 1}:</strong> {f.mint.toBase58()}
            {f.isBurned ? '🔥️' : '❌️'}
          </div>
        )
      })}
      <button
        className="btn-primary"
        onClick={handleClaimNft}
      >
        Claim
      </button>
    </div>
  )
}

export default Fragment
