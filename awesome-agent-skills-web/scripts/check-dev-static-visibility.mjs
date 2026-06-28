import { chromium, devices } from "@playwright/test";

const devBaseURL = process.env.DEV_BASE_URL ?? "http://127.0.0.1:3200";
const staticBaseURL = process.env.STATIC_BASE_URL ?? "http://127.0.0.1:3300";

const routeCases = [
  {
    name: "home-desktop",
    path: "/",
    device: null,
    checks: [{ kind: "text", value: "Find a skill you can actually use." }],
  },
  {
    name: "skills-desktop",
    path: "/skills",
    device: null,
    checks: [{ kind: "placeholder", value: "Search by skill, company, or task" }],
  },
  {
    name: "skill-detail-desktop",
    path: "/skill?slug=anthropics-docx",
    device: null,
    checks: [{ kind: "text", value: "anthropics/docx" }],
  },
  {
    name: "publisher-detail-desktop",
    path: "/publisher?slug=anthropics",
    device: null,
    checks: [{ kind: "text", value: "Anthropics" }],
  },
  {
    name: "roles-desktop",
    path: "/roles",
    device: null,
    checks: [{ kind: "text", value: "Start from the job you need done." }],
  },
  {
    name: "skills-mobile-zh",
    path: "/zh-CN/skills",
    device: devices["Pixel 7"],
    checks: [{ kind: "placeholder", value: "按 skill、公司或任务搜索" }],
  },
];

async function assertRouteVisible(page, route, label) {
  await page.goto(label + route.path, { waitUntil: "domcontentloaded", timeout: 30000 });

  for (const check of route.checks) {
    if (check.kind === "placeholder") {
      await page.getByPlaceholder(check.value).first().waitFor({ state: "visible", timeout: 30000 });
      continue;
    }

    await page.getByText(check.value).first().waitFor({ state: "visible", timeout: 30000 });
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const failures = [];

  try {
    for (const route of routeCases) {
      for (const [label, baseURL] of [
        ["dev", devBaseURL],
        ["static", staticBaseURL],
      ]) {
        const context = await browser.newContext(route.device ?? { viewport: { width: 1440, height: 1100 } });
        const page = await context.newPage();

        try {
          await assertRouteVisible(page, route, baseURL);
          console.log(`PASS ${label} ${route.name}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${label} ${route.name}: ${message}`);
          console.error(`FAIL ${label} ${route.name}`);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    console.error("\nVisibility check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("\nVisibility check passed.");
}

await run();
