import type { FC } from 'react';
import type { FragmentData } from 'fragmentor';

import { PublicKey } from '@metaplex-foundation/js';

type Fragments = { originalNft: string; fragments: FragmentData[] };

type FragmentProps = {
  fragment: Fragments;
  unfragmentNft: (originalNft: PublicKey, fragments: FragmentData[]) => void;
  claimNft: (originalNft: PublicKey) => void;
};

const Fragment: FC<FragmentProps> = ({ fragment, unfragmentNft, claimNft }) => {
  return (
    <div
      key={fragment.originalNft}
      className="border border-cyan-700  bg-gray-100 p-2 px-4 text-lg rounded-lg flex flex-col w-[43rem]"
    >
      <h3>
        <strong>Original NFT:</strong> {fragment.originalNft}
      </h3>
      <button
        className="bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
        onClick={() => unfragmentNft(new PublicKey(fragment.originalNft), fragment.fragments)}
      >
        Unfragment
      </button>
      {fragment.fragments.map((f, index) => {
        return (
          <div key={f.mint.toBase58()}>
            <strong>Fragment {index + 1}:</strong> {f.mint.toBase58()}
            {f.isBurned ? '🔥️' : '❌️'}
          </div>
        );
      })}
      <button
        className="bg-cyan-600 text-white p-2 px-4 border-0 font-semibold text-lg rounded-lg transition-colors duration-100 ease-in-out hover:bg-cyan-800"
        onClick={() => claimNft(new PublicKey(fragment.originalNft))}
      >
        Claim
      </button>
    </div>
  );
};

export default Fragment;
