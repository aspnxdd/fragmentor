use crate::MAX_FRAGMENTS;
use anchor_lang::prelude::*;

#[repr(C)]
#[derive(Clone, Debug, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
pub struct FragmentData {
    pub mint: Pubkey,
    pub is_burned: bool, // @TODO - change to burned_by (Pubkey)
}

#[repr(C)]
#[account]
pub struct WholeNft {
    pub vault: Pubkey,
    pub original_mint: Pubkey,
    pub claimer: Option<Pubkey>,
    pub fragments: Vec<FragmentData>,
}

impl WholeNft {
    pub const LEN: usize = 32 + 32 + 32 + 1 + MAX_FRAGMENTS * std::mem::size_of::<FragmentData>();

    pub fn assert_all_fragments_burned(&self) -> bool {
        !self.fragments.iter().any(|f| !f.is_burned)
    }

    pub fn assert_all_fragments_not_burned(&self) -> bool {
        self.fragments.iter().filter(|f| f.is_burned).count() != self.fragments.len()
    }

    pub fn set_fragments_as_burned(&mut self) -> Result<()> {
        for fragment in self.fragments.iter_mut() {
            fragment.is_burned = true;
        }
        Ok(())
    }

    pub fn set_claimer(&mut self, claimer: Pubkey) {
        self.claimer = Some(claimer);
    }

    fn init_fragments(nfts: Vec<Pubkey>) -> Vec<FragmentData> {
        nfts.iter()
            .map(|nft| {
                return FragmentData {
                    mint: nft.key(),
                    is_burned: false,
                };
            })
            .collect()
    }

    pub fn new(original_mint: &Pubkey, fragmented_nfts: Vec<Pubkey>, vault: &Pubkey) -> Self {
        Self {
            fragments: WholeNft::init_fragments(fragmented_nfts),
            original_mint: original_mint.key(),
            vault: vault.key(),
            claimer: None,
        }
    }
}
