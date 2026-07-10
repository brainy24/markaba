import type { DefaultSession } from 'next-auth';
import type { Role } from '../generated/prisma-client';

// Session and JWT are declared in @auth/core (next-auth re-exports them),
// so augmenting the re-exporting `next-auth`/`next-auth/jwt` modules doesn't
// merge into the original declarations — augment the actual source modules.
declare module '@auth/core/types' {
  interface Session {
    user: {
      role?: Role;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: Role;
  }
}
