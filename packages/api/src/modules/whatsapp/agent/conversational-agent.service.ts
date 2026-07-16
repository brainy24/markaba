import { Injectable } from '@nestjs/common';
import { FAQ_CONTENT, FAQ_MENU_TEXT } from '../content/faq.content';
import { AuditService } from '../../audit/audit.service';
import { AnthropicClient } from './anthropic-client';

const ESCALATE_PREFIX = 'ESCALATE:';
const DEFAULT_ESCALATION_MESSAGE =
  "That's a great question — let me get a team member to follow up with you on that.";
const ACTOR = 'whatsapp-agent';

/**
 * Grounded-only system prompt: the model may answer solely from the approved
 * FAQ content and must escalate anything else, rather than freely generating
 * a claim about Sharia compliance, pricing, or eligibility. This is the
 * safety property that lets the agent exist ahead of SSB certification of
 * the underlying content — see docs/decisions/ (agent ADR) and CLAUDE.md
 * §2.1's rationale, which this narrows rather than bypasses. Exported so
 * tests can assert the FAQ content is actually present in what gets sent.
 */
export function buildSystemPrompt(): string {
  const knowledgeBase = FAQ_CONTENT.map(
    (entry) => `Q: ${entry.question}\nA: ${entry.answer}`,
  ).join('\n\n');

  return [
    "You are Markaba's WhatsApp assistant for a Sharia-compliant vehicle-financing platform in Nigeria.",
    '',
    'Rules you must never break:',
    '1. Answer ONLY using the approved content below. Never invent, guess, or ' +
      'speculate about Sharia rulings, pricing, eligibility, or anything not ' +
      'explicitly stated in it.',
    "2. If the customer's question is not covered by the approved content, do " +
      `not attempt an answer. Instead reply with exactly: ${ESCALATE_PREFIX} ` +
      '<one short, warm sentence telling the customer a team member will follow up>',
    '3. Keep answers short and conversational — a few sentences, suitable for ' +
      'WhatsApp, not an essay.',
    '4. Never issue a credit decision, quote a specific approval, or promise a ' +
      "specific outcome for the customer's own application.",
    '5. If the customer wants to start an application or check their status, ' +
      'tell them to reply "apply" or "status" — you do not process those yourself.',
    '',
    'APPROVED CONTENT:',
    knowledgeBase,
  ].join('\n');
}

/**
 * Conversational layer for anything that isn't the deterministic
 * apply/status flows in WhatsAppService (those stay keyword-routed —
 * CLAUDE.md §2.3, the agent never triggers a binding action itself).
 *
 * Falls back to plain keyword/substring FAQ matching when no
 * ANTHROPIC_API_KEY is configured, so the app works out of the box without
 * a real key (same "safe default" pattern as every other integration
 * adapter in this repo).
 */
@Injectable()
export class ConversationalAgentService {
  constructor(
    private readonly anthropicClient: AnthropicClient,
    private readonly audit: AuditService,
  ) {}

  async reply(from: string, text: string): Promise<string> {
    if (!this.anthropicClient.isConfigured()) {
      return this.deterministicFallback(text);
    }

    const raw = (await this.anthropicClient.complete(buildSystemPrompt(), text)).trim();

    if (raw.startsWith(ESCALATE_PREFIX)) {
      const acknowledgment = raw.slice(ESCALATE_PREFIX.length).trim() || DEFAULT_ESCALATION_MESSAGE;
      await this.audit.log({
        actor: ACTOR,
        action: 'WHATSAPP_AGENT_ESCALATED',
        entityType: 'Customer',
        entityId: from,
        metadata: { question: text },
      });
      return acknowledgment;
    }

    await this.audit.log({
      actor: ACTOR,
      action: 'WHATSAPP_AGENT_REPLIED',
      entityType: 'Customer',
      entityId: from,
      metadata: { question: text },
    });
    return raw || FAQ_MENU_TEXT;
  }

  /** Identical to the pre-agent handleEducation() this replaces — unchanged behavior. */
  private deterministicFallback(text: string): string {
    const normalized = text.trim().toLowerCase();
    const match = FAQ_CONTENT.find((entry) =>
      normalized.includes(entry.question.toLowerCase().replace('?', '')),
    );
    return match ? match.answer : FAQ_MENU_TEXT;
  }
}
