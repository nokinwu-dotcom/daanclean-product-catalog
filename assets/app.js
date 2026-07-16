const catalog = window.DAAN_CATALOG_DATA;
const state = {
  category: "",
  secondary: "",
  query: "",
};

const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");
const totalCount = document.getElementById("totalCount");
const activeFilter = document.getElementById("activeFilter");
const categoryMenu = document.getElementById("categoryMenu");
const secondarySelect = document.getElementById("secondarySelect");
const searchInput = document.getElementById("searchInput");
const resetFilters = document.getElementById("resetFilters");
const filterToggle = document.getElementById("filterToggle");
const filterbar = document.querySelector(".filterbar");

const quickFields = ["Net Weight", "Color", "Product Form"];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function categoryLabel(product) {
  return product.secondary ? `${product.primary} / ${product.secondary}` : product.primary;
}

function searchText(product) {
  return [
    product.sku,
    product.name,
    product.primary,
    product.secondary,
    ...Object.values(product.specs || {}),
  ].join(" ").toLowerCase();
}

function filteredProducts() {
  const query = state.query.trim().toLowerCase();
  return catalog.products.filter(product => {
    const categoryMatch = !state.category || product.primary === state.category;
    const secondaryMatch = !state.secondary || product.secondary === state.secondary;
    const queryMatch = !query || searchText(product).includes(query);
    return categoryMatch && secondaryMatch && queryMatch;
  });
}

function renderCategoryMenu() {
  const allActive = !state.category;
  const buttons = [
    `<button class="chip ${allActive ? "active" : ""}" type="button" data-category="">All <span>${catalog.productCount}</span></button>`,
    ...catalog.categories.map(category => {
      const active = state.category === category.name;
      return `<button class="chip ${active ? "active" : ""}" type="button" data-category="${escapeHtml(category.name)}">${escapeHtml(category.name)} <span>${category.count}</span></button>`;
    }),
  ];
  categoryMenu.innerHTML = buttons.join("");
  categoryMenu.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      state.secondary = "";
      render();
      filterbar.classList.remove("open");
      filterToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function renderSecondarySelect() {
  const category = catalog.categories.find(item => item.name === state.category);
  const children = category?.children || [];
  const disabled = !state.category || children.length === 0;
  secondarySelect.disabled = disabled;
  const allLabel = state.category ? `All in ${state.category}` : "All subcategories";
  secondarySelect.innerHTML = [
    `<option value="">${escapeHtml(allLabel)}</option>`,
    ...children.map(child => `<option value="${escapeHtml(child.name)}">${escapeHtml(child.name)} (${child.count})</option>`),
  ].join("");
  secondarySelect.value = state.secondary;
}

function specRows(product) {
  return catalog.fields
    .map(field => {
      const value = product.specs?.[field.label];
      if (!value) return "";
      return `<div class="spec-row"><b>${escapeHtml(field.label)}</b><span>${escapeHtml(value)}</span></div>`;
    })
    .join("");
}

function card(product) {
  const quickSpecs = quickFields
    .filter(key => product.specs?.[key])
    .map(key => `<span class="pill" title="${escapeHtml(product.specs[key])}">${escapeHtml(product.specs[key])}</span>`)
    .join("");
  const specs = specRows(product);
  const image = product.image
    ? `<img loading="lazy" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">`
    : `<span class="no-photo">No image</span>`;
  return `<article class="product-card">
    <div class="product-photo">${image}</div>
    <div class="product-body">
      <div class="sku">${escapeHtml(product.sku)}</div>
      <h2 class="product-name" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</h2>
      <div class="category-path">${escapeHtml(categoryLabel(product))}</div>
      <div class="quick-specs">${quickSpecs}</div>
      <details class="spec-details">
        <summary>Full specs</summary>
        <div class="spec-list">${specs || '<div class="spec-row"><b>Specs</b><span>To be confirmed</span></div>'}</div>
      </details>
    </div>
  </article>`;
}

function renderGrid(items) {
  grid.innerHTML = items.map(card).join("");
  grid.hidden = items.length === 0;
  emptyState.hidden = items.length !== 0;
}

function renderMeta(items) {
  const countLabel = `${items.length} ${items.length === 1 ? "product" : "products"}`;
  resultCount.textContent = countLabel;
  totalCount.textContent = `${catalog.productCount} products`;
  const parts = [];
  if (state.category) parts.push(state.category);
  if (state.secondary) parts.push(state.secondary);
  if (state.query.trim()) parts.push(`Search: ${state.query.trim()}`);
  activeFilter.textContent = parts.length ? parts.join(" / ") : "All categories";
}

function render() {
  renderCategoryMenu();
  renderSecondarySelect();
  const items = filteredProducts();
  renderMeta(items);
  renderGrid(items);
}

secondarySelect.addEventListener("change", () => {
  state.secondary = secondarySelect.value;
  render();
});

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  render();
});

resetFilters.addEventListener("click", () => {
  state.category = "";
  state.secondary = "";
  state.query = "";
  searchInput.value = "";
  render();
});

filterToggle.addEventListener("click", () => {
  const open = filterbar.classList.toggle("open");
  filterToggle.setAttribute("aria-expanded", String(open));
});

render();
