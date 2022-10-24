import { Connection, PublicKey } from "@solana/web3.js";
import { Metadata, Metaplex, Nft } from "@metaplex-foundation/js";

export class MetaplexClient {
  private metaplex: Metaplex;

  constructor(connection: Connection) {
    this.metaplex = Metaplex.make(connection);
  }

  async fetchNft(mintAddress: PublicKey) {
    return this.metaplex.nfts().findByMint({ mintAddress });
  }
  async fetchNftBatch(mints: PublicKey[]) {
    return await Promise.all(
      mints.map(async (mint) => await this.fetchNft(mint))
    );
  }

  async getNFTsByOwner(owner: PublicKey) {
    try {
      const nfts = (await this.metaplex
        .nfts()
        .findAllByOwner({ owner })) as Metadata[];
      const nftsLoaded = Promise.all(
        nfts.map((nft) => {
          return this.metaplex.nfts().load({ metadata: nft });
        })
      );
      return nftsLoaded as Promise<Nft[]>;
    } catch (e) {
      console.error(e);
    }
  }
}
