const catalog = window.DAAN_CATALOG_DATA;
const state = {
  category: "",
  query: "",
};

const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const totalCount = document.getElementById("totalCount");
const categoryMenu = document.getElementById("categoryMenu");
const searchInput = document.getElementById("searchInput");
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
    const queryMatch = !query || searchText(product).includes(query);
    return categoryMatch && queryMatch;
  });
}

function renderCategoryMenu() {
  const allActive = !state.category;
  const buttons = [
    `<button class="chip ${allActive ? "active" : ""}" type="button" data-category="">All <span>${catalog.productCount}</span></button>`,
    `<a class="chip factory-chip" href="#factoryStrength">Factory Strength</a>`,
    ...catalog.categories.map(category => {
      const active = state.category === category.name;
      return `<button class="chip ${active ? "active" : ""}" type="button" data-category="${escapeHtml(category.name)}">${escapeHtml(category.name)} <span>${category.count}</span></button>`;
    }),
  ];
  categoryMenu.innerHTML = buttons.join("");
  categoryMenu.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      render();
      filterbar.classList.remove("open");
      filterToggle.setAttribute("aria-expanded", "false");
    });
  });
  categoryMenu.querySelector(".factory-chip")?.addEventListener("click", () => {
    filterbar.classList.remove("open");
    filterToggle.setAttribute("aria-expanded", "false");
  });
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
  totalCount.textContent = `${items.length} ${items.length === 1 ? "product" : "products"}`;
}

function render() {
  renderCategoryMenu();
  const items = filteredProducts();
  renderMeta(items);
  renderGrid(items);
}

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  render();
});

filterToggle.addEventListener("click", () => {
  const open = filterbar.classList.toggle("open");
  filterToggle.setAttribute("aria-expanded", String(open));
});

render();
