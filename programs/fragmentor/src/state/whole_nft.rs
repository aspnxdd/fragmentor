use anchor_lang::prelude::*;

pub const WHOLE_NFT_SIZE: usize = 32 * 20 + 32 + 1;

#[repr(C)]
#[account]
pub struct WholeNft {
    pub vault: Pubkey,
    pub original_mint: Pubkey,
    pub parts: u8,
    pub fragments: Vec<Pubkey>,
}
