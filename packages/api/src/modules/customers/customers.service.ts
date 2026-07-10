import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotImplementedError } from '@markaba/shared';

export interface CreateCustomerInput {
  displayName: string;
  phone: string;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  create(input: CreateCustomerInput) {
    return this.prisma.customer.create({ data: input });
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }

  findByPhoneNumber(phone: string) {
    return this.prisma.customer.findUnique({ where: { phone } });
  }

  /**
   * NDPA A.4 — PII has a defined deletion path (30 days post-Ijarah-completion
   * unless a lawful retention basis applies). This is a Phase 1 stub: it records
   * the intent and who's accountable for it, but does not perform a real purge.
   * See docs/decisions/0001-ndpa-deletion-policy.md.
   */
  async scheduleDeletion(customerId: string, actor: string): Promise<never> {
    await this.audit.log({
      actor,
      action: 'DELETION_SCHEDULED',
      entityType: 'Customer',
      entityId: customerId,
    });
    throw new NotImplementedError(
      'Automated PII purge is not implemented in Phase 1 — see docs/decisions/0001-ndpa-deletion-policy.md.',
    );
  }
}
