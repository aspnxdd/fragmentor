use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

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

    #[account(init, seeds = [
        b"whole_nft_throne".as_ref(),
        mint.key().as_ref(),
    ],
    bump,
    token::mint = mint,
    token::authority = payer,
    payer = payer)]
    pub whole_nft_throne: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint_source: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(init, seeds = [
        b"fragments",
        mint.key().as_ref(),
    ],
    bump,
    payer = payer,
    space = ANCHOR_DISC + FRAGMENTED_MINTS_SIZE)]
    pub fragmented_mints: Account<'info, FragmentedMints>,

    pub fragmenter: Signer<'info>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

// impl<'info> Fragment<'info> {
//     fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
//         CpiContext::new(
//             self.token_program.to_account_info(),
//             Transfer {
//                 from: self.mint_source.to_account_info(),
//                 to: self.whole_nft.to_account_info(),
//                 authority: self.payer.to_account_info(),
//             },
//         )
//     }
// }

pub fn handler(
    ctx: Context<Fragment>,
    original_nft: Pubkey,
    fragmented_nfts: Vec<Pubkey>,
) -> Result<()> {
    ctx.accounts.fragmented_mints.mints = fragmented_nfts.to_vec();
    ctx.accounts.whole_nft.mint = original_nft;
    ctx.accounts.whole_nft.parts = ctx.accounts.fragmented_mints.mints.len() as u8;
    // let mint = &ctx.accounts.mint.key();
    // let seeds = &[b"whole_nft", mint.as_ref()];

    // token::transfer(ctx.accounts.transfer_ctx().with_signer(&[seeds]), 1)?;

    Ok(())
}
