import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { MetaplexClient } from '../lib/metaplex'
import { useQuery } from 'react-query'

export default function useFetchNfts() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const metaplexClient = useMemo(() => new MetaplexClient(connection), [connection])

  const fetchNftsQuery = useQuery(
    ['fetchNfts', publicKey?.toBase58()],
    async () => {
      if (!publicKey?.toBase58()) {
        return []
      }
      return (await metaplexClient.getNFTsByOwner(publicKey).catch(() => null)) ?? []
    },
    {
      enabled: !!publicKey?.toBase58(),
    },
  )

  return { fetchNftsQuery }
}
