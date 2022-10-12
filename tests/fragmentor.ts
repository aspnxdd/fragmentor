import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Fragmentor } from "../target/types/fragmentor";

describe("fragmentor", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Fragmentor as Program<Fragmentor>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
