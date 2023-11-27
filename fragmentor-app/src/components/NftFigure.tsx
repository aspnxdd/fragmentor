/* eslint-disable @next/next/no-img-element */
import type { Nft } from '@metaplex-foundation/js'
import type { FC } from 'react'

import { trimAddress } from '../lib/utils'

type NftFigureProps = {
  nft: Nft
  handleClickOnNft?: (nft: Nft) => void
}

const NftFigure: FC<NftFigureProps> = ({ handleClickOnNft, nft }) => {
  function internalHandleClickOnNfts(nft: Nft) {
    if (handleClickOnNft) {
      handleClickOnNft(nft)
    }
  }

  return (
    <button key={nft.mint.address.toBase58()} onClick={() => internalHandleClickOnNfts(nft)}>
      <figure className="p-4 object-cover text-center">
        <img
          className="rounded-lg hover:rotate-2 duration-200 ease-in-out"
          src={nft.json?.image}
          alt={nft.mint.address.toBase58()}
          width="110"
          height="90"
        />
        <figcaption>
          <small>{trimAddress(nft.mint.address.toBase58())}</small>
        </figcaption>
      </figure>
    </button>
  )
}

export default NftFigure
