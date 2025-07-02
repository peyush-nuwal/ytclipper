import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Backend tests would be handled by Go
  'apps/app',
  'apps/landing',
  'packages/ui',
]);
