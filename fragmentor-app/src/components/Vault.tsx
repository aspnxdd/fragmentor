import { PublicKey } from '@solana/web3.js'
import { IVault } from 'fragmentor'
import { FC } from 'react'

type VaultProps = {
  vault: IVault & { address: PublicKey }
  setSelectedVault: (address: PublicKey) => void
}

const Vault: FC<VaultProps> = ({ vault, setSelectedVault }) => {
  return (
    <button
      className="bg-gradient-to-l from-gray-100 to-blue-200 p-2 px-4 font-semibold text-lg rounded-lg flex flex-col shadow1"
      key={vault.address.toBase58()}
      onClick={() => setSelectedVault(vault.address)}
    >
      <h2 className="text-black">
        Vault: <span className="font-normal text-black">{vault.address.toBase58()}</span>
      </h2>
      <h2 className="text-black">
        Owner: <span className="font-normal text-black">{vault.owner.toBase58()}</span>
      </h2>
      <h2 className="text-black">
        Boxes: <span className="font-normal text-black">{vault.boxes}</span>
      </h2>
    </button>
  )
}

export default Vault
