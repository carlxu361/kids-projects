(() => {
  let entry;
  let count;
  let nextRefresh;
  let refreshId = 0;

  function linkFor(card) {
    const link = document.createElement('a');
    link.href = '/birthday';
    if (card.display === 'banner') {
      link.className = 'birthday-banner';
      const message = document.createElement('span');
      message.textContent = '🎂 祝橙子 12 岁生日快乐！点击进入生日庆祝页';
      link.append(message);
      return link;
    }
    link.className = 'project-card';
    link.setAttribute('aria-label', card.title);
    const icon = document.createElement('span');
    icon.className = 'project-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '🎂';
    const meta = document.createElement('span');
    meta.className = 'project-meta';
    meta.textContent = '游戏 · 20 · 更新于 ' + card.date;
    const title = document.createElement('h3');
    title.textContent = card.title;
    const description = document.createElement('p');
    description.textContent = card.description;
    link.append(icon, meta, title, description);
    return link;
  }

  async function refresh() {
    const current = ++refreshId;
    clearTimeout(nextRefresh);
    try {
      const response = await fetch('/birthday/card', { cache: 'no-store' });
      const card = await response.json();
      if (current !== refreshId) return;
      const destination = card.display === 'banner' ? document.body
        : document.querySelector('[aria-labelledby="category-游戏"] .project-grid');
      if (response.ok && destination && entry?.className === (card.display === 'banner' ? 'birthday-banner' : 'project-card')) return;
      if (entry?.className === 'project-card' && count) count.textContent = String(Number(count.textContent) - 1);
      entry?.remove();
      entry = undefined;
      if (!response.ok || !destination) return;
      entry = linkFor(card);
      if (card.display === 'banner') {
        destination.prepend(entry);
      } else {
        destination.append(entry);
        count = document.querySelector('.stats .stat strong');
        if (count) count.textContent = String(Number(count.textContent) + 1);
      }
    } catch {
      // The other portfolio links remain available during a temporary connection failure.
    } finally {
      if (current === refreshId) {
        const day = 86_400_000;
        const hongKongNow = Date.now() + 8 * 3_600_000;
        nextRefresh = setTimeout(refresh, day - hongKongNow % day + 1000);
      }
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
  refresh();
})();
