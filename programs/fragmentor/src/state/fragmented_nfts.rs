use anchor_lang::prelude::*;

pub const FRAGMENTED_MINTS_SIZE: usize = 32 * 20;

#[repr(C)]
#[account]
pub struct FragmentedMints {
    pub mints: Vec<Pubkey>,
}
