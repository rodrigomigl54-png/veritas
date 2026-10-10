import { t } from '../i18n/index.js';
import { sendForm } from './submit.js';
import { errorHtml } from './errors.js';
import { validateForm, liveValidate, setStatus } from './validate.js';

export function initNewsletter() {
  const form = document.querySelector('[data-newsletter-form]');
  if (!form) return;
  liveValidate(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(form, null, '');
    if (!validateForm(form)) return;
    const d = Object.fromEntries(new FormData(form));
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
      await sendForm({ Email: d.email }, { subject: 'Newsletter prijava', replyTo: d.email, botcheck: d.botcheck });
      form.reset();
      setStatus(form, 'success', t('footer.newsletterSuccess'));
    } catch (err) {
      console.error(err);
      setStatus(form, 'error', errorHtml(err));
    } finally {
      btn.disabled = false;
    }
  });
}
