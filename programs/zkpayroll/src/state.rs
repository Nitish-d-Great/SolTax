use anchor_lang::prelude::*;

/// Payroll account - stores employer configuration
/// PDA Seeds: ["payroll", authority.as_ref()]
#[account]
#[derive(Default)]
pub struct Payroll {
    /// Employer wallet address (authority)
    pub authority: Pubkey,
    /// Tax authority wallet address (government)
    pub tax_authority: Pubkey,
    /// Tax rate in basis points (500 = 5%)
    pub tax_rate_bps: u16,
    /// ShadowWire program ID for CPI calls
    pub shadowwire_program: Pubkey,
    /// PDA bump seed
    pub bump: u8,
    /// Total employees registered
    pub employee_count: u32,
    /// Total payments processed
    pub payment_count: u64,
}

impl Payroll {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // tax_authority  
        2 +  // tax_rate_bps
        32 + // shadowwire_program
        1 +  // bump
        4 +  // employee_count
        8;   // payment_count
}

/// Employee account - stores employee information
/// PDA Seeds: ["employee", payroll.key().as_ref(), employee_id.as_bytes()]
#[account]
#[derive(Default)]
pub struct Employee {
    /// Reference to parent payroll account
    pub payroll: Pubkey,
    /// Unique employee identifier
    pub employee_id: String,
    /// Employee name
    pub name: String,
    /// Employee's Solana wallet address
    pub wallet: Pubkey,
    /// Pedersen commitment of salary (hides actual amount)
    pub salary_commitment: [u8; 32],
    /// Risk screening score from Range API (0-100)
    pub screening_score: u8,
    /// Unix timestamp of last screening
    pub last_screened: i64,
    /// Whether employee is active
    pub is_active: bool,
    /// Employee's ShadowWire confidential account
    pub confidential_account: Pubkey,
    /// PDA bump seed
    pub bump: u8,
}

impl Employee {
    pub const MAX_ID_LEN: usize = 64;
    pub const MAX_NAME_LEN: usize = 128;
    
    pub const LEN: usize = 8 +  // discriminator
        32 + // payroll
        4 + Self::MAX_ID_LEN +   // employee_id (String with length prefix)
        4 + Self::MAX_NAME_LEN + // name (String with length prefix)
        32 + // wallet
        32 + // salary_commitment
        1 +  // screening_score
        8 +  // last_screened
        1 +  // is_active
        32 + // confidential_account
        1;   // bump
}

/// Payment record - stores payment metadata (NO amounts for privacy!)
/// PDA Seeds: ["payment", employee.key().as_ref(), &timestamp.to_le_bytes()]
#[account]
#[derive(Default)]
pub struct PaymentRecord {
    /// Reference to employee account
    pub employee: Pubkey,
    /// Payment timestamp
    pub timestamp: i64,
    /// Tax authority's ShadowWire confidential account
    pub tax_confidential_account: Pubkey,
    /// Employee's ShadowWire confidential account
    pub employee_confidential_account: Pubkey,
    /// Whether the Bulletproof has been verified
    pub verified: bool,
    /// Verification timestamp (0 if not verified)
    pub verified_at: i64,
    /// Who verified the proof
    pub verifier: Pubkey,
    /// PDA bump seed
    pub bump: u8,
}

impl PaymentRecord {
    pub const LEN: usize = 8 +  // discriminator
        32 + // employee
        8 +  // timestamp
        32 + // tax_confidential_account
        32 + // employee_confidential_account
        1 +  // verified
        8 +  // verified_at
        32 + // verifier
        1;   // bump
}

/// Employer's confidential account configuration
#[account]
#[derive(Default)]
pub struct EmployerConfidentialConfig {
    /// Reference to payroll account
    pub payroll: Pubkey,
    /// Employer's ShadowWire confidential account
    pub confidential_account: Pubkey,
    /// Tax authority's ShadowWire confidential account
    pub tax_confidential_account: Pubkey,
    /// PDA bump seed
    pub bump: u8,
}

impl EmployerConfidentialConfig {
    pub const LEN: usize = 8 +  // discriminator
        32 + // payroll
        32 + // confidential_account
        32 + // tax_confidential_account
        1;   // bump
}
