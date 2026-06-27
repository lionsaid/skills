import { LegalPageShell } from "@/components/legal-page-shell";
import { getRequestLocale } from "@/lib/request-locale";

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const zh = locale === "zh-CN";

  return (
    <LegalPageShell
      locale={locale}
      eyebrow={zh ? "隐私政策" : "Privacy"}
      title={zh ? "隐私政策" : "Privacy Policy"}
      intro={
        zh
          ? "这份页面说明 LionSaid Skills 会收集什么、不会收集什么，以及我们如何处理你在站内的基本使用信息。"
          : "This page explains what LionSaid Skills collects, what it does not collect, and how basic usage information is handled."
      }
      updatedAt={zh ? "最后更新：2026 年 6 月 27 日" : "Last updated: June 27, 2026"}
    >
      {zh ? (
        <>
          <h2>我们收集什么</h2>
          <p>当前站点主要是一个技能检索目录。我们不会要求你注册账号，也不会要求你提交身份证明、支付信息或敏感个人资料。</p>
          <p>站点目前会保存少量与你的界面体验有关的信息，例如语言偏好 cookie，以及浏览器本地保存的主题设置。</p>

          <h2>我们如何使用这些信息</h2>
          <p>这些信息只用于让页面记住你的显示偏好，例如中英文切换和浅色 / 深色模式，不用于广告投放，也不会用于出售用户画像。</p>
          <p>如果你明确同意统计 cookie，我们还会加载 Google Analytics，用于了解基础访问趋势和页面使用情况；如果你拒绝，相关统计脚本不会加载。</p>

          <h2>第三方来源与外链</h2>
          <p>站内收录的 skill 来自 GitHub、官方站点和其他公开来源。你点击跳转到外部网站后，将受对应网站自己的隐私政策和条款约束。</p>

          <h2>日志与基础技术信息</h2>
          <p>和大多数网站一样，托管平台、CDN 或服务器可能会记录基础访问日志，例如请求时间、IP、浏览器类型和错误信息。这类数据主要用于安全、稳定性和故障排查。</p>

          <h2>Cookie 与本地存储</h2>
          <p>当前站点至少会用到以下本地数据：</p>
          <ul>
            <li>语言偏好 cookie，用于记住你选择的是英文还是简体中文。</li>
            <li>浏览器本地存储，用于记住浅色或深色主题。</li>
            <li>cookie 同意状态，用于记住你是否允许统计类 cookie。</li>
          </ul>
          <p>必要 cookie 会默认启用，因为它们直接关系到语言、主题和基础体验。统计类 cookie 只有在你明确同意后才会启用。</p>

          <h2>Google Analytics</h2>
          <p>如果你同意统计类 cookie，本站会加载 Google Analytics，用于了解页面访问趋势、流量来源和基础使用情况。我们使用这类数据来判断哪些页面更有帮助、哪些入口更常被使用，以及站点是否存在明显的体验问题。</p>
          <p>如果你拒绝统计类 cookie，Google Analytics 不会被加载。</p>

          <h2>如何管理你的选择</h2>
          <p>你可以在首次访问时通过 cookie 横幅决定是否同意统计。之后也可以通过页脚里的 “Cookie 设置” 重新打开设置，并再次调整这个决定。</p>

          <h2>儿童隐私</h2>
          <p>本网站不是面向儿童设计的。如果你认为有未成年人向本站提供了不应提供的信息，请通过 lionsaid@aliyun.com 联系我们处理。</p>

          <h2>政策更新</h2>
          <p>如果后续我们新增账号系统、分析服务、邮件订阅或其他会影响隐私处理方式的功能，这份页面会同步更新。</p>

          <h2>联系方式</h2>
          <p>如果你对隐私、cookie、统计脚本或数据处理方式有疑问，可以通过 lionsaid@aliyun.com 联系我们。</p>
        </>
      ) : (
        <>
          <h2>What we collect</h2>
          <p>LionSaid Skills is currently a discovery directory. We do not ask you to create an account, submit identity documents, or provide payment details or other sensitive personal information.</p>
          <p>The site currently stores a small amount of preference data related to your interface experience, such as a locale cookie and a browser theme preference.</p>

          <h2>How we use it</h2>
          <p>This information is used only to remember display preferences such as language and light or dark mode. It is not used for ad targeting or sold as user profile data.</p>
          <p>If you explicitly allow analytics cookies, we also load Google Analytics to understand basic traffic and page usage trends. If you reject analytics, that script is not loaded.</p>

          <h2>Third-party sources and outbound links</h2>
          <p>Skills listed here come from GitHub, official sites, and other public sources. Once you leave this site, the privacy policies and terms of the destination site apply.</p>

          <h2>Logs and basic technical data</h2>
          <p>Like most websites, the hosting platform, CDN, or server may record basic request logs such as request time, IP address, browser type, and error information. This is mainly used for security, stability, and troubleshooting.</p>

          <h2>Cookies and local storage</h2>
          <p>The site currently uses local data at least for the following:</p>
          <ul>
            <li>A locale cookie to remember whether you prefer English or Simplified Chinese.</li>
            <li>Browser local storage to remember light or dark theme preference.</li>
            <li>A consent cookie to remember whether you allow analytics cookies.</li>
          </ul>
          <p>Essential cookies are enabled by default because they are directly tied to language, theme, and basic site experience. Analytics cookies are enabled only if you explicitly allow them.</p>

          <h2>Google Analytics</h2>
          <p>If you allow analytics cookies, the site loads Google Analytics to understand traffic trends, referral sources, and basic usage patterns. We use that information to understand which pages are more useful, which entry points are used more often, and whether there are obvious usability issues.</p>
          <p>If you reject analytics cookies, Google Analytics is not loaded.</p>

          <h2>How to manage your choice</h2>
          <p>You can decide whether to allow analytics through the cookie banner shown on first visit. You can also reopen the setting later through the “Cookie Settings” entry in the footer and change your choice again.</p>

          <h2>Children&apos;s privacy</h2>
          <p>This site is not designed for children. If you believe a minor has provided information that should not have been provided here, contact us at lionsaid@aliyun.com and we will review it.</p>

          <h2>Policy updates</h2>
          <p>If the product later adds accounts, analytics, email subscriptions, or other features that change how data is handled, this page will be updated.</p>

          <h2>Contact</h2>
          <p>If you have questions about privacy, cookies, analytics, or how data is handled on this site, contact us at lionsaid@aliyun.com.</p>
        </>
      )}
    </LegalPageShell>
  );
}
