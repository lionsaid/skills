type PageLoadingProps = {
  locale?: "en" | "zh-CN";
  title?: string;
  description?: string;
};

export function PageLoading({
  locale = "en",
  title,
  description,
}: PageLoadingProps) {
  const heading = title ?? (locale === "zh-CN" ? "正在加载" : "Loading");
  const copy =
    description ??
    (locale === "zh-CN"
      ? "正在准备页面内容，请稍候。"
      : "Preparing the page content. Please wait a moment.");

  return (
    <main className="grain flex flex-1 flex-col overflow-x-hidden pb-28 sm:pb-0">
      <section className="hero-grid relative overflow-hidden py-6">
        <div className="page-shell py-12 lg:py-16">
          <div className="glass relative overflow-hidden rounded-[2.4rem] p-7 sm:p-9 lg:p-12">
            <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--accent-soft)]" />
            <div className="mt-5 h-14 max-w-xl animate-pulse rounded-[1.6rem] bg-black/8 dark:bg-white/10" />
            <div className="mt-4 h-5 max-w-2xl animate-pulse rounded-full bg-black/6 dark:bg-white/8" />
            <div className="mt-2 h-5 max-w-xl animate-pulse rounded-full bg-black/6 dark:bg-white/8" />

            <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
                <p className="eyebrow text-[var(--accent)]">{heading}</p>
                <p className="muted mt-4 max-w-xl text-base leading-7">{copy}</p>
                <div className="mt-6 space-y-3">
                  <div className="h-5 w-full animate-pulse rounded-full bg-black/6 dark:bg-white/8" />
                  <div className="h-5 w-[92%] animate-pulse rounded-full bg-black/6 dark:bg-white/8" />
                  <div className="h-5 w-[76%] animate-pulse rounded-full bg-black/6 dark:bg-white/8" />
                </div>
              </div>

              <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
                <div className="h-5 w-32 animate-pulse rounded-full bg-black/6 dark:bg-white/8" />
                <div className="mt-5 h-28 animate-pulse rounded-[1.5rem] bg-[var(--midnight)]/90" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="h-20 animate-pulse rounded-[1.25rem] bg-black/6 dark:bg-white/8" />
                  <div className="h-20 animate-pulse rounded-[1.25rem] bg-black/6 dark:bg-white/8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
