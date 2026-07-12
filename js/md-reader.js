(function () {
  'use strict';
  window.MdReaderReady = true;

  function parseDocument(source) {
    var title = '';
    var body = source;
    var match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
    if (match) {
      var titleMatch = match[1].match(/^title:\s*(.+)$/m);
      title = titleMatch ? titleMatch[1].trim() : '';
      body = source.slice(match[0].length);
    }
    return { title: title, body: body };
  }

  function syncTitle(title) {
    if (!title) return;
    var seo = document.querySelector('#seo-header');
    var subtitle = document.querySelector('#subtitle');
    if (seo) seo.textContent = title;
    if (subtitle) {
      subtitle.setAttribute('data-typed-text', title);
      subtitle.textContent = title;
    }
    document.title = title + ' - LDH blog';
  }

  function syncWordCount(container) {
    var text = container.textContent.replace(/\s+/g, ' ').trim();
    var cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    var latin = (text.replace(/[\u4e00-\u9fff]/g, ' ').match(/\b[\w-]+\b/g) || []).length;
    var words = Math.max(1, cjk + latin);
    var wordNode = document.querySelector('#banner .site-post-words');
    if (wordNode) wordNode.innerHTML = '<i class="iconfont icon-chart"></i> ' + words + ' 字';
  }

  function buildToc(container) {
    var tocBody = document.querySelector('#toc-body');
    if (!tocBody) return;
    var used = Object.create(null);
    var list = document.createElement('ol');
    list.className = 'tocbot-list';
    container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function (heading, index) {
      var base = heading.textContent.trim().replace(/\s+/g, '-').replace(/[^\w\u3400-\u9fff-]/g, '') || 'section-' + index;
      var id = base;
      var suffix = 2;
      while (used[id]) id = base + '-' + suffix++;
      used[id] = true;
      heading.id = id;
      var item = document.createElement('li');
      item.className = 'toc-list-item';
      var link = document.createElement('a');
      link.className = 'tocbot-link';
      link.href = '#' + encodeURIComponent(id);
      link.textContent = heading.textContent.trim();
      link.addEventListener('click', function (event) {
        event.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(history.state, document.title, window.location.pathname + window.location.search + '#' + encodeURIComponent(id));
      });
      item.appendChild(link);
      list.appendChild(item);
    });
    tocBody.replaceChildren(list);
  }

  function markdownUrl() {
    var path = window.location.pathname;
    if (!/^\/20\d{2}\//.test(path)) return null;
    return path.replace(/index\.html$/, '').replace(/\/?$/, '/') + 'index.md';
  }

  function loadMarkdown() {
    if (document.body && document.body.getAttribute('data-article-compiled') === 'true') return;
    var url = markdownUrl();
    var container = document.querySelector('.post-content .markdown-body');
    if (!url || !container || !window.marked) return;
    var token = url;
    container.setAttribute('aria-busy', 'true');
    fetch(url, { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(function (source) {
        if (markdownUrl() !== token) return;
        var article = parseDocument(source);
        container.innerHTML = window.marked.parse(article.body, { gfm: true, breaks: false });
        container.removeAttribute('aria-busy');
        syncTitle(article.title);
        syncWordCount(container);
        buildToc(container);
        if (window.refreshArticleToc) window.refreshArticleToc();
        [200, 700, 1700].forEach(function (delay) {
          window.setTimeout(function () {
            if (markdownUrl() === token) syncTitle(article.title);
          }, delay);
        });
        document.dispatchEvent(new CustomEvent('markdown:rendered', { detail: { container: container } }));
      })
      .catch(function (error) {
        container.removeAttribute('aria-busy');
        container.innerHTML = '<p class="md-reader-error">文章加载失败，请稍后重试。</p>';
        console.error('[md-reader]', error);
      });
  }

  window.loadMarkdownArticle = loadMarkdown;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMarkdown);
  } else {
    loadMarkdown();
  }
  document.addEventListener('site:navigated', loadMarkdown);
})();
