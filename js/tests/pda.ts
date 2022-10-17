import { PublicKey } from "@solana/web3.js";
import { program } from "./utils";

type PDA = [PublicKey, number]
export function getWholeNftPda(mintKey: PublicKey, vault: PublicKey):PDA {
  const [wholeNftPDA, wholeNftPDABump] = PublicKey.findProgramAddressSync(
    [Buffer.from("whole_nft"), mintKey.toBytes(), vault.toBytes()],
    program?.programId
  );

  return [wholeNftPDA, wholeNftPDABump];
}

// vault auth that will manage tokens in n out
// the vault auth is the owner of the token account holding the original nft
export function getVaultAuthPda(mintKey: PublicKey, vault: PublicKey):PDA {
  const [vaultAuthPDA, vaultAuthPDABump] = PublicKey.findProgramAddressSync(
    [Buffer.from(vault.toBytes())],
    program.programId
  );

  return [vaultAuthPDA, vaultAuthPDABump];
}

// token account holding the original nft
export function getWholeNftThronePda(mintKey: PublicKey, vault: PublicKey):PDA {
  const [wholeNftThronePDA, wholeNftThronePDABump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("whole_nft_throne"), mintKey.toBytes(), vault.toBytes()],
      program.programId
    );
  return [wholeNftThronePDA, wholeNftThronePDABump];
}

