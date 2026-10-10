// Sends form data by email through Web3Forms (https://web3forms.com).
import { site } from '../config/site.js';

export class FormNotConfiguredError extends Error {}

/**
 * @param {Record<string, string>} fields readable key/value pairs that appear in the email
 * @param {{ subject: string, replyTo?: string, fromName?: string, botcheck?: string, ccEmail?: string }} meta
 */
export async function sendForm(fields, meta) {
  if (meta.botcheck) return { ok: true, spam: true }; // honeypot filled → silently drop
  if (!site.forms.accessKey) throw new FormNotConfiguredError('VITE_FORM_ACCESS_KEY is not set');
  const payload = {
    access_key: site.forms.accessKey,
    subject: meta.subject,
    from_name: meta.fromName || 'Vinarija Veritas — sajt',
    ...(meta.replyTo ? { replyto: meta.replyTo } : {}),
    // Copy to the customer — only works on a Web3Forms plan that supports `ccemail`.
    ...(meta.ccEmail && site.forms.customerCopy ? { ccemail: meta.ccEmail } : {}),
    botcheck: '',
    ...fields,
  };
  const res = await fetch(site.forms.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);
  return { ok: true };
}
