import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { prefixLocalePath, type Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/request-locale";
import { buildMetadata, getLocalizedDescription } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Donate",
    path: "/donate",
    description: getLocalizedDescription("en"),
  });
}

type PageProps = { locale: Locale };

export async function DonatePageContent({ locale }: PageProps) {
  const zh = locale === "zh-CN";

  return (
    <main className="grain flex flex-1 flex-col overflow-x-hidden pb-28 sm:pb-0">
      <section className="hero-grid relative overflow-hidden py-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-orb absolute left-[10%] top-4 h-72 w-72 rounded-full bg-[rgba(225,6,0,0.14)] blur-3xl" />
          <div className="hero-orb absolute right-[8%] top-24 h-80 w-80 rounded-full bg-[rgba(13,23,38,0.12)] blur-3xl [animation-delay:1.3s]" />
        </div>

        <SiteHeader currentPath="/" locale={locale} />

        <div className="page-shell py-8 lg:py-12">
          <div className="glass overflow-hidden rounded-[2.4rem] border border-[var(--border-soft)] p-6 sm:p-8 lg:p-10">
            <div className="max-w-3xl">
              <p className="eyebrow text-[var(--accent)]">{zh ? "捐助" : "Donate"}</p>
              <h1 className="display mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-[3.4rem] lg:text-[3.9rem]">
                {zh ? "如果这个目录帮到了你，欢迎随手支持一下。" : "If this directory helps you, a small donation goes a long way."}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--ink-muted)] sm:text-lg">
                {zh
                  ? "我们会继续把 skill 整理得更好，尽量让你少跑去 GitHub 里翻。捐助是完全可选的，扫码即可。"
                  : "We keep improving the directory so you can find useful skills without digging through GitHub. Donations are optional and can be sent by scanning a code below."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--ink-muted)]">
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2">
                  {zh ? "本地二维码" : "Local QR codes"}
                </span>
                <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2">
                  {zh ? "无需外链" : "No external links"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            {
              title: zh ? "支付宝" : "AliPay",
              subtitle: zh ? "打开支付宝扫一扫" : "Scan with AliPay",
              src: "/pay/AliPay.jpg",
            },
            {
              title: zh ? "微信支付" : "WeCom / WeChat Pay",
              subtitle: zh ? "打开微信扫一扫" : "Scan with WeCom or WeChat",
              src: "/pay/WeCom.jpg",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="surface-panel overflow-hidden rounded-[2rem] border border-[var(--border-soft)] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow text-[var(--accent)]">{item.title}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{item.subtitle}</h2>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--border-soft)] bg-white p-4 shadow-[0_18px_40px_rgba(20,16,10,0.06)]">
                <Image
                  alt={item.title}
                  className="h-auto w-full rounded-[1rem] object-contain"
                  height={1200}
                  src={item.src}
                  width={1200}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[2rem] border border-[var(--border-soft)] bg-[var(--surface)] p-5 text-sm text-[var(--ink-muted)]">
          {zh ? (
            <>
              你也可以先继续用站点，等需要的时候再来这里。{" "}
              <Link className="text-[var(--accent)] underline underline-offset-4" href={prefixLocalePath("/skills", locale)}>
                回到 skill 列表
              </Link>
              。
            </>
          ) : (
            <>
              You can keep using the site and come back here anytime.{" "}
              <Link className="text-[var(--accent)] underline underline-offset-4" href={prefixLocalePath("/skills", locale)}>
                Back to skills
              </Link>
              .
            </>
          )}
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}

export default async function DonatePage() {
  return <DonatePageContent locale={await getRequestLocale()} />;
}
