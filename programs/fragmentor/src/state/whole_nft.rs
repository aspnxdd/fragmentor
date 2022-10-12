use anchor_lang::prelude::*;

#[repr(C)]
#[account]
pub struct WholeNft {
    pub mint: Pubkey,
    pub parts: u8,
}
