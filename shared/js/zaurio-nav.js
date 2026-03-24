(() => {
  const root = document.querySelector("[data-zaurio-nav]");
  const legacyTopMenu = document.querySelector(".topMenu");
  const active =
    (root && root.dataset.active) ||
    document.body.dataset.zaurioNav ||
    "";
  const ctaId =
    (root && root.dataset.ctaId) ||
    document.body.dataset.zaurioCtaId ||
    "";
  const ctaLabel =
    (root && root.dataset.ctaLabel) ||
    document.body.dataset.zaurioCtaLabel ||
    "";
  const ctaTitle =
    (root && root.dataset.ctaTitle) ||
    document.body.dataset.zaurioCtaTitle ||
    ctaLabel ||
    "";

  if (!root && !legacyTopMenu) return;

  const links = [
    {
      key: "home",
      href: "https://zaurio.es",
      label: "Inicio",
      icon: "/shared/assets/brand/favicon-32x32.png",
    },
    {
      key: "miercoles",
      href: "https://miercoles.zaurio.es",
      label: "Miercoles",
      icon: "/shared/assets/brand/miercoles.png",
    },
    {
      key: "secretos",
      href: "https://secretos.zaurio.es",
      label: "Secretos",
      icon: "/shared/assets/brand/confesion.png",
    },
    {
      key: "herramientas",
      href: "https://herramientas.zaurio.es",
      label: "Herramientas",
      icon: "/shared/assets/apps/toolbox.png",
    },
    {
      key: "juegos",
      href: "https://zaurio.es/#juegos",
      label: "Juegos",
      icon: "/shared/assets/apps/piggy.png",
      badge: "Soon",
      soon: true,
    },
  ];

  const cta = ctaId
    ? `
      <button id="${ctaId}" class="zaurio-nav-cta composeBtn" type="button" aria-label="${ctaTitle}" title="${ctaTitle}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
        </svg>
      </button>
    `
    : "";

  const renderRootNav = () => `
    <div class="zaurio-nav-shell">
      <nav class="zaurio-nav" aria-label="Navegacion global de Zaurio">
        <a class="zaurio-brand" href="https://zaurio.es" aria-label="Zaurio">
          <img class="zaurio-brand-mark" src="/shared/assets/brand/favicon-32x32.png" alt="Zaurio">
          <span class="zaurio-brand-text">
            <span class="zaurio-brand-title">Zaurio</span>
            <span class="zaurio-brand-subtitle">dramas, gameplays y caos con calendario propio</span>
          </span>
        </a>
        <div class="zaurio-nav-links">
          ${links
            .map((link) => {
              const classes = [
                "zaurio-nav-link",
                link.key === active ? "is-active" : "",
                link.soon ? "is-soon" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const badge = link.badge
                ? `<span class="zaurio-badge ${link.soon ? "soon" : ""}">${link.badge}</span>`
                : "";

              return `
                <a class="${classes}" href="${link.href}" ${link.soon ? 'aria-disabled="true"' : ""}>
                  <img class="zaurio-nav-icon" src="${link.icon}" alt="">
                  <span class="zaurio-nav-meta">
                    <span class="zaurio-nav-label">${link.label}</span>
                    ${badge}
                  </span>
                </a>
              `;
            })
            .join("")}
        </div>
        ${cta}
      </nav>
    </div>
  `;

  const renderLegacyNav = () => `
    <div class="menuLeft">
      <a class="menuLogoLink ${active === "home" ? "active" : ""}" href="https://zaurio.es" aria-label="Zaurio">
        <img class="menuLogo zaurio" src="/shared/assets/brand/favicon-32x32.png" alt="Zaurio">
      </a>
    </div>
    <div class="menuCenter">
      <a class="menuLogoLink ${active === "miercoles" ? "active" : ""}" href="https://miercoles.zaurio.es" aria-label="Miercoles">
        <img class="menuLogo miercoles" src="/shared/assets/brand/miercoles.png" alt="Miercoles">
      </a>
      <a class="menuLogoLink ${active === "secretos" ? "active" : ""}" href="https://secretos.zaurio.es" aria-label="Secretos">
        <img class="menuLogo confesion" src="/shared/assets/brand/confesion.png" alt="Secretos">
      </a>
      <a class="menuLogoLink ${active === "herramientas" ? "active" : ""}" href="https://herramientas.zaurio.es" aria-label="Herramientas">
        <img class="menuLogo herramientas" src="/shared/assets/apps/toolbox.png" alt="Herramientas">
      </a>
    </div>
    <div class="menuRight">
      ${cta}
    </div>
  `;

  if (root) {
    root.innerHTML = renderRootNav();
  }

  if (legacyTopMenu) {
    legacyTopMenu.innerHTML = renderLegacyNav();
  }
})();
