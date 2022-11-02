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

    pub fn new(vault: &Pubkey, creator: &Pubkey, program_id: &Pubkey) -> Self {
        let vault_address = vault.key();
        let authority_seed = &[vault_address.as_ref()];
        let (authority, bump) = Pubkey::find_program_address(authority_seed, program_id);
        Self {
            authority,
            authority_seed: vault_address,
            authority_bump_seed: [bump],
            owner: *creator,
            boxes: 0,
        }
    }

    pub fn increase_boxes(&mut self) -> Result<()> {
        self.boxes += 1;
        Ok(())
    }

    pub fn decrease_boxes(&mut self) -> Result<()> {
        self.boxes -= 1;
        Ok(())
    }
}
