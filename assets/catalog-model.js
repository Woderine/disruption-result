(() => {
  'use strict';
  window.ResultCatalog = {
    fromPaths(paths, repository = '') {
      const images = [];
      const collections = new Map();
      for (const file of paths) {
        if (typeof file !== 'string' || !file.startsWith('results/') || file.split('/').some(p => p === '..' || p === '.')) continue;
        const parts = file.slice(8).split('/');
        const match = /^shot_(\d+)(?:_(.+))?\.(png|jpg|jpeg|webp)$/i.exec(parts.at(-1));
        if (!match) continue;
        const shot = match[1].replace(/^0+(?=\d)/, '');
        const legacy = ['cq_test_fast10', 'cq_test_slow10'].includes(parts[0]);
        const directory = parts.slice(0, -1);
        const id = legacy ? 'initial-cq/' + parts.slice(1, -1).join('/') : directory.join('/') || 'shared';
        const label = legacy && parts[1] === 'four_arms_full_time'
          ? 'Woderine · 四组全时间轴'
          : legacy ? 'Woderine · ' + parts.slice(1, -1).join(' / ') : directory.join(' / ') || '共享结果';
        collections.set(id, {id, label});
        const title = match[2] ? match[2].replace(/^_+/, '').replaceAll('_', ' ') : '结果图';
        images.push({path: file, shot, series: id, title});
      }
      images.sort((a, b) => a.path.localeCompare(b.path));
      return {repository, series: [...collections.values()].sort((a, b) => a.id.localeCompare(b.id)), images};
    }
  };
})();
