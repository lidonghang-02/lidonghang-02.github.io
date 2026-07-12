---
---
{% assign blog_posts = site.pages | sort: "path" %}
window.BLOG_POSTS = [
{% for post in blog_posts %}
{% if post.path contains 'index.md' and post.path contains '2023/' or post.path contains 'index.md' and post.path contains '2024/' %}
  {
    "title": {{ post.title | jsonify }},
    "path": {{ post.url | jsonify }}{% if post.date %},
    "date": {{ post.date | date: "%Y-%m-%d %H:%M:%S" | jsonify }}{% endif %}{% if post.categories %},
    "category": {{ post.categories | jsonify }}{% endif %}{% if post.tags %},
    "tags": {{ post.tags | jsonify }}{% endif %}{% if post.source %},
    "source": {{ post.source | jsonify }}{% endif %}{% if post.description %},
    "excerpt": {{ post.description | jsonify }}{% endif %}
  },
{% endif %}
{% endfor %}
  {}
];
