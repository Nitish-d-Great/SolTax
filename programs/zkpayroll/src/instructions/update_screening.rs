use anchor_lang::prelude::*;
use crate::state::{Payroll, Employee};
use crate::errors::{PayrollError, SCREENING_THRESHOLD};

#[derive(Accounts)]
pub struct UpdateScreening<'info> {
    /// Payroll account
    #[account(
        seeds = [b"payroll", authority.key().as_ref()],
        bump = payroll.bump,
        has_one = authority @ PayrollError::Unauthorized
    )]
    pub payroll: Account<'info, Payroll>,

    /// Employee to update screening for
    #[account(
        mut,
        constraint = employee.payroll == payroll.key() @ PayrollError::Unauthorized
    )]
    pub employee: Account<'info, Employee>,

    /// Authority (must match payroll.authority)
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateScreening>, new_score: u8) -> Result<()> {
    let clock = Clock::get()?;
    let employee = &mut ctx.accounts.employee;

    // Update screening info
    employee.screening_score = new_score;
    employee.last_screened = clock.unix_timestamp;

    // If score drops below threshold, deactivate employee
    if new_score < SCREENING_THRESHOLD {
        employee.is_active = false;
        msg!("WARNING: Employee {} deactivated due to low screening score", employee.employee_id);
    }

    msg!("Screening updated for employee: {}", employee.employee_id);
    msg!("New score: {}/100", new_score);
    msg!("Screened at: {}", employee.last_screened);

    Ok(())
}
