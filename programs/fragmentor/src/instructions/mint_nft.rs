use anchor_lang::{prelude::*, solana_program::program::invoke};
use anchor_spl::token;
use anchor_spl::token::{MintTo, Token};
use mpl_token_metadata::instructions::{
    CreateMasterEditionV3, CreateMasterEditionV3InstructionArgs, CreateMetadataAccountV3,
    CreateMetadataAccountV3InstructionArgs,
};
use mpl_token_metadata::types::{Creator, DataV2};

#[derive(Accounts)]
pub struct MintNFT<'info> {
    #[account(mut)]
    pub mint_authority: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    // #[account(mut)]
    pub token_program: Program<'info, Token>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_metadata_program: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub payer: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub rent: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
}

impl<'info> MintNFT<'info> {
    fn mint_to_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            MintTo {
                mint: self.mint.to_account_info(),
                to: self.token_account.to_account_info(),
                authority: self.payer.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<MintNFT>, uri: String, title: String, symbol: String) -> Result<()> {
    token::mint_to(ctx.accounts.mint_to_ctx(), 1)?;

    let account_info = vec![
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.mint_authority.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];
    let creat1 = Creator {
        address: ctx.accounts.mint.key(),
        verified: false,
        share: 100,
    };
    let creat2 = Creator {
        address: ctx.accounts.mint_authority.key(),
        verified: false,
        share: 0,
    };

    let xx = CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata.key(),
        mint: ctx.accounts.mint.key(),
        mint_authority: ctx.accounts.mint_authority.key(),
        payer: ctx.accounts.payer.key(),
        rent: Some(ctx.accounts.rent.key()),
        update_authority: (ctx.accounts.payer.key(), true),
        system_program: ctx.accounts.system_program.key(),
    };
    let data = DataV2 {
        collection: None,
        name: title,
        symbol,
        uri,
        seller_fee_basis_points: 0,
        creators: Some(vec![creat1, creat2]),
        uses: None,
    };
    let args2 = CreateMetadataAccountV3InstructionArgs {
        data,
        collection_details: None,
        is_mutable: true,
    };
    invoke(&xx.instruction(args2), account_info.as_slice())?;
    let master_edition_infos = vec![
        ctx.accounts.master_edition.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.mint_authority.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.token_metadata_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.rent.to_account_info(),
    ];
    let x = CreateMasterEditionV3 {
        edition: ctx.accounts.master_edition.key(),
        mint: ctx.accounts.mint.key(),
        metadata: ctx.accounts.metadata.key(),
        mint_authority: ctx.accounts.mint_authority.key(),
        payer: ctx.accounts.payer.key(),
        update_authority: ctx.accounts.payer.key(),
        rent: Some(ctx.accounts.rent.key()),
        token_program: ctx.accounts.token_program.key(),
        system_program: ctx.accounts.system_program.key(),
    };
    let args = CreateMasterEditionV3InstructionArgs { max_supply: None };
    invoke(&x.instruction(args), master_edition_infos.as_slice())?;
    Ok(())
}
