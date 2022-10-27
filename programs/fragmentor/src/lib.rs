use anchor_lang::prelude::*;
use instructions::*;

mod constants;
mod errors;
mod instructions;
mod state;

declare_id!("CdYdVmD7bDbr2CfSHDhY5HP51ZV8weQsQBQgXiVzAyed");

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

    pub fn mint_nft(ctx: Context<MintNFT>, mint_key: Pubkey) -> Result<()> {
        instructions::mint_nft::handler(ctx, mint_key, "https://arweave.net/0m6rZv0Nim4277-wLTPtSTP2NIB_0zvrtTFoHcSeqTo".to_owned(), "b".to_owned())
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
