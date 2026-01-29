use anchor_lang::prelude::*;

#[error_code]
pub enum PayrollError {
    /// Tax rate exceeds maximum (100% = 10000 bps)
    #[msg("Tax rate cannot exceed 100% (10000 basis points)")]
    InvalidTaxRate,

    /// Wallet screening score is below threshold
    #[msg("Wallet screening failed: score below minimum threshold of 50")]
    ScreeningFailed,

    /// Screening has expired (older than 24 hours)
    #[msg("Wallet screening has expired, re-screening required")]
    ScreeningExpired,

    /// Bulletproof verification failed
    #[msg("Zero-knowledge proof verification failed")]
    ProofVerificationFailed,

    /// Invalid ShadowWire confidential account
    #[msg("Invalid or malformed confidential account")]
    InvalidConfidentialAccount,

    /// Insufficient balance in confidential account
    #[msg("Insufficient balance in confidential account")]
    InsufficientBalance,

    /// Signer is not authorized
    #[msg("Unauthorized: signer is not the payroll authority")]
    Unauthorized,

    /// Employee is not active
    #[msg("Employee is not active")]
    EmployeeNotActive,

    /// Employee ID too long
    #[msg("Employee ID exceeds maximum length of 64 characters")]
    EmployeeIdTooLong,

    /// Employee name too long
    #[msg("Employee name exceeds maximum length of 128 characters")]
    EmployeeNameTooLong,

    /// Payment already verified
    #[msg("Payment has already been verified")]
    AlreadyVerified,

    /// Invalid amount (must be greater than 0)
    #[msg("Invalid amount: must be greater than zero")]
    InvalidAmount,

    /// Tax amount exceeds salary
    #[msg("Tax amount cannot exceed salary amount")]
    TaxExceedsSalary,
}

/// Screening threshold - minimum score required
pub const SCREENING_THRESHOLD: u8 = 50;

/// Screening validity period in seconds (24 hours)
pub const SCREENING_VALIDITY_SECONDS: i64 = 86400;

/// Maximum tax rate in basis points (100%)
pub const MAX_TAX_RATE_BPS: u16 = 10000;
