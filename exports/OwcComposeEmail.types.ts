import { OwcComposeEmail } from './OwcComposeEmail.js';

declare global {
  interface HTMLElementTagNameMap {
    'owc-compose-email': OwcComposeEmail<Record<string, string> & { user: { email: string } }>;
  }
}
