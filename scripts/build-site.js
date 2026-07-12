const fs = require('fs');
const path = require('path');
const { marked } = require('../js/vendor/marked.umd.js');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const templatePath = path.join(root, 'reader.html');
const excludedTopLevel = new Set(['.git', '.github', '_site', 'scripts', 'AGENTS.md']);

function removeDirectory(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyTree(source, destination, topLevel = false) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (topLevel && excludedTopLevel.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyTree(from, to, false);
    else fs.copyFileSync(from, to);
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseMarkdown(source, fallbackTitle) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
  const frontMatter = match ? match[1] : '';
  const body = match ? source.slice(match[0].length) : source;
  const field = (name) => {
    const found = frontMatter.match(new RegExp('^' + name + ':\\s*(.+)$', 'm'));
    if (!found) return '';
    const value = found[1].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  };
  const list = (name) => {
    const found = frontMatter.match(new RegExp('^' + name + ':\\s*\\r?\\n((?:[ \\t]+-.*(?:\\r?\\n|$))*)', 'm'));
    if (!found) return [];
    return found[1].split(/\r?\n/).map((line) => line.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
  };
  return {
    title: field('title'),
    fallbackTitle,
    date: field('date'),
    category: field('categories'),
    tags: list('tags'),
    source: field('source'),
    description: field('description'),
    body
  };
}

function textStats(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|=-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = (text.replace(/[\u4e00-\u9fff]/g, ' ').match(/\b[\w-]+\b/g) || []).length;
  return { text, words: Math.max(1, cjk + latin) };
}

function replaceMeta(html, article, relativeDirectory) {
  const title = escapeHtml(article.title);
  const stats = textStats(article.body);
  const description = escapeHtml(article.description || stats.text.slice(0, 200));
  const date = (article.date || relativeDirectory.split('/').slice(0, 3).join('-')).slice(0, 10);
  const dateTime = article.date || date;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title} - LDH blog</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${description}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${title}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${description}">`);
  html = html.replace(/<meta property="article:published_time" content="[^"]*">/i, `<meta property="article:published_time" content="${escapeHtml(dateTime)}">`);
  html = html.replace(/<body(\s[^>]*)?>/i, (match) => match.replace(/>$/, ' data-article-compiled="true">'));
  html = html.replace(/<span id="subtitle"[^>]*>[\s\S]*?<\/span>/i, `<span id="subtitle" data-typed-text="${title}">${title}</span>`);
  html = html.replace(/<h1 id="seo-header">[\s\S]*?<\/h1>/i, `<h1 id="seo-header">${title}</h1>`);
  html = html.replace(/<time datetime="[^"]*" pubdate>[^<]*<\/time>/i, `<time datetime="${escapeHtml(dateTime)}" pubdate>${escapeHtml(date)}</time>`);
  html = html.replace(/<i class="iconfont icon-chart"><\/i>[\s\S]*?<\/span>/i, `<i class="iconfont icon-chart"></i> ${stats.words} 字</span>`);
  return html;
}

function renderArticle(template, markdownPath) {
  const directory = path.dirname(markdownPath);
  const relativeDirectory = path.relative(root, directory).split(path.sep).join('/');
  const source = fs.readFileSync(markdownPath, 'utf8');
  const article = parseMarkdown(source, path.basename(directory));
  const rendered = marked.parse(article.body, { gfm: true, breaks: false });
  let html = replaceMeta(template, { ...article, title: article.title || article.fallbackTitle }, relativeDirectory);
  const marker = /<!-- ARTICLE_CONTENT_START -->[\s\S]*?<!-- ARTICLE_CONTENT_END -->/;
  if (!marker.test(html)) throw new Error('reader.html is missing article content markers');
  html = html.replace(marker, `<!-- ARTICLE_CONTENT_START -->\n${rendered}\n<!-- ARTICLE_CONTENT_END -->`);
  const target = path.join(output, relativeDirectory, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, 'utf8');
  return {
    relativeDirectory,
    title: article.title,
    date: article.date,
    category: article.category,
    tags: article.tags,
    source: article.source,
    excerpt: article.description,
    path: '/' + relativeDirectory + '/',
    target
  };
}

function renderHomeCards(articles) {
  const homePath = path.join(output, 'index.html');
  let home = fs.readFileSync(homePath, 'utf8');
  const cards = articles
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.path.localeCompare(a.path))
    .map((article) => {
      const href = escapeHtml(encodeURI(article.path));
      const title = article.title ? `<h2 class="index-header"><a href="${href}" target="_self">${escapeHtml(article.title)}</a></h2>` : '';
      const excerpt = article.excerpt ? `<a class="index-excerpt index-excerpt__noimg" href="${href}" target="_self"><div>${escapeHtml(article.excerpt)}</div></a>` : '';
      const metadata = [];
      if (article.date) metadata.push(`<div class="post-meta mr-3"><i class="iconfont icon-date"></i><time datetime="${escapeHtml(article.date)}" pubdate>${escapeHtml(article.date)}</time></div>`);
      if (article.category) metadata.push(`<div class="post-meta mr-3"><i class="iconfont icon-category"></i><a href="/categories/${encodeURIComponent(article.category)}/">${escapeHtml(article.category)}</a></div>`);
      if (article.tags.length) metadata.push(`<div class="post-meta mr-3"><i class="iconfont icon-tags"></i>${article.tags.map((tag) => `<a class="site-post-tag" href="/tags/${encodeURIComponent(tag)}/">${escapeHtml(tag)}</a>`).join('<span aria-hidden="true">, </span>')}</div>`);
      if (article.source) metadata.push(`<div class="post-meta mr-3"><i class="iconfont icon-link"></i><a href="${escapeHtml(article.source)}" rel="noopener noreferrer">来源</a></div>`);
      return `  <div class="row mx-auto index-card csdn-exported-card">
    <article class="col-12 col-md-12 mx-auto index-info">
      ${title}
      ${excerpt}
      ${metadata.length ? `<div class="index-btm post-metas">${metadata.join('')}</div>` : ''}
    </article>
  </div>`;
    })
    .join('\n\n');
  const marker = /<!-- POST_LIST_START -->[\s\S]*?<!-- POST_LIST_END -->/;
  if (!marker.test(home)) throw new Error('index.html is missing post list markers');
  home = home.replace(marker, `<!-- POST_LIST_START -->\n${cards}\n<!-- POST_LIST_END -->`);
  fs.writeFileSync(homePath, home, 'utf8');
}

function injectRegistry(articles) {
  const registry = articles
    .map(({ title, path: articlePath, date, category, tags, source, excerpt }) => {
      const item = { path: articlePath };
      if (title) item.title = title;
      if (date) item.date = date;
      if (category) item.category = category;
      if (tags.length) item.tags = tags;
      if (source) item.source = source;
      if (excerpt) item.excerpt = excerpt;
      return item;
    })
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.path.localeCompare(b.path));
  fs.writeFileSync(path.join(output, 'js', 'post-registry.generated.js'), `window.BLOG_POSTS = ${JSON.stringify(registry, null, 2)};\n`, 'utf8');
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.name.endsWith('.html')) {
        let html = fs.readFileSync(target, 'utf8');
        if (html.includes('/js/site-shell.js') && !html.includes('/js/post-registry.generated.js')) {
          html = html.replace(/(<script\s+defer\s+src="\/js\/site-shell\.js)/i, '<script defer src="/js/post-registry.generated.js"></script>\n  $1');
          fs.writeFileSync(target, html, 'utf8');
        }
      }
    }
  };
  visit(output);
}

function findArticles(year) {
  const start = path.join(root, year);
  if (!fs.existsSync(start)) return [];
  const results = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.name === 'index.md') results.push(target);
    }
  };
  visit(start);
  return results;
}

removeDirectory(output);
copyTree(root, output, true);
fs.writeFileSync(path.join(output, '.nojekyll'), '', 'utf8');

const template = fs.readFileSync(templatePath, 'utf8');
const articles = [...findArticles('2023'), ...findArticles('2024')].map((file) => renderArticle(template, file));
if (!articles.length) throw new Error('No Markdown articles found');
renderHomeCards(articles);
injectRegistry(articles);
console.log(`Built ${articles.length} Markdown articles into ${output}`);
