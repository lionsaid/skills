import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";
import { type Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/request-locale";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";

type PageProps = { locale: Locale };

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Disclaimer",
    path: "/legal/disclaimer",
    description: getLocalizedDescription("en"),
  });
}

export async function DisclaimerPageContent({ locale }: PageProps) {
  const zh = locale === "zh-CN";

  return (
    <LegalPageShell
      locale={locale}
      eyebrow={zh ? "免责声明" : "Disclaimer"}
      title={zh ? "免责声明与来源说明" : "Disclaimer and Source Notice"}
      intro={
        zh
          ? "这份页面解释本站如何收录 skill、来源标签是什么意思，以及为什么这些内容不应被理解为官方背书或使用保证。"
          : "This page explains how skills are indexed, what source labels mean, and why listings should not be treated as guarantees or endorsements."
      }
      updatedAt={zh ? "最后更新：2026 年 6 月 27 日" : "Last updated: June 27, 2026"}
    >
      {zh ? (
        <>
          <h2>我们做的事情</h2>
          <p>LionSaid Skills 的作用是帮助用户更快找到可能有用的 skill。我们会把公开来源里的 skill 做整理、归类、标签化和检索展示。</p>

          <h2>我们不是什么</h2>
          <p>除非页面明确说明，否则本站不是这些 skill 的原始作者、原始维护者，也不代表对应公司、开源组织或个人发布者。</p>

          <h2>来源标签是什么意思</h2>
          <ul>
            <li>官方出品：表示该 skill 更接近官方团队或官方站点来源，但不代表你在任何场景下都一定适用。</li>
            <li>人工整理：表示内容来自人工维护或整理过的来源，不代表完整审核。</li>
            <li>社区 / 请自行判断：表示它可能来自公开社区、市场或开放仓库，使用前应自行评估。</li>
          </ul>

          <h2>关于准确性与时效性</h2>
          <p>我们会持续更新索引，但不能保证所有 skill 的标题、说明、角色归类、任务归类、stars、Logo、作者头像、外链状态或适配建议始终正确。</p>
          <p>站内的来源标签、推荐结果和统计展示会随着公开来源变化、数据刷新和人工规则调整而变化，因此它们应被理解为辅助信息，而不是长期不变的事实陈述。</p>

          <h2>关于排名与推荐</h2>
          <p>站内的推荐、角色页 starter pack、任务排序、热门结果和精选结果，都只是为了帮助用户更快开始，不构成专业建议、采购建议、法律建议或官方背书。</p>

          <h2>关于 Logo、商标与名称</h2>
          <p>站内展示的公司名称、仓库名称、Logo、商标和头像，仅用于来源识别与导航。相关权利归原始权利人所有。如果权利人希望更正或移除相关展示，可通过 lionsaid@aliyun.com 联系处理。</p>

          <h2>使用风险</h2>
          <p>部分 skill 可能会要求执行脚本、安装依赖、访问外部 API、处理敏感数据，或在开发 / 生产环境中运行。你应在自己的环境中先审查其来源、代码、权限和安全性，再决定是否使用。</p>
        </>
      ) : (
        <>
          <h2>What this site does</h2>
          <p>LionSaid Skills exists to help people find useful skills faster. It indexes public skills, then organizes, tags, and presents them in a more searchable way.</p>

          <h2>What this site is not</h2>
          <p>Unless a page explicitly says otherwise, this site is not the original author or original maintainer of those skills, and it does not speak for the company, open source project, or individual that published them.</p>

          <h2>What source labels mean</h2>
          <ul>
            <li>Official means the listing appears closer to an official team or official site source, not that it is guaranteed to fit your use case.</li>
            <li>Reviewed source means the listing came from a human-maintained or curated source, not that every detail has been fully verified.</li>
            <li>Community or use-with-care means the listing may come from public community, marketplace, or open repository sources and should be evaluated before use.</li>
          </ul>

          <h2>Accuracy and freshness</h2>
          <p>We keep the index updated, but we do not guarantee that titles, descriptions, role mappings, task mappings, stars, logos, creator avatars, outbound links, or fit recommendations are always correct or current.</p>
          <p>Source labels, recommendations, and stats shown on the site may change as public sources change, data refreshes run, and manual rules are updated. They should be treated as helpful guidance, not permanent factual guarantees.</p>

          <h2>Ranking and recommendations</h2>
          <p>Featured picks, role starter packs, task ordering, and recommendation rankings are meant to help users start faster. They are not professional advice, purchasing advice, legal advice, or formal endorsement.</p>

          <h2>Logos, trademarks, and names</h2>
          <p>Company names, repository names, logos, trademarks, and avatars are shown for source identification and navigation. Rights remain with the original rights holders. If a rights holder wants a correction or removal, they should contact us at lionsaid@aliyun.com.</p>

          <h2>Use at your own risk</h2>
          <p>Some skills may ask you to run scripts, install dependencies, access external APIs, handle sensitive data, or operate in development or production environments. You should review source, code, permissions, and security before deciding to use them.</p>
        </>
      )}
    </LegalPageShell>
  );
}

export default async function DisclaimerPage() {
  return <DisclaimerPageContent locale={await getRequestLocale()} />;
}
