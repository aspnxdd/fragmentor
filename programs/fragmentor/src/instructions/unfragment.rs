use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::{prelude::*, solana_program::program::invoke};
use anchor_spl::{
    associated_token::get_associated_token_address,
    token::{Token, TokenAccount},
};
use mpl_token_metadata::{
    instruction::burn_nft,
    pda::{find_master_edition_account, find_metadata_account},
};
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

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_metadata_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(
    ctx: Context<'key, 'accounts, 'remaining, 'info, Unfragment<'info>>,
    fragmented_nfts: Vec<Pubkey>,
) -> Result<()> {
    let owner = ctx.accounts.payer.key();

    // the remaining accs must be passed in the following order:
    // 1. the first items must be the fragmented nfts accounts
    // 2. the first items must be the fragmented nfts associated token accounts (ata)
    let remaining_accs = &mut ctx.remaining_accounts.iter();
    let remaining_accs_len = remaining_accs.len();

    let mut mint_accs = vec![];
    let mut ata_accs = vec![];
    let mut metadata_accs = vec![];
    let mut edition_accs = vec![];

    msg!("remaining_accs_len: {}", remaining_accs_len);
    // map all the mint accs
    for _ in 0..(remaining_accs_len / 4) {
        let acc = next_account_info(remaining_accs);
        match acc {
            Ok(acc) => {
                mint_accs.push(acc);
            }
            Err(_) => {
                return Err(error!(ErrorCode::NftsMismatch));
            }
        }
    }

    // map all the ata accs
    for _ in 0..(remaining_accs_len / 4) {
        let acc = next_account_info(remaining_accs);
        match acc {
            Ok(acc) => {
                ata_accs.push(acc);
            }
            Err(_) => {
                return Err(error!(ErrorCode::NftsMismatch));
            }
        }
    }

    // map all the metadata accs
    for _ in 0..(remaining_accs_len / 4) {
        let acc = next_account_info(remaining_accs);
        match acc {
            Ok(acc) => {
                metadata_accs.push(acc);
            }
            Err(_) => {
                return Err(error!(ErrorCode::NftsMismatch));
            }
        }
    }

    // map all the edition accs
    for _ in 0..(remaining_accs_len / 4) {
        let acc = next_account_info(remaining_accs);
        match acc {
            Ok(acc) => {
                edition_accs.push(acc);
            }
            Err(_) => {
                return Err(error!(ErrorCode::NftsMismatch));
            }
        }
    }

    msg!("mint_accs: {}", mint_accs.len());
    msg!("ata_accs_len: {}", ata_accs.len());
    msg!("fragmented_nfts: {}", fragmented_nfts.len());

    if mint_accs.len() != fragmented_nfts.len() {
        return Err(error!(ErrorCode::NftsMismatch));
    }
    if ata_accs.len() != fragmented_nfts.len() {
        return Err(error!(ErrorCode::NftsMismatch));
    }

    // // check user is sending some fragments
    let accum = mint_accs.iter().fold(0, |acc, mint| {
        if !fragmented_nfts.contains(&mint.key()) {
            return acc;
        }
        acc + 1
    });
    if accum != fragmented_nfts.len() {
        return Err(error!(ErrorCode::MintAccsMismatch));
    }

    // // burn fragmented nft
    for fragmented_nft in &fragmented_nfts {
        let nft = fragmented_nft.clone();
        let ata = get_associated_token_address(&owner.key(), &fragmented_nft.key());
        let (metadata, _) = find_metadata_account(&fragmented_nft.key());
        let (edition, _) = find_master_edition_account(&fragmented_nft.key());

        let mint_acc = mint_accs.iter().find(|&&mint| &mint.key() == &nft.key());

        if mint_acc.is_none() {
            return Err(error!(ErrorCode::MintAccsMismatch));
        }

        let ata_acc = ata_accs
            .iter()
            .find(|&&ata_acc_info| ata_acc_info.key() == ata);

        let metadata_acc = metadata_accs
            .iter()
            .find(|&&metadata_acc_info| metadata_acc_info.key() == metadata);

        let edition_acc = edition_accs
            .iter()
            .find(|&&edition_acc_info| edition_acc_info.key() == edition);

        if ata_acc.is_none() {
            return Err(error!(ErrorCode::AtaAccsMismatch));
        }
        if metadata_acc.is_none() {
            return Err(error!(ErrorCode::AtaAccsMismatch));
        }
        if edition_acc.is_none() {
            return Err(error!(ErrorCode::AtaAccsMismatch));
        }

        let accs = vec![
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
            metadata_acc.unwrap().to_account_info(),
            edition_acc.unwrap().to_account_info(),
            mint_acc.unwrap().to_account_info(),
            ata_acc.unwrap().to_account_info(),
        ];
        invoke(
            &burn_nft(
                ctx.accounts.token_metadata_program.key(),
                metadata,
                owner,
                nft,
                ata,
                edition,
                ctx.accounts.token_program.key(),
                None,
            ),
            accs.as_slice(),
        )?;

        let whole_nft = &mut *ctx.accounts.whole_nft;

        let fragment_index = whole_nft
            .fragments
            .iter()
            .position(|fragment| fragment.mint == nft.key());

        match fragment_index {
            Some(i) => whole_nft.fragments[i].is_burned = true,
            None => {
                return Err(error!(ErrorCode::NftsMismatch));
            }
        }
    }

    Ok(())
}
