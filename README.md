# The Plan

The Plan 复现了《DDE》短片中出现的网站，包括搜索首页、外星人变身教程和彩蛋页面。静态网页从 `main` 分支发布到 GitHub Pages。[访问线上站点](https://dde-404.github.io/theplan/)

## 本地预览

在仓库根目录启动本地服务器。

```sh
python3 -m http.server 8000
```

在首页搜索 `Alien transformation tutorial`，即可经过加载页进入教程。[打开本地首页](http://localhost:8000/)

- `index.html` 是搜索首页，关键词和跳转规则在 `search.js`。
- `loading.html` 预加载教程资源，随后跳转到 `tutorial.html`。动图加载在 `tutorial-media.js`。
- 页面使用的图片、动图和视频放在 `assets/`。

## 留言服务

线上留言由 ChatGPT Sites 托管，服务地址在 `tutorial.html` 的 `data-api-url` 属性里。需要独立部署时，可以使用 `comments-worker/` 中的 Cloudflare Worker 和 D1 数据库。[留言管理与部署说明](comments-worker/README.md)

## 历史文件

`ThePlan.zip` 是早期网页原型的存档。根目录的三张 `P*_preview.png` 是设计参考图。当前完整代码和素材以 `main` 分支为准。[下载当前版本](https://github.com/DDE-404/theplan/archive/refs/heads/main.zip)
