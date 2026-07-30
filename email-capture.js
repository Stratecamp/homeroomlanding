/* ============================================================
   homeroom · email capture (Kit)
   ------------------------------------------------------------
   Posts through a hidden iframe instead of fetch(). Browsers block
   cross-origin fetch to Kit unless they send CORS headers, which is
   almost certainly why the earlier version silently failed. A form
   POST into an iframe is exempt from that rule, so it always lands.

   Form IDs = the data-uid from each Kit embed snippet.
   ============================================================ */

const HR_EMAIL = {
  ACCOUNT: 'homeroom-for-family',
  FORMS: {
    sampler: '94b361b12d',   // Free lunch notes + Week Zero (delivers the PDF)
    app:     'd6d0c99011',   // App early access
    recipes: 'f5bd724bde',   // Recipe library waitlist
    dinner:  'e6a79fa509',   // Dinner club founding members
    general: 'aca427f482'    // General newsletter
  }
};

function hrEnsureSink() {
  let f = document.getElementById('hr-sink');
  if (!f) {
    f = document.createElement('iframe');
    f.id = 'hr-sink';
    f.name = 'hr-sink';
    f.style.cssText = 'position:absolute;width:0;height:0;border:0;left:-9999px;';
    document.body.appendChild(f);
  }
  return f;
}

function hrSubscribe(email, listKey) {
  const uid = HR_EMAIL.FORMS[listKey] || HR_EMAIL.FORMS.general;
  if (!uid) return false;

  hrEnsureSink();

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `https://app.kit.com/forms/${uid}/subscriptions`;
  form.target = 'hr-sink';
  form.style.display = 'none';

  const field = document.createElement('input');
  field.type = 'hidden';
  field.name = 'email_address';
  field.value = email;
  form.appendChild(field);

  // Kit accepts either field name depending on form version; send both.
  const alt = document.createElement('input');
  alt.type = 'hidden';
  alt.name = 'fields[email_address]';
  alt.value = email;
  form.appendChild(alt);

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => form.remove(), 2000);
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
      }, 900);
    });
  });
}
document.addEventListener('DOMContentLoaded', hrInitForms);
