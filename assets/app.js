(function () {
  "use strict";

  const wiki = window.WIKI;
  const pageEntries = Object.entries(wiki.pages);
  const orderedIds = wiki.groups.flatMap(group => group.pages);
  const article = document.getElementById("article");
  const sideNav = document.getElementById("side-nav");
  const tocNav = document.getElementById("toc-nav");
  const footerNav = document.getElementById("footer-nav");
  const sidebar = document.getElementById("sidebar");
  const menuButton = document.getElementById("menu-button");
  const scrim = document.getElementById("scrim");
  const themeButton = document.getElementById("theme-button");
  const searchDialog = document.getElementById("search-dialog");
  const searchTrigger = document.getElementById("search-trigger");
  const searchClose = document.getElementById("search-close");
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const readingProgress = document.getElementById("reading-progress");

  const icons = {
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
    start: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
    features: '<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/>',
    reference: '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z"/><path d="M7 16h12M9 8h6M9 11h7"/>',
    admin: '<path d="M12 3 4.5 6v5c0 4.7 3 8.2 7.5 10 4.5-1.8 7.5-5.3 7.5-10V6L12 3Z"/><path d="m9 12 2 2 4-5"/>'
  };

  function routeInfo() {
    const raw = (location.hash || "#/").slice(1);
    const [pathRaw, query = ""] = raw.split("?");
    const path = normalizePath(pathRaw || "/");
    const params = new URLSearchParams(query);
    return { path, section: params.get("section") || "" };
  }

  function normalizePath(path) {
    if (!path.startsWith("/")) path = "/" + path;
    if (path.length > 1) path = path.replace(/\/+$/, "");
    return path;
  }

  function pageForPath(path) {
    return pageEntries.find(([, page]) => page.path === path) || ["home", wiki.pages.home];
  }

  function navIcon(name) {
    return `<span class="nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg></span>`;
  }

  function renderSidebar(activeId) {
    sideNav.innerHTML = wiki.groups.map(group => `
      <div class="nav-group">
        <span class="nav-label">${group.label}</span>
        ${group.pages.map(id => {
          const page = wiki.pages[id];
          return `<a class="nav-link${id === activeId ? " active" : ""}" href="#${page.path}">
            ${navIcon(group.icon)}<span>${page.nav}</span>
          </a>`;
        }).join("")}
      </div>
    `).join("");
  }

  function makeHeadingAnchors(pagePath) {
    article.querySelectorAll("h2[id], h3[id]").forEach(heading => {
      if (heading.querySelector(".anchor")) return;
      const anchor = document.createElement("a");
      anchor.className = "anchor";
      anchor.href = `#${pagePath}?section=${encodeURIComponent(heading.id)}`;
      anchor.setAttribute("aria-label", `Link to ${heading.textContent}`);
      anchor.textContent = "#";
      heading.appendChild(anchor);
    });
  }

  function renderToc(pagePath) {
    const headings = [...article.querySelectorAll("h2[id], h3[id]")];
    tocNav.innerHTML = headings.map(heading => `
      <a class="depth-${heading.tagName === "H3" ? 3 : 2}" href="#${pagePath}?section=${encodeURIComponent(heading.id)}" data-section="${heading.id}">${heading.childNodes[0].textContent.trim()}</a>
    `).join("");
    observeHeadings(headings);
  }

  let headingObserver;
  function observeHeadings(headings) {
    if (headingObserver) headingObserver.disconnect();
    if (!("IntersectionObserver" in window) || !headings.length) return;
    headingObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      tocNav.querySelectorAll("a").forEach(link => link.classList.toggle("active", link.dataset.section === visible[0].target.id));
    }, { rootMargin: "-80px 0px -72%", threshold: [0, 1] });
    headings.forEach(heading => headingObserver.observe(heading));
  }

  function renderFooter(activeId) {
    const index = orderedIds.indexOf(activeId);
    const previous = index > 0 ? wiki.pages[orderedIds[index - 1]] : null;
    const next = index < orderedIds.length - 1 ? wiki.pages[orderedIds[index + 1]] : null;
    footerNav.innerHTML = `
      ${previous ? `<a class="footer-link" href="#${previous.path}"><small>← Previous</small><strong>${previous.nav}</strong></a>` : "<span></span>"}
      ${next ? `<a class="footer-link next" href="#${next.path}"><small>Next →</small><strong>${next.nav}</strong></a>` : "<span></span>"}
    `;
  }

  function renderPage() {
    const route = routeInfo();
    const [id, page] = pageForPath(route.path);
    document.title = `${page.title} — Tide Team Journal Wiki`;
    document.querySelector('meta[name="description"]').setAttribute("content", page.description);
    article.innerHTML = page.body;
    renderSidebar(id);
    makeHeadingAnchors(page.path);
    renderToc(page.path);
    renderFooter(id);
    closeNavigation();

    requestAnimationFrame(() => {
      if (route.section) {
        const target = document.getElementById(route.section);
        if (target) target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      updateProgress();
    });
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function openNavigation() {
    document.body.classList.add("nav-open");
    menuButton.setAttribute("aria-expanded", "true");
  }

  function closeNavigation() {
    document.body.classList.remove("nav-open");
    menuButton.setAttribute("aria-expanded", "false");
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("ttj-wiki-theme", theme);
  }

  function initializeTheme() {
    const saved = localStorage.getItem("ttj-wiki-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(saved || preferred);
  }

  function openSearch() {
    if (!searchDialog.open) searchDialog.showModal();
    searchInput.value = "";
    showSearchPrompt();
    requestAnimationFrame(() => searchInput.focus());
  }

  function closeSearch() {
    if (searchDialog.open) searchDialog.close();
  }

  function stripHtml(html) {
    const node = document.createElement("div");
    node.innerHTML = html;
    return node.textContent.replace(/\s+/g, " ").trim();
  }

  const searchIndex = pageEntries.map(([id, page]) => ({
    id,
    page,
    text: `${page.title} ${page.nav} ${page.description} ${page.keywords || ""} ${stripHtml(page.body)}`.toLowerCase(),
    plain: stripHtml(page.body)
  }));

  function showSearchPrompt() {
    searchResults.innerHTML = `<div class="search-hint">Type to search all ${searchIndex.length} pages. Press <strong>Enter</strong> to open the first result.</div>`;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function highlight(value, terms) {
    let safe = escapeHtml(value);
    terms.forEach(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      safe = safe.replace(new RegExp(`(${escaped})`, "ig"), "<mark>$1</mark>");
    });
    return safe;
  }

  function snippetFor(item, terms) {
    const lower = item.plain.toLowerCase();
    const position = Math.max(0, ...terms.map(term => lower.indexOf(term)).filter(index => index >= 0));
    const start = Math.max(0, position - 70);
    const end = Math.min(item.plain.length, start + 190);
    return `${start > 0 ? "…" : ""}${item.plain.slice(start, end)}${end < item.plain.length ? "…" : ""}`;
  }

  function runSearch() {
    const query = searchInput.value.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    if (!terms.length) return showSearchPrompt();
    const matches = searchIndex
      .filter(item => terms.every(term => item.text.includes(term)))
      .sort((a, b) => scoreSearch(b, terms) - scoreSearch(a, terms))
      .slice(0, 12);
    if (!matches.length) {
      searchResults.innerHTML = `<div class="search-empty">No pages matched <strong>${escapeHtml(query)}</strong>.<br>Try a command, setting name, or feature.</div>`;
      return;
    }
    searchResults.innerHTML = matches.map((item, index) => `
      <a class="search-result${index === 0 ? " selected" : ""}" href="#${item.page.path}">
        <strong>${highlight(item.page.title, terms)}</strong>
        <span>${highlight(snippetFor(item, terms), terms)}</span>
      </a>
    `).join("");
  }

  function scoreSearch(item, terms) {
    const title = item.page.title.toLowerCase();
    return terms.reduce((score, term) => score + (title.includes(term) ? 8 : 0) + (item.page.keywords?.includes(term) ? 3 : 0), 0);
  }

  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    readingProgress.style.width = `${max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0}%`;
  }

  menuButton.addEventListener("click", () => document.body.classList.contains("nav-open") ? closeNavigation() : openNavigation());
  scrim.addEventListener("click", closeNavigation);
  themeButton.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  searchTrigger.addEventListener("click", openSearch);
  searchClose.addEventListener("click", closeSearch);
  searchInput.addEventListener("input", runSearch);
  searchResults.addEventListener("click", event => { if (event.target.closest("a")) closeSearch(); });
  searchDialog.addEventListener("click", event => { if (event.target === searchDialog) closeSearch(); });
  searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      const first = searchResults.querySelector("a");
      if (first) { event.preventDefault(); location.hash = first.getAttribute("href"); closeSearch(); }
    }
  });
  document.addEventListener("keydown", event => {
    const typing = /input|textarea|select/i.test(document.activeElement?.tagName || "");
    if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); openSearch(); }
    if (event.key === "Escape") { closeNavigation(); closeSearch(); }
  });
  window.addEventListener("hashchange", renderPage);
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", () => { if (innerWidth > 850) closeNavigation(); });

  initializeTheme();
  renderPage();
})();
