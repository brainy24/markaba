import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateCustomerInput {
  fullName: string;
  phoneNumber: string;
  email?: string;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

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

  findByPhoneNumber(phoneNumber: string) {
    return this.prisma.customer.findUnique({ where: { phoneNumber } });
  }
}
