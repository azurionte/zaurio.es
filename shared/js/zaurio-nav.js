(() => {
  const root = document.querySelector("div[data-zaurio-nav]");
  const legacyTopMenu = root ? null : document.querySelector(".topMenu");
  const active =
    (root && root.dataset.active) ||
    document.body.dataset.zaurioNav ||
    "";
  const ctaId =
    (root && root.dataset.ctaId) ||
    document.body.dataset.zaurioCtaId ||
    "";
  const ctaTitle =
    (root && root.dataset.ctaTitle) ||
    document.body.dataset.zaurioCtaTitle ||
    "";

  if (!root && !legacyTopMenu) return;

  const topLevelItems = [
    {
      type: "link",
      key: "miercoles",
      href: "https://miercoles.zaurio.es",
      label: "Miercoles",
      icon: "/shared/assets/brand/miercoles.png",
    },
    {
      type: "link",
      key: "secretos",
      href: "https://secretos.zaurio.es",
      label: "Secretos",
      icon: "/shared/assets/brand/confesion.png",
    },
    {
      type: "menu",
      key: "herramientas",
      href: "https://herramientas.zaurio.es",
      label: "Herramientas",
      icon: "/shared/assets/apps/toolbox.png",
      items: [
        {
          type: "link",
          href: "https://herramientas.zaurio.es/dinerozaurio/",
          label: "DineroZaurio",
          icon: "/shared/assets/apps/piggy.png",
          tag: "beta",
        },
        {
          type: "static",
          label: "Emprezaurio",
          icon: "/shared/assets/apps/toolbox.png",
          tag: "soon",
        },
      ],
    },
    {
      type: "menu",
      key: "juegos",
      href: "https://juegos.zaurio.es",
      label: "Juegos",
      icon: "/shared/assets/apps/piggy.png",
      items: [
        {
          type: "link",
          href: "https://juegos.zaurio.es/trivialodon/",
          label: "Trivialodon",
          icon: "/shared/assets/apps/piggy.png",
          tag: "soon",
        },
      ],
    },
  ];

  function renderTag(tag) {
    if (!tag) return "";
    const map = {
      beta: "Beta",
      soon: "Proximamente",
    };
    return `<span class="zaurio-tag ${tag}">${map[tag] || tag}</span>`;
  }

  function renderDropdownItem(item) {
    const copy = `
      <span class="zaurio-dropdown-copy">
        <img src="${item.icon}" alt="">
        <span>${item.label}</span>
      </span>
      ${renderTag(item.tag)}
    `;

    if (item.type === "link") {
      return `<a class="zaurio-dropdown-item" href="${item.href}">${copy}</a>`;
    }

    return `<div class="zaurio-dropdown-static">${copy}</div>`;
  }

  function renderTopItem(item) {
    if (item.type === "link") {
      return `
        <a class="zaurio-nav-item ${active === item.key ? "is-active" : ""}" href="${item.href}" aria-label="${item.label}">
          <img class="zaurio-nav-icon" src="${item.icon}" alt="">
          <span class="zaurio-nav-label">${item.label}</span>
        </a>
      `;
    }

    return `
      <div class="zaurio-nav-menu ${active === item.key ? "is-active" : ""}" data-zaurio-menu>
        <button class="zaurio-nav-trigger" type="button" aria-label="${item.label}" aria-expanded="false">
          <img class="zaurio-nav-icon" src="${item.icon}" alt="">
          <span class="zaurio-nav-label">${item.label}</span>
          <span class="zaurio-nav-chevron" aria-hidden="true"></span>
        </button>
        <div class="zaurio-nav-dropdown" role="menu" aria-label="${item.label}">
          <a class="zaurio-dropdown-item" href="${item.href}">
            <span class="zaurio-dropdown-copy">
              <img src="${item.icon}" alt="">
              <span>Ir a ${item.label}</span>
            </span>
          </a>
          ${item.items.map(renderDropdownItem).join("")}
        </div>
      </div>
    `;
  }

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

  const navMarkup = `
    <nav class="zaurio-global-nav" aria-label="Navegacion global de Zaurio">
      <a class="zaurio-home-link ${active === "home" ? "is-active" : ""}" href="https://zaurio.es" aria-label="Ir a Zaurio">
        <img class="zaurio-home-icon" src="/shared/assets/brand/favicon-32x32.png" alt="Zaurio">
      </a>
      <div class="zaurio-nav-list">
        ${topLevelItems.map(renderTopItem).join("")}
      </div>
      ${cta}
    </nav>
  `;

  if (root) {
    root.classList.add("zaurio-nav-host");
    root.innerHTML = navMarkup;
  }

  if (legacyTopMenu) {
    legacyTopMenu.classList.add("zaurio-nav-host");
    legacyTopMenu.innerHTML = navMarkup;
  }

  const menuNodes = document.querySelectorAll("[data-zaurio-menu]");

  menuNodes.forEach((menu) => {
    const button = menu.querySelector(".zaurio-nav-trigger");
    if (!button) return;

    button.addEventListener("click", (event) => {
      if (window.innerWidth > 720) return;
      event.preventDefault();
      const isOpen = menu.classList.contains("is-open");
      menuNodes.forEach((node) => {
        node.classList.remove("is-open");
        const trigger = node.querySelector(".zaurio-nav-trigger");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        menu.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth > 720) return;
    menuNodes.forEach((menu) => {
      if (!menu.contains(event.target)) {
        menu.classList.remove("is-open");
        const trigger = menu.querySelector(".zaurio-nav-trigger");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      }
    });
  });
})();
