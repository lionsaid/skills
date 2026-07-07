import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { DelayedRouteLink } from "@/components/delayed-skill-link";
import { prefixLocalePath, type Locale } from "@/lib/i18n";

const footerColumns = [
  {
    title: "Explore",
    items: [
      { label: "Browse Skills", href: "/skills" },
      { label: "Featured skills", href: "/skills?sort=featured" },
      { label: "Official teams", href: "/skills?kind=official" },
      { label: "Community picks", href: "/skills?kind=community" },
    ],
  },
  {
    title: "Publishers",
    items: [
      { label: "Anthropics", href: "/skills?publisher=anthropics" },
      { label: "OpenAI", href: "/skills?publisher=openai" },
      { label: "NVIDIA", href: "/skills?publisher=nvidia" },
      { label: "All publishers", href: "/skills" },
    ],
  },
  {
    title: "Source",
    items: [
      { label: "GitHub", href: "https://github.com/lionsaid/skills" },
      { label: "How it works", href: "https://github.com/lionsaid/skills/blob/main/README.md" },
      { label: "Main site", href: "https://skill.lionsaid.com" },
    ],
  },
  {
    title: "About",
    items: [
      { label: "About us", href: "/about" },
      { label: "Updates", href: "/updates" },
      { label: "Other products", href: "/more" },
    ],
  },
  {
    title: "Support",
    items: [{ label: "Donate", href: "/donate" }],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Disclaimer", href: "/legal/disclaimer" },
      { label: "Cookie Settings", href: "#cookie-settings" },
    ],
  },
];

function translateFooterLabel(locale: Locale, label: string) {
  if (locale !== "zh-CN") {
    return label;
  }

  const translations: Record<string, string> = {
    "Browse Skills": "浏览全部 skill",
    "Featured skills": "精选 skill",
    "Official teams": "官方出品",
    "Community picks": "社区整理",
    "All publishers": "全部公司",
    GitHub: "GitHub",
    "How it works": "了解更多",
    "Main site": "主站",
    "About us": "关于我们",
    "Other products": "其他产品",
    Updates: "更新历史",
    "Privacy Policy": "隐私政策",
    "Terms of Service": "服务条款",
    Disclaimer: "免责声明",
    Donate: "捐助",
    "Cookie Settings": "Cookie 设置",
  };

  return translations[label] ?? label;
}

function translateFooterTitle(locale: Locale, title: string) {
  if (locale !== "zh-CN") {
    return title;
  }

  const translations: Record<string, string> = {
    Explore: "开始找",
    Publishers: "公司",
    Source: "更多来源",
    About: "关于",
    Support: "支持",
    Legal: "法律",
  };

  return translations[title] ?? title;
}

export function SiteFooter({ locale = "en" }: { locale?: Locale }) {
  const localize = (path: string) => prefixLocalePath(path, locale);

  return (
    <footer className="site-footer mt-10 overflow-hidden">
      <div className="page-shell relative py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:items-start">
          <div>
            <p className="eyebrow text-[color:var(--footer-muted)]">
              {locale === "zh-CN" ? "继续浏览" : "Keep exploring"}
            </p>
            <h2 className="display mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-[5.25rem]">
              {locale === "zh-CN"
                ? "想找能直接用的 skill，先从这里开始。"
                : "Start here when you want a skill that can help right away."}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--footer-muted)]">
              {locale === "zh-CN"
                ? "按任务、角色或公司开始找，先看到更适合你的选择。"
                : "Browse by task, role, or company, and get to the right options sooner."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <DelayedRouteLink
                className="action-primary inline-flex min-w-[10rem] items-center justify-center whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition"
                href={localize("/skills")}
              >
                {locale === "zh-CN" ? "开始找 skill" : "Search skills"}
              </DelayedRouteLink>
              <DelayedRouteLink
                className="action-secondary inline-flex min-w-[10rem] items-center justify-center whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition"
                href={localize("/skills?sort=featured")}
              >
                {locale === "zh-CN" ? "看看精选 skill" : "See featured skills"}
              </DelayedRouteLink>
            </div>
          </div>
        </div>

        <div className="mt-14 grid justify-items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title} className="footer-rule w-full border-t pt-6 text-left">
              <p className="eyebrow text-[color:var(--footer-muted)]">
                {translateFooterTitle(locale, column.title)}
              </p>
              <div className="mt-4 grid justify-items-start gap-3">
                {column.items.map((item) =>
                  item.href.startsWith("http") ? (
                    <a
                      key={item.label}
                      className="footer-link text-sm transition"
                      href={item.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {translateFooterLabel(locale, item.label)}
                    </a>
                  ) : (
                    item.label === "Cookie Settings" ? (
                      <CookieSettingsButton
                        key={item.label}
                        label={locale === "zh-CN" ? "Cookie 设置" : item.label}
                      />
                    ) : (
                      <DelayedRouteLink
                        key={item.label}
                        className="footer-link text-sm transition"
                        href={localize(item.href)}
                      >
                        {translateFooterLabel(locale, item.label)}
                      </DelayedRouteLink>
                    )
                ),
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-rule mt-14 flex flex-col gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>skill.lionsaid.com</p>
          <p>{locale === "zh-CN" ? "帮你更快找到能直接用的 skill。" : "A faster way to find skills you can use right away."}</p>
        </div>

        <div
          aria-hidden="true"
          className="footer-watermark pointer-events-none select-none pt-10 text-[clamp(4.5rem,15vw,12rem)] font-semibold leading-none tracking-[-0.08em]"
        >
          LionSaid
        </div>
      </div>
    </footer>
  );
}
