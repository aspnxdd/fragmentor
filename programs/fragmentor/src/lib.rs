use anchor_lang::prelude::*;
use instructions::*;

mod errors;
mod instructions;
mod state;

declare_id!("9SPvLNP6TAW4ZCtST8pmCCrKYt2gctRedmq1eWAu2Cwz");

#[constant]
pub const ANCHOR_DISC: usize = 8;

#[constant]
pub const MAX_FRAGMENTS: usize = 20;

#[program]
pub mod fragmentor {

    use super::*;

    pub fn fragment(
        ctx: Context<Fragment>,
        _bump_auth: u8,
        original_nft: Pubkey,
        fragmented_nfts: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::fragment::handler(ctx, original_nft, fragmented_nfts)
    }

    pub fn mint_nft(
        ctx: Context<MintNFT>,
        uri: String,
        title: String,
        symbol: String,
    ) -> Result<()> {
        instructions::mint_nft::handler(ctx, uri, title, symbol)
    }

    pub fn init_vault(ctx: Context<InitVault>) -> Result<()> {
        instructions::init_vault::handler(ctx)
    }

    pub fn unfrag<'key, 'accounts, 'remaining, 'info>(
        ctx: Context<'key, 'accounts, 'remaining, 'info, Unfragment<'info>>,
        _bump_auth: u8,
        fragmented_nfts: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::unfragment::handler(ctx, fragmented_nfts)
    }
    
    pub fn claim(
        ctx: Context<Claim>,
        _bump_auth: u8,
        _bump_whole_nft: u8,
        _bump_whole_nft_throne: u8,
    ) -> Result<()> {
        instructions::claim::handler(ctx)
    }
}
