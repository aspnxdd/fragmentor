import type { Nft } from "@metaplex-foundation/js";
import { atom } from "jotai";

export const walletNftsAtom = atom<Nft[]>([]);
