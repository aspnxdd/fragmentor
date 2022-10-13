use anchor_lang::prelude::*;

mod constants;
mod instructions;
mod state;

use instructions::*;

declare_id!("CdYdVmD7bDbr2CfSHDhY5HP51ZV8weQsQBQgXiVzAyed");

#[program]
pub mod fragmentor {

    use super::*;

    pub fn fragment(
        ctx: Context<Fragment>,
        original_nft: Pubkey,
        fragmented_nfts: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::fragment::handler(ctx, original_nft, fragmented_nfts)
    }

    pub fn mint_nft(ctx: Context<MintNFT>, mint_key: Pubkey) -> Result<()> {
        instructions::mint_nft::handler(ctx, mint_key, "a".to_owned(), "b".to_owned())
    }
}
