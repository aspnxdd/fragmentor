use anchor_lang::prelude::*;
use anchor_spl::token::{
     Mint, TokenAccount,
};

use crate::state::*;

use crate::constants::ANCHOR_DISC;

#[derive(Accounts)]
#[instruction(parts: u8)]
pub struct Fragment<'info> {
    #[account(init, seeds = [
        b"whole_nft",
        mint.key().as_ref(),
    ],
    bump,
    payer = payer,
    space = ANCHOR_DISC + std::mem::size_of::<WholeNft>())]
    pub whole_nft: Account<'info, WholeNft>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint_source: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub fragmented_mints: Account<'info, FragmentedMints>,

    pub fragmenter: Signer<'info>,

    pub system_program: Program<'info, System>,
}
