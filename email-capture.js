/* ============================================================
   homeroom · email capture (Kit)
   ------------------------------------------------------------
   Uses Kit's real submission endpoint with the NUMERIC form id
   (found in the form's HTML embed: action=".../forms/9744403/...").
   The data-uid (e.g. 94b361b12d) is only for their JS embed and is
   NOT a valid endpoint — that was the earlier bug.

   Posts via a hidden iframe so no CORS permission is required.
   To add a list: get its numeric id from Kit → form → Embed → HTML.
   ============================================================ */

const HR_EMAIL = {
  FORMS: {
    sampler: '9744403',   // Free lunch notes + Week Zero (delivers the PDF)
    app:     '9744295',   // App early access
    recipes: '9744336',   // Recipe library waitlist
    dinner:  '9744347',   // Dinner club founding members
    general: '9744376'    // General newsletter
  },
  // Fallback only — every list above has a real id now.
  HOSTED: {}
};

function hrSink() {
  let f = document.getElementById('hr-sink');
  if (!f) {
    f = document.createElement('iframe');
    f.id = 'hr-sink'; f.name = 'hr-sink';
    f.style.cssText = 'position:absolute;width:0;height:0;border:0;left:-9999px;';
    document.body.appendChild(f);
  }
  return f;
}

function hrSubscribe(email, listKey) {
  const id = HR_EMAIL.FORMS[listKey];
  if (!id) {
    const url = HR_EMAIL.HOSTED[listKey];
    if (url) window.open(url, '_blank', 'noopener');
    return false;
  }
  hrSink();
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `https://app.kit.com/forms/${id}/subscriptions`;
  form.target = 'hr-sink';
  form.style.display = 'none';

  const email_address = document.createElement('input');
  email_address.type = 'hidden';
  email_address.name = 'email_address';
  email_address.value = email;
  form.appendChild(email_address);

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => form.remove(), 3000);
  return true;
}

function hrInitForms() {
  document.querySelectorAll('form[data-hr-list]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('input[type=email]');
      const btn   = form.querySelector('button');
      const okBox = document.getElementById('ok-' + (form.dataset.hrOk || form.dataset.hrList));
      const email = (input.value || '').trim();
      if (!email) return;

      btn.textContent = 'Sending…';
      btn.disabled = true;
      hrSubscribe(email, form.dataset.hrList);

      setTimeout(() => {
        input.value = '';
        btn.disabled = false;
        if (okBox) okBox.style.display = 'block';
        form.style.display = 'none';
      }, 1000);
    });
  });
}
document.addEventListener('DOMContentLoaded', hrInitForms);
