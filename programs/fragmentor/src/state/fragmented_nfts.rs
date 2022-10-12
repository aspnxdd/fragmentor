use anchor_lang::prelude::*;


#[repr(C)]
#[account]
pub struct FragmentedMints {
    pub mints: Vec<Pubkey>,
}
