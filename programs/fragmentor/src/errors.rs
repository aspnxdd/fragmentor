
use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    // 0x1770
    #[msg("Nfts mismatch")]
    NftsMismatch,

    // 0x1771
    #[msg("MintAccs mismatch")]
    MintAccsMismatch,

    // 0x1772
    #[msg("AtaAccs mismatch")]
    AtaAccsMismatch,

    // 0x1773
    #[msg("MetadataAccs mismatch")]
    MetadataAccsMismatch,

    // 0x1774
    #[msg("EditionAccs mismatch")]
    EditionAccsMismatch,

    // 0x1775
    #[msg("unknown instruction called")]
    UnknownInstruction,

    // 0x1776
    #[msg("Not all fragments have been destroyed")]
    NotAllFragmentsDestroyed,

    // 0x1777
    #[msg("All fragments have been destroyed")]
    AllFragmentsDestroyed,

    // 0x1778
    #[msg("Too many fragments, max 20")]
    TooManyFragments,

    // 0x1779
    #[msg("You need to have all the fragments")]
    NotAllFragments,
    
    // 0x177a
    #[msg("You are the claimer")]
    YouAreTheClaimer,

}
