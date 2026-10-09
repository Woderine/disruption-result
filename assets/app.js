(async () => {
  'use strict';
  let data = window.RESULTS_DATA;
  let shotGroups = data?.shotGroups || {};
  let viewers = data?.viewers || [];
  if (location.protocol !== 'file:') {
    try {
      const response = await fetch('catalog.json', {cache: 'no-cache'});
      if (!response.ok) throw new Error('Catalog unavailable');
      const paths = await response.json();
      data = window.ResultCatalog.fromPaths(paths, data ? data.repository : '');
    } catch { /* Retain the local manifest if the online catalog is unavailable. */ }
  }
  if (location.protocol !== 'file:') {
    try {
      const response = await fetch('shot-groups.json', {cache: 'no-cache'});
      if (!response.ok) throw new Error('Shot groups unavailable');
      const groups = await response.json();
      if (groups && typeof groups === 'object' && !Array.isArray(groups)) shotGroups = groups;
    } catch { /* Unlisted shots remain unclassified; retain the offline groups. */ }
  }
  if (location.protocol !== 'file:') {
    try {
      const response = await fetch('viewers.json', {cache: 'no-cache'});
      if (!response.ok) throw new Error('Viewers unavailable');
      const entries = await response.json();
      if (Array.isArray(entries)) viewers = entries;
    } catch { /* Keep the viewer links from the offline manifest. */ }
  }
  const groupLabels = {fast: '快炮', slow: '慢炮', unclassified: '未分类'};
  const groupOf = shot => ['fast', 'slow'].includes(shotGroups[shot]) ? shotGroups[shot] : 'unclassified';
  const gallery = document.getElementById('gallery');
  const empty = document.getElementById('empty');
  if (!data || !data.images.length) {
    empty.hidden = false;
    empty.textContent = '暂时没有按炮号命名的结果图片。';
    return;
  }
  const a = document.getElementById('series-a');
  const b = document.getElementById('series-b');
  const search = document.getElementById('search');
  const group = document.getElementById('shot-group');
  const viewer = document.getElementById('viewer');
  const params = new URLSearchParams(location.hash.slice(1));
  const seriesMap = new Map(data.series.map(s => [s.id, s]));
  const safePath = p => p.split('/').map(encodeURIComponent).join('/');
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  for (const s of data.series) {
    a.add(new Option(s.label, s.id));
    b.add(new Option(s.label, s.id));
  }
  if (params.get('a') === 'all' || seriesMap.has(params.get('a'))) a.value = params.get('a');
  if (params.get('b') === 'all' || seriesMap.has(params.get('b'))) b.value = params.get('b');
  search.value = params.get('shot') || '';
  if (['all', 'fast', 'slow', 'unclassified'].includes(params.get('group'))) group.value = params.get('group');
  const stats = document.getElementById('stats');
  for (const [value, text] of [[new Set(data.images.map(i => i.shot)).size, '炮次'], [data.images.length, '张图片'], [data.series.length, '个来源']]) {
    const item = el('span'); item.append(el('strong', '', value), document.createTextNode(text)); stats.append(item);
  }
  if (data.repository) {
    document.getElementById('repo-link').href = 'https://github.com/' + data.repository;
    document.getElementById('rules-link').href = 'https://github.com/' + data.repository + '/blob/main/UPLOAD_RULES.md';
  }
  const shots = new Map();
  for (const image of data.images) {
    if (!shots.has(image.shot)) shots.set(image.shot, []);
    shots.get(image.shot).push(image);
  }
  function imageLabel(image) {
    return seriesMap.get(image.series).label + ' · ' + image.title + ' (' + image.path.split('/').at(-1) + ')';
  }
  function panel(candidates, shot, side, preferred) {
    const container = el('section', 'panel');
    container.setAttribute('aria-label', '炮 ' + shot + ' · ' + side);
    container.append(el('p', 'panel-title', side));
    if (!candidates.length) {
      container.append(el('p', 'missing', '该来源没有炮 ' + shot + ' 的图片'));
      return container;
    }
    const selectorLabel = el('label', 'field image-choice', '选择此炮图片');
    const selector = el('select', 'image-select');
    selector.setAttribute('aria-label', '炮 ' + shot + ' · ' + side + '图片');
    for (const image of candidates) selector.add(new Option(imageLabel(image), image.path));
    if (preferred && candidates.some(i => i.path === preferred)) selector.value = preferred;
    selectorLabel.append(selector); container.append(selectorLabel);
    const imageArea = el('div');
    const original = el('a', 'original-link', '打开原图 ↗');
    original.target = '_blank'; original.rel = 'noopener';
    function showImage() {
      const image = candidates.find(i => i.path === selector.value);
      const button = el('button', 'image-button'); button.type = 'button';
      button.setAttribute('aria-label', '放大炮 ' + shot + ' · ' + imageLabel(image));
      const img = el('img');
      img.alt = '炮 ' + shot + ' · ' + imageLabel(image);
      img.decoding = 'async';
      img.src = safePath(image.path);
      img.addEventListener('error', () => button.replaceWith(el('p', 'image-error', '图片加载失败，请打开原图重试。')), {once: true});
      button.append(img);
      button.addEventListener('click', () => {
        document.getElementById('viewer-title').textContent = img.alt;
        const large = document.getElementById('viewer-image'); large.src = img.src; large.alt = img.alt;
        document.getElementById('original').href = img.src;
        viewer.showModal();
      });
      imageArea.replaceChildren(button); original.href = img.src;
    }
    selector.addEventListener('change', showImage);
    container.append(imageArea, original); showImage();
    return container;
  }
  function render() {
    const comparing = !!b.value;
    gallery.replaceChildren();
    const query = search.value.trim();
    const rows = [...shots.entries()].filter(([shot, images]) => {
      if (!shot.includes(query) || (group.value !== 'all' && groupOf(shot) !== group.value)) return false;
      return images.some(i => a.value === 'all' || i.series === a.value || (comparing && (b.value === 'all' || i.series === b.value)));
    }).sort(([x], [y]) => x.localeCompare(y, undefined, {numeric: true}));
    for (const [shot, images] of rows) {
      const left = images.filter(i => a.value === 'all' || i.series === a.value);
      const right = comparing ? images.filter(i => b.value === 'all' || i.series === b.value) : [];
      const details = el('details', 'shot-card');
      details.dataset.shot = shot;
      const summary = el('summary', 'shot-summary');
      summary.append(el('strong', '', '炮 ' + shot + ' · ' + groupLabels[groupOf(shot)]));
      const info = el('span', 'shot-info', images.length + ' 张图片 · ' + new Set(images.map(i => i.series)).size + ' 个来源');
      const action = el('span', 'expand-label', '点击展开');
      summary.append(info, action);
      const content = el('div', 'shot-content');
      details.append(summary, content);
      details.addEventListener('toggle', () => {
        action.textContent = details.open ? '收起' : '点击展开';
        if (!details.open) {content.replaceChildren(); return;}
        const panels = el('div', comparing ? 'panels comparing' : 'panels');
        const leftPreferred = left[0] ? left[0].path : '';
        const rightPreferred = (right.find(i => i.path !== leftPreferred) || right[0] || {}).path;
        panels.append(panel(left, shot, comparing ? '左侧结果' : '结果图片', leftPreferred));
        if (comparing) panels.append(panel(right, shot, '右侧结果', rightPreferred));
        const note = el('p', 'shot-note', '按炮号匹配；各图保留自己的布局、坐标轴和图例。');
        content.replaceChildren(panels, note);
        for (const item of viewers) {
          if (!Array.isArray(item.shots) || !item.shots.some(n => String(n) === shot) || !/^viewers\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/$/.test(item.path)) continue;
          const entry = el('p', 'shot-note');
          const link = el('a', '', '打开交互查看器：' + item.title);
          link.href = safePath(item.path) + '#shot=' + encodeURIComponent(shot);
          entry.append(link); content.append(entry);
        }
      });
      gallery.append(details);
    }
    empty.hidden = rows.length > 0;
    document.getElementById('result-count').textContent = rows.length + ' 炮 · 点击炮号查看' + (comparing ? '与比较' : '');
    const hash = new URLSearchParams({a: a.value});
    if (b.value) hash.set('b', b.value);
    if (query) hash.set('shot', query);
    if (group.value !== 'all') hash.set('group', group.value);
    try {history.replaceState(null, '', '#' + hash);} catch { /* Offline viewers may restrict history. */ }
  }
  [a, b, search, group].forEach(node => node.addEventListener('input', render));
  document.getElementById('collapse-all').addEventListener('click', () => {
    gallery.querySelectorAll('details[open]').forEach(d => {d.open = false;});
  });
  document.getElementById('close-viewer').addEventListener('click', () => {viewer.close(); document.getElementById('viewer-image').removeAttribute('src');});
  viewer.addEventListener('click', event => {if (event.target === viewer) viewer.close();});
  viewer.addEventListener('close', () => document.getElementById('viewer-image').removeAttribute('src'));
  render();
})();
