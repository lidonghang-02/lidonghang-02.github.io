---
---
{% assign blog_posts = site.pages | where_exp: "post", "post.path contains '2023/' or post.path contains '2024/'" | where_exp: "post", "post.ext == '.md'" | sort: "date" %}
window.BLOG_POSTS = [
{% for post in blog_posts %}
  {
    "title": {{ post.title | jsonify }},
    "path": {{ post.url | jsonify }},
    "date": {{ post.date | date: "%Y-%m-%d" | jsonify }},
    "category": {{ post.categories | default: "未分类" | jsonify }},
    "excerpt": {{ post.description | default: post.content | strip_html | strip_newlines | truncate: 200 | jsonify }}
  }{% unless forloop.last %},{% endunless %}
{% endfor %}
];
