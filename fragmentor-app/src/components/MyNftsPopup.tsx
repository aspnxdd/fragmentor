'use client'
import type { Nft } from '@metaplex-foundation/js';
import type { FC } from 'react';

import NftFigure from './NftFigure';
import Popup from './Popup';

type MyNftsPopupProps = {
  popupOpen: boolean;
  setPopupOpen: (value: boolean) => void;
  nfts: Nft[];
  handleClickOnNft?: (nft: Nft) => void;
};

const MyNftsPopup: FC<MyNftsPopupProps> = ({ nfts, popupOpen, setPopupOpen, handleClickOnNft }) => {
  return (
    <Popup show={popupOpen} onClose={() => setPopupOpen(false)} title="My NFTs">
      <div className="flex flex-wrap mt-10 gap-4 items-center justify-evenly">
        {nfts.map((nft) => (
          <NftFigure
            nft={nft}
            key={nft.mint.address.toBase58()}
            handleClickOnNft={handleClickOnNft}
          />
        ))}
      </div>
    </Popup>
  );
};

export default MyNftsPopup;
