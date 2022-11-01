use anchor_lang::prelude::*;

use crate::{constants::ANCHOR_DISC, state::*};

#[derive(Accounts)]
pub struct InitVault<'info> {
    // vault
    #[account(init, payer = payer, space = ANCHOR_DISC + std::mem::size_of::<Vault>())]
    pub vault: Box<Account<'info, Vault>>,
    pub creator: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let creator = ctx.accounts.payer.key();

    // derive the authority responsible for all token transfers within the new vault
    let vault_address = vault.key();
    let authority_seed = &[vault_address.as_ref()];
    let (authority, bump) = Pubkey::find_program_address(authority_seed, ctx.program_id);

    vault.owner = creator;
    vault.authority = authority;
    vault.authority_seed = vault_address;
    vault.authority_bump_seed = [bump];
    vault.boxes = 0;

    Ok(())
}
