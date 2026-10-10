import { t } from '../i18n/index.js';
import { site } from '../config/site.js';
import { FormNotConfiguredError } from './submit.js';

// Error message with the phone number as a fallback.
export function errorHtml(err) {
  const phone = site.contact.phone;
  const base = t('form.errorHtml', undefined, { phone: phone.display, phoneHref: phone.href });
  return err instanceof FormNotConfiguredError ? `${t('form.notConfigured')} ${base}` : base;
}
