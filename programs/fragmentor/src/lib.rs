use anchor_lang::prelude::*;

mod instructions;
mod state;
mod constants;

use instructions::*;

declare_id!("6jZDraLYUeT7Gau1Y4CEf8GPdbquacMEDJ6nZKYX6Q4m");

#[program]
pub mod fragmentor {

    use super::*;

    pub fn fragment(ctx: Context<Fragment>, parts: u8) -> Result<()> {
        Ok(())
    }

    pub fn mint_nft(ctx: Context<MintNFT>, mint_key:Pubkey) -> Result<()> {
        instructions::mint_nft::handler(ctx, mint_key, "a".to_owned(), "b".to_owned())
    }
}
