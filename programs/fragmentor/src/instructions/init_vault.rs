use anchor_lang::prelude::*;

use crate::{state::*, ANCHOR_DISC};

#[derive(Accounts)]
pub struct InitVault<'info> {
    #[account(init, payer = payer, space = ANCHOR_DISC + std::mem::size_of::<Vault>())]
    pub vault: Account<'info, Vault>,

    pub creator: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    **vault = Vault::new(&vault.key(), &ctx.accounts.payer.key(), ctx.program_id);

    Ok(())
}
