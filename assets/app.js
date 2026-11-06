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
const factorySection = document.getElementById("factoryStrength");

const quickFields = ["Net Weight", "Color", "Product Form"];

// Display headings only. The full source names remain in the model rows and search.
const toolSeriesNames = {
  "DA-T-SH-9": "Mirror Light Shoe Horn",
  "DA-T-SH-10": "Black Shoehorn",
  "DA-T-SH-11": "Mirror Light X Leather Case",
  "DA-T-SH-12": "Black X Leather Case",
  "DA-T-SH-13": "Exploding Gold Shoehorn",
  "DA-T-SH-14": "Beechwood Shoe Horn",
  "DA-T-SH-15": "Hemu Wood Shoe Horn",
  "DA-T-SH-16": "Beech Shoehorn",
  "DA-T-SB-60": "Square Beech Brush",
  "DA-T-SB-61": "Beech Horse Brush 122",
  "DA-T-SB-62": "270 Sweater Brush",
};

function hasSpecification(value) {
  return value != null && String(value).trim() !== "" && !/^[\s/]+$/.test(String(value));
}

function toolModels(product) {
  // The source puts A-104 and A-105 on one line; split at the explicit model code.
  return product.name.replace(/\b(A-\d+)\s+(?=[A-Z])/g, "$1\n")
    .split(/\r?\n/).map(name => name.trim()).filter(Boolean);
}

function toolVariants(product) {
  const models = toolModels(product);
  const fields = catalog.fields.filter(field => hasSpecification(product.specs?.[field.label]));
  const columns = fields.map(field => {
    // Empty source lines are positions, not separators to discard.
    const values = String(product.specs[field.label]).split(/\r?\n/).map(value => value.trim());
    return { label: field.label, values, aligned: values.length === models.length };
  });
  return {
    columns,
    unresolved: columns.filter(column => !column.aligned),
    rows: models.map((name, index) => ({
      name,
      values: columns.map(column => column.aligned && hasSpecification(column.values[index])
        ? column.values[index] : null),
    })),
  };
}

function variantValue(value) {
  return value == null ? '<span class="variant-pending">To be confirmed</span>' : escapeHtml(value);
}

function variantSpecifications(product) {
  const { columns, rows, unresolved } = toolVariants(product);
  const labels = columns.length ? columns.map(column => column.label) : ["Specifications"];
  const rowValues = row => columns.length ? row.values : [null];
  const pendingNote = unresolved.length ? `<p class="variant-note">${escapeHtml(unresolved.map(column => column.label).join(", "))} by model: to be confirmed.</p>` : "";
  return `<details class="tool-variants">
    <summary class="variant-summary"><span>Model specifications</span><span class="variant-summary-count">${rows.length} models</span></summary>
    <div class="variant-body">
    ${pendingNote}
    <table class="variant-table" aria-label="${escapeHtml(product.sku)} model specifications">
      <thead><tr><th scope="col">Model</th>${labels.map(label => `<th scope="col">${escapeHtml(label)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(row => `<tr><th scope="row">${escapeHtml(row.name)}</th>${rowValues(row).map(value => `<td>${variantValue(value)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    <div class="variant-cards">${rows.map(row => `<section class="variant-card"><h4>${escapeHtml(row.name)}</h4><dl>${rowValues(row).map((value, index) => `<div><dt>${escapeHtml(labels[index])}</dt><dd>${variantValue(value)}</dd></div>`).join("")}</dl></section>`).join("")}</div>
    </div>
  </details>`;
}

function productImage(product, title, tool = false) {
  const base = `assets/products-web-20261104/${product.sku}`;
  const sizes = tool ? '(max-width: 680px) 240px, 200px' : '(max-width: 680px) calc(100vw - 56px), (max-width: 900px) 40vw, 300px';
  return `<img loading="eager" decoding="async" width="720" height="720" src="${escapeHtml(base)}-720.webp" srcset="${escapeHtml(base)}-360.webp 360w, ${escapeHtml(base)}-720.webp 720w" sizes="${sizes}" data-fallback-src="${escapeHtml(product.image)}" alt="${escapeHtml(title)}">`;
}

function toolCard(product) {
  const models = toolModels(product);
  const isSeries = models.length > 1;
  const title = toolSeriesNames[product.sku] || product.name;
  const specs = catalog.fields.filter(field => hasSpecification(product.specs?.[field.label]));
  const specificationDetails = specs.length ? `<details class="tool-details">
    <summary>Specifications</summary>
    <dl class="tool-specs">${specs.map(field => `<div><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(product.specs[field.label])}</dd></div>`).join("")}</dl>
    </details>` : `<p class="tool-specs-pending">Specifications to be confirmed.</p>`;
  return `<article class="product-card tool-card ${isSeries ? "tool-card--series" : "tool-card--single"}" data-sku="${escapeHtml(product.sku)}">
    <div class="tool-photo">${productImage(product, title, true)}</div>
    <div class="tool-content">
      <div class="tool-meta"><span class="sku">${escapeHtml(product.sku)}</span><span>${isSeries ? `${models.length} models` : escapeHtml(product.secondary)}</span></div>
      <h3 class="tool-title">${escapeHtml(title)}</h3>
      ${isSeries ? `<p class="tool-series-description">${escapeHtml(product.secondary)} collection</p>` : specificationDetails}
    </div>
    ${isSeries ? variantSpecifications(product) : ""}
  </article>`;
}

function toolsCollection(products) {
  return `<section class="tools-collection" aria-labelledby="toolsHeading">
    <header class="tools-heading"><h2 id="toolsHeading">Cleaning and Care Tools</h2><p>Shoe horns and brushes</p></header>
    <div class="tools-grid">${products.map(toolCard).join("")}</div>
  </section>`;
}

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
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  });
  categoryMenu.querySelector(".factory-chip")?.addEventListener("click", () => {
    state.category = "";
    state.query = "";
    searchInput.value = "";
    render();
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
    ? productImage(product, product.name)
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
  const tools = items.filter(product => product.primary === "Cleaning and Care Tools");
  const standard = items.filter(product => product.primary !== "Cleaning and Care Tools");
  grid.innerHTML = standard.map(card).join("") + (tools.length ? toolsCollection(tools) : "");
  grid.hidden = items.length === 0;
  emptyState.hidden = items.length !== 0;
  grid.querySelectorAll("img[data-fallback-src]").forEach(image => {
    const useOriginal = () => {
      const original = image.dataset.fallbackSrc;
      if (!original) return;
      delete image.dataset.fallbackSrc;
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
      image.src = original;
    };
    image.addEventListener("error", useOriginal, { once: true });
    if (image.complete && !image.naturalWidth) useOriginal();
  });
}

function renderMeta(items) {
  totalCount.textContent = `${items.length} ${items.length === 1 ? "product" : "products"}`;
}

function render() {
  factorySection.hidden = Boolean(state.category || state.query.trim());
  renderCategoryMenu();
  const items = filteredProducts();
  renderMeta(items);
  renderGrid(items);
}

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
});

filterToggle.addEventListener("click", () => {
  const open = filterbar.classList.toggle("open");
  filterToggle.setAttribute("aria-expanded", String(open));
});

render();
