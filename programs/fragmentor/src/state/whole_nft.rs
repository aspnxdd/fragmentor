use crate::errors::ErrorCode;
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
    pub fragments: Vec<FragmentData>,
}

impl WholeNft {
    pub const LEN: usize = 32 + 32 + MAX_FRAGMENTS * std::mem::size_of::<FragmentData>();

    pub fn assert_all_fragments_burned(&self) -> bool {
        !self.fragments.iter().any(|f| !f.is_burned)
    }

    pub fn assert_all_fragments_not_burned(&self) -> bool {
        self.fragments.iter().filter(|f| f.is_burned).count() != self.fragments.len()
    }

    pub fn set_fragment_as_burned(&mut self, nft: Pubkey) -> Result<()> {
        let fragment_index = self
            .fragments
            .iter()
            .position(|fragment| fragment.mint == nft.key());

        match fragment_index {
            Some(i) => self.fragments[i].is_burned = true,
            None => {
                return Err(error!(ErrorCode::NftsMismatch));
            }
        }

        Ok(())
    }

    fn init_fragments(nfts: Vec<Pubkey>) -> Vec<FragmentData> {
        nfts.iter().map(|nft| {
            return FragmentData {
                mint: nft.key(),
                is_burned: false,
            };
        }).collect()    
    }

    pub fn new(original_mint: &Pubkey, fragmented_nfts: Vec<Pubkey>, vault: &Pubkey) -> Self {
        Self {
            fragments: WholeNft::init_fragments(fragmented_nfts),
            original_mint: original_mint.key(),
            vault: vault.key(),
        }
    }
}
