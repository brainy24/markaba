import { describe, expect, it, vi } from 'vitest';
import { consumeInvite, resolveSignIn } from './invites';

function mockPrisma(overrides: {
  user?: unknown;
  invite?: { role: string; consumedAt: Date | null } | null;
}) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(overrides.user ?? null),
      update: vi.fn().mockResolvedValue({}),
    },
    adminInvite: {
      findUnique: vi.fn().mockResolvedValue(overrides.invite ?? null),
      update: vi.fn().mockResolvedValue({}),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('resolveSignIn', () => {
  it('allows an email with an already-provisioned role, without consulting invites', async () => {
    const prisma = mockPrisma({ user: { role: 'CEO' } });

    const result = await resolveSignIn(prisma, 'ceo@markaba.example');

    expect(result).toEqual({ allowed: true, role: 'CEO', alreadyProvisioned: true });
    expect(prisma.adminInvite.findUnique).not.toHaveBeenCalled();
  });

  it('allows an email with a matching, unconsumed invite', async () => {
    const prisma = mockPrisma({ invite: { role: 'CreditAnalyst', consumedAt: null } });

    const result = await resolveSignIn(prisma, 'new-analyst@markaba.example');

    expect(result).toEqual({
      allowed: true,
      role: 'CreditAnalyst',
      alreadyProvisioned: false,
    });
  });

  it('rejects an email with no user record and no invite', async () => {
    const prisma = mockPrisma({});

    const result = await resolveSignIn(prisma, 'stranger@example.com');

    expect(result).toEqual({ allowed: false });
  });

  it('rejects an email whose invite was already consumed', async () => {
    const prisma = mockPrisma({
      invite: { role: 'Operations', consumedAt: new Date('2026-01-01') },
    });

    const result = await resolveSignIn(prisma, 'already-used@markaba.example');

    expect(result).toEqual({ allowed: false });
  });
});

describe('consumeInvite', () => {
  it('marks the invite consumed and stamps the role onto the user', async () => {
    const prisma = mockPrisma({});

    await consumeInvite(prisma, 'new-analyst@markaba.example', 'CreditAnalyst');

    expect(prisma.adminInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'new-analyst@markaba.example' },
        data: expect.objectContaining({ consumedAt: expect.any(Date) }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: 'new-analyst@markaba.example' },
      data: { role: 'CreditAnalyst' },
    });
  });
});
