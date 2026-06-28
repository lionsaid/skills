import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal-page-shell";
import { type Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/request-locale";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";

type PageProps = { locale: Locale };

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Terms of Service",
    path: "/legal/terms",
    description: getLocalizedDescription("en"),
  });
}

export async function TermsPageContent({ locale }: PageProps) {
  const zh = locale === "zh-CN";

  return (
    <LegalPageShell
      locale={locale}
      eyebrow={zh ? "服务条款" : "Terms"}
      title={zh ? "服务条款" : "Terms of Service"}
      intro={
        zh
          ? "这份页面说明你在使用 LionSaid Skills 这个技能检索目录时适用的基础规则。"
          : "This page explains the basic rules that apply when you use LionSaid Skills as a skills discovery directory."
      }
      updatedAt={zh ? "最后更新：2026 年 6 月 27 日" : "Last updated: June 27, 2026"}
    >
      {zh ? (
        <>
          <h2>服务性质</h2>
          <p>LionSaid Skills 是一个技能目录和发现工具，帮助用户按角色、任务、公司和来源查找公开 skill。它本身通常不是这些 skill 的原始作者或原始发布方。</p>

          <h2>允许使用方式</h2>
          <p>你可以正常浏览、搜索、筛选和打开站内收录的 skill 页面与外部来源链接。你不得利用本站从事违法活动、破坏站点稳定性，或以自动化方式恶意抓取、压垮服务。</p>
          <p>如果站点提供 cookie 选择或统计开关，你不应通过绕过界面或技术手段伪造、篡改或滥用这类机制。</p>

          <h2>外部内容</h2>
          <p>很多 skill 会指向 GitHub、官方文档或第三方网站。这些外部内容由对应发布方自行维护。你使用这些外部内容时，需要同时遵守对应来源自己的条款、许可和使用限制。</p>

          <h2>不保证持续可用</h2>
          <p>我们会尽量维护索引质量，但不承诺任意 skill、页面、标签、排序结果或外链始终准确、完整、及时或可访问。</p>

          <h2>知识产权</h2>
          <p>站内提到的 skill 名称、公司名称、Logo、商标和仓库内容，权利通常归原始发布方或权利人所有。未经授权，你不应把第三方内容当作自己的内容进行再分发或商用。</p>

          <h2>责任限制</h2>
          <p>本站提供的是发现和导航服务，不对第三方 skill 的质量、安全性、适用性、可维护性或结果负责。你在实际使用外部 skill、脚本、仓库或说明文档前，应自行判断风险。</p>

          <h2>条款变更</h2>
          <p>如果产品形态、功能边界或数据来源发生明显变化，这份条款也可能更新。更新后继续使用本站，通常意味着你接受更新后的版本。</p>
        </>
      ) : (
        <>
          <h2>Nature of the service</h2>
          <p>LionSaid Skills is a discovery directory that helps people find public skills by role, task, company, and source. It is generally not the original author or original publisher of those skills.</p>

          <h2>Permitted use</h2>
          <p>You may browse, search, filter, and open listed skill pages and external source links. You may not use the site for unlawful activity, to disrupt service stability, or to perform abusive automated scraping against the service.</p>
          <p>If the site provides cookie choices or analytics controls, you should not bypass, tamper with, or abuse those mechanisms through interface or technical workarounds.</p>

          <h2>External content</h2>
          <p>Many listed skills point to GitHub, official docs, or third-party sites. Those external resources are maintained by their respective publishers. When you use them, their own terms, licenses, and restrictions also apply.</p>

          <h2>No guarantee of continued availability</h2>
          <p>We try to maintain useful indexing quality, but we do not guarantee that any skill, page, label, ranking result, or outbound link will always be accurate, complete, current, or accessible.</p>

          <h2>Intellectual property</h2>
          <p>Skill names, company names, logos, trademarks, and repository content shown on the site generally belong to their original publishers or rights holders. You should not republish or commercially use third-party content as your own without permission.</p>

          <h2>Limitation of responsibility</h2>
          <p>This site provides discovery and navigation. It does not take responsibility for the quality, safety, suitability, maintainability, or outcomes of third-party skills, scripts, repositories, or documentation. You are responsible for evaluating risk before using them.</p>

          <h2>Changes to these terms</h2>
          <p>If the product, scope, or data sources materially change, these terms may be updated. Continued use of the site after updates generally means you accept the revised version.</p>
        </>
      )}
    </LegalPageShell>
  );
}

export default async function TermsPage() {
  return <TermsPageContent locale={await getRequestLocale()} />;
}
