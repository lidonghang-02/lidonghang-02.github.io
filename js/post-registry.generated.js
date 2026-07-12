---
---
{% assign blog_posts = site.pages | sort: "path" %}
window.BLOG_POSTS = [
{% for post in blog_posts %}
{% if post.path contains 'index.md' and post.path contains '2023/' or post.path contains 'index.md' and post.path contains '2024/' %}
  {
    "title": {{ post.title | jsonify }},
    "path": {{ post.url | jsonify }},
    "date": {{ post.date | date: "%Y-%m-%d" | jsonify }},
    "category": {{ post.categories | default: "未分类" | jsonify }},
    "excerpt": {{ post.description | default: post.content | strip_html | strip_newlines | truncate: 200 | jsonify }}
  },
{% endif %}
{% endfor %}
  {}
];
