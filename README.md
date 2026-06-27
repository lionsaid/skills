# LionSaid Skills

LionSaid Skills 是一个帮助用户更快找到合适 AI skill 的目录网站。

它不要求用户先去 GitHub、官方站点或 marketplace 到处翻。用户可以先按角色、任务、公司或关键词找到合适的 skill，再决定要不要打开原始来源。

当前仓库主要包含：

- `awesome-agent-skills-web/`
  当前网站前端与数据生成脚本
- `README.md`
  当前项目说明

## 当前产品定位

这个项目不是“收集一大堆 skill 链接”这么简单。

我们现在在做的是一个更适合普通用户使用的 skill 发现入口：

- 先帮用户缩小范围，而不是让用户自己去读大仓库
- 优先展示更可信、信息更完整的 skill
- 支持按角色、任务、公司和关键词查找
- 尽量把 logo、作者头像、发布方信息和基础说明补齐
- 把多来源 skill 数据整理成统一目录，而不是让用户自己去各站搜索

## 主要能力

- 首页按角色、任务、发布方推荐 skill
- `/skills` 支持搜索、筛选和浏览
- `/roles` 支持按角色聚合推荐
- `/publishers/[slug]` 支持按发布方浏览
- `/skills/[slug]` 提供 skill 详情、来源、安装入口和相关推荐
- 支持简体中文 / 英文切换
- 支持亮色 / 暗色模式
- 支持本地 logo、发布方头像、仓库头像等增强信息

## 数据来源

当前数据不是单一来源，而是聚合整理后的结果，主要覆盖：

- GitHub skill 仓库与 README
- 官方 skill 站点
- marketplace / 索引站
- 远程 HTML 页面解析结果
- 本地补充的人工配置与 curated 数据

项目里已经加入了数据扩展和缓存逻辑，用来持续补充 skill、发布方 logo 和仓库信息。

## 本地开发

进入前端目录后启动：

```bash
cd awesome-agent-skills-web
pnpm install
pnpm dev
```

默认访问：

```bash
http://localhost:3000
```

## 常用命令

在 `awesome-agent-skills-web/` 目录下执行：

```bash
pnpm dev
pnpm build
pnpm lint
```

数据相关：

```bash
pnpm generate:data
pnpm generate:repo-stats
pnpm validate:roles
pnpm refresh:publisher-logos
pnpm refresh:github-cache
pnpm refresh:all
```

说明：

- `generate:data`
  重新生成 skill 数据，并自动校验角色结果
- `generate:repo-stats`
  更新仓库 star / fork 等统计
- `validate:roles`
  校验角色页推荐是否合理
- `refresh:publisher-logos`
  更新本地发布方 logo
- `refresh:github-cache`
  刷新 GitHub 扩展缓存
- `refresh:all`
  一次更新主要数据、repo stats 和 logo

## 当前目录结构

```text
skills/
├── awesome-agent-skills-web/
│   ├── public/
│   ├── scripts/
│   ├── src/
│   └── package.json
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## 当前重点

这个项目当前重点不是“把 README 做成 awesome list”，而是把网站本身做成真正可用的 skill 发现产品。

主要方向包括：

- 继续扩充和清洗多来源 skill 数据
- 提高角色页和任务页推荐准确度
- 优先展示更可信、更适合普通用户理解的信息
- 持续补全发布方 logo、作者头像和来源信息
- 优化中文和英文用户可见文案
- 持续打磨移动端与桌面端体验

## 备注

如果你看到仓库里还有旧的上游文案、旧品牌或不符合当前产品定位的说明，那就是待清理内容，不代表当前产品方向。
