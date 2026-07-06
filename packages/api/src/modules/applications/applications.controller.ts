import { Controller, Get, Query } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { ApplicationsService } from './applications.service';

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
}
