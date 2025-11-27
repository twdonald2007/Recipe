// ./js/recipe.js
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ===== 設定 =====
  const DEFAULT_DATA_URL = 'https://twdonald2007.github.io/test1/json/data.json'; // 從本地 data.json 讀取

  // ===== DOM =====
  const $content = document.getElementById('content');
  const $btnPrev = document.getElementById('btnPrev');
  const $btnNext = document.getElementById('btnNext');
  const $pageInfo = document.getElementById('pageInfo');
  const $toc = document.getElementById('toc');

  if (!$content || !$btnPrev || !$btnNext || !$pageInfo || !$toc) {
    console.warn('[recipe.js] HTML 缺少必要元素。');
    return;
  }

  // ===== 狀態 =====
  let PAGES = [];
  let pageIndex = 0;

  // ===== 工具 =====
  const qs = new URLSearchParams(window.location.search);
  const dataUrl = qs.get('data') || DEFAULT_DATA_URL;

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function updateButtons() {
    $btnPrev.disabled = (pageIndex <= 0);
    $btnNext.disabled = (pageIndex >= PAGES.length - 1);

    $pageInfo.textContent =
      PAGES.length ? `第 ${pageIndex + 1} / ${PAGES.length} 頁` : '0 / 0 頁';

    // 更新 TOC 樣式
    const buttons = $toc.querySelectorAll('button[data-i]');
    buttons.forEach((b, i) => {
      if (i === pageIndex) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }

  function renderItem(it) {
    const step = it.step
      ? `<div class="item-step">步驟：${escapeHtml(it.step)}</div>`
      : '';
    const narr = it.narrate
      ? `<div class="item-narr">說白：${escapeHtml(it.narrate)}</div>`
      : '';
    return `<div class="item">${step}${narr}</div>`;
  }

  function renderPage(idx) {
    if (!PAGES.length) {
      $content.innerHTML = '<div class="item">尚無資料</div>';
      updateButtons();
      return;
    }

    pageIndex = clamp(idx, 0, PAGES.length - 1);
    const items = PAGES[pageIndex] || [];

    $content.innerHTML = items.map(renderItem).join('');
    updateButtons();

    window.location.hash = `#p=${pageIndex + 1}`;
  }

  function renderTOC() {
    if (!PAGES.length) {
      $toc.innerHTML = '';
      return;
    }

    $toc.innerHTML = PAGES
      .map((_, i) => `<button type="button" data-i="${i}">${i + 1}</button>`)
      .join('');
  }

  // ===== 控制事件 =====
  $btnPrev.addEventListener('click', () => renderPage(pageIndex - 1));
  $btnNext.addEventListener('click', () => renderPage(pageIndex + 1));

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') renderPage(pageIndex - 1);
    if (e.key === 'ArrowRight') renderPage(pageIndex + 1);
  });

  // ===== 初始化 =====
  (async function bootstrap() {
    try {
      const resp = await fetch(dataUrl, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      if (!Array.isArray(json))
        throw new Error('JSON 格式錯誤：頂層必須是陣列');

      PAGES = json;
    } catch (err) {
      console.error('[recipe.js] 無法讀取 JSON：', err);
      PAGES = []; // 沒資料 → 不放 fallback
    }

    renderTOC();

    const m = window.location.hash.match(/#p=(\d+)/);
    const start = m ? Math.max(1, parseInt(m[1], 10)) - 1 : 0;

    renderPage(start);
  })();
});
