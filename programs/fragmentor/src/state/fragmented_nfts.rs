use anchor_lang::prelude::*;


#[repr(C)]
#[account]
pub struct FragmentedMints {
    pub fragmented_mints: Vec<Pubkey>,
}
