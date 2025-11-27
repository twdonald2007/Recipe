'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const dataUrl = './json/budget_recipes.json';

  // DOM
  const $budgetForm = document.getElementById('budgetForm');
  const $budgetInput = document.getElementById('budgetInput');
  const $resultList = document.getElementById('resultList');
  const $resultCount = document.getElementById('resultCount');
  const $totalCount = document.getElementById('totalCount');
  const $recipeDetail = document.getElementById('recipeDetail');
  const $selectionMeta = document.getElementById('selectionMeta');
  const $writeBtn = document.getElementById('writeBtn');
  const $jsonOutput = document.getElementById('jsonOutput');
  const $downloadLink = document.getElementById('downloadLink');

  let allRecipes = [];
  let filtered = [];
  let selected = null;
  let downloadUrl = '';

  function clearDownload() {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = '';
    $downloadLink.setAttribute('aria-disabled', 'true');
    $downloadLink.href = '#';
  }

  function formatMeta(recipe) {
    return `預算 ${recipe.budget} 元 · ${recipe.duration} 分鐘 · ${recipe.servings} 人份 · ${recipe.category}`;
  }

  function renderList(list) {
    $resultList.innerHTML = '';
    list.forEach((recipe) => {
      const card = document.createElement('article');
      card.className = 'result-card';
      card.setAttribute('role', 'listitem');

      const title = document.createElement('h3');
      title.className = 'result-card__title';
      title.textContent = recipe.title;

      const meta = document.createElement('div');
      meta.className = 'result-card__meta';
      meta.textContent = formatMeta(recipe);

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '選擇食譜';
      button.addEventListener('click', () => selectRecipe(recipe));

      card.append(title, meta, button);
      $resultList.appendChild(card);
    });

    $resultCount.textContent = list.length;
  }

  function renderDetail(recipe) {
    if (!recipe) {
      $recipeDetail.innerHTML = '<p class="muted">輸入預算後，從左側列表挑一份吧。</p>';
      $selectionMeta.textContent = '請先選擇食譜';
      $writeBtn.disabled = true;
      clearDownload();
      $jsonOutput.textContent = '[]';
      return;
    }

    $selectionMeta.textContent = formatMeta(recipe);
    $writeBtn.disabled = false;

    const ingredientList = recipe.ingredients.map((i) => `<li>${i}</li>`).join('');
    const stepList = recipe.steps.map((s, idx) => `<li><strong>步驟 ${idx + 1}：</strong>${s}</li>`).join('');

    $recipeDetail.innerHTML = `
      <div>
        <h3>${recipe.title}</h3>
        <div class="badge-row">
          <span class="tag">預算 ${recipe.budget} 元/份</span>
          <span class="tag">${recipe.duration} 分鐘</span>
          <span class="tag">${recipe.servings} 人份</span>
          <span class="tag">${recipe.category}</span>
        </div>
      </div>
      <div>
        <h4>食材</h4>
        <ul class="list">${ingredientList}</ul>
      </div>
      <div>
        <h4>步驟</h4>
        <ol class="list">${stepList}</ol>
      </div>
      <p class="muted">${recipe.tip}</p>
    `;

    const data = buildDataJson(recipe);
    updateJsonPreview(data);
  }

  function chunk(arr, size) {
    const output = [];
    for (let i = 0; i < arr.length; i += size) {
      output.push(arr.slice(i, i + size));
    }
    return output;
  }

  function buildDataJson(recipe) {
    const pages = [];
    pages.push([
      {
        step: '食材清單',
        narrate: recipe.ingredients.join('、')
      },
      {
        step: '預算與份量',
        narrate: `單份約 ${recipe.budget} 元，${recipe.servings} 人份，約 ${recipe.duration} 分鐘。`
      }
    ]);

    const stepPages = chunk(recipe.steps, 2).map((group, pageIndex) =>
      group.map((text, idx) => ({
        step: `步驟 ${pageIndex * 2 + idx + 1}：${text}`,
        narrate: recipe.tip
      }))
    );

    return pages.concat(stepPages);
  }

  function updateJsonPreview(data) {
    $jsonOutput.textContent = JSON.stringify(data, null, 2);
    clearDownload();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadUrl = URL.createObjectURL(blob);
    $downloadLink.href = downloadUrl;
    $downloadLink.setAttribute('aria-disabled', 'false');
  }

  function selectRecipe(recipe) {
    selected = recipe;
    renderDetail(recipe);
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    const budget = parseInt($budgetInput.value, 10);
    if (!Number.isFinite(budget) || budget <= 0) return;

    filtered = allRecipes
      .filter((r) => r.budget <= budget)
      .sort((a, b) => a.budget - b.budget || a.duration - b.duration)
      .slice(0, 20);

    renderList(filtered);
    selectRecipe(filtered[0] || null);
  }

  async function bootstrap() {
    try {
      const resp = await fetch(dataUrl, { cache: 'no-store' });
      if (!resp.ok) throw new Error(resp.statusText);
      allRecipes = await resp.json();
    } catch (err) {
      console.error('[budget] 無法載入預算食譜：', err);
      allRecipes = [];
    }

    $totalCount.textContent = allRecipes.length;
    renderList([]);
  }

  $budgetForm?.addEventListener('submit', handleSubmit);
  $writeBtn?.addEventListener('click', () => {
    if (!selected) return;
    const data = buildDataJson(selected);
    updateJsonPreview(data);
    alert('已將此食譜內容轉成 data.json，點擊「下載 data.json」即可保存。');
  });

  bootstrap();
});
