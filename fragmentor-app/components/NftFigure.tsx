/* eslint-disable @next/next/no-img-element */
import type { Nft } from '@metaplex-foundation/js';
import type { FC } from 'react';

import { trimAddress } from 'lib/utils';

type NftFigureProps = {
  nft: Nft;
  handleClickOnNft?: (nft: Nft) => void;
};

const NftFigure: FC<NftFigureProps> = ({ handleClickOnNft, nft }) => {
  function internalHandleClickOnNfts(nft: Nft) {
    if (handleClickOnNft) {
      handleClickOnNft(nft);
    }
  }

  return (
    <figure
      key={nft.mint.address.toBase58()}
      onClick={() => internalHandleClickOnNfts(nft)}
      className="p-4 object-cover"
    >
      <img src={nft.json?.image} alt={nft.mint.address.toBase58()} width="110" height="90" />
      <figcaption>{trimAddress(nft.mint.address.toBase58())}</figcaption>
    </figure>
  );
};

export default NftFigure;
