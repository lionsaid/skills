# LionSaid Skills Web

LionSaid Skills Web 是 `LionSaid Skills` 的网站前端和数据生成工程。

这个应用的目标不是让用户继续去 GitHub、官方站点和 marketplace 自己翻，而是先把 skill 整理成一个更容易搜索、筛选和理解的目录入口。

## 主要功能

- 首页按角色、任务、公司推荐 skill
- `/skills` 支持搜索、筛选和浏览
- `/roles` 支持按角色查看推荐 skill
- `/publishers/[slug]` 支持按发布方聚合浏览
- `/skills/[slug]` 提供 skill 详情、来源、安装方式和相关推荐
- 支持简体中文 / 英文切换
- 支持本地发布方 logo 和 GitHub 作者头像

## 数据来源

当前 skill 数据来自多来源聚合：

- 本地 curated README
- GitHub README 镜像
- 官方 skill 站点索引页
- marketplace API / 索引站
- GitHub 仓库扩展缓存
- 本地人工覆盖配置

网站不会直接把所有来源原样展示出来，而是会做统一清洗、去重、分类、角色匹配和来源分层。

## 目录结构

```text
awesome-agent-skills-web/
├── config/                 数据来源、角色、规则配置
├── public/                 本地 logo、静态资源
├── scripts/                数据生成、校验、刷新脚本
├── src/
│   ├── app/                Next.js App Router 页面
│   ├── components/         组件
│   ├── data/               生成后的数据文件
│   └── lib/                查询、筛选、文案、工具函数
├── package.json
└── README.md
```

## 本地开发

```bash
pnpm install
pnpm dev
```

默认地址：

```bash
http://localhost:3000
```

## 常用命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm generate:data
pnpm generate:repo-stats
pnpm validate:roles
pnpm audit:roles
pnpm audit:recommendations
pnpm refresh:publisher-logos
pnpm refresh:github-cache
pnpm refresh:all
```

说明：

- `generate:data`
  重新生成 skill 数据，并自动执行角色校验和角色审计导出
- `generate:repo-stats`
  更新仓库 star / fork 等统计
- `validate:roles`
  校验角色页推荐是否缺项、过少或过于单一
- `audit:roles`
  导出每个角色的前 10 推荐结果，方便人工复核
- `audit:recommendations`
  输出目录与角色推荐质量报告，包括缺描述率、近似重复率、Top 10 来源多样性、可信来源占比、风险标记占比和每个角色的人工复核队列；人工结论保存在 `config/recommendation-review.json`，以角色 slug 为第一层、skill slug 为第二层，状态可选 `relevant`、`borderline` 或 `not-relevant`，并可附带 `note`
- `refresh:publisher-logos`
  按规则刷新本地发布方 logo
- `refresh:github-cache`
  刷新 GitHub skill 仓库扩展缓存
- `refresh:all`
  一次更新主要数据、仓库统计和 logo

## 当前约束

- 用户可见文案优先使用面向普通用户的表达，不写工程说明口吻
- 发布方 logo 优先展示企业 / 官方发布方
- 没有本地 logo 的发布方，不默认退回成字母占位
- 角色页推荐不只追求“有结果”，更要保证结果和角色真的相关

## 后续重点

- 继续扩充多来源 skill 数据
- 提高角色页和任务页推荐准确度
- 收紧社区来源和 marketplace 的展示策略
- 持续补齐高质量企业发布方 logo
- 继续统一中英文文案
