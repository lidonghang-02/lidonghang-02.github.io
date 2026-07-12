const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function visit(directory, results) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(target, results);
    else if (entry.name === 'index.md') results.push(target);
  }
}

const files = [];
for (const year of ['2023', '2024']) visit(path.join(root, year), files);

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error(`Invalid front matter: ${path.relative(root, file)}`);
  const relative = path.relative(root, file).split(path.sep);
  let frontMatter = match[1];
  const titleMatch = frontMatter.match(/^title:\s*(.+)$/m);
  if (!titleMatch) throw new Error(`Missing title: ${path.relative(root, file)}`);
  const title = titleMatch[1].trim().replace(/^['"]|['"]$/g, '');
  frontMatter = frontMatter.replace(/^title:\s*.+$/m, `title: ${JSON.stringify(title)}`);
  if (!/^date:/m.test(frontMatter)) {
    frontMatter += `\ndate: ${relative[0]}-${relative[1]}-${relative[2]} 00:00:00`;
  }
  if (!/^categories:/m.test(frontMatter)) {
    frontMatter += '\ncategories: 未分类';
  }
  const normalized = `---\n${frontMatter}\n---\n${source.slice(match[0].length)}`;
  fs.writeFileSync(file, normalized, 'utf8');
}

console.log(`Normalized ${files.length} Markdown front matter blocks`);

const homePath = path.join(root, 'index.html');
const home = fs.readFileSync(homePath, 'utf8').replace(/^\s*(---\r?\n---)/, '$1');
fs.writeFileSync(homePath, home, 'utf8');
