use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

use crate::state::*;

#[derive(Accounts)]
#[instruction(bump_auth: u8, bump_whole_nft:u8, bump_whole_nft_throne:u8)]
pub struct Claim<'info> {
    #[account(mut, has_one = authority)]
    pub vault: Account<'info, Vault>,

    #[account(mut, seeds = [
        b"whole_nft",
        mint.key().as_ref(),
        vault.key().as_ref()
    ],
    close = payer,
    bump=bump_whole_nft)]
    pub whole_nft: Account<'info, WholeNft>,

    // @TODO - make authority a from vault
    #[account(mut,
    seeds=[
        b"whole_nft_throne",
        mint.key().as_ref(),
        vault.key().as_ref()
    ],
    bump=bump_whole_nft_throne,
    token::mint = mint,
    token::authority = authority)]
    pub whole_nft_throne: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(seeds = [vault.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    #[account(init_if_needed,
        associated_token::mint=mint,
        associated_token::authority=payer,
    payer = payer)]
    pub mint_dest_acc: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,

    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Claim<'info> {
    fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.whole_nft_throne.to_account_info(),
                to: self.mint_dest_acc.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
    fn close_nft_throne(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            CloseAccount {
                account: self.whole_nft_throne.to_account_info(),
                destination: self.payer.to_account_info(),
                authority: self.authority.clone(),
            },
        )
    }
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    let whole_nft = &mut *ctx.accounts.whole_nft;
    let vault = &*ctx.accounts.vault;

    require!(
        whole_nft.assert_all_fragments_burned(),
        ErrorCode::NotAllFragmentsDestroyed
    );

    token::transfer(
        ctx.accounts
            .transfer_ctx()
            .with_signer(&[&vault.vault_seeds()]),
        1,
    )?;
    token::close_account(
        ctx.accounts
            .close_nft_throne()
            .with_signer(&[&vault.vault_seeds()]),
    )?;
    let vault = &mut ctx.accounts.vault;
    vault.boxes -= 1;

    Ok(())
}
