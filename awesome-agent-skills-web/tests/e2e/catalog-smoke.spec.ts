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

  test("Chinese role page keeps locale when opening all matching skills", async ({ page }) => {
    await page.goto("/zh-CN/roles/data-analyst");
    await page.getByRole("link", { name: "查看全部技能" }).first().click();
    await expect(page).toHaveURL(/\/zh-CN\/skills\/\?persona=data-analyst/);
  });
});
