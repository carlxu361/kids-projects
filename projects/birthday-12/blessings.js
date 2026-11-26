(() => {
  const dialog = document.querySelector('#blessings');
  const form = dialog.querySelector('#blessings-form');
  const status = dialog.querySelector('#blessings-status');
  const list = dialog.querySelector('#blessings-list');
  const review = dialog.querySelector('#blessings-review');
  const endpoint = '/birthday/blessings';

  async function request(fields) {
    const response = await fetch(endpoint, fields ? {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    } : { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '暂时无法连接祝福页，请稍后再试。');
    return data;
  }

  function entry({ name, message }) {
    const item = document.createElement('li');
    const author = document.createElement('strong');
    const text = document.createElement('p');
    author.textContent = name;
    text.textContent = message;
    item.append(author, text);
    return item;
  }

  async function refresh() {
    const { messages, pending } = await request();
    list.replaceChildren(...messages.map(entry));
    dialog.querySelector('#blessings-empty').hidden = messages.length > 0;
    const pendingList = review.querySelector('ul');
    pendingList.replaceChildren();
    review.hidden = !Array.isArray(pending);
    dialog.querySelector('#blessings-moderator').hidden = !review.hidden;
    for (const message of pending || []) {
      const item = entry(message);
      for (const [action, label] of [['approve', '批准并公开'], ['reject', '拒绝']]) {
        const control = document.createElement('button');
        control.type = 'button';
        control.textContent = label;
        control.addEventListener('click', async () => {
          const controls = item.querySelectorAll('button');
          for (const button of controls) button.disabled = true;
          try {
            await request({ id: message.id, action });
            await refresh();
            status.textContent = action === 'approve' ? '祝福已公开。' : '已拒绝这条祝福。';
          } catch (error) {
            status.textContent = error.message;
            for (const button of controls) button.disabled = false;
          }
        });
        item.append(control);
      }
      pendingList.append(item);
    }
    review.querySelector('p').hidden = Boolean(pending?.length);
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('[data-open-blessings]')) return;
    status.textContent = '';
    dialog.showModal();
    refresh().catch(error => { status.textContent = error.message; });
  });
  const login = dialog.querySelector('#blessings-login');
  login.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = login.querySelector('button');
    submit.disabled = true;
    try {
      const response = await fetch('/birthday/blessings-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(login))),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      login.reset();
      await refresh();
      status.textContent = data.message;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('button');
    const values = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    status.textContent = '正在送出祝福…';
    try {
      await request(values);
      form.reset();
      status.textContent = '祝福已送到，家长审核后会显示在这里。';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
})();
