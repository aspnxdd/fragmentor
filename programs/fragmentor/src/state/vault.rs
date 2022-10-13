use anchor_lang::prelude::*;

#[repr(C)]
#[account]
pub struct Vault {
    pub owner: Pubkey,

    pub authority: Pubkey,

    pub authority_seed: Pubkey,

    pub authority_bump_seed: [u8; 1],

    pub boxes: u64,
}

impl Vault {
    pub fn vault_seeds(&self) -> [&[u8]; 2] {
        [self.authority_seed.as_ref(), &self.authority_bump_seed]
    }
}
