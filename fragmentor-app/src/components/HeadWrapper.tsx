import type { FC } from 'react'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Fragmentor App',
  url: 'http://fragmentor-app.vercel.app/',
  description:
    'Fragmentor App - Fragment Solana NFTs into multiple pieces and create a new NFT from them.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'New York Street 123',
    addressLocality: 'New York',
    addressRegion: 'NY',
    postalCode: '10021',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-401-555-1212',
    contactType: 'Customer service',
  },
  image: 'http://fragmentor-app.vercel.app/ico.webp',
}

const HeadWrapper: FC = () => {
  return (
    <head>
      <title>Fragmentor App</title>
      <meta
        name="description"
        content="Fragmentor App - Fragment Solana NFTs into multiple pieces and create a new NFT from them."
      />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="googlebot" content="index,follow" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:type" content="website" />
      <meta
        property="og:title"
        content="Fragmentor App - Fragment Solana NFTs into multiple pieces"
      />
      <meta
        property="og:description"
        content="Fragmentor App - Fragment Solana NFTs into multiple pieces and create a new NFT from them."
      />
      <meta name="google-site-verification" content="x" />
      <meta property="og:url" content="permalink" />
      <link rel="canonical" href="http://fragmentor-app.vercel.app/" />

      <script type="application/ld+json"></script>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      ></script>
    </head>
  )
}

export default HeadWrapper
