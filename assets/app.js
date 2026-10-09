(async () => {
  'use strict';
  const data = window.RESULTS_DATA;
  // Pages rebuilds this catalog from uploaded images; data.js supports offline use.
  if (data && location.protocol !== 'file:') {
    try {
      const response = await fetch('catalog.json', {cache: 'no-cache'});
      if (!response.ok) throw new Error('Image catalog unavailable');
      const paths = await response.json();
      const series = new Map();
      const images = [];
      const views = {four_arms_full_time: '四组对照 · 全时间轴', sigma_three_arms: '三组对照 · 均值与尺度'};
      for (const file of paths) {
        if (typeof file !== 'string' || !file.startsWith('results/') || file.split('/').some(p => p === '..' || p === '.')) continue;
        const parts = file.slice(8).split('/');
        const match = /^shot_(\d+)\.(png|jpg|jpeg|webp)$/i.exec(parts.at(-1));
        if (!match) continue;
        const gi = parts.findIndex(p => ['cq_test_fast10', 'cq_test_slow10', 'fast10', 'slow10'].includes(p));
        const group = gi < 0 ? 'other' : parts[gi].includes('fast') ? 'fast' : 'slow';
        const prefix = gi < 0 ? parts.slice(0, -1) : parts.slice(0, gi);
        const view = gi < 0 ? 'results' : parts.slice(gi + 1, -1).join('/') || 'results';
        const id = `${prefix.join('/') || 'initial-cq'}/${view}`;
        const label = (prefix.length ? prefix.join(' / ') + ' · ' : '') + (views[view] || view.replaceAll('_', ' '));
        series.set(id, {id, label});
        images.push({path: file, shot: match[1], group, series: id});
      }
      if (images.length) {data.images = images; data.series = [...series.values()].sort((a, b) => a.id.localeCompare(b.id));}
    } catch { /* Fall back to the verified offline manifest. */ }
  }
  const gallery = document.getElementById('gallery');
  if (!data || !data.series.length) {
    document.getElementById('empty').hidden = false;
    document.getElementById('empty').textContent = '图集尚未生成。请运行 tools/build_gallery.py。';
    return;
  }
  const a = document.getElementById('series-a');
  const b = document.getElementById('series-b');
  const search = document.getElementById('search');
  const viewer = document.getElementById('viewer');
  const params = new URLSearchParams(location.hash.slice(1));
  const labels = {fast: '快速 CQ', slow: '慢速 CQ', other: '其他结果'};
  const seriesMap = new Map(data.series.map(s => [s.id, s]));
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  const safePath = p => p.split('/').map(encodeURIComponent).join('/');
  for (const s of data.series) {
    a.add(new Option(s.label, s.id));
    b.add(new Option(s.label, s.id));
  }
  if (seriesMap.has(params.get('a'))) a.value = params.get('a');
  if (seriesMap.has(params.get('b'))) b.value = params.get('b');
  search.value = params.get('shot') || '';
  const selectedGroup = params.get('group');
  if (['all', 'fast', 'slow', 'other'].includes(selectedGroup)) {
    document.querySelector(`input[name="group"][value="${selectedGroup}"]`).checked = true;
  }
  document.getElementById('other-group').hidden = !data.images.some(i => i.group === 'other');
  const stats = document.getElementById('stats');
  for (const [value, text] of [[new Set(data.images.map(i => i.shot)).size, '炮次'], [data.images.length, '张图片'], [data.series.length, '个图集']]) {
    const item = el('span'); item.append(el('strong', '', value), document.createTextNode(text)); stats.append(item);
  }
  if (data.repository) {
    const link = document.getElementById('repo-link');
    link.href = `https://github.com/${data.repository}`;
    link.target = '_blank'; link.rel = 'noopener';
  }
  function renderPanel(image, seriesId, shot) {
    const panel = el('div', 'panel');
    panel.append(el('p', 'panel-title', seriesMap.get(seriesId).label));
    if (!image) {panel.append(el('div', 'missing', '此图集尚未提供该炮结果')); return panel;}
    const button = el('button', 'image-button'); button.type = 'button';
    button.setAttribute('aria-label', `放大炮 ${shot} · ${seriesMap.get(seriesId).label}`);
    const img = el('img'); img.src = safePath(image.path); img.alt = `炮 ${shot}，${labels[image.group]}，${seriesMap.get(seriesId).label}`;
    img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('error', () => {
      button.replaceWith(el('p', 'image-error', '图片加载失败，请使用下方原图链接重试。'));
    }, {once: true});
    button.append(img);
    button.addEventListener('click', () => {
      document.getElementById('viewer-title').textContent = img.alt;
      const large = document.getElementById('viewer-image'); large.src = img.src; large.alt = img.alt;
      document.getElementById('original').href = img.src;
      viewer.showModal();
    });
    panel.append(button); return panel;
  }
  function render() {
    const group = document.querySelector('input[name="group"]:checked').value;
    const comparing = !!b.value;
    const requested = [...new Set([a.value, b.value].filter(Boolean))];
    const rows = new Map();
    for (const image of data.images) {
      if (!requested.includes(image.series) || (group !== 'all' && image.group !== group) || !image.shot.includes(search.value.trim())) continue;
      const key = `${image.group}:${image.shot}`;
      if (!rows.has(key)) rows.set(key, {shot: image.shot, group: image.group, images: new Map()});
      rows.get(key).images.set(image.series, image);
    }
    const sorted = [...rows.values()].sort((x, y) => Number(x.shot) - Number(y.shot) || x.group.localeCompare(y.group));
    gallery.replaceChildren(); gallery.classList.toggle('comparing', comparing);
    for (const row of sorted) {
      const card = el('article', 'card');
      const head = el('div', 'card-head'); head.append(el('h3', '', `炮 ${row.shot}`), el('span', 'badge', labels[row.group]));
      const panels = el('div', 'panels');
      panels.append(renderPanel(row.images.get(a.value), a.value, row.shot));
      if (comparing) panels.append(renderPanel(row.images.get(b.value), b.value, row.shot));
      const foot = el('div', 'card-foot');
      for (const [index, id] of requested.entries()) {
        const image = row.images.get(id); if (!image) continue;
        const link = el('a', '', comparing ? `打开${index ? '右' : '左'}侧原图 ↗` : '打开原图 ↗');
        link.href = safePath(image.path); link.target = '_blank'; link.rel = 'noopener'; foot.append(link);
      }
      card.append(head, panels, foot); gallery.append(card);
    }
    document.getElementById('empty').hidden = sorted.length > 0;
    document.getElementById('result-count').textContent = `${sorted.length} 炮 · ${comparing ? '并排比较' : '单图浏览'}`;
    const hash = new URLSearchParams({group, a: a.value});
    if (b.value) hash.set('b', b.value);
    if (search.value.trim()) hash.set('shot', search.value.trim());
    try {history.replaceState(null, '', `#${hash}`);} catch { /* Local file viewers may restrict history. */ }
  }
  [a, b, search].forEach(node => node.addEventListener('input', render));
  document.querySelectorAll('input[name="group"]').forEach(node => node.addEventListener('change', render));
  document.getElementById('close-viewer').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {if (event.target === viewer) viewer.close();});
  render();
})();
