import { Test } from '@nestjs/testing';
import { AuditService } from '../../audit/audit.service';
import { AnthropicClient } from './anthropic-client';
import { buildSystemPrompt, ConversationalAgentService } from './conversational-agent.service';

describe('buildSystemPrompt', () => {
  it('includes every approved FAQ question in the grounded knowledge base', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('What is Ijarah?');
    expect(prompt).toContain('What is Murabaha?');
    expect(prompt).toContain('APPROVED CONTENT:');
  });

  it('instructs the model to escalate rather than invent an answer', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/ESCALATE:/);
    expect(prompt).toMatch(/never invent, guess, infer, extrapolate, or reason/i);
  });

  it('instructs the model to escalate the whole question, with no commentary of its own', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toMatch(/all-or-nothing per question/i);
    expect(prompt).toMatch(/no partial answer, no extra sentence/i);
  });
});

describe('ConversationalAgentService', () => {
  let service: ConversationalAgentService;
  let anthropicClient: { isConfigured: jest.Mock; complete: jest.Mock };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    anthropicClient = {
      isConfigured: jest.fn(() => true),
      complete: jest.fn(() => Promise.resolve('Ijarah is a lease-to-own arrangement.')),
    };
    audit = { log: jest.fn(() => Promise.resolve({})) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConversationalAgentService,
        { provide: AnthropicClient, useValue: anthropicClient },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(ConversationalAgentService);
  });

  it('falls back to deterministic FAQ matching when no API key is configured', async () => {
    anthropicClient.isConfigured.mockReturnValue(false);

    const reply = await service.reply('+2348000000001', 'what is ijarah?');

    expect(reply).toContain('lease-to-own');
    expect(anthropicClient.complete).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('returns the grounded reply and audit-logs it when configured', async () => {
    const reply = await service.reply('+2348000000001', 'what is ijarah?');

    expect(reply).toBe('Ijarah is a lease-to-own arrangement.');
    expect(anthropicClient.complete).toHaveBeenCalledWith(
      expect.stringContaining('APPROVED CONTENT:'),
      'what is ijarah?',
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: 'whatsapp-agent',
        action: 'WHATSAPP_AGENT_REPLIED',
        entityId: '+2348000000001',
      }),
    );
  });

  it('parses an ESCALATE response and audit-logs the escalation', async () => {
    anthropicClient.complete.mockResolvedValueOnce('ESCALATE:');

    const reply = await service.reply('+2348000000001', 'can you finance a helicopter?');

    expect(reply.length).toBeGreaterThan(0);
    expect(reply).not.toContain('ESCALATE');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'WHATSAPP_AGENT_ESCALATED',
        metadata: { question: 'can you finance a helicopter?' },
      }),
    );
  });

  it('never forwards model-written acknowledgment text to the customer, even if the model adds its own claims', async () => {
    anthropicClient.complete.mockResolvedValueOnce(
      'ESCALATE: Markaba has a strict fairness and anti-corruption policy — no connection changes your outcome.',
    );

    const reply = await service.reply('+2348000000001', 'can my uncle at the bank help my approval?');

    expect(reply).not.toContain('fairness');
    expect(reply).not.toContain('anti-corruption');
    expect(reply).not.toContain('ESCALATE');
  });

  it('discards a partial answer and escalates cleanly even if the model blends the two', async () => {
    anthropicClient.complete.mockResolvedValueOnce(
      "I can't confirm the details on that. ESCALATE: A team member will follow up with the exact details.",
    );

    const reply = await service.reply('+2348000000001', 'edge case question');

    expect(reply).not.toContain("I can't confirm");
    expect(reply).not.toContain('A team member will follow up with the exact details');
    expect(reply).not.toContain('ESCALATE');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'WHATSAPP_AGENT_ESCALATED' }),
    );
  });
});
