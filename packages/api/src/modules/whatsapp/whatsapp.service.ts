import { Injectable } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { ApplicationsService } from '../applications/applications.service';
import { FAQ_CONTENT, FAQ_MENU_TEXT } from './content/faq.content';
import { routeIntent } from './message-router';

export interface InboundWhatsAppMessage {
  from: string;
  text: string;
}

const WHATSAPP_ACTOR = 'whatsapp-bot';

/** Mock defaults — a real flow would collect these over the conversation. */
const MOCK_DEFAULT_FINANCE_TYPE = 'IJARAH' as const;
const MOCK_DEFAULT_REQUESTED_AMOUNT_NAIRA = 3_600_000;

@Injectable()
export class WhatsAppService {
  constructor(
    private readonly customers: CustomersService,
    private readonly applications: ApplicationsService,
  ) {}

  /**
   * Dispatches an inbound message to the right handler. No credit decision, no
   * Sharia ruling, and no real personal data leaves the system here — customer
   * creation and application creation use only what the customer themselves sent
   * over this channel (CLAUDE.md §2.1, §2.2).
   */
  async handleMessage(message: InboundWhatsAppMessage): Promise<string> {
    const intent = routeIntent(message.text);

    switch (intent) {
      case 'education':
        return this.handleEducation(message.text);
      case 'start_application':
        return this.handleStartApplication(message.from);
      case 'check_status':
        return this.handleCheckStatus(message.from);
      case 'unknown':
      default:
        return `I didn't understand that. ${FAQ_MENU_TEXT}. Or reply "apply" or "status".`;
    }
  }

  private handleEducation(text: string): string {
    const normalized = text.trim().toLowerCase();
    const match = FAQ_CONTENT.find((entry) =>
      normalized.includes(entry.question.toLowerCase().replace('?', '')),
    );
    return match ? match.answer : FAQ_MENU_TEXT;
  }

  private async handleStartApplication(from: string): Promise<string> {
    let customer = await this.customers.findByPhoneNumber(from);
    if (!customer) {
      customer = await this.customers.create({ fullName: 'Pending KYC', phoneNumber: from });
    }

    const application = await this.applications.create(
      {
        customerId: customer.id,
        financeType: MOCK_DEFAULT_FINANCE_TYPE,
        requestedAmountNaira: MOCK_DEFAULT_REQUESTED_AMOUNT_NAIRA,
      },
      WHATSAPP_ACTOR,
    );

    return (
      `Thanks — your application ${application.id} has been submitted (status: ` +
      `${application.state}). We'll message you as it progresses.`
    );
  }

  private async handleCheckStatus(from: string): Promise<string> {
    const customer = await this.customers.findByPhoneNumber(from);
    if (!customer) {
      return "We don't have an application on file for this number yet. Reply \"apply\" to start one.";
    }

    const application = await this.applications.findLatestByCustomer(customer.id);
    if (!application) {
      return "We don't have an application on file for this number yet. Reply \"apply\" to start one.";
    }

    return `Your latest application (${application.id}) is currently: ${application.state}.`;
  }
}
