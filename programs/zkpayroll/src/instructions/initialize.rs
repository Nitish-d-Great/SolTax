use anchor_lang::prelude::*;
use crate::state::Payroll;
use crate::errors::{PayrollError, MAX_TAX_RATE_BPS};

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Payroll account to initialize (PDA)
    #[account(
        init,
        payer = authority,
        space = Payroll::LEN,
        seeds = [b"payroll", authority.key().as_ref()],
        bump
    )]
    pub payroll: Account<'info, Payroll>,

    /// Employer/authority who owns this payroll
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Tax authority wallet (government)
    /// CHECK: This is just stored as a reference, no validation needed
    pub tax_authority: UncheckedAccount<'info>,

    /// ShadowWire program for confidential transfers
    /// CHECK: This is the ShadowWire program ID, validated by caller
    pub shadowwire_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>,
    tax_rate_bps: u16,
) -> Result<()> {
    // Validate tax rate
    require!(
        tax_rate_bps <= MAX_TAX_RATE_BPS,
        PayrollError::InvalidTaxRate
    );

    let payroll = &mut ctx.accounts.payroll;
    
    payroll.authority = ctx.accounts.authority.key();
    payroll.tax_authority = ctx.accounts.tax_authority.key();
    payroll.tax_rate_bps = tax_rate_bps;
    payroll.shadowwire_program = ctx.accounts.shadowwire_program.key();
    payroll.bump = ctx.bumps.payroll;
    payroll.employee_count = 0;
    payroll.payment_count = 0;

    msg!("Payroll initialized with {}% tax rate", tax_rate_bps as f64 / 100.0);
    msg!("Tax authority: {}", payroll.tax_authority);
    
    Ok(())
}
