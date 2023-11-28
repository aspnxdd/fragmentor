use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::{prelude::*, solana_program::program::invoke};
use anchor_spl::{
    associated_token::get_associated_token_address,
    token::{Token, TokenAccount},
};
use mpl_token_metadata::{accounts::MasterEdition, accounts::Metadata, instructions::BurnNft};

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

    let whole_nft = &*ctx.accounts.whole_nft;

    //@ TODO - ensure all fragments are passed

    require!(
        whole_nft.assert_all_fragments_not_burned(),
        ErrorCode::AllFragmentsDestroyed
    );

    // the remaining accs must be passed in the following order:
    // 1. the first items must be the fragmented nfts accounts
    // 2. the first items must be the fragmented nfts associated token accounts (ata)
    let remaining_accs = &mut ctx.remaining_accounts.iter();
    let remaining_accs_len = remaining_accs.len();

    let mut mint_accs = vec![];
    let mut ata_accs = vec![];
    let mut metadata_accs = vec![];
    let mut edition_accs = vec![];

    // map all the mint accs
    for _ in 0..(remaining_accs_len / 4) {
        let acc = next_account_info(remaining_accs);
        match acc {
            Ok(acc) => {
                mint_accs.push(acc);
            }
            Err(_) => {
                return Err(error!(ErrorCode::MintAccsMismatch));
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
                return Err(error!(ErrorCode::AtaAccsMismatch));
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
                return Err(error!(ErrorCode::MetadataAccsMismatch));
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
                return Err(error!(ErrorCode::EditionAccsMismatch));
            }
        }
    }

    if mint_accs.len() != fragmented_nfts.len() {
        return Err(error!(ErrorCode::MintAccsMismatch));
    }
    if ata_accs.len() != fragmented_nfts.len() {
        return Err(error!(ErrorCode::AtaAccsMismatch));
    }
    if metadata_accs.len() != fragmented_nfts.len() {
        return Err(error!(ErrorCode::MetadataAccsMismatch));
    }
    if edition_accs.len() != fragmented_nfts.len() {
        return Err(error!(ErrorCode::EditionAccsMismatch));
    }

    // check user is sending all the fragmented nfts whose accounts were provided
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
        let fragment = fragmented_nft.clone();
        let ata = get_associated_token_address(&owner.key(), &fragmented_nft.key());

        let (metadata, _) = Metadata::find_pda(&fragmented_nft.key());
        let (edition, _) = MasterEdition::find_pda(&fragmented_nft.key());

        let mint_acc = mint_accs
            .iter()
            .find(|&&mint_acc_info| &mint_acc_info.key() == &fragment.key());

        if mint_acc.is_none() {
            return Err(error!(ErrorCode::MintAccsMismatch));
        }

        let ata_acc = ata_accs
            .iter()
            .find(|&&ata_acc_info| ata_acc_info.key() == ata);

        if ata_acc.is_none() {
            return Err(error!(ErrorCode::AtaAccsMismatch));
        }

        let metadata_acc = metadata_accs
            .iter()
            .find(|&&metadata_acc_info| metadata_acc_info.key() == metadata);

        if metadata_acc.is_none() {
            return Err(error!(ErrorCode::MetadataAccsMismatch));
        }

        let edition_acc = edition_accs
            .iter()
            .find(|&&edition_acc_info| edition_acc_info.key() == edition);

        if edition_acc.is_none() {
            return Err(error!(ErrorCode::EditionAccsMismatch));
        }

        let accs = vec![
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            metadata_acc.unwrap().to_account_info(),
            edition_acc.unwrap().to_account_info(),
            mint_acc.unwrap().to_account_info(),
            ata_acc.unwrap().to_account_info(),
        ];
        let burn_nft = BurnNft {
            collection_metadata: None,
            master_edition_account: (edition_acc.unwrap().key()),
            metadata,
            mint: fragment,
            owner,
            spl_token_program: ctx.accounts.token_program.key(),
            token_account: ata,
        };
        invoke(&burn_nft.instruction(), &accs[..])?;

        let whole_nft = &mut *ctx.accounts.whole_nft;

        whole_nft.set_fragment_as_burned(fragment.key())?;
    }

    Ok(())
}
