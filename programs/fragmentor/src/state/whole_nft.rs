use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

pub const WHOLE_NFT_SIZE: usize = 32 + 32 + 20 * std::mem::size_of::<FragmentData>();

#[repr(C)]
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

impl WholeNft {
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

    pub fn init_fragments(&mut self, nfts: Vec<Pubkey>) -> Result<()> {
        let mut fragments = vec![];
        for nft in nfts {
            fragments.push(FragmentData {
                mint: nft.key(),
                is_burned: false,
            });
        }

        self.fragments = fragments;

        Ok(())
    }
}
