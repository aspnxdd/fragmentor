import { type FC, useState, Suspense } from 'react'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import useFetchNfts from '../hooks/useFetchNfts'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const MyNftsPopup = dynamic(() => import('./MyNftsPopup'))

const Navbar: FC = () => {
  const [popupOpen, setPopupOpen] = useState(false)
  const { fetchNftsQuery } = useFetchNfts()

  const nfts = fetchNftsQuery.data ?? []

  return (
    <nav className="w-screen fixed top-0 left-0 flex justify-between items-center bg-teal-100">
      <Link href="/" className="ml-10 flex gap-4 items-center">
        <Image src="/ico.webp" width="40" height="40" alt="icon" className="w-auto h-auto" />
        <h1 className="text-4xl font-bold cursor-pointer">Fragmentor </h1>
      </Link>
      <div className="flex items-center content-center">
        <button
          className="btn-primary"
          onClick={() => setPopupOpen(true)}
        >
          Show NFTs
        </button>
        <Suspense fallback={<></>}>
          <MyNftsPopup popupOpen={popupOpen} nfts={nfts} setPopupOpen={setPopupOpen} />
        </Suspense>
        <div className="m-4">
          <WalletMultiButton
            style={{
              color: 'black',
              backgroundColor: 'transparent',
              fontFamily: 'inherit',
              marginRight: '1rem',
              borderRadius: '0.475rem',
              fontSize: '0.9rem',
            }}
          />
        </div>
      </div>
    </nav>
  )
}

export default Navbar
