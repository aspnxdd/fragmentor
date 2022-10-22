use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::state::*;

use crate::constants::ANCHOR_DISC;

#[derive(Accounts)]
#[instruction(bump_auth: u8)]
pub struct Fragment<'info> {
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,

    #[account(init_if_needed, seeds = [
        b"whole_nft",
        mint.key().as_ref(),
        vault.key().as_ref()
    ],
    bump,
    payer = payer,
    space = ANCHOR_DISC + WHOLE_NFT_SIZE)]
    pub whole_nft: Account<'info, WholeNft>,

    // @TODO - make authority a from vault
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
    ctx.accounts.whole_nft.original_mint = original_nft;

    let fragments = fragmented_nfts
        .clone()
        .iter()
        .map(|fragment| FragmentData {
            mint: *fragment,
            is_burned: false,
        })
        .collect();

    ctx.accounts.whole_nft.fragments = fragments;
    ctx.accounts.whole_nft.vault = ctx.accounts.vault.key();
    let vault = &*ctx.accounts.vault;
    token::transfer(
        ctx.accounts
            .transfer_ctx()
            .with_signer(&[&vault.vault_seeds()]),
        1,
    )?;

    let vault = &mut ctx.accounts.vault;
    vault.boxes += 1;

    Ok(())
}
