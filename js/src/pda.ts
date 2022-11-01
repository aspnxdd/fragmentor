import { PublicKey } from "@solana/web3.js";

const PROGRAM = new PublicKey("CdYdVmD7bDbr2CfSHDhY5HP51ZV8weQsQBQgXiVzAyed");
type PDA = [PublicKey, number];
export function getWholeNftPda(mintKey: PublicKey, vault: PublicKey): PDA {
  const [wholeNftPDA, wholeNftPDABump] = PublicKey.findProgramAddressSync(
    [Buffer.from("whole_nft"), mintKey.toBytes(), vault.toBytes()],
    PROGRAM
  );

  return [wholeNftPDA, wholeNftPDABump];
}

// vault auth that will manage tokens in n out
// the vault auth is the owner of the token account holding the original nft
export function getVaultAuthPda(vault: PublicKey): PDA {
  const [vaultAuthPDA, vaultAuthPDABump] = PublicKey.findProgramAddressSync(
    [Buffer.from(vault.toBytes())],
    PROGRAM
  );

  return [vaultAuthPDA, vaultAuthPDABump];
}

// token account holding the original nft
export function getWholeNftThronePda(
  mintKey: PublicKey,
  vault: PublicKey
): PDA {
  const [wholeNftThronePDA, wholeNftThronePDABump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("whole_nft_throne"), mintKey.toBytes(), vault.toBytes()],
      PROGRAM
    );
  return [wholeNftThronePDA, wholeNftThronePDABump];
}
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const getMetadata = (mint: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];
};

export const getMasterEdition = (mint: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];
};
