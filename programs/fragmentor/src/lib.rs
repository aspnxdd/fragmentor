use anchor_lang::prelude::*;

mod constants;
mod instructions;
mod state;

use instructions::*;

declare_id!("6jZDraLYUeT7Gau1Y4CEf8GPdbquacMEDJ6nZKYX6Q4m");

#[program]
pub mod fragmentor {

    use super::*;

    pub fn fragment(ctx: Context<Fragment>, fragmented_nfts: Vec<Pubkey>) -> Result<()> {
        instructions::fragment::handler(ctx, fragmented_nfts)
    }

    pub fn mint_nft(ctx: Context<MintNFT>, mint_key: Pubkey) -> Result<()> {
        instructions::mint_nft::handler(ctx, mint_key, "a".to_owned(), "b".to_owned())
    }
}
