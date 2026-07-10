import { PrismaClient } from '../src/generated/prisma-client';

const prisma = new PrismaClient();

/**
 * Bootstraps the very first SuperAdmin invite. Solves the chicken-and-egg
 * problem: sign-in is invite-gated (see ../src/lib/invites.ts), so someone
 * has to be SuperAdmin before anyone can invite anyone else. Run once via
 * `npm run prisma:seed --workspace=@markaba/admin` after setting
 * INITIAL_SUPERADMIN_EMAIL in packages/admin/.env.local to a real work email.
 */
async function main(): Promise<void> {
  const email = process.env.INITIAL_SUPERADMIN_EMAIL;
  if (!email || email === 'placeholder@example.com') {
    throw new Error(
      'Set INITIAL_SUPERADMIN_EMAIL in packages/admin/.env.local to a real work email before seeding.',
    );
  }

  const invite = await prisma.adminInvite.upsert({
    where: { email },
    create: { email, role: 'SuperAdmin', invitedBy: 'system' },
    update: {},
  });

  console.log(
    invite.consumedAt
      ? `${email} already has a consumed invite — nothing to do.`
      : `Seeded SuperAdmin invite for ${email}. They can now sign in with Google or Microsoft.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
