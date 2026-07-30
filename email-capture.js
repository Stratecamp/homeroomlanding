/* ============================================================
   homeroom · email capture  (Kit / ConvertKit)
   ------------------------------------------------------------
   Form IDs live in HR_EMAIL.FORMS below. To add or change one,
   grab the data-uid from the Kit embed snippet, e.g.
   <script data-uid="94b361b12d" ...>  →  '94b361b12d'
   ============================================================ */

const HR_EMAIL = {
  ACCOUNT: 'homeroom-for-family',        // your Kit subdomain
  FORMS: {
    sampler: '94b361b12d',               // Free lunch notes + Week Zero (delivers the PDF)
    app:     'd6d0c99011',               // App early access list
    recipes: 'f5bd724bde',               // Recipe library waitlist
    dinner:  'e6a79fa509',               // Dinner club founding members
    general: 'aca427f482'                // General newsletter
  }
};

async function hrSubscribe(email, listKey) {
  const uid = HR_EMAIL.FORMS[listKey] || HR_EMAIL.FORMS.general;
  if (!uid) { console.warn('[homeroom] no form id for', listKey); return { ok: true, demo: true }; }

  const body = new FormData();
  body.append('email_address', email);

  // Primary: Kit's form subscription endpoint.
  try {
    const res = await fetch(`https://app.kit.com/forms/${uid}/subscriptions`, {
      method: 'POST', headers: { 'Accept': 'application/json' }, body
    });
    if (res.ok) return { ok: true };
    throw new Error('status ' + res.status);
  } catch (err) {
    // Fallback: fire it opaquely at the hosted form. We can't read the response,
    // but Kit still records the subscriber.
    try {
      await fetch(`https://${HR_EMAIL.ACCOUNT}.kit.com/${uid}`, {
        method: 'POST', mode: 'no-cors', body
      });
      return { ok: true, opaque: true };
    } catch (e2) {
      console.error('[homeroom] signup failed:', e2);
      return { ok: false };
    }
  }
}

function hrInitForms() {
  document.querySelectorAll('form[data-hr-list]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const input = form.querySelector('input[type=email]');
      const btn   = form.querySelector('button');
      const okBox = document.getElementById('ok-' + (form.dataset.hrOk || form.dataset.hrList));
      const email = (input.value || '').trim();
      if (!email) return;

      const original = btn.textContent;
      btn.textContent = 'Sending…'; btn.disabled = true;

      const result = await hrSubscribe(email, form.dataset.hrList);

      btn.disabled = false; btn.textContent = original;

      if (result.ok) {
        input.value = '';
        if (okBox) okBox.style.display = 'block';
        form.style.display = 'none';
      } else if (okBox) {
        okBox.style.background = '#D9472B';
        okBox.textContent = "Something went wrong on our end. Try again in a moment, or email us and we'll add you by hand.";
        okBox.style.display = 'block';
      }
    });
  });
}
document.addEventListener('DOMContentLoaded', hrInitForms);
