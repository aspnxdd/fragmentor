import { PublicKey } from '@solana/web3.js';
import { IVault } from 'fragmentor';
import { FC } from 'react';

type VaultProps = {
  vault: IVault & { address: PublicKey };
  setSelectedVault: (address: PublicKey) => void;
};

const Vault: FC<VaultProps> = ({ vault, setSelectedVault }) => {
  return (
    <div
      className="border border-cyan-700  bg-gray-100 p-2 px-4 font-semibold text-lg rounded-lg flex flex-col"
      key={vault.address.toBase58()}
      onClick={() => setSelectedVault(vault.address)}
    >
      <h2 className="text-gray-700">
        Vault: <span className="font-normal text-black">{vault.address.toBase58()}</span>
      </h2>
      <h2 className="text-gray-700">
        Owner: <span className="font-normal text-black">{vault.owner.toBase58()}</span>
      </h2>
      <h2 className="text-gray-700">
        Boxes: <span className="font-normal text-black">{vault.boxes}</span>
      </h2>
    </div>
  );
};

export default Vault;
