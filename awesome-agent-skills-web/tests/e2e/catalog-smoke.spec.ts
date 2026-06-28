import { expect, test } from "@playwright/test";

test.describe("catalog smoke", () => {
  test("language switch keeps Chinese skills route and UI copy", async ({ page }) => {
    await page.goto("/");

    await page.locator('button[aria-label="简体中文"]:visible').click();
    await expect(page).toHaveURL(/\/zh-CN\/$/);

    await page.getByRole("link", { name: "浏览技能" }).click();
    await expect(page).toHaveURL(/\/zh-CN\/skills\/?$/);
    await expect(page.getByPlaceholder("按 skill、公司或任务搜索")).toBeVisible();
    await expect(page.getByRole("button", { name: /English/i })).toBeVisible();
  });

  test("skills search and detail flow work in English", async ({ page }) => {
    await page.goto("/skills");
    await expect(page).toHaveURL(/\/skills\/?$/);

    const searchInput = page.getByPlaceholder("Search by skill, company, or task");
    await searchInput.fill("anthropics/docx");
    await expect(page).toHaveURL(/\/skills\/?\?q=anthropics(?:%2F|\/)docx/);
    await expect(page.getByText("anthropics/docx")).toBeVisible();

    const firstCard = page.locator("a").filter({ hasText: "anthropics/docx" }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await expect(page).toHaveURL(/\/skill\/\?slug=/);
    await expect(page.getByRole("link", { name: "View source" }).first()).toBeVisible();
  });

  test("mobile Chinese skills page can open filters modal", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only interaction");

    await page.goto("/zh-CN/skills");
    await expect(page).toHaveURL(/\/zh-CN\/skills\/?$/);

    await page.getByRole("button", { name: "筛选" }).click();
    await expect(page.getByRole("heading", { name: "筛选" })).toBeVisible();
    await expect(page.getByRole("button", { name: "应用筛选" })).toBeVisible();
  });

  test("Chinese skill detail keeps localized UI through query locale", async ({ page }) => {
    await page.goto("/zh-CN/skills");
    await page.getByPlaceholder("按 skill、公司或任务搜索").fill("anthropics/docx");
    await page.locator("a").filter({ hasText: "anthropics/docx" }).first().click();

    await expect(page).toHaveURL(/\/skill\/\?slug=anthropics-docx&locale=zh-CN|\/skill\/\?locale=zh-CN&slug=anthropics-docx/);
    await expect(page.getByText("安装与配置")).toBeVisible();
    await expect(page.getByRole("link", { name: /更多来自 anthropics/i })).toBeVisible();
  });

  test("language switch clears detail query locale when returning to English", async ({ page }) => {
    await page.goto("/zh-CN/skills");
    await page.getByPlaceholder("按 skill、公司或任务搜索").fill("anthropics/docx");
    await page.locator("a").filter({ hasText: "anthropics/docx" }).first().click();

    await expect(page).toHaveURL(/\/skill\/\?(?:slug=anthropics-docx&locale=zh-CN|locale=zh-CN&slug=anthropics-docx)/);
    await page.getByRole("button", { name: /English/i }).click();

    await expect(page).toHaveURL(/\/skill\/\?slug=anthropics-docx$/);
    await expect(page.getByRole("link", { name: "View source" }).first()).toBeVisible();
    await expect(page.getByText("安装与配置")).toHaveCount(0);
  });

  test("Chinese role page keeps locale when opening all matching skills", async ({ page }) => {
    await page.goto("/zh-CN/roles/data-analyst");
    await page.getByRole("link", { name: /查看全部与 .* 相关的 skill|查看全部/ }).first().click();
    await expect(page).toHaveURL(/\/zh-CN\/skills\/\?persona=data-analyst/);
  });

  test("Chinese footer keeps localized skills navigation", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.getByRole("link", { name: "开始找 skill" }).click();
    await expect(page).toHaveURL(/\/zh-CN\/skills\/?$/);
  });

  test("desktop filters update URL and can be reset", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop-only interaction");

    await page.goto("/skills");
    await page.getByRole("button", { name: /show filters/i }).click();
    const moreFiltersButton = page.getByRole("button", { name: /more filters/i });
    await expect(moreFiltersButton).toBeVisible();
    await moreFiltersButton.click();
    await page.getByRole("button", { name: /popular with larger companies/i }).click();

    await expect(page).toHaveURL(/\/skills\/\?enterprise=1/);
    await expect(page.getByText(/matched|indexed|results/i).first()).toBeVisible();

    await page.getByRole("button", { name: /reset/i }).click();
    await expect(page).toHaveURL(/\/skills\/?$/);
  });

  test("mobile filters apply and reset through modal", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only interaction");

    await page.goto("/zh-CN/skills");
    await page.getByRole("button", { name: "筛选" }).click();
    await page.getByLabel("类型").selectOption("official");
    await page.getByRole("button", { name: "应用筛选" }).click();

    await expect(page).toHaveURL(/\/zh-CN\/skills\/\?kind=official/);

    await page.getByRole("button", { name: "筛选" }).click();
    await page.getByRole("button", { name: "重置" }).click();
    await page.getByRole("button", { name: "应用筛选" }).click();

    await expect(page).toHaveURL(/\/zh-CN\/skills\/?$/);
  });

  test("catalog can load the next page explicitly", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop-only explicit pagination assertion");

    await page.goto("/skills");
    await expect(
      page.getByText(/auto-loaded to page 1|已自动加载到第 1 页/i).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: /load next page now/i }).click();
    await expect(page).toHaveURL(/\/skills\/\?page=2/);
    await expect(
      page.getByText(/auto-loaded to page 2|已自动加载到第 2 页/i).first(),
    ).toBeVisible();
  });

  test("mobile skills page shows back-to-search button after scrolling", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only interaction");

    await page.goto("/zh-CN/skills");
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.getByRole("button", { name: "回到搜索" })).toBeVisible();
    await page.getByRole("button", { name: "回到搜索" }).click();
    await expect(page.getByPlaceholder("按 skill、公司或任务搜索")).toBeInViewport();
  });

  test("mobile catalog keeps cookie card above bottom nav and below filter sheet", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only interaction");

    await page.goto("/zh-CN/skills");

    const cookieCard = page.getByTestId("cookie-consent-card");
    const bottomNav = page.getByTestId("mobile-bottom-nav");
    await expect(cookieCard).toBeVisible();
    await expect(bottomNav).toBeVisible();

    const cookieBox = await cookieCard.boundingBox();
    const navBox = await bottomNav.boundingBox();
    expect(cookieBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(cookieBox!.y + cookieBox!.height).toBeLessThanOrEqual(navBox!.y + 2);

    await page.getByRole("button", { name: "筛选" }).click();
    const sheet = page.getByTestId("mobile-filters-sheet");
    await expect(sheet).toBeVisible();

    const sheetBox = await sheet.boundingBox();
    const cookieAfterOpen = await cookieCard.boundingBox();
    expect(sheetBox).not.toBeNull();
    expect(cookieAfterOpen).not.toBeNull();
    expect(sheetBox!.y).toBeLessThan(cookieAfterOpen!.y + cookieAfterOpen!.height);
  });
});
