
use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    // --------------------------------------- generic (0 - 19)
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
    #[msg("unknown instruction called")]
    UnknownInstruction,

    // 0x1774
    #[msg("Not all fragments have been destroyed")]
    NotAllFragmentsDestroyed,

    // 0x1775
    #[msg("All fragments have been destroyed")]
    AllFragmentsDestroyed,
    

}
