# Tutorial 留言管理

## 线上管理

打开 [ThePlan 留言管理](https://theplan-dde-comments.tenacioushill2.chatgpt.site/admin)，使用拥有 ThePlan 留言服务的 ChatGPT 账号登录。可以逐条删除留言。要清空全部，在管理页输入「清空」确认。

## 独立部署

在 `comments-worker` 目录，用拥有 Cloudflare Workers 和 D1 权限的账号登录 Wrangler。创建 `theplan-tutorial-comments` 数据库，把返回的数据库 ID 填进 `wrangler.jsonc` 的 `database_id`，然后应用数据库迁移并部署。

```sh
npx wrangler d1 create theplan-tutorial-comments
npx wrangler d1 migrations apply theplan-tutorial-comments --remote
npx wrangler deploy
```

把部署返回的 HTTPS 地址加上 `/comments`，填入 `tutorial.html` 的 `data-api-url`。`SITE_ORIGIN` 是 GitHub Pages 的来源地址，换域名时需要同步修改。

## 自托管数据库删帖

登录 Cloudflare，在 **Workers & Pages → D1 → theplan-tutorial-comments → Console** 查看留言编号。

```sql
SELECT id, body, created_at FROM tutorial_comments ORDER BY created_at DESC LIMIT 50;
```

把下面的 `留言编号` 替换成要删的那条编号再执行。清空整个留言区时可以执行 `DELETE FROM tutorial_comments;`。

```sql
DELETE FROM tutorial_comments WHERE id = '留言编号';
```

每条留言保存正文、发布时间、留言编号和删除钥匙的 SHA-256 摘要。游客的原始钥匙保存在发帖的浏览器里。留言数据库不存访客账号、IP 地址或设备指纹。
