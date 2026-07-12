(function () {
  function pageKind() {
    var path = window.location.pathname;
    if (path === "/" || path === "/index.html") {
      return "site-home";
    }
    if (path.indexOf("/archives") === 0) {
      return "site-archive";
    }
    if (path.indexOf("/categories") === 0) {
      return "site-category";
    }
    if (path.indexOf("/tags") === 0) {
      return "site-tags";
    }
    if (path.indexOf("/about") === 0) {
      return "site-about";
    }
    if (path.indexOf("/links") === 0) {
      return "site-links";
    }
    if (document.querySelector(".post-content")) {
      return "site-post";
    }
    return "site-page";
  }

  function applyShell() {
    var body = document.body;
    if (!body) {
      return;
    }

    var kind = pageKind();
    body.classList.add("tech-shell", kind);
    if (kind !== "site-post") {
      window.refreshArticleToc = null;
      body.classList.remove("site-toc-hidden");
      document.querySelectorAll('[data-site-detached-toc="1"]').forEach(function (node) {
        node.parentElement && node.parentElement.removeChild(node);
      });
    }
    var run = function (name, callback) {
      try {
        callback();
      } catch (error) {
        if (window.console && console.warn) {
          console.warn("[site-shell] " + name + " failed", error);
        }
      }
    };

    run("removeBoardLabel", removeBoardLabel);
    run("applyUnifiedChrome", function () { applyUnifiedChrome(body); });
    run("applySearchModal", applySearchModal);
    run("applyHomeTitle", function () { applyHomeTitle(body); });
    run("applyArchivePage", function () { applyArchivePage(body); });
    run("applyCategoryList", function () { applyCategoryList(body); });
    run("applyTagsPage", function () { applyTagsPage(body); });
    run("applyArticleImages", function () { applyArticleImages(body); });
    run("applySidebarActionLabels", applySidebarActionLabels);
    run("applyColorToggle", applyColorToggle);
    run("applyNavToggle", function () { applyNavToggle(body); });
    run("applyMobileNavDrawer", applyMobileNavDrawer);
    run("limitHomeExcerpts", function () { limitHomeExcerpts(body); });
    run("applyHomePagination", function () { applyHomePagination(body); });
    run("ensureMarkdownReader", function () { ensureMarkdownReader(body); });
    run("repairPostStructure", function () { repairPostStructure(body); });
    run("applyPostTitle", function () { applyPostTitle(body); });
    run("applyPostMeta", function () { applyPostMeta(body); });
    run("applyCodeBlocks", function () { applyCodeBlocks(body); });
    run("applyPostNavigation", function () { applyPostNavigation(body); });
    run("applyPostComments", function () { applyPostComments(body); });
    run("standardizePostTemplate", function () { standardizePostTemplate(body); });
    run("ensurePostEssentials", function () { ensurePostEssentials(body); });
    run("removeCommentPrompt", function () { removeCommentPrompt(body); });
    run("normalizeCommentFields", function () { normalizeCommentFields(body); });
    run("removeHeadingAnchors", function () { removeHeadingAnchors(body); });
    run("applyArticleToc", function () { applyArticleToc(body); });
    run("applyUnifiedNavigation", function () { applyUnifiedNavigation(body); });
  }

  function removeBoardLabel() {
    document.querySelectorAll(".site-board-label").forEach(function (label) {
      label.parentNode && label.parentNode.removeChild(label);
    });
  }

  function limitHomeExcerpts(body) {
    if (!body.classList.contains("site-home")) {
      return;
    }
    document.querySelectorAll(".index-excerpt > div").forEach(function (excerpt) {
      var text = excerpt.textContent.replace(/\s+/g, " ").trim();
      excerpt.textContent = Array.from(text).slice(0, 200).join("");
    });
  }


  function applyUnifiedChrome(body) {
    var labels = [
      { href: '/', text: '\u9996\u9875', icon: 'icon-home-fill' },
      { href: '/archives/', text: '\u5f52\u6863', icon: 'icon-archive-fill' },
      { href: '/categories/', text: '\u5206\u7c7b', icon: 'icon-category-fill' },
      { href: '/tags/', text: '\u6807\u7b7e', icon: 'icon-tags-fill' },
      { href: '/about/', text: '\u5173\u4e8e', icon: 'icon-user-fill' }
    ];

    document.querySelectorAll('.navbar-brand strong').forEach(function (node) {
      node.textContent = 'LDH Blog';
    });

    var nav = document.querySelector('#navbar .navbar-nav');
    if (nav) {
      nav.innerHTML = '';
      labels.forEach(function (item) {
        var li = document.createElement('li');
        li.className = 'nav-item';
        var a = document.createElement('a');
        a.className = 'nav-link';
        a.href = item.href;
        a.innerHTML = '<i class="iconfont ' + item.icon + '"></i><span>' + item.text + '</span>';
        li.appendChild(a);
        nav.appendChild(li);
      });

      var search = document.createElement('li');
      search.className = 'nav-item';
      search.id = 'search-btn';
      search.innerHTML = '<a class="nav-link" target="_self" href="javascript:;" data-toggle="modal" data-target="#modalSearch" aria-label="Search"><i class="iconfont icon-search"></i></a>';
      nav.appendChild(search);

      var color = document.createElement('li');
      color.className = 'nav-item';
      color.id = 'color-toggle-btn';
      color.innerHTML = '<a class="nav-link" target="_self" href="javascript:;" aria-label="Color Toggle"><i class="iconfont icon-dark" id="color-toggle-icon"></i></a>';
      nav.appendChild(color);
    }

    var pageTitle = document.querySelector('.page-header .h2, .page-header span.h2');
    if (body.classList.contains('site-archive') && pageTitle) pageTitle.textContent = '\u5f52\u6863';
    if (body.classList.contains('site-category') && pageTitle && !pageTitle.textContent.trim()) pageTitle.textContent = '\u5206\u7c7b';
    if (body.classList.contains('site-tags') && pageTitle) pageTitle.textContent = '\u6807\u7b7e';
  }

  function applySearchModal() {
    if (!document.querySelector('#modalSearch')) {
      var modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'modalSearch';
      modal.tabIndex = -1;
      modal.setAttribute('role', 'dialog');
      modal.innerHTML = '<div class="modal-dialog modal-dialog-scrollable modal-lg" role="document"><div class="modal-content"><div class="modal-header"><input type="text" id="local-search-input" class="form-control validate" placeholder="\\u641c\\u7d22\\u6587\\u7ae0" aria-label="\\u641c\\u7d22\\u6587\\u7ae0"><button type="button" id="local-search-close" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body"><div class="list-group" id="local-search-result"></div></div></div></div>';
      document.body.appendChild(modal);
      if (!document.querySelector('script[src*="local-search.js"]')) {
        var script = document.createElement('script');
        script.src = '/js/local-search.js';
        document.body.appendChild(script);
      }
    }
    var input = document.querySelector('#local-search-input');
    if (input) {
      input.setAttribute('placeholder', '\u641c\u7d22\u6587\u7ae0');
      input.setAttribute('aria-label', '\u641c\u7d22\u6587\u7ae0');
    }
    document.querySelectorAll('label[for="local-search-input"]').forEach(function (label) {
      label.parentElement && label.parentElement.removeChild(label);
    });
  }

  function applyUnifiedNavigation(body) {
    if (body.getAttribute("data-shell-navigation-bound") === "true") {
      return;
    }
    body.setAttribute("data-shell-navigation-bound", "true");
    var prefetched = Object.create(null);
    var pageCache = Object.create(null);
    var activeNavigation = 0;

    var normalizeInternalUrl = function (href) {
      var url;
      try {
        url = new URL(href, window.location.href);
      } catch (_error) {
        return null;
      }
      if (url.origin !== window.location.origin) {
        return null;
      }
      if (!/^https?:$/.test(url.protocol)) {
        return null;
      }
      return url;
    };

    var isShellControl = function (link) {
      return link.closest("#search-btn") || link.closest("#color-toggle-btn") || link.closest("#modalSearch");
    };

    var closeMobileNav = function () {
      var collapse = document.querySelector("#navbarSupportedContent");
      var toggler = document.querySelector("#navbar-toggler-btn");
      var icon = toggler && toggler.querySelector(".animated-icon");
      if (collapse) {
        collapse.classList.remove("show");
        collapse.classList.remove("collapsing");
        collapse.style.height = "";
      }
      if (toggler) {
        toggler.classList.add("collapsed");
        toggler.setAttribute("aria-expanded", "false");
      }
      if (icon) {
        icon.classList.remove("open");
      }
      document.body.classList.remove("site-mobile-nav-open");
    };

    var isDocumentLink = function (link) {
      if (!link || !link.matches || !link.matches("a[href]")) {
        return false;
      }
      var href = link.getAttribute("href") || "";
      if (!href || href === "#" || href.indexOf("javascript:") === 0) {
        return false;
      }
      if (link.hasAttribute("download") || link.closest("#toc") || link.closest("#toc-body")) {
        return false;
      }
      if (link.classList.contains("headerlink") || link.classList.contains("anchorjs-link")) {
        return false;
      }
      if (isShellControl(link)) {
        return false;
      }
      return true;
    };

    var getNavigationTarget = function (link) {
      if (!isDocumentLink(link)) {
        return null;
      }
      var url = normalizeInternalUrl(link.getAttribute("href") || "");
      if (!url) {
        return null;
      }
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
        return null;
      }
      var path = url.pathname.toLowerCase();
      if (/\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|7z|rar|tar|gz|mp4|mp3|wav)$/i.test(path)) {
        return null;
      }
      return url.pathname + url.search + url.hash;
    };

    var normalizeLink = function (link) {
      if (!isDocumentLink(link)) {
        return;
      }

      var url = normalizeInternalUrl(link.getAttribute("href") || "");
      if (!url) {
        return;
      }

      var normalizedHref = url.pathname + url.search + url.hash;
      if (link.getAttribute("href") !== normalizedHref) {
        link.setAttribute("href", normalizedHref);
      }
      if (!link.getAttribute("target")) {
        link.setAttribute("target", "_self");
      }
      link.dataset.shellNavigation = "native";
    };

    var fetchPage = function (normalizedHref) {
      if (!normalizedHref) {
        return Promise.reject(new Error("empty navigation target"));
      }
      if (pageCache[normalizedHref]) {
        return pageCache[normalizedHref];
      }
      pageCache[normalizedHref] = fetch(normalizedHref, {
        credentials: "same-origin",
        headers: { "X-Requested-With": "SiteShell" }
      }).then(function (response) {
        var type = response.headers.get("content-type") || "";
        if (!response.ok || type.indexOf("text/html") < 0) {
          throw new Error("navigation fetch failed");
        }
        return response.text();
      }).catch(function (error) {
        delete pageCache[normalizedHref];
        throw error;
      });
      return pageCache[normalizedHref];
    };

    var prefetchLink = function (link) {
      var normalizedHref = getNavigationTarget(link);
      if (!normalizedHref || prefetched[normalizedHref]) {
        return;
      }
      prefetched[normalizedHref] = true;
      var head = document.head || document.getElementsByTagName("head")[0];
      if (!head) {
        return;
      }
      var prefetch = document.createElement("link");
      prefetch.rel = "prefetch";
      prefetch.as = "document";
      prefetch.href = normalizedHref;
      head.appendChild(prefetch);
      fetchPage(normalizedHref).catch(function () {});
    };

    var schedulePrefetch = function (event) {
      var link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
      if (!link) {
        return;
      }
      var run = function () {
        prefetchLink(link);
      };
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(run, { timeout: 450 });
      } else {
        window.setTimeout(run, 60);
      }
    };

    var runWhenIdle = function (callback, timeout) {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout: timeout || 700 });
      } else {
        window.setTimeout(callback, 80);
      }
    };

    var prefetchLikelyTargets = function () {
      var selectors = [
        ".site-home .index-card a[href]",
        ".site-series-nav a[href]",
        ".pagination a[href]",
        "#navbar .nav-link[href]"
      ].join(",");
      var links = Array.prototype.slice.call(document.querySelectorAll(selectors));
      var seen = Object.create(null);
      links.some(function (link) {
        var target = getNavigationTarget(link);
        if (!target || seen[target]) {
          return false;
        }
        seen[target] = true;
        prefetchLink(link);
        return Object.keys(seen).length >= 10;
      });
    };

    var normalizeAll = function () {
      document.querySelectorAll("a[href]").forEach(normalizeLink);
      body.classList.remove("site-is-navigating");
    };

    var updateBodyKind = function () {
      var kinds = ["site-home", "site-archive", "site-category", "site-tags", "site-about", "site-links", "site-post", "site-page"];
      kinds.forEach(function (name) {
        document.body.classList.remove(name);
      });
      document.body.classList.add(pageKind());
    };

    var swapDocument = function (html, href, shouldPush, titleHint) {
      var next = new DOMParser().parseFromString(html, "text/html");
      var nextMain = next.querySelector("main");
      if (!nextMain) {
        throw new Error("navigation target missing main");
      }

      if (/^\/20\d{2}\//.test(new URL(href, window.location.href).pathname) && titleHint) {
        var nextSubtitle = next.querySelector("#subtitle");
        if (nextSubtitle) {
          nextSubtitle.setAttribute("data-typed-text", titleHint);
          nextSubtitle.textContent = titleHint;
        }
        next.title = titleHint + " - LDH blog";
      }

      document.querySelectorAll('[data-site-detached-toc="1"]').forEach(function (node) {
        node.parentElement && node.parentElement.removeChild(node);
      });

      var selectors = ["header", "main", "footer"];
      selectors.forEach(function (selector) {
        var currentNode = document.querySelector(selector);
        var nextNode = next.querySelector(selector);
        if (currentNode && nextNode) {
          currentNode.replaceWith(document.importNode(nextNode, true));
        }
      });

      document.title = next.title || document.title;
      if (shouldPush) {
        history.pushState({ siteShell: true }, document.title, href);
      }
      updateBodyKind();
      applyShell();
      normalizeAll();
      document.dispatchEvent(new CustomEvent("site:navigated", { detail: { href: href } }));
      runWhenIdle(prefetchLikelyTargets, 900);

      var hash = new URL(href, window.location.href).hash;
      if (hash) {
        var target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (!target) {
          try {
            target = document.querySelector(hash);
          } catch (_error) {
            target = null;
          }
        }
        if (target) {
          target.scrollIntoView();
          return;
        }
      }
      window.scrollTo(0, 0);
    };

    var renderFetchedPage = function (href, shouldPush, titleHint) {
      var token = ++activeNavigation;
      document.documentElement.classList.add("site-pjax-loading");
      return fetchPage(href).then(function (html) {
        if (token !== activeNavigation) {
          return;
        }
        var render = function () {
          swapDocument(html, href, shouldPush, titleHint);
        };
        if (document.startViewTransition) {
          return document.startViewTransition(render).finished;
        }
        render();
      }).catch(function () {
        if (shouldPush) {
          window.location.href = href;
        }
      }).finally(function () {
        if (token === activeNavigation) {
          document.documentElement.classList.remove("site-pjax-loading");
        }
      });
    };

    var handleDocumentClick = function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      var link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
      var target = getNavigationTarget(link);
      if (!target) {
        return;
      }
      event.preventDefault();
      closeMobileNav();
      var titleHint = "";
      var card = link.closest(".index-card");
      var cardTitle = card && card.querySelector(".index-header");
      if (cardTitle) {
        titleHint = cardTitle.textContent.trim();
      }
      if (!titleHint) {
        var targetPath = decodeURIComponent(new URL(target, window.location.href).pathname.replace(/index\.html$/, ""));
        if (targetPath.charAt(targetPath.length - 1) !== "/") targetPath += "/";
        var post = getPostRegistry().find(function (item) { return item.path === targetPath; });
        titleHint = post ? post.title : "";
      }
      renderFetchedPage(target, true, titleHint);
    };

    normalizeAll();
    history.replaceState({ siteShell: true }, document.title, window.location.pathname + window.location.search + window.location.hash);
    window.addEventListener("pageshow", normalizeAll);
    window.addEventListener("pageshow", function () {
      runWhenIdle(prefetchLikelyTargets, 1000);
    });
    window.addEventListener("load", function () {
      runWhenIdle(prefetchLikelyTargets, 1000);
    });
    window.addEventListener("popstate", function () {
      normalizeAll();
      renderFetchedPage(window.location.pathname + window.location.search + window.location.hash, false);
    });
    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("pointerover", schedulePrefetch, { passive: true });
    document.addEventListener("focusin", schedulePrefetch);
    document.addEventListener("touchstart", schedulePrefetch, { passive: true });
    document.addEventListener("mousedown", schedulePrefetch, { passive: true });

    if ("MutationObserver" in window) {
      var observer = new MutationObserver(normalizeAll);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
    }
  }

  function applyHomeTitle(body) {
    if (!body.classList.contains('site-home')) return;
    var homePath = window.location.pathname;
    var sync = function () {
      if (window.location.pathname !== homePath || !document.body.classList.contains('site-home')) return;
      var subtitle = document.querySelector('#subtitle');
      if (!subtitle) return;
      subtitle.setAttribute('data-typed-text', 'LDH Blog');
      subtitle.textContent = 'LDH Blog';
      document.title = 'LDH Blog';
    };
    sync();
    window.setTimeout(sync, 120);
    window.setTimeout(sync, 800);
    window.setTimeout(sync, 1800);
    window.addEventListener('load', sync);
  }

  function repairPostStructure(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var title = document.querySelector("#seo-header");
    if (!title) {
      return;
    }

    var metadataTitle = "";
    var meta = document.querySelector('meta[property="og:title"]');
    if (meta) {
      metadataTitle = (meta.getAttribute("content") || "").trim();
    }
    if (!metadataTitle) {
      var subtitle = document.querySelector("#subtitle");
      metadataTitle = ((subtitle && (subtitle.getAttribute("data-typed-text") || subtitle.textContent)) || "").trim();
    }
    if (!metadataTitle) {
      metadataTitle = document.title.replace(/\s+-\s+LDH blog.*$/i, "").trim();
    }

    var markdown = title.querySelector(".markdown-body");
    if (markdown && title.parentElement) {
      title.parentElement.insertBefore(markdown, title.nextSibling);
    }

    var current = (title.textContent || "").trim();
    if (metadataTitle && (markdown || /\/h1>/.test(current) || current.length > 120)) {
      title.textContent = metadataTitle;
      document.title = metadataTitle + " - LDH blog";
    }
  }

  function applyCategoryList(body) {
    if (!body.classList.contains('site-category') || window.location.pathname.replace(/index\.html$/, '') !== '/categories/') return;
    var board = document.querySelector('#board .markdown-body, #board article, #board');
    if (!board) return;
    var categories = [
      { title: 'C', path: '/categories/C/', count: 1 },
      { title: '\u9a71\u52a8\u5f00\u53d1', path: '/categories/\u9a71\u52a8\u5f00\u53d1/', count: 22 }
    ];
    var list = document.createElement('div');
    list.className = 'site-category-list';
    var summary = document.createElement('div');
    summary.className = 'site-category-summary';
    summary.textContent = '\u5206\u7c7b\u5217\u8868 \u00b7 \u5171 ' + categories.length + ' \u7c7b';
    list.appendChild(summary);
    categories.forEach(function (category, index) {
      var item = document.createElement('a');
      item.className = 'site-category-item';
      item.href = encodeURI(category.path);
      item.innerHTML = '<span class="site-category-index">' + String(index + 1).padStart(2, '0') + '</span><span class="site-category-title">' + category.title + '</span><span class="site-category-count">' + category.count + ' \u7bc7</span>';
      list.appendChild(item);
    });
    board.innerHTML = '';
    board.appendChild(list);
  }

  function applyArchivePage(body) {
    if (!body.classList.contains('site-archive')) return;
    var list = document.querySelector('#board .list-group');
    if (!list) return;
    var posts = getPostRegistry().slice().sort(function (a, b) {
      return b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
    });
    list.classList.add('site-archive-timeline');
    list.innerHTML = '';
    var currentYear = '';
    posts.forEach(function (post) {
      var year = post.date.slice(0, 4);
      if (year !== currentYear) {
        currentYear = year;
        var heading = document.createElement('p');
        heading.className = 'h5 site-archive-year';
        heading.textContent = year;
        list.appendChild(heading);
      }
      var item = document.createElement('a');
      item.className = 'list-group-item list-group-item-action';
      item.href = encodeURI(post.path);
      item.innerHTML = '<time>' + post.date.slice(5) + '</time><div class="list-group-item-title">' + post.title + '</div>';
      list.appendChild(item);
    });
  }

  function applyTagsPage(body) {
    if (!body.classList.contains('site-tags')) return;
    var board = document.querySelector('#board .markdown-body, #board article, #board');
    if (!board) return;
    if (document.querySelector('.site-tag-list')) return;
    var box = document.createElement('div');
    box.className = 'site-tag-list tagcloud';
    var a = document.createElement('a');
    a.href = '/tags/\u539f\u521b/';
    a.textContent = '\u539f\u521b';
    var count = document.createElement('span');
    count.className = 'site-tag-count';
    count.textContent = getPostRegistry().length + ' \u7bc7';
    a.appendChild(count);
    box.appendChild(a);
    board.innerHTML = '';
    board.appendChild(box);
  }

  function applyNavToggle(body) {
    if (document.querySelector(".site-nav-toggle")) {
      return;
    }

    var isCollapsed = localStorage.getItem("ldh-nav-collapsed") === "true";
    if (isCollapsed) {
      body.classList.add("tech-nav-collapsed");
    }

    var button = document.createElement("button");
    button.className = "site-nav-toggle";
    button.type = "button";
    button.setAttribute("aria-controls", "navbar");
    button.setAttribute("aria-expanded", String(!isCollapsed));

    var mark = document.createElement("span");
    mark.className = "site-nav-toggle__mark";
    mark.setAttribute("aria-hidden", "true");

    var text = document.createElement("span");
    text.className = "site-nav-toggle__text";
    text.textContent = isCollapsed ? "Show nav" : "Hide nav";

    button.appendChild(mark);
    button.appendChild(text);
    button.addEventListener("click", function () {
      var collapsed = body.classList.toggle("tech-nav-collapsed");
      localStorage.setItem("ldh-nav-collapsed", String(collapsed));
      button.setAttribute("aria-expanded", String(!collapsed));
      text.textContent = collapsed ? "Show nav" : "Hide nav";
    });

    document.body.insertBefore(button, document.body.firstChild);
  }

  function applyMobileNavDrawer() {
    var collapse = document.querySelector("#navbarSupportedContent");
    var toggler = document.querySelector("#navbar-toggler-btn");
    if (!collapse || collapse.getAttribute("data-shell-mobile-nav-ready") === "true") {
      return;
    }

    var icon = toggler && toggler.querySelector(".animated-icon");
    var close = collapse.querySelector(".site-mobile-nav-close");
    if (!close) {
      close = document.createElement("button");
      close.className = "site-mobile-nav-close";
      close.type = "button";
      close.setAttribute("aria-label", "\u5173\u95ed\u4fa7\u8fb9\u680f");
      close.innerHTML = '<span aria-hidden="true">&times;</span>';
      collapse.insertBefore(close, collapse.firstChild);
    }

    var closeDrawer = function () {
      collapse.classList.remove("show");
      collapse.classList.remove("collapsing");
      collapse.style.height = "";
      if (toggler) {
        toggler.classList.add("collapsed");
        toggler.setAttribute("aria-expanded", "false");
      }
      if (icon) {
        icon.classList.remove("open");
      }
      document.body.classList.remove("site-mobile-nav-open");
    };

    var syncState = function () {
      var open = collapse.classList.contains("show");
      document.body.classList.toggle("site-mobile-nav-open", open);
      if (toggler) {
        toggler.setAttribute("aria-expanded", String(open));
        toggler.classList.toggle("collapsed", !open);
      }
      if (icon) {
        icon.classList.toggle("open", open);
      }
    };

    close.addEventListener("click", function (event) {
      event.preventDefault();
      closeDrawer();
    });

    if (toggler) {
      toggler.addEventListener("click", function () {
        window.setTimeout(syncState, 0);
        window.setTimeout(syncState, 260);
      });
    }

    collapse.addEventListener("click", function (event) {
      var link = event.target && event.target.closest ? event.target.closest("a.nav-link[href]") : null;
      if (!link || link.closest("#search-btn") || link.closest("#color-toggle-btn")) {
        return;
      }
      closeDrawer();
    });

    if ("MutationObserver" in window) {
      var observer = new MutationObserver(syncState);
      observer.observe(collapse, { attributes: true, attributeFilter: ["class", "style"] });
    }

    collapse.setAttribute("data-shell-mobile-nav-ready", "true");
    syncState();
  }

  function applySidebarActionLabels() {
    var searchLink = document.querySelector("#search-btn .nav-link");
    ensureSidebarActionLabel(searchLink, "\u641c\u7d22");

    var colorLink = document.querySelector("#color-toggle-btn .nav-link");
    var colorIcon = document.querySelector("#color-toggle-icon");
    var updateColorLabel = function () {
      if (!colorLink) {
        return;
      }

      var currentMode = document.documentElement.getAttribute("data-user-color-scheme");
      var nextMode = currentMode === "dark" ? "light" : currentMode === "light" ? "dark" : colorIcon && colorIcon.getAttribute("data");
      var text = nextMode === "light" ? "\u65e5\u95f4\u6a21\u5f0f" : "\u591c\u95f4\u6a21\u5f0f";
      ensureSidebarActionLabel(colorLink, text);
    };

    updateColorLabel();
    window.setTimeout(updateColorLabel, 100);
    window.setTimeout(updateColorLabel, 500);
    if (colorLink) {
      colorLink.addEventListener("click", function () {
        window.setTimeout(updateColorLabel, 0);
        window.setTimeout(updateColorLabel, 240);
      });
    }
    if (colorIcon && "MutationObserver" in window) {
      var observer = new MutationObserver(updateColorLabel);
      observer.observe(colorIcon, { attributes: true, attributeFilter: ["data", "class"] });
    }
    if ("MutationObserver" in window) {
      var rootObserver = new MutationObserver(updateColorLabel);
      rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-user-color-scheme"] });
    }
  }

  function applyColorToggle() {
    var button = document.querySelector("#color-toggle-btn");
    var link = document.querySelector("#color-toggle-btn .nav-link");
    var icon = document.querySelector("#color-toggle-icon");
    if (!button || !link || !icon || button.getAttribute("data-shell-color-bound") === "true") {
      return;
    }

    var storageKey = "Fluid_Color_Scheme";
    var root = document.documentElement;
    var setMode = function (mode) {
      mode = mode === "dark" ? "dark" : "light";
      root.setAttribute("data-user-color-scheme", mode);
      try {
        localStorage.setItem(storageKey, mode);
      } catch (e) {}
      icon.className = "iconfont " + (mode === "dark" ? "icon-dark" : "icon-light");
      icon.setAttribute("data", mode === "dark" ? "light" : "dark");
      var label = link.querySelector(".site-nav-action-label");
      if (label) {
        label.textContent = mode === "dark" ? "\u65e5\u95f4\u6a21\u5f0f" : "\u591c\u95f4\u6a21\u5f0f";
      }
      link.setAttribute("title", mode === "dark" ? "\u65e5\u95f4\u6a21\u5f0f" : "\u591c\u95f4\u6a21\u5f0f");
    };

    var current = root.getAttribute("data-user-color-scheme");
    if (current !== "dark" && current !== "light") {
      try {
        current = localStorage.getItem(storageKey);
      } catch (e) {}
    }
    if (current === "dark" || current === "light") {
      setMode(current);
    }

    button.setAttribute("data-shell-color-bound", "true");
    link.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var next = root.getAttribute("data-user-color-scheme") === "dark" ? "light" : "dark";
      setMode(next);
    }, true);
  }

  function ensureSidebarActionLabel(link, text) {
    if (!link) {
      return;
    }

    var label = link.querySelector(".site-nav-action-label");
    if (!label) {
      label = document.createElement("span");
      label.className = "site-nav-action-label";
      link.appendChild(label);
    }

    label.textContent = text;
    link.setAttribute("title", text);
    link.setAttribute("aria-label", text);
  }

  function applyArticleImages(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var pageDir = window.location.pathname.replace(/index\.html$/, "");
    if (pageDir.charAt(pageDir.length - 1) !== "/") {
      pageDir += "/";
    }

    document.querySelectorAll(".post-content img").forEach(function (image) {
      var src = image.getAttribute("src");
      image.removeAttribute("srcset");
      image.removeAttribute("lazyload");

      if (!src || src.indexOf("/./") !== 0) {
        return;
      }

      var fileName = src.split("/").pop();
      if (fileName) {
        image.setAttribute("src", pageDir + fileName);
      }
    });
  }

  function applyPostTitle(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }
    if (window.MdReaderReady) {
      return;
    }

    var title = document.querySelector("#seo-header");
    var subtitle = document.querySelector("#subtitle");
    if (!title || !subtitle) {
      return;
    }

    var text = title.textContent.trim();
    if (!text) {
      return;
    }

    var syncTitle = function () {
      subtitle.setAttribute("data-typed-text", text);
      subtitle.textContent = text;
      document.title = text + " - LDH blog";
    };

    syncTitle();
    window.setTimeout(syncTitle, 120);
    window.setTimeout(syncTitle, 600);
    window.setTimeout(syncTitle, 1600);
    window.addEventListener("load", syncTitle);
  }

  function ensureMarkdownReader(body) {
    if (body.getAttribute("data-article-compiled") === "true") {
      return;
    }
    if (!body.classList.contains("site-post") || !/^\/20\d{2}\//.test(window.location.pathname)) {
      return;
    }
    if (window.loadMarkdownArticle) {
      window.loadMarkdownArticle();
      return;
    }

    var loadReader = function () {
      if (window.MdReaderReady || document.querySelector('script[data-md-reader]')) return;
      var reader = document.createElement('script');
      reader.src = '/js/md-reader.js';
      reader.defer = true;
      reader.setAttribute('data-md-reader', '1');
      document.head.appendChild(reader);
    };

    if (window.marked) {
      loadReader();
      return;
    }
    if (!document.querySelector('script[data-marked-reader]')) {
      var markedScript = document.createElement('script');
      markedScript.src = '/js/vendor/marked.umd.js';
      markedScript.setAttribute('data-marked-reader', '1');
      markedScript.addEventListener('load', loadReader, { once: true });
      document.head.appendChild(markedScript);
    }
  }

  function applyPostMeta(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var postDate = "";
    document.querySelectorAll(".post-meta time[datetime]").forEach(function (time) {
      var value = time.getAttribute("datetime");
      if (!value) {
        return;
      }

      var date = value.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        postDate = date;
        time.textContent = date;
      }
    });

    var content = document.querySelector(".markdown-body");
    if (!content) {
      return;
    }

    var text = content.textContent.replace(/\s+/g, " ").trim();
    var cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    var latin = (text.replace(/[\u4e00-\u9fff]/g, " ").match(/\b[\w-]+\b/g) || []).length;
    var words = Math.max(1, cjk + latin);
    var wordText = words + " \u5b57";
    var minutes = Math.max(1, Math.ceil(words / 350));
    var chart = document.querySelector(".post-meta .icon-chart");
    var clock = document.querySelector(".post-meta .icon-clock-fill");
    if (chart && chart.parentElement) {
      chart.parentElement.innerHTML = '<i class="iconfont icon-chart"></i> ' + wordText;
    }
    if (clock && clock.parentElement) {
      clock.parentElement.style.display = "none";
    }

    var bannerText = document.querySelector("#banner .banner-text");
    if (bannerText && postDate) {
      var oldMetaRows = Array.prototype.slice.call(bannerText.querySelectorAll(".mt-3, .mt-1")).filter(function (row) {
        return row.querySelector(".post-meta");
      });
      if (oldMetaRows.length) {
        var metaLine = document.createElement("div");
        metaLine.className = "mt-3 site-post-meta-line";
        metaLine.innerHTML =
          '<span class="post-meta site-post-date"><i class="iconfont icon-date-fill" aria-hidden="true"></i><time datetime="' + postDate + '" pubdate>' + postDate + '</time></span>' +
          '<span class="post-meta site-post-words"><i class="iconfont icon-chart"></i> ' + wordText + '</span>';
        oldMetaRows[0].parentNode.insertBefore(metaLine, oldMetaRows[0]);
        oldMetaRows.forEach(function (row) {
          row.parentNode && row.parentNode.removeChild(row);
        });
      }
    }
  }

  function applyCodeBlocks(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var scheduled = false;
    var writeClipboard = function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          textarea.parentNode && textarea.parentNode.removeChild(textarea);
        }
      });
    };
    var setCopyState = function (button, copied) {
      var icon = button.querySelector("i");
      if (icon) {
        icon.className = "iconfont " + (copied ? "icon-success" : "icon-copy");
      }
      button.childNodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          node.nodeValue = copied ? "Copied" : "Copy";
        }
      });
    };
    var ensureCopyButton = function (pre) {
      if (!pre || pre.querySelector("code.mermaid")) {
        return;
      }
      var host = pre.closest("figure.highlight, .code-wrapper") || pre;
      if (host === pre && pre.parentNode) {
        var wrapper = document.createElement("div");
        wrapper.className = "code-wrapper";
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        host = wrapper;
      }
      var code = host.querySelector("td.code code, pre code, code") || pre.querySelector("code");
      if (!code) {
        return;
      }
      host.classList.add("site-code-host");

      var buttons = Array.prototype.slice.call(host.querySelectorAll(".copy-btn"));
      Array.prototype.slice.call(pre.querySelectorAll(".copy-btn")).forEach(function (button) {
        if (buttons.indexOf(button) < 0) {
          buttons.push(button);
        }
      });
      var button = buttons[0];
      if (!button) {
        button = document.createElement("div");
        button.className = "code-widget copy-btn";
        button.setAttribute("data-clipboard-snippet", "");
        button.innerHTML = '<i class="iconfont icon-copy"></i>Copy';
      }
      buttons.slice(1).forEach(function (extra) {
        extra.parentNode && extra.parentNode.removeChild(extra);
      });
      if (button.parentNode !== host) {
        host.appendChild(button);
      }
      if (button.dataset.siteCopyClickReady !== "1") {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          writeClipboard(code.textContent || "").then(function () {
            setCopyState(button, true);
            window.setTimeout(function () {
              setCopyState(button, false);
            }, 1400);
          });
        });
        button.dataset.siteCopyClickReady = "1";
      }
    };
    var normalize = function () {
      document.querySelectorAll(".markdown-body figure.highlight").forEach(function (figure) {
        figure.classList.add("site-code-block");
        var language = Array.prototype.slice.call(figure.classList).filter(function (name) {
          return name !== "highlight" && name !== "site-code-block";
        })[0];
        var code = figure.querySelector("td.code code, pre code");
        if (language && code) {
          code.classList.add("language-" + language);
          if ((language === "c" || language === "cpp") && !code.dataset.siteHighlighted && !code.querySelector("[class^='hljs-'], [class*=' hljs-']")) {
            applyCLikeHighlight(code);
            code.dataset.siteHighlighted = "1";
          } else if (code.querySelector("[class^='hljs-'], [class*=' hljs-']")) {
            code.dataset.siteHighlighted = "1";
          }
        }
      });

      document.querySelectorAll(".markdown-body pre code[class*='language-']").forEach(function (code) {
        var languageClass = Array.prototype.slice.call(code.classList).find(function (name) {
          return name.indexOf("language-") === 0;
        });
        var language = languageClass ? languageClass.slice(9).toLowerCase() : "";
        if ((language === "c" || language === "cpp") && !code.dataset.siteHighlighted && !code.querySelector("[class^='hljs-'], [class*=' hljs-']")) {
          applyCLikeHighlight(code);
          code.classList.add("hljs");
          code.dataset.siteHighlighted = "1";
        }
      });

      document.querySelectorAll(".markdown-body pre").forEach(function (pre) {
        if (!pre.classList.contains("site-code-pre")) {
          pre.classList.add("site-code-pre");
        }
        ensureCopyButton(pre);
      });

      document.querySelectorAll(".markdown-body .copy-btn").forEach(function (button) {
        if (button.dataset.siteCopyReady === "1") {
          return;
        }
        button.childNodes.forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = "Copy";
          }
        });
        if (!button.textContent.trim()) {
          button.appendChild(document.createTextNode("Copy"));
        }
        button.setAttribute("aria-label", "Copy code");
        button.setAttribute("title", "Copy");
        button.dataset.siteCopyReady = "1";
      });
    };

    var scheduleNormalize = function () {
      if (scheduled) {
        return;
      }
      scheduled = true;
      window.setTimeout(function () {
        scheduled = false;
        normalize();
      }, 80);
    };

    normalize();
    window.setTimeout(scheduleNormalize, 320);
    window.addEventListener("load", scheduleNormalize);

    if ("MutationObserver" in window) {
      var observer = new MutationObserver(scheduleNormalize);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    var highlightTargets = ".markdown-body figure.highlight code, .markdown-body pre code[class*='language-']";
    var needsHighlight = Array.prototype.slice.call(document.querySelectorAll(highlightTargets)).some(function (code) {
      return !code.dataset.siteHighlighted && !code.querySelector("[class^='hljs-'], [class*=' hljs-']");
    });
    var runHighlight = function () {
      if (!window.hljs) {
        return;
      }
      document.querySelectorAll(highlightTargets).forEach(function (code) {
        if (!code.dataset.siteHighlighted && !code.querySelector("[class^='hljs-'], [class*=' hljs-']")) {
          window.hljs.highlightElement(code);
          code.dataset.siteHighlighted = "1";
        }
      });
    };
    if (needsHighlight) {
      if (window.hljs) {
        runHighlight();
      } else if (window.Fluid && Fluid.utils && Fluid.utils.createScript) {
        Fluid.utils.createScript("https://lib.baomitu.com/highlight.js/11.9.0/highlight.min.js", runHighlight);
      }
    }
  }

  function applyCLikeHighlight(code) {
    var source = code.textContent || "";
    var escapeHtml = function (text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    var keywords = /^(auto|break|case|const|continue|default|do|else|enum|extern|for|goto|if|register|return|sizeof|static|struct|switch|typedef|union|volatile|while|class|public|private|protected|template|typename|namespace|new|delete|this)$/;
    var types = /^(char|double|float|int|long|short|signed|unsigned|void|bool|size_t|uint8_t|uint16_t|uint32_t|uint64_t|int8_t|int16_t|int32_t|int64_t)$/;
    var builtins = /^(printf|scanf|malloc|free|memset|memcpy|strlen|strcpy|open|read|write|close|ioctl|poll|select|copy_to_user|copy_from_user|printk|module_init|module_exit)$/;
    var token = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|\b[A-Za-z_][A-Za-z0-9_]*\b|\b\d+(?:\.\d+)?\b)/g;
    var html = "";
    var last = 0;
    source.replace(token, function (match, _token, offset) {
      html += escapeHtml(source.slice(last, offset));
      var cls = "";
      if (match.indexOf("/*") === 0 || match.indexOf("//") === 0) cls = "hljs-comment";
      else if (match.charAt(0) === '"' || match.charAt(0) === "'") cls = "hljs-string";
      else if (match.charAt(0) === "#") cls = "hljs-meta";
      else if (keywords.test(match)) cls = "hljs-keyword";
      else if (types.test(match)) cls = "hljs-type";
      else if (builtins.test(match)) cls = "hljs-built_in";
      else if (/^\d/.test(match)) cls = "hljs-number";
      html += cls ? '<span class="' + cls + '">' + escapeHtml(match) + '</span>' : escapeHtml(match);
      last = offset + match.length;
      return match;
    });
    html += escapeHtml(source.slice(last));
    code.innerHTML = html;
  }

  function applyPostNavigation(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var posts = getPostRegistry();

    var currentPath = decodeURIComponent(window.location.pathname.replace(/index\.html$/, ""));
    if (currentPath.charAt(currentPath.length - 1) !== "/") {
      currentPath += "/";
    }

    var index = posts.findIndex(function (post) {
      return post.path === currentPath;
    });
    if (index < 0) {
      return;
    }

    var content = document.querySelector(".post-content");
    if (!content) {
      return;
    }

    document.querySelectorAll(".post-prev, .post-next, .post-prevnext").forEach(function (node) {
      node.parentElement && node.parentElement.removeChild(node);
    });

    var nav = document.createElement("div");
    nav.className = "post-prevnext site-series-nav row mx-auto";

    var createItem = function (post, className, label, iconClass) {
      var article = document.createElement("article");
      article.className = className + " col-6";
      post = post || (className.indexOf("post-prev") >= 0 ? posts[posts.length - 1] : posts[0]);

      var link = document.createElement("a");
      link.href = encodeURI(post.path);
      link.title = post.title;

      if (className.indexOf("post-prev") >= 0) {
        var leftIcon = document.createElement("i");
        leftIcon.className = "iconfont " + iconClass;
        link.appendChild(leftIcon);
      }

      var text = document.createElement("span");
      text.className = "hidden-mobile";
      text.textContent = post.title;
      link.appendChild(text);

      var mobile = document.createElement("span");
      mobile.className = "visible-mobile";
      mobile.textContent = label;
      link.appendChild(mobile);

      if (className.indexOf("post-next") >= 0) {
        var rightIcon = document.createElement("i");
        rightIcon.className = "iconfont " + iconClass;
        link.appendChild(rightIcon);
      }

      article.appendChild(link);
      return article;
    };

    nav.appendChild(createItem(posts[index - 1], "post-prev", "\u4e0a\u4e00\u7bc7", "icon-arrowleft"));
    nav.appendChild(createItem(posts[index + 1], "post-next", "\u4e0b\u4e00\u7bc7", "icon-arrowright"));
    content.appendChild(nav);
  }

  function applyPostComments(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var board = document.querySelector("#board");
    if (!board) {
      return;
    }

    var comments = document.querySelector("#comments");
    if (!comments) {
      comments = document.createElement("article");
      comments.id = "comments";
      comments.setAttribute("lazyload", "");
      comments.innerHTML = '<div id="valine"></div><noscript>Please enable JavaScript to view the comments</noscript>';
      board.parentElement.insertBefore(comments, board.nextSibling);
    }

    var commentPath = window.location.pathname.replace(/index\.html$/, "");
    if (comments.dataset.siteCommentPath && comments.dataset.siteCommentPath !== commentPath) {
      comments.innerHTML = '<div id="valine"></div><noscript>Please enable JavaScript to view the comments</noscript>';
      delete comments.dataset.siteCommentsReady;
    }
    comments.dataset.siteCommentPath = commentPath;

    var init = function () {
      if (window.Valine && document.querySelector("#valine") && !document.querySelector("#valine .vwrap")) {
        new window.Valine({
          el: "#valine",
          appId: "0r6Gu1FDMfgWqlGYZ7ajgr5Z-MdYXbMMI",
          appKey: "lDtuGLuwzxbRgeIpWrrzqVeV",
          path: commentPath,
          avatar: "retro",
          meta: ["nick", "mail"],
          pageSize: 10,
          lang: "zh-CN",
          highlight: false,
          recordIP: false
        });
      }
    };

    if (comments.dataset.siteCommentsReady === "1") {
      return;
    }
    comments.dataset.siteCommentsReady = "1";

    if (window.Valine) {
      init();
    } else if (window.Fluid && Fluid.utils && Fluid.utils.createScript) {
      Fluid.utils.createScript("https://lib.baomitu.com/valine/1.5.1/Valine.min.js", init);
    }
  }

  function standardizePostTemplate(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var board = document.querySelector("#board");
    var content = document.querySelector(".post-content");
    var markdown = document.querySelector(".post-content > .markdown-body, .post-content .markdown-body");
    var title = document.querySelector("#seo-header");
    if (!board || !content || !markdown) {
      return;
    }

    content.classList.add("site-post-template");
    markdown.classList.add("site-post-body");

    if (title) {
      title.classList.add("site-post-title");
      if (title.parentElement !== content) {
        content.insertBefore(title, content.firstChild);
      }
      if (markdown.parentElement === content && title.nextElementSibling !== markdown) {
        content.insertBefore(markdown, title.nextSibling);
      }
    }

    var seriesNav = document.querySelector(".site-series-nav");
    if (seriesNav) {
      seriesNav.classList.add("site-post-section", "site-post-section-nav");
      if (seriesNav.parentElement !== content) {
        content.appendChild(seriesNav);
      }
    }

    var comments = document.querySelector("#comments");
    if (comments && board.parentElement) {
      comments.classList.add("site-comments", "site-post-section");
      comments.setAttribute("aria-label", "\u6587\u7ae0\u8bc4\u8bba");
      if (comments.parentElement !== board.parentElement || comments.previousElementSibling !== board) {
        board.parentElement.insertBefore(comments, board.nextSibling);
      }
    }

    board.setAttribute("data-post-template", "standard");
  }

  function ensurePostEssentials(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var board = document.querySelector("#board");
    var content = document.querySelector(".post-content");
    var markdown = document.querySelector(".post-content > .markdown-body, .post-content .markdown-body, #board .markdown-body");
    if (!board || !content || !markdown) {
      return;
    }

    content.style.removeProperty("display");
    content.style.removeProperty("visibility");
    markdown.style.removeProperty("display");
    markdown.style.removeProperty("visibility");
    content.classList.add("site-post-template");
    markdown.classList.add("site-post-body");

    if (markdown.parentElement !== content) {
      content.appendChild(markdown);
    }

    var nav = document.querySelector(".site-series-nav");
    if (!nav) {
      applyPostNavigation(body);
      nav = document.querySelector(".site-series-nav");
    }
    if (nav) {
      nav.classList.add("site-post-section", "site-post-section-nav");
      if (nav.parentElement !== content) {
        content.appendChild(nav);
      }
      nav.style.removeProperty("display");
      nav.style.removeProperty("visibility");
    }

    var comments = document.querySelector("#comments");
    if (!comments) {
      comments = document.createElement("article");
      comments.id = "comments";
      comments.setAttribute("lazyload", "");
      comments.innerHTML = '<div id="valine"></div><noscript>Please enable JavaScript to view the comments</noscript>';
    } else if (!comments.querySelector("#valine")) {
      comments.insertAdjacentHTML("afterbegin", '<div id="valine"></div>');
    }

    comments.classList.add("site-comments", "site-post-section");
    comments.style.removeProperty("display");
    comments.style.removeProperty("visibility");
    if (board.parentElement && (comments.parentElement !== board.parentElement || comments.previousElementSibling !== board)) {
      board.parentElement.insertBefore(comments, board.nextSibling);
    }
  }

  function removeCommentPrompt(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var clean = function () {
      document.querySelectorAll("#valine .vempty, #valine .vcount").forEach(function (node) {
        if (/来发评论吧|来发评论/.test(node.textContent || "")) {
          node.parentElement && node.parentElement.removeChild(node);
        }
      });
      document.querySelectorAll("#valine *").forEach(function (node) {
        if ((node.textContent || "").trim() === "来发评论吧~") {
          node.parentElement && node.parentElement.removeChild(node);
        }
      });
    };

    clean();
    window.setTimeout(clean, 300);
    window.setTimeout(clean, 1200);
    window.addEventListener("load", clean);
    if ("MutationObserver" in window) {
      var observer = new MutationObserver(clean);
      var target = document.querySelector("#comments") || document.body;
      observer.observe(target, { childList: true, subtree: true, characterData: true });
    }
  }


  function normalizeCommentFields(body) {
    if (!body.classList.contains('site-post')) return;
    var clean = function () {
      document.querySelectorAll('#valine input[name="link"], #valine .vlink').forEach(function (node) {
        var wrapper = node.closest('.vinput') || node.closest('p') || node.parentElement;
        if (wrapper && wrapper.parentElement) wrapper.parentElement.removeChild(wrapper);
      });
      document.querySelectorAll('#valine input').forEach(function (input) {
        var placeholder = input.getAttribute('placeholder') || '';
        if (/http|link/i.test(placeholder)) {
          var wrapper = input.closest('.vinput') || input.closest('p') || input.parentElement;
          if (wrapper && wrapper.parentElement) wrapper.parentElement.removeChild(wrapper);
        }
      });
    };
    clean();
    window.setTimeout(clean, 400);
    window.setTimeout(clean, 1400);
    if ('MutationObserver' in window) {
      var observer = new MutationObserver(clean);
      observer.observe(document.querySelector('#comments') || document.body, { childList: true, subtree: true });
    }
  }

  function removeHeadingAnchors(body) {
    if (!body.classList.contains('site-post')) return;
    var clean = function () {
      document.querySelectorAll('.markdown-body .headerlink, .markdown-body .anchorjs-link').forEach(function (node) {
        node.parentElement && node.parentElement.removeChild(node);
      });
      document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6').forEach(function (heading) {
        heading.removeAttribute('data-anchorjs-icon');
      });
      if (window.anchors && anchors.removeAll) anchors.removeAll();
    };
    clean();
    window.setTimeout(clean, 120);
    window.setTimeout(clean, 800);
    window.setTimeout(clean, 1600);
    window.addEventListener('load', clean);
    if ("MutationObserver" in window) {
      var observer = new MutationObserver(clean);
      observer.observe(document.querySelector('.markdown-body') || document.body, { childList: true, subtree: true });
    }
  }

  function getPostRegistry() {
    if (Array.isArray(window.BLOG_POSTS) && window.BLOG_POSTS.length) {
      return window.BLOG_POSTS.filter(function (item) { return item && item.path; });
    }
    return [
      {
            "title": "简单字符型设备驱动",
            "path": "/2023/12/01/简单字符型设备驱动/",
            "date": "2023-12-01"
      },
      {
            "title": "在docker上搭建D1-H哪吒开发板环境",
            "path": "/2023/12/01/在docker上搭建D1-H哪吒开发板环境/",
            "date": "2023-12-01"
      },
      {
            "title": "在ubuntu上挂载WebDAV",
            "path": "/2023/12/01/在ubuntu上挂载WebDAV/",
            "date": "2023-12-01"
      },
      {
            "title": "ubuntu安装fusuma",
            "path": "/2023/12/01/ubuntu安装fusuma/",
            "date": "2023-12-01"
      },
      {
            "title": "基于STM32的温室控制系统",
            "path": "/2024/03/05/基于STM32的温室控制系统/",
            "date": "2024-03-05"
      },
      {
            "title": "在ubuntu上安装-卸载libreoffice",
            "path": "/2024/03/05/在ubuntu上安装-卸载libreoffice/",
            "date": "2024-03-05"
      },
      {
            "title": "D1-H哪吒开发板GPIO使用",
            "path": "/2024/03/05/D1-H哪吒开发板GPIO使用/",
            "date": "2024-03-05"
      },
      {
            "title": "[Linux内核驱动]创建字符设备",
            "path": "/2024/06/21/[Linux内核驱动]创建字符设备/",
            "date": "2024-06-21"
      },
      {
            "title": "[Linux内核驱动]模块参数",
            "path": "/2024/06/21/[Linux内核驱动]模块参数/",
            "date": "2024-06-21"
      },
      {
            "title": "[Linux内核驱动]模块的加载和卸载",
            "path": "/2024/06/21/[Linux内核驱动]模块的加载和卸载/",
            "date": "2024-06-21"
      },
      {
            "title": "[Linux内核驱动]内存动态申请",
            "path": "/2024/06/21/[Linux内核驱动]内存动态申请/",
            "date": "2024-06-21"
      },
      {
            "title": "[Linux内核驱动]信号量",
            "path": "/2024/06/21/[Linux内核驱动]信号量/",
            "date": "2024-06-21"
      },
      {
            "title": "[Linux内核驱动]自旋锁",
            "path": "/2024/06/21/[Linux内核驱动]自旋锁/",
            "date": "2024-06-21"
      },
      {
            "title": "[Linux内核驱动]ioctl",
            "path": "/2024/06/21/[Linux内核驱动]ioctl/",
            "date": "2024-06-21"
      },
      {
            "title": "[Linux内核驱动]Makefile",
            "path": "/2024/06/21/[Linux内核驱动]Makefile/",
            "date": "2024-06-21"
      },
      {
            "title": "[Linux内核驱动]等待队列",
            "path": "/2024/06/22/[Linux内核驱动]等待队列/",
            "date": "2024-06-22"
      },
      {
            "title": "[Linux内核驱动]应用",
            "path": "/2024/06/22/[Linux内核驱动]应用/",
            "date": "2024-06-22"
      },
      {
            "title": "[Linux内核驱动]定时器",
            "path": "/2024/06/30/[Linux内核驱动]定时器/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]定时器应用",
            "path": "/2024/06/30/[Linux内核驱动]定时器应用/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]工作队列",
            "path": "/2024/06/30/[Linux内核驱动]工作队列/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]轮询操作",
            "path": "/2024/06/30/[Linux内核驱动]轮询操作/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]数据类型",
            "path": "/2024/06/30/[Linux内核驱动]数据类型/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]延时",
            "path": "/2024/06/30/[Linux内核驱动]延时/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]异步通知",
            "path": "/2024/06/30/[Linux内核驱动]异步通知/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]应用",
            "path": "/2024/06/30/[Linux内核驱动]应用/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]中断",
            "path": "/2024/06/30/[Linux内核驱动]中断/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]platform",
            "path": "/2024/06/30/[Linux内核驱动]platform/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]proc",
            "path": "/2024/06/30/[Linux内核驱动]proc/",
            "date": "2024-06-30"
      },
      {
            "title": "[Linux内核驱动]tasklet",
            "path": "/2024/06/30/[Linux内核驱动]tasklet/",
            "date": "2024-06-30"
      }
];
  }

  function applyHomePagination(body) {
    if (!body.classList.contains("site-home")) {
      return;
    }

    var cards = Array.prototype.slice.call(document.querySelectorAll("#board .index-card"));
    var perPage = 10;
    cards.forEach(function (card, index) {
      card.setAttribute("data-entry-number", String(index + 1).padStart(2, "0"));
    });

    if (cards.length <= perPage || document.querySelector(".site-home-pagination")) {
      return;
    }

    var totalPages = Math.ceil(cards.length / perPage);
    var pager = document.createElement("nav");
    pager.className = "site-home-pagination";
    pager.setAttribute("aria-label", "\u9996\u9875\u6587\u7ae0\u5206\u9875");

    var list = document.createElement("div");
    list.className = "site-home-pagination__list";
    pager.appendChild(list);

    var getPageFromUrl = function () {
      var params = new URLSearchParams(window.location.search);
      var page = parseInt(params.get("page") || "1", 10);
      if (Number.isNaN(page)) {
        page = 1;
      }
      return Math.max(1, Math.min(totalPages, page));
    };

    var setUrlPage = function (page) {
      var url = new URL(window.location.href);
      if (page <= 1) {
        url.searchParams.delete("page");
      } else {
        url.searchParams.set("page", String(page));
      }
      window.history.pushState({ homePage: page }, "", url);
    };

    var makeButton = function (label, page, className, disabled, current) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = label;
      button.disabled = !!disabled;
      button.setAttribute("aria-label", label);
      if (current) {
        button.setAttribute("aria-current", "page");
      }
      button.addEventListener("click", function () {
        render(page, true);
      });
      return button;
    };

    var render = function (page, updateUrl) {
      page = Math.max(1, Math.min(totalPages, page));
      var start = (page - 1) * perPage;
      var end = start + perPage;

      cards.forEach(function (card, index) {
        card.hidden = index < start || index >= end;
      });

      list.innerHTML = "";
      list.appendChild(makeButton("\u4e0a\u4e00\u9875", page - 1, "site-home-pagination__button site-home-pagination__button--prev", page === 1, false));
      for (var i = 1; i <= totalPages; i += 1) {
        list.appendChild(makeButton(String(i), i, "site-home-pagination__button site-home-pagination__button--number", false, i === page));
      }
      list.appendChild(makeButton("\u4e0b\u4e00\u9875", page + 1, "site-home-pagination__button site-home-pagination__button--next", page === totalPages, false));

      if (updateUrl) {
        setUrlPage(page);
        var board = document.querySelector("#board");
        if (board) {
          board.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    var boardContainer = document.querySelector("#board .container");
    if (boardContainer) {
      boardContainer.appendChild(pager);
    }

    render(getPageFromUrl(), false);
    window.addEventListener("popstate", function () {
      render(getPageFromUrl(), false);
    });
  }

  function applyArticleToc(body) {
    if (!body.classList.contains("site-post")) {
      return;
    }

    var content = document.querySelector(".post-content");
    var toc = document.querySelector("#toc");
    var tocCol = toc && toc.closest(".side-col");
    if (!content || !tocCol) {
      return;
    }
    if (tocCol.parentNode !== document.body) {
      document.body.appendChild(tocCol);
    }
    tocCol.setAttribute("data-site-detached-toc", "1");

    var buildFallbackToc = function () {
      var tocBody = document.querySelector("#toc-body");
      var toc = document.querySelector("#toc");
      if (!tocBody || tocBody.querySelector(".tocbot-link")) {
        return;
      }

      var headings = Array.prototype.slice.call(content.querySelectorAll("h1, h2, h3, h4, h5, h6")).filter(function (heading) {
        return heading.textContent.trim();
      });
      if (!headings.length) {
        return;
      }

      var list = document.createElement("ol");
      list.className = "tocbot-list";
      headings.forEach(function (heading, index) {
        if (!heading.id) {
          heading.id = "heading-" + index;
        }

        var item = document.createElement("li");
        item.className = "toc-list-item";
        var link = document.createElement("a");
        link.className = "tocbot-link";
        link.href = "#" + encodeURIComponent(heading.id);
        link.textContent = heading.textContent.trim();
        item.appendChild(link);
        list.appendChild(item);
      });
      tocBody.innerHTML = "";
      tocBody.appendChild(list);
      if (toc) {
        toc.style.visibility = "visible";
      }
    };

    var measureTocWidth = function (availableWidth) {
      var links = tocCol.querySelectorAll(".tocbot-link");
      var minWidth = 160;
      var maxWidth = Math.min(320, availableWidth);
      if (!links.length || maxWidth <= minWidth) {
        return { width: Math.max(0, maxWidth), capped: links.length > 0 };
      }

      var measurer = document.createElement("span");
      measurer.style.position = "fixed";
      measurer.style.left = "-9999px";
      measurer.style.top = "0";
      measurer.style.visibility = "hidden";
      measurer.style.whiteSpace = "nowrap";
      document.body.appendChild(measurer);

      var widest = minWidth;
      links.forEach(function (link) {
        var style = window.getComputedStyle(link);
        var depth = 0;
        var node = link.parentElement;
        while (node && node !== tocCol) {
          if (node.tagName === "OL") {
            depth += 1;
          }
          node = node.parentElement;
        }

        measurer.style.font = style.font;
        measurer.textContent = link.textContent.trim();
        widest = Math.max(widest, Math.ceil(measurer.getBoundingClientRect().width) + Math.max(1, depth) * 16 + 28);
      });

      document.body.removeChild(measurer);
      return {
        width: Math.min(maxWidth, Math.max(minWidth, widest)),
        capped: widest > maxWidth
      };
    };

    var placement = null;
    var applyPlacement = function () {
      if (!placement) {
        return;
      }
      var tocBox = document.querySelector("#toc");
      var tocBody = document.querySelector("#toc-body") || document.querySelector(".toc-body");
      var sidebar = tocCol.querySelector(".sidebar");
      tocCol.classList.toggle("site-toc-width-capped", !!placement.capped);
      body.classList.toggle("site-toc-hidden", !placement.hasRoom);
      tocCol.style.setProperty("padding-top", "0px", "important");
      tocCol.style.setProperty("padding-left", "0px", "important");
      tocCol.style.setProperty("padding-right", "0px", "important");
      tocCol.style.setProperty("margin-top", "0px", "important");
      tocCol.style.setProperty("transform", "none", "important");
      if (placement.hasRoom) {
        body.style.setProperty("--article-toc-left", placement.left + "px");
        body.style.setProperty("--article-toc-width", placement.width + "px");
        tocCol.style.setProperty("display", "block", "important");
        tocCol.style.setProperty("position", "fixed", "important");
        tocCol.style.setProperty("top", placement.top + "px", "important");
        tocCol.style.setProperty("left", placement.left + "px", "important");
        tocCol.style.setProperty("right", "auto", "important");
        tocCol.style.setProperty("width", placement.width + "px", "important");
        tocCol.style.setProperty("max-width", placement.width + "px", "important");
        tocCol.style.setProperty("max-height", "calc(100vh - " + (placement.top + 20) + "px)", "important");
        tocCol.style.setProperty("overflow-x", "hidden", "important");
        tocCol.style.setProperty("overflow-y", "auto", "important");
        tocCol.style.setProperty("z-index", "4", "important");
        if (sidebar) {
          sidebar.style.setProperty("position", "static", "important");
          sidebar.style.setProperty("top", "auto", "important");
          sidebar.style.setProperty("left", "auto", "important");
          sidebar.style.setProperty("right", "auto", "important");
          sidebar.style.setProperty("width", "100%", "important");
          sidebar.style.setProperty("margin", "0", "important");
          sidebar.style.setProperty("transform", "none", "important");
          sidebar.style.setProperty("padding-left", "0px", "important");
          sidebar.style.setProperty("padding-right", "0px", "important");
        }
        if (tocBox) {
          tocBox.style.setProperty("position", "static", "important");
          tocBox.style.setProperty("top", "auto", "important");
          tocBox.style.setProperty("left", "auto", "important");
          tocBox.style.setProperty("right", "auto", "important");
          tocBox.style.setProperty("transform", "none", "important");
          tocBox.style.setProperty("width", "100%", "important");
          tocBox.style.setProperty("max-height", "100%", "important");
          tocBox.style.setProperty("overflow", "visible", "important");
        }
        if (tocBody) {
          tocBody.style.setProperty("max-height", "none", "important");
          tocBody.style.setProperty("overflow-x", placement.capped ? "auto" : "visible", "important");
          tocBody.style.setProperty("overflow-y", "visible", "important");
          tocBody.style.setProperty("transform", "none", "important");
          tocBody.scrollTop = 0;
        }
      } else {
        tocCol.style.setProperty("display", "none", "important");
      }
    };

    var update = function () {
      var anchor = document.querySelector("#board") || content;
      var contentRect = anchor.getBoundingClientRect();
      var gap = 16;
      var rightSideLeft = Math.round(contentRect.right + gap);
      var availableRight = window.innerWidth - rightSideLeft - 24;
      var tocMeasure = measureTocWidth(availableRight);
      var tocWidth = tocMeasure.width;
      var hasRoom = window.innerWidth >= 1280 && rightSideLeft + tocWidth + 24 <= window.innerWidth;
      placement = {
        hasRoom: hasRoom,
        left: rightSideLeft,
        top: 104,
        width: tocWidth,
        capped: tocMeasure.capped
      };
      applyPlacement();
    };

    buildFallbackToc();
    update();
    window.setTimeout(update, 120);
    window.setTimeout(function () {
      buildFallbackToc();
      update();
    }, 600);
    window.setTimeout(function () {
      buildFallbackToc();
      update();
    }, 1400);
    window.addEventListener("resize", function () {
      placement = null;
      update();
    });
    window.addEventListener("load", update);
    window.refreshArticleToc = function () {
      placement = null;
      update();
    };
    if ("MutationObserver" in window) {
      var observer = new MutationObserver(applyPlacement);
      observer.observe(tocCol, { childList: true, subtree: true, characterData: true });
    }

    var toggle = document.querySelector(".site-nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        window.setTimeout(update, 280);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyShell);
  } else {
    applyShell();
  }
})();
