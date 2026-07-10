import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { ApplicationState } from '@markaba/shared';
import { CustomersService } from '../customers/customers.service';
import { ApplicationsService } from './applications.service';

interface TransitionBody {
  to: ApplicationState;
  actor: string;
  humanApprovalToken?: string;
}

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly customers: CustomersService,
    private readonly applications: ApplicationsService,
  ) {}

  /** Read-only. Returns the applications for the customer with this phone number. */
  @Get()
  async findMine(@Query('phoneNumber') phoneNumber: string) {
    const customer = await this.customers.findByPhoneNumber(phoneNumber);
    if (!customer) return [];

    const latest = await this.applications.findLatestByCustomer(customer.id);
    return latest ? [latest] : [];
  }

  /**
   * Applies a state transition. A binding credit decision requires
   * `humanApprovalToken` in the body — see `ApplicationsService.transition`
   * (CLAUDE.md §2.3). Unit-tested only; not run against a live database in this
   * environment (no local Postgres — see docs/SPRINT-02.md).
   */
  @Post(':id/transition')
  transition(@Param('id') id: string, @Body() body: TransitionBody) {
    return this.applications.transition({
      applicationId: id,
      to: body.to,
      actor: body.actor,
      humanApprovalToken: body.humanApprovalToken,
    });
  }
}
