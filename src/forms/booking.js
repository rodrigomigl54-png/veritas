// "Zakaži termin" — booking form (inline in the Visits section and as a modal / mobile sheet).
import { t } from '../i18n/index.js';
import { createDialog } from '../ui/dialog.js';
import { sendForm } from './submit.js';
import { errorHtml } from './errors.js';
import { validateForm, liveValidate, setStatus, setLoading, toDateValue, earliestVisit, visitDateTime } from './validate.js';

function formatDateSr(value) {
  const [y, m, d] = value.split('-');
  return `${d}.${m}.${y}.`;
}

// Earliest selectable date = now + 24h; on that day, earlier arrival times are disabled.
// If no arrival time is left on that day, the first selectable date is the next day.
function enforceNotice(form) {
  const date = form.querySelector('[data-min-notice]');
  const time = form.querySelector('select[name="time"]');
  const slots = [...time.options].map((o) => o.value).filter(Boolean);
  const update = () => {
    const earliest = earliestVisit();
    let minDay = new Date(earliest);
    if (visitDateTime(toDateValue(minDay), slots[slots.length - 1]) < earliest) minDay = new Date(minDay.getFullYear(), minDay.getMonth(), minDay.getDate() + 1);
    date.min = toDateValue(minDay);
    if (date.value && date.value < date.min) date.value = '';
    [...time.options].forEach((opt) => {
      if (!opt.value) return;
      opt.disabled = !!date.value && visitDateTime(date.value, opt.value) < earliest;
    });
    if (time.selectedOptions[0]?.disabled) time.value = '';
  };
  date.addEventListener('focus', update);
  date.addEventListener('change', update);
  update();
  setInterval(update, 60 * 1000);
}

function wire(form, onDone) {
  enforceNotice(form);
  liveValidate(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(form, null, '');
    if (!validateForm(form)) return;
    const d = Object.fromEntries(new FormData(form));
    setLoading(form, true, 'booking.sending');
    try {
      await sendForm(
        {
          'Ime i prezime': d.name,
          Telefon: d.phone,
          Email: d.email,
          'Vrsta posete': d.type,
          Datum: formatDateSr(d.date),
          'Okvirno vreme dolaska': d.time,
          'Broj osoba': d.people,
          Napomena: d.note || '—',
        },
        { subject: `Nova rezervacija — ${d.type} — ${formatDateSr(d.date)}`, replyTo: d.email, fromName: d.name, botcheck: d.botcheck },
      );
      form.reset();
      enforceNotice(form);
      setStatus(form, 'success', t('booking.success'));
      onDone?.();
    } catch (err) {
      console.error(err);
      setStatus(form, 'error', errorHtml(err));
    } finally {
      setLoading(form, false);
    }
  });
}

export function initBooking() {
  const modalEl = document.getElementById('booking-modal');
  const modal = createDialog(modalEl, {
    initialFocus: () => modalEl.querySelector('input'),
    onOpen: () => setStatus(modalEl.querySelector('form'), null, ''),
  });
  modalEl.querySelectorAll('[data-close-modal]').forEach((b) => b.addEventListener('click', modal.close));
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-booking]')) {
      e.preventDefault();
      modal.open();
    }
  });
  document.querySelectorAll('[data-booking-form]').forEach((form) => wire(form));
  return modal;
}
