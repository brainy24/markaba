import { Injectable } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import { ApplicationsService } from '../applications/applications.service';
import { ConversationalAgentService } from './agent/conversational-agent.service';
import { routeIntent } from './message-router';

export interface InboundWhatsAppMessage {
  from: string;
  text: string;
}

const WHATSAPP_ACTOR = 'whatsapp-bot';

/** Mock defaults — a real flow would collect these over the conversation. */
const MOCK_DEFAULT_PRODUCT = 'IJARAH' as const;
const MOCK_DEFAULT_FINANCED_AMOUNT = 3_600_000;
const MOCK_DEFAULT_DOWN_PAYMENT_PCT = 20;
const MOCK_DEFAULT_TERM_MONTHS = 36;
const MOCK_DEFAULT_DECLARED_VEHICLE_USE = 'personal_commute';

@Injectable()
export class WhatsAppService {
  constructor(
    private readonly customers: CustomersService,
    private readonly applications: ApplicationsService,
    private readonly agent: ConversationalAgentService,
  ) {}

  /**
   * Dispatches an inbound message to the right handler. No credit decision, no
   * Sharia ruling, and no real personal data leaves the system here — customer
   * creation and application creation use only what the customer themselves sent
   * over this channel (CLAUDE.md §2.1, §2.2).
   *
   * `education`/`unknown` both go to the conversational agent — it only
   * converses, it never triggers `start_application`/`check_status` itself
   * (CLAUDE.md §2.3: those stay deterministic, keyword-routed, human-auditable).
   */
  async handleMessage(message: InboundWhatsAppMessage): Promise<string> {
    const intent = routeIntent(message.text);

    switch (intent) {
      case 'start_application':
        return this.handleStartApplication(message.from);
      case 'check_status':
        return this.handleCheckStatus(message.from);
      case 'education':
      case 'unknown':
      default:
        return this.agent.reply(message.from, message.text);
    }
  }

  private async handleStartApplication(from: string): Promise<string> {
    let customer = await this.customers.findByPhoneNumber(from);
    if (!customer) {
      customer = await this.customers.create({ displayName: 'Pending KYC', phone: from });
    }

    const application = await this.applications.create(
      {
        customerId: customer.id,
        product: MOCK_DEFAULT_PRODUCT,
        financedAmount: MOCK_DEFAULT_FINANCED_AMOUNT,
        downPaymentPct: MOCK_DEFAULT_DOWN_PAYMENT_PCT,
        termMonths: MOCK_DEFAULT_TERM_MONTHS,
        declaredVehicleUse: MOCK_DEFAULT_DECLARED_VEHICLE_USE,
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
      return 'We don\'t have an application on file for this number yet. Reply "apply" to start one.';
    }

    const application = await this.applications.findLatestByCustomer(customer.id);
    if (!application) {
      return 'We don\'t have an application on file for this number yet. Reply "apply" to start one.';
    }

    return `Your latest application (${application.id}) is currently: ${application.state}.`;
  }
}
