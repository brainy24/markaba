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
    '1. Answer ONLY using the approved content below, and ONLY the specific ' +
      'facts it states. Never invent, guess, infer, extrapolate, or reason ' +
      'your own way to an answer about Sharia rulings, pricing, eligibility, ' +
      'approval criteria, fairness/anti-corruption policy, legal questions, ' +
      "or anything else — even if the answer feels obvious, safe, or like " +
      'common sense. If it is not written in the approved content below, you ' +
      'do not know it.',
    "2. Treat this as all-or-nothing per question: if ANY part of the " +
      "customer's question is not explicitly covered by the approved " +
      'content, do not answer ANY part of it yourself — including the parts ' +
      'that do overlap with the approved content, and do not add your own ' +
      'commentary about policy, fairness, process, or anything else not ' +
      `literally in the approved content. Reply with EXACTLY the single word ` +
      `"${ESCALATE_PREFIX}" and nothing else — no explanation, no partial ` +
      'answer, no extra sentence. A fixed message (not written by you) is ' +
      'sent to the customer instead.',
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

    // Look for the marker anywhere in the response, not just at the start: the
    // model is instructed to lead with it, but if it ever blends a partial
    // answer before an escalation instead, we must still discard that partial
    // answer rather than let it reach the customer — never trust the model to
    // have followed the "don't blend" instruction perfectly. Likewise, the
    // acknowledgment text the model writes after the prefix is never sent to
    // the customer — it has been observed inventing unapproved claims there
    // (e.g. a "fairness policy") that are just as ungrounded as a normal
    // hallucinated answer, just wrapped inside the escalation path instead.
    // The fixed message is the only thing a customer ever sees on escalation.
    if (raw.includes(ESCALATE_PREFIX)) {
      const acknowledgment = DEFAULT_ESCALATION_MESSAGE;
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
