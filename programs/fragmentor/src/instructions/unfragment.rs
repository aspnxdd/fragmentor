use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::{prelude::*, solana_program::program::invoke};
use anchor_spl::{
    associated_token::get_associated_token_address,
    token::{Token, TokenAccount},
};
use mpl_token_metadata::{accounts::MasterEdition, accounts::Metadata, instructions::BurnNft};
use std::collections::BTreeMap;

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

    require!(
        whole_nft.assert_all_fragments_not_burned(),
        ErrorCode::AllFragmentsDestroyed
    );

    // the remaining accs must be passed in the following order:
    // 1. the first items must be the fragmented nfts accounts
    // 2. the first items must be the fragmented nfts associated token accounts (ata)

    let mut mint_accs = BTreeMap::new();
    let mut ata_accs = BTreeMap::new();
    let mut metadata_accs = BTreeMap::new();
    let mut edition_accs = BTreeMap::new();

    // map all the mint accs
    for (pos, accs) in ctx
        .remaining_accounts
        .chunks(ctx.remaining_accounts.len() / 4)
        .enumerate()
    {
        for acc in accs {
            match pos {
                0 => {
                    mint_accs.insert(acc.key(), acc);
                }
                1 => {
                    ata_accs.insert(acc.key(), acc);
                }
                2 => {
                    metadata_accs.insert(acc.key(), acc);
                }
                3 => {
                    edition_accs.insert(acc.key(), acc);
                }
                _ => {}
            }
        }
    }

    require!(
        mint_accs.len() == fragmented_nfts.len(),
        ErrorCode::MintAccsMismatch
    );
    require!(
        ata_accs.len() == fragmented_nfts.len(),
        ErrorCode::AtaAccsMismatch
    );
    require!(
        metadata_accs.len() == fragmented_nfts.len(),
        ErrorCode::MetadataAccsMismatch
    );
    require!(
        edition_accs.len() == fragmented_nfts.len(),
        ErrorCode::EditionAccsMismatch
    );

    // // burn fragmented nft
    for fragmented_nft in &fragmented_nfts {
        let fragment = fragmented_nft.clone();
        let ata = get_associated_token_address(&owner.key(), &fragmented_nft.key());

        let (metadata, _) = Metadata::find_pda(&fragmented_nft.key());
        let (edition, _) = MasterEdition::find_pda(&fragmented_nft.key());

        let mint_acc = mint_accs
            .get(&fragment)
            .ok_or_else(|| error!(ErrorCode::MintAccsMismatch))?;

        let ata_acc = ata_accs
            .get(&ata)
            .ok_or_else(|| error!(ErrorCode::AtaAccsMismatch))?;

        let metadata_acc = metadata_accs
            .get(&metadata)
            .ok_or_else(|| error!(ErrorCode::MetadataAccsMismatch))?;

        let edition_acc = edition_accs
            .get(&edition)
            .ok_or_else(|| error!(ErrorCode::EditionAccsMismatch))?;

        let accs = vec![
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            metadata_acc.to_account_info(),
            edition_acc.to_account_info(),
            mint_acc.to_account_info(),
            ata_acc.to_account_info(),
        ];
        let burn_nft = BurnNft {
            collection_metadata: None,
            master_edition_account: (edition_acc.key()),
            metadata,
            mint: fragment,
            owner,
            spl_token_program: ctx.accounts.token_program.key(),
            token_account: ata,
        };
        invoke(&burn_nft.instruction(), &accs[..])?;

        let whole_nft = &mut *ctx.accounts.whole_nft;

        whole_nft.set_fragment_as_burned(fragment.key())?;
        whole_nft.claimer = Some(ctx.accounts.payer.key());
    }

    Ok(())
}
