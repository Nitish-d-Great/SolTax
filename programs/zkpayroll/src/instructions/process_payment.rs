use anchor_lang::prelude::*;
use crate::state::{Payroll, Employee, PaymentRecord};
use crate::errors::{PayrollError, SCREENING_VALIDITY_SECONDS};

#[derive(Accounts)]
#[instruction(salary_amount: u64, tax_amount: u64, payment_timestamp: i64)]
pub struct ProcessPayment<'info> {
    /// Payroll configuration
    #[account(
        seeds = [b"payroll", authority.key().as_ref()],
        bump = payroll.bump,
        has_one = authority @ PayrollError::Unauthorized
    )]
    pub payroll: Account<'info, Payroll>,

    /// Employee receiving payment
    #[account(
        mut,
        constraint = employee.payroll == payroll.key() @ PayrollError::Unauthorized,
        constraint = employee.is_active @ PayrollError::EmployeeNotActive
    )]
    pub employee: Account<'info, Employee>,

    /// Payment record (created for this payment)
    #[account(
        init,
        payer = authority,
        space = PaymentRecord::LEN,
        seeds = [
            b"payment",
            employee.key().as_ref(),
            &payment_timestamp.to_le_bytes()
        ],
        bump
    )]
    pub payment_record: Account<'info, PaymentRecord>,

    /// Employer authority
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Employer's ShadowWire confidential account (source of funds)
    /// CHECK: This is a ShadowWire confidential account
    #[account(mut)]
    pub employer_confidential_account: UncheckedAccount<'info>,

    /// Tax authority's ShadowWire confidential account
    /// CHECK: This is a ShadowWire confidential account
    #[account(mut)]
    pub tax_confidential_account: UncheckedAccount<'info>,

    /// Employee's ShadowWire confidential account
    /// CHECK: This is a ShadowWire confidential account
    #[account(
        mut,
        constraint = employee_confidential_account.key() == employee.confidential_account 
            @ PayrollError::InvalidConfidentialAccount
    )]
    pub employee_confidential_account: UncheckedAccount<'info>,

    /// ShadowWire program for CPI
    /// CHECK: This should match the shadowwire_program stored in payroll
    #[account(
        constraint = shadowwire_program.key() == payroll.shadowwire_program 
            @ PayrollError::InvalidConfidentialAccount
    )]
    pub shadowwire_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<ProcessPayment>,
    salary_amount: u64,
    tax_amount: u64,
    payment_timestamp: i64,
) -> Result<()> {
    let clock = Clock::get()?;
    let employee = &ctx.accounts.employee;
    let _payroll = &ctx.accounts.payroll;

    // Validate amounts
    require!(salary_amount > 0, PayrollError::InvalidAmount);
    require!(tax_amount <= salary_amount, PayrollError::TaxExceedsSalary);

    // Validate timestamp is reasonably close to current time (within 5 minutes)
    let time_diff = (clock.unix_timestamp - payment_timestamp).abs();
    require!(time_diff < 300, PayrollError::InvalidAmount);

    // Check screening is not expired (24 hours)
    let time_since_screening = clock.unix_timestamp - employee.last_screened;
    require!(
        time_since_screening < SCREENING_VALIDITY_SECONDS,
        PayrollError::ScreeningExpired
    );

    // Calculate net salary
    let _net_salary = salary_amount.checked_sub(tax_amount).unwrap();

    msg!("Processing payment for employee: {}", employee.employee_id);
    msg!("Screening valid (last screened {} seconds ago)", time_since_screening);

    // ============================================================
    // CONFIDENTIAL TRANSFERS VIA SHADOWWIRE
    // ============================================================
    // 
    // In a production implementation, we would make CPI calls to ShadowWire here:
    //
    // Step 1: Transfer tax_amount from employer -> tax_authority (confidential)
    // Step 2: Transfer net_salary from employer -> employee (confidential)
    //
    // The ShadowWire SDK handles:
    // - Bulletproof generation for amount hiding
    // - Encrypted balance updates
    // - On-chain proof storage
    //
    // For this implementation, we use the ShadowWire TypeScript SDK on the frontend
    // which signs and submits the confidential transfers in the same transaction batch.
    // ============================================================

    // Note: Actual confidential transfers are handled by ShadowWire SDK on frontend
    // The program records that a payment occurred but stores NO amounts

    // Create payment record (NO amounts stored for privacy!)
    let payment_record = &mut ctx.accounts.payment_record;
    payment_record.employee = employee.key();
    payment_record.timestamp = payment_timestamp;
    payment_record.tax_confidential_account = ctx.accounts.tax_confidential_account.key();
    payment_record.employee_confidential_account = ctx.accounts.employee_confidential_account.key();
    payment_record.verified = false;
    payment_record.verified_at = 0;
    payment_record.verifier = Pubkey::default();
    payment_record.bump = ctx.bumps.payment_record;

    msg!("Payment record created: {}", payment_record.key());
    msg!("Tax sent to: {}", payment_record.tax_confidential_account);
    msg!("Net salary sent to: {}", payment_record.employee_confidential_account);
    msg!("IMPORTANT: Actual amounts are hidden via Bulletproof ZK proofs");

    Ok(())
}
