use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{get_associated_token_address, AssociatedToken},
    token::{self, Burn, Token, TokenAccount},
};

use crate::state::*;

#[error_code]
pub enum Errors {
    #[msg("NotEnoughMints")]
    NotEnoughMints,
}

#[derive(Accounts)]
#[instruction(bump_auth: u8)]
pub struct Unfragment<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub whole_nft: Account<'info, WholeNft>,

    #[account(mut)]
    pub whole_nft_throne: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK:` doc comment explaining why no checks through types are necessary.
    #[account(seeds = [vault.key().as_ref()], bump = bump_auth)]
    pub authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

// impl<'info> Unfragment<'info> {
//     fn burn_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
//         CpiContext::new(
//             self.token_program.to_account_info(),
//             Burn {
//                 from: self.mint_source.to_account_info(),
//                 mint: self.mint.to_account_info(),
//                 authority: self.payer.to_account_info(),
//             },
//         )
//     }
// }

pub fn handler<'key, 'accounts, 'remaining, 'info>(
    ctx: Context<'key, 'accounts, 'remaining, 'info, Unfragment<'info>>,
    fragmented_nfts: Vec<Pubkey>,
) -> Result<()> {
    let vault = &*ctx.accounts.vault;
    let whole_nft = &mut *ctx.accounts.whole_nft;
    let owner = ctx.accounts.payer.key();
    let remaining_accs = &mut ctx.remaining_accounts.iter();

    let mut mint_accs = vec![];
    let mut ata_accs = vec![];

    // get all the mint accs
    for _ in 0..((remaining_accs.len() / 2) ) {
        let acc = next_account_info(remaining_accs);
        match acc {
            Ok(acc) => {
                mint_accs.push(acc);
                msg!("got acc {}", acc.key());
                msg!("got acc owner {}", acc.owner.key());
            }
            Err(_) => {
                return Err(Errors::NotEnoughMints.into());
            }
        }
    }

    // get all the ata accs
    for _ in 0..((remaining_accs.len() / 2) ) {
        let acc = next_account_info(remaining_accs);
        match acc {
            Ok(acc) => {
                ata_accs.push(acc);
                msg!("got acc {}", acc.key());
                msg!("got acc owner {}", acc.owner.key());
            }
            Err(_) => {
                return Err(Errors::NotEnoughMints.into());
            }
        }
    }

    if mint_accs.len() != fragmented_nfts.len() {
        return Err(error!(Errors::NotEnoughMints));
    }
    // check user is sending all the fragments
    let accum = mint_accs.iter().fold(0, |acc, mint| {
        if fragmented_nfts.contains(&mint.key()) {
            acc + 1
        } else {
            acc
        }
    });
    assert_eq!(accum, fragmented_nfts.len());

        

    for fragmented_nft in &fragmented_nfts {
        // burn fragmented nft
        let mint_acc = mint_accs
            .iter()
            .find(|mint| mint.key() == fragmented_nft.key())
            .unwrap();
        let ata_acc = ata_accs
            .iter()
            .find(|ata| ata.key() == get_associated_token_address(&owner.key(), &mint_acc.key()))
            .unwrap();
        msg!("burning {}", mint_acc.key());
        let cpi_accounts = Burn {
            authority: ctx.accounts.payer.to_account_info(),
            from: ata_acc.to_account_info(),
            mint: mint_acc.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, 1)?;

        // remove fragmented nft from whole_nft
        // whole_nft.fragments.retain(|x| x != fragmented_nft);
    }

    // let vault = &mut ctx.accounts.vault;
    // vault.boxes -= 1;

    Ok(())
}
