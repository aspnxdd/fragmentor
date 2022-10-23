use anchor_lang::prelude::*;

pub const WHOLE_NFT_SIZE: usize = 32 + 32 + 20 * std::mem::size_of::<FragmentData>();

#[derive(Clone, Debug, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
pub struct FragmentData {
    pub mint: Pubkey,
    pub is_burned: bool,
}

#[repr(C)]
#[account]
pub struct WholeNft {
    pub vault: Pubkey,
    pub original_mint: Pubkey,
    pub fragments: Vec<FragmentData>,
}
