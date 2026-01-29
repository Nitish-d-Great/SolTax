use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("APj56TZKsc3mDNBpSik46AtGzQnNKhXG6aTrtciXtRj6");

#[program]
pub mod zk_payroll {
    use super::*;

    /// Initialize the payroll system with tax configuration
    pub fn initialize(
        ctx: Context<Initialize>,
        tax_rate_bps: u16,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, tax_rate_bps)
    }

    /// Add a new employee with wallet screening validation
    pub fn add_employee(
        ctx: Context<AddEmployee>,
        employee_id: String,
        name: String,
        salary_commitment: [u8; 32],
        screening_score: u8,
    ) -> Result<()> {
        instructions::add_employee::handler(ctx, employee_id, name, salary_commitment, screening_score)
    }

    /// Process salary payment with confidential transfers
    /// Tax payment and net salary are sent via ShadowWire confidential transfers
    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        salary_amount: u64,
        tax_amount: u64,
        payment_timestamp: i64,
    ) -> Result<()> {
        instructions::process_payment::handler(ctx, salary_amount, tax_amount, payment_timestamp)
    }

    /// Verify the Bulletproof on a payment record
    pub fn verify_proof(ctx: Context<VerifyProof>) -> Result<()> {
        instructions::verify_proof::handler(ctx)
    }

    /// Update employee screening score (re-screening)
    pub fn update_screening(
        ctx: Context<UpdateScreening>,
        new_score: u8,
    ) -> Result<()> {
        instructions::update_screening::handler(ctx, new_score)
    }

    /// Deactivate an employee
    pub fn deactivate_employee(ctx: Context<DeactivateEmployee>) -> Result<()> {
        instructions::deactivate_employee::handler(ctx)
    }
}
