<p align="center">
	<img align="center" src="./fragmentor-app/public/ico.webp" width=100  />
	<br>
    <h1 align="center">🧩 Fragmentor  </h1>
    <p align="center">Solana Program to fragment NFTs into small NFTs, then do the opposite process and claim back the original NFT</a></p>
</p>

---

### 😎 Features

- Fragment or split an NFT into multiple NFTs, these NFTs can also be fragmented into multiples NFTs...
- Built with [Anchor](https://www.anchor-lang.com/) and some [Metaplex](https://www.metaplex.com/) tools such as Solita and Amman.

A lot is still missing, but we will get there!

### 🎁 Demo

**Note**: You can try the frontend app build with NextJS by running `pnpm dev:app` from the root.

### ❇️ Deployment

Program is currently only deployed on devnet as `FRAGFu59MRwy5KeEMnbzsUPa2JkwLVsaP7WbhF2r2Yh`

### 🎴️ Deploy your own version

- `git clone` this repo
- Run `pnpm i`
- Make sure you have `solana-cli` installed, keypair configured, and at least 4 SOL on devnet beforehand
- Update path to your keypair in `Anchor.toml` that begins with `wallet =`
- Run `anchor build` to build the programs
- Update the program IDs:
  - Run `solana-keygen new -o ./target/deploy/fragmentor-keypair.json` to generate your own program Keypair.
  - Run `solana-keygen pubkey ./target/deploy/fragmentor-keypair.json` - insert the new pubkey in the following locations:
    - `./Anchor.toml`
    - `./programs/fragmentor/src/lib.rs`
    - `./.solitarc.js`
  - Run `pnpm run solita`
- Run `anchor build` to build one more time
- Run `anchor deploy --provider.cluster devnet` to deploy to devnet

Note that deploying your own version will cost you ~4 SOL.

### 📜 To-do

- [ ] Write docs.
- [ ] Backend to split an image into multiple images, representing fragments, graphically, of the original NFT image.
- [ ] Improve tests.

MIT License
