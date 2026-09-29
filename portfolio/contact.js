const form = document.querySelector('#enquiry');
form?.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const lines = [...data].map(([key, value]) => key + ': ' + (value || '—')).join('\n');
  const subject = 'Project enquiry — ' + data.get('name');
  const url = 'mailto:hello@anzaworks.lk?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines);
  document.querySelector('#form-status').textContent = 'Your email app should open with a draft. Please confirm the address and send it there.';
  location.href = url;
});
