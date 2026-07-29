/* ============================================================
   homeroom · email capture
   ------------------------------------------------------------
   SETUP: fill in the CONFIG block below, save, commit. Done.

   USING KIT (formerly ConvertKit) — recommended, free to 10k:
     1. Kit dashboard → Grow → Landing Pages & Forms → New Form → Inline
     2. Save it, then look at the form's URL in your browser:
        https://app.kit.com/forms/1234567/edit   ← 1234567 is the FORM ID
     3. Set PROVIDER to 'kit' and paste that number into the FORMS below.
     4. Make one form per source so you know where people came from
        (e.g. "App early list", "Recipes list"). Or reuse one ID for all.

   USING MAILERLITE — also free to 1k:
     1. MailerLite → Forms → Embedded forms → create one → "Use HTML code"
     2. In that code, find the <form action="..."> URL. It looks like:
        https://assets.mailerlite.com/jsonp/123456/forms/7890123456/subscribe
     3. Set PROVIDER to 'mailerlite' and paste the FULL URL into FORMS below.

   NOT READY YET? Leave PROVIDER as 'demo'. Forms will show the thank-you
   message but nothing is stored, so don't run ads to it in demo mode.
   ============================================================ */

const HR_EMAIL = {
  PROVIDER: 'demo',            // 'kit' | 'mailerlite' | 'demo'

  FORMS: {
    app:     '',               // people wanting the app early list
    recipes: '',               // people wanting the recipe library
    general: ''                // anything else
  },

  // Optional: sent to Kit as a custom field so you can segment later.
  SOURCE_FIELD: 'signup_source'
};

/* ---------- the machinery (you shouldn't need to touch this) ---------- */

async function hrSubscribe(email, listKey) {
  const cfg = HR_EMAIL;
  const target = cfg.FORMS[listKey] || cfg.FORMS.general || '';

  if (cfg.PROVIDER === 'demo' || !target) {
    console.warn('[homeroom] Email capture is in demo mode. Set HR_EMAIL.PROVIDER and FORMS in email-capture.js to store addresses.');
    return { ok: true, demo: true };
  }

  try {
    if (cfg.PROVIDER === 'kit') {
      const body = new FormData();
      body.append('email_address', email);
      body.append(`fields[${cfg.SOURCE_FIELD}]`, listKey);
      const res = await fetch(`https://app.kit.com/forms/${target}/subscriptions`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body
      });
      if (!res.ok) throw new Error('Kit responded ' + res.status);
      return { ok: true };
    }

    if (cfg.PROVIDER === 'mailerlite') {
      const body = new FormData();
      body.append('fields[email]', email);
      body.append('ml-submit', '1');
      body.append('anticsrf', 'true');
      await fetch(target, { method: 'POST', mode: 'no-cors', body });
      // no-cors gives an opaque response, so we can't read status. MailerLite
      // still records the subscriber. Check your dashboard after a test signup.
      return { ok: true, opaque: true };
    }

    throw new Error('Unknown PROVIDER: ' + cfg.PROVIDER);
  } catch (err) {
    console.error('[homeroom] signup failed:', err);
    return { ok: false, error: err };
  }
}

/* Wires up any <form data-hr-list="app"> on the page.
   Expects a sibling/nearby element with id "ok-<formId>" for the success note. */
function hrInitForms() {
  document.querySelectorAll('form[data-hr-list]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const input  = form.querySelector('input[type=email]');
      const btn    = form.querySelector('button');
      const okBox  = document.getElementById('ok-' + (form.dataset.hrOk || form.dataset.hrList));
      const email  = (input.value || '').trim();
      if (!email) return;

      const original = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      const result = await hrSubscribe(email, form.dataset.hrList);

      btn.disabled = false;
      btn.textContent = original;

      if (result.ok) {
        input.value = '';
        if (okBox) okBox.style.display = 'block';
        form.style.display = 'none';
      } else {
        if (okBox) {
          okBox.style.background = '#D9472B';
          okBox.textContent = "Something went wrong on our end. Try again in a moment, or email us and we'll add you by hand.";
          okBox.style.display = 'block';
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', hrInitForms);
