use anchor_lang::prelude::*;
use crate::state::{Payroll, Employee};
use crate::errors::PayrollError;

#[derive(Accounts)]
pub struct DeactivateEmployee<'info> {
    /// Payroll account
    #[account(
        mut,
        seeds = [b"payroll", authority.key().as_ref()],
        bump = payroll.bump,
        has_one = authority @ PayrollError::Unauthorized
    )]
    pub payroll: Account<'info, Payroll>,

    /// Employee to deactivate
    #[account(
        mut,
        constraint = employee.payroll == payroll.key() @ PayrollError::Unauthorized,
        constraint = employee.is_active @ PayrollError::EmployeeNotActive
    )]
    pub employee: Account<'info, Employee>,

    /// Authority (must match payroll.authority)
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<DeactivateEmployee>) -> Result<()> {
    let employee = &mut ctx.accounts.employee;
    let payroll = &mut ctx.accounts.payroll;

    employee.is_active = false;

    // Update payroll stats
    payroll.employee_count = payroll.employee_count.saturating_sub(1);

    msg!("Employee deactivated: {} ({})", employee.name, employee.employee_id);

    Ok(())
}
