use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::MAX_FRAGMENTS;

use crate::ANCHOR_DISC;

#[derive(Accounts)]
#[instruction(bump_auth: u8)]
pub struct Fragment<'info> {
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,

    #[account(init, seeds = [
        b"whole_nft",
        mint.key().as_ref(),
        vault.key().as_ref()
    ],
    bump,
    payer = payer,
    space = ANCHOR_DISC + WholeNft::LEN)]
    pub whole_nft: Account<'info, WholeNft>,

    #[account(init,
    seeds=[
        b"whole_nft_throne",
        mint.key().as_ref(),
        vault.key().as_ref()
    ],
    bump,
    token::mint = mint,
    token::authority = authority,
    payer = payer)]
    pub whole_nft_throne: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(seeds = [vault.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    #[account(mut)]
    pub mint_source: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub fragmenter: Signer<'info>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Fragment<'info> {
    fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.mint_source.to_account_info(),
                to: self.whole_nft_throne.to_account_info(),
                authority: self.payer.to_account_info(),
            },
        )
    }
}

pub fn handler(
    ctx: Context<Fragment>,
    original_nft: Pubkey,
    fragmented_nfts: Vec<Pubkey>,
) -> Result<()> {
    if fragmented_nfts.len() > MAX_FRAGMENTS {
        return Err(error!(ErrorCode::TooManyFragments));
    }

    let whole_nft = &mut ctx.accounts.whole_nft;
    **whole_nft = WholeNft::new(&original_nft, fragmented_nfts, &ctx.accounts.vault.key());

    let vault = &*ctx.accounts.vault;

    token::transfer(
        ctx.accounts
            .transfer_ctx()
            .with_signer(&[&vault.vault_seeds()]),
        1,
    )?;

    let vault = &mut ctx.accounts.vault;
    vault.increase_boxes()?;

    Ok(())
}
