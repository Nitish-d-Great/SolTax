use anchor_lang::prelude::*;
use crate::state::{Payroll, Employee};
use crate::errors::{PayrollError, SCREENING_THRESHOLD};

#[derive(Accounts)]
#[instruction(employee_id: String)]
pub struct AddEmployee<'info> {
    /// Payroll account (must exist)
    #[account(
        mut,
        seeds = [b"payroll", authority.key().as_ref()],
        bump = payroll.bump,
        has_one = authority @ PayrollError::Unauthorized
    )]
    pub payroll: Account<'info, Payroll>,

    /// Employee account to create (PDA)
    #[account(
        init,
        payer = authority,
        space = Employee::LEN,
        seeds = [b"employee", payroll.key().as_ref(), employee_id.as_bytes()],
        bump
    )]
    pub employee: Account<'info, Employee>,

    /// Employee's wallet address
    /// CHECK: Just stored as reference
    pub employee_wallet: UncheckedAccount<'info>,

    /// Employee's ShadowWire confidential account
    /// CHECK: Should be a valid ShadowWire account, validated off-chain
    pub confidential_account: UncheckedAccount<'info>,

    /// Authority (must match payroll.authority)
    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AddEmployee>,
    employee_id: String,
    name: String,
    salary_commitment: [u8; 32],
    screening_score: u8,
) -> Result<()> {
    // Validate input lengths
    require!(
        employee_id.len() <= Employee::MAX_ID_LEN,
        PayrollError::EmployeeIdTooLong
    );
    require!(
        name.len() <= Employee::MAX_NAME_LEN,
        PayrollError::EmployeeNameTooLong
    );

    // Validate screening score meets threshold
    require!(
        screening_score >= SCREENING_THRESHOLD,
        PayrollError::ScreeningFailed
    );

    let clock = Clock::get()?;
    let employee = &mut ctx.accounts.employee;
    let payroll = &mut ctx.accounts.payroll;

    // Initialize employee account
    employee.payroll = payroll.key();
    employee.employee_id = employee_id.clone();
    employee.name = name.clone();
    employee.wallet = ctx.accounts.employee_wallet.key();
    employee.salary_commitment = salary_commitment;
    employee.screening_score = screening_score;
    employee.last_screened = clock.unix_timestamp;
    employee.is_active = true;
    employee.confidential_account = ctx.accounts.confidential_account.key();
    employee.bump = ctx.bumps.employee;

    // Update payroll stats
    payroll.employee_count = payroll.employee_count.checked_add(1).unwrap();

    msg!("Employee added: {} ({})", name, employee_id);
    msg!("Screening score: {}/100", screening_score);
    msg!("Confidential account: {}", employee.confidential_account);

    Ok(())
}
