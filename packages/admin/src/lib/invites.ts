import type { PrismaClient, Role } from '../generated/prisma-client';

type InviteAwarePrisma = Pick<PrismaClient, 'user' | 'adminInvite'>;

export interface SignInResolution {
  allowed: boolean;
  role?: Role;
  /** True if this email already had a provisioned User.role (returning staff). */
  alreadyProvisioned?: boolean;
}

/**
 * The actual access-control decision for the admin portal: a valid
 * Google/Microsoft account is necessary but not sufficient. Either the email
 * already has a provisioned role (returning staff), or there must be a
 * matching, unconsumed AdminInvite a SuperAdmin created beforehand. No
 * matching row of either kind means sign-in is rejected outright.
 */
export async function resolveSignIn(
  prisma: InviteAwarePrisma,
  email: string,
): Promise<SignInResolution> {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser?.role) {
    return { allowed: true, role: existingUser.role, alreadyProvisioned: true };
  }

  const invite = await prisma.adminInvite.findUnique({ where: { email } });
  if (!invite || invite.consumedAt) {
    return { allowed: false };
  }

  return { allowed: true, role: invite.role, alreadyProvisioned: false };
}

/**
 * Marks the invite consumed and stamps its role onto the User record.
 * Call only after `resolveSignIn` returned an unconsumed-invite match
 * (`allowed: true, alreadyProvisioned: false`) — see auth.ts's jwt callback.
 */
export async function consumeInvite(
  prisma: InviteAwarePrisma,
  email: string,
  role: Role,
): Promise<void> {
  await prisma.adminInvite.update({
    where: { email },
    data: { consumedAt: new Date() },
  });
  await prisma.user.update({
    where: { email },
    data: { role },
  });
}
