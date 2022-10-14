use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct InitVault<'info> {
    // vault
    #[account(init, payer = payer, space = 8 + std::mem::size_of::<Vault>())]
    pub vault: Box<Account<'info, Vault>>,
    pub creator: Signer<'info>,
    

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitVault>) -> Result<()> {
    // record total number of vaults in bank's state
    let vault = &mut ctx.accounts.vault;
    let creator = ctx.accounts.payer.key();

    // derive the authority responsible for all token transfers within the new vault
    let vault_address = vault.key();
    msg!("vault address: {:?}", vault_address);
    let authority_seed = &[vault_address.as_ref()];
    let (authority, bump) = Pubkey::find_program_address(authority_seed, ctx.program_id);
    msg!("authority address: {:?}", authority);
    msg!("authority bump: {:?}", bump);

    // record vault's state
    vault.owner = creator;
    vault.authority = authority;
    vault.authority_seed = vault_address;
    vault.authority_bump_seed = [bump];

    Ok(())
}
