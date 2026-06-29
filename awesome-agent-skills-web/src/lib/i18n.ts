import type { SkillFilterKind, SkillSort, SkillTrustFilter } from "@/lib/skills";

export type Locale = "en" | "zh-CN";

export const LOCALE_COOKIE = "lionsaid-locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "zh-CN";
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "zh-CN" ? "zh-CN" : "en";
}

function trimTrailingSlash(path: string) {
  return path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
}

export function prefixLocalePath(path: string, locale: Locale) {
  if (!path.startsWith("/")) {
    return path;
  }

  const zhPrefix = "/zh-CN";
  const normalizedPath = trimTrailingSlash(path);
  const isEnglishOnlyDetailPath =
    normalizedPath === "/skill" ||
    path.startsWith("/skill?") ||
    normalizedPath === "/publisher" ||
    path.startsWith("/publisher?");

  if (locale === "en") {
    if (path === zhPrefix) {
      return "/";
    }

    if (path.startsWith(`${zhPrefix}/`)) {
      return path.slice(zhPrefix.length);
    }

    return path;
  }

  if (isEnglishOnlyDetailPath) {
    return path;
  }

  if (path === "/" || path === zhPrefix) {
    return zhPrefix;
  }

  if (path.startsWith(`${zhPrefix}/`)) {
    return path;
  }

  return `${zhPrefix}${path}`;
}

export function getLocaleSwitchUrl(
  pathname: string,
  search: string,
  nextLocale: Locale,
) {
  const params = new URLSearchParams(search);
  const normalizedPathname = trimTrailingSlash(pathname);
  const nextPath = prefixLocalePath(pathname, nextLocale);
  const isQueryDetailPath = normalizedPathname === "/skill" || normalizedPathname === "/publisher";

  if (isQueryDetailPath) {
    if (nextLocale === "zh-CN") {
      params.set("locale", "zh-CN");
    } else {
      params.delete("locale");
    }
  }

  const nextSearch = params.toString();
  return nextSearch ? `${nextPath}?${nextSearch}` : nextPath;
}

export function getSkillDetailPath(slug: string, locale?: Locale) {
  const params = new URLSearchParams({ slug });
  if (locale === "zh-CN") {
    params.set("locale", locale);
  }
  return `/skill?${params.toString()}`;
}

export function getPublisherDetailPath(slug: string, locale?: Locale) {
  const params = new URLSearchParams({ slug });
  if (locale === "zh-CN") {
    params.set("locale", locale);
  }
  return `/publisher?${params.toString()}`;
}

type Copy = {
  nav: {
    home: string;
    browseSkills: string;
    roles: string;
    github: string;
  };
  language: {
    short: string;
    english: string;
    chinese: string;
  };
  home: {
    eyebrow: string;
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    searchButton: string;
    stats: {
      skills: string;
      publishers: string;
      official: string;
      community: string;
    };
    rolesHeading: string;
    tasksHeading: string;
    featuredHeading: string;
    roleIntro: string;
    taskIntro: string;
    featuredIntro: string;
    goalExamples: string[];
  };
  roles: {
    eyebrow: string;
    title: string;
    subtitle: string;
    openCatalog: string;
    officialOnly: string;
    allRoles: string;
    curatedSkills: string;
    startWithOfficial: string;
    openRole: string;
    viewAllSkills: string;
    taskHeading: string;
    taskIntro: string;
    openAllRoleCatalog: string;
  };
  skills: {
    browseByTask: string;
    browseByRole: string;
    allTasks: string;
    allRoles: string;
    allSkills: string;
    officialOnly: string;
    communityOnly: string;
    searchPlaceholder: string;
    searchButton: string;
    featuredOrder: string;
    alphabetical: string;
    byPublisher: string;
    trustAll: string;
    trustOfficial: string;
    trustCurated: string;
    trustUntrusted: string;
    enterpriseOnly: string;
    excludeMarketplace: string;
  };
  common: {
    open: string;
    browse: string;
    featured: string;
    allPublishers: string;
    matchingSkills: string;
    curatedSkills: string;
    broaderMatches: string;
    officialEnterprisePicks: string;
  };
  roleLabels: Record<string, string>;
  roleSummaries: Record<string, string>;
  roleHeroes: Record<string, string>;
  taskLabels: Record<string, string>;
  queryLabels: Record<string, string>;
  skillFilters: {
    kind: Record<Exclude<SkillFilterKind, "all">, string>;
    sort: Record<SkillSort, string>;
    trust: Record<Exclude<SkillTrustFilter, "all">, string>;
  };
};

const commonEn: Copy = {
  nav: {
    home: "Home",
    browseSkills: "Find Skills",
    roles: "By Role",
    github: "GitHub",
  },
  language: {
    short: "EN",
    english: "English",
    chinese: "简体中文",
  },
  home: {
    eyebrow: "Skill discovery",
    title: "Find a skill you can actually use.",
    subtitle:
      "Search directly, start from your role, or begin from a goal you care about. The point is to help you get to something useful faster.",
    searchPlaceholder: "Search by skill, company, or task",
    searchButton: "Search skills",
    stats: {
      skills: "skills indexed",
      publishers: "publishers",
      official: "official",
      community: "community",
    },
    rolesHeading: "Start from your role, hobby, or goal.",
    tasksHeading: "Or start from the result you want.",
    featuredHeading: "Start with the skills most likely to help first.",
    roleIntro:
      "Most people only know the outcome they want: a cleaner weekly report, a better pitch deck, a photo workflow that feels easier, or a travel plan they can actually finish. Start there.",
    taskIntro:
      "If you already know the job, this is the fastest way to get to something concrete.",
    featuredIntro:
      "These are good starting points when you want to move quickly and see a result sooner.",
    goalExamples: [
      "Ship a cleaner weekly report",
      "Make a better pitch deck",
      "Build a travel planner for your next trip",
      "Organize photos or notes more easily",
    ],
  },
  roles: {
    eyebrow: "Find by role",
    title: "Start from the job you need done.",
    subtitle:
      "Pick the closest starting point and open the skills most likely to help.",
    openCatalog: "See all skills",
    officialOnly: "From official teams",
    allRoles: "All roles",
    curatedSkills: "recommended skills",
    startWithOfficial: "See trusted picks first",
    openRole: "Open role",
    viewAllSkills: "See all skills",
    taskHeading: "Common tasks",
    taskIntro: "Pick a task when you know the outcome you want, but not which skill to open yet.",
    openAllRoleCatalog: "Find by task",
  },
  skills: {
    browseByTask: "Find by task",
    browseByRole: "Find by role",
    allTasks: "All tasks",
    allRoles: "All roles",
    allSkills: "All skills",
    officialOnly: "From official teams",
    communityOnly: "From the community",
    searchPlaceholder: "Search by skill, company, or task",
    searchButton: "Search",
    featuredOrder: "Featured order",
    alphabetical: "Alphabetical",
    byPublisher: "By company",
    trustAll: "All sources",
    trustOfficial: "Official team",
    trustCurated: "Reviewed source",
    trustUntrusted: "Use with care",
    enterpriseOnly: "Popular with larger companies",
    excludeMarketplace: "Hide community marketplace results",
  },
  common: {
    open: "Open",
    browse: "Browse",
    featured: "Featured",
    allPublishers: "All companies",
    matchingSkills: "matching skills",
    curatedSkills: "recommended skills",
    broaderMatches: "more results",
    officialEnterprisePicks: "Start with trusted picks",
  },
  roleLabels: {
    "data-analyst": "Data Analyst",
    engineer: "Engineer",
    pm: "Product Manager",
    designer: "Designer",
    marketer: "Marketer",
    ops: "Ops / DevOps",
    researcher: "Researcher",
    founder: "Founder",
    sales: "Sales",
    support: "Support",
    "content-creator": "Content Creator",
    consultant: "Consultant",
  },
  roleSummaries: {
    "data-analyst": "Find skills for SQL, spreadsheets, dashboards, extraction, and recurring reporting.",
    engineer: "Browse skills for coding, debugging, APIs, infra, testing, and shipping software.",
    pm: "Use skills for research synthesis, PRDs, reporting, planning, and stakeholder communication.",
    designer: "Explore skills for UI design, visual systems, prototypes, critique, and presentation-ready output.",
    marketer: "Find skills for content, campaign planning, landing pages, research, and reporting.",
    ops: "Browse skills for deployment, infra operations, incident response, testing, and environment workflows.",
    researcher: "Find skills for synthesis, document review, extraction, reporting, and evidence-heavy workflows.",
    founder: "Use skills for planning, product direction, GTM pages, pitch materials, and execution across small teams.",
    sales: "Browse skills for decks, proposals, customer-facing documents, reporting, and account workflow support.",
    support: "Find skills for repetitive workflows, documentation, extraction, response operations, and internal knowledge handling.",
    "content-creator": "Explore skills for content production, visual assets, landing pages, campaign support, and publishing workflows.",
    consultant: "Use skills for research, client-facing deliverables, reporting, decks, and document-heavy workflows.",
  },
  roleHeroes: {
    "data-analyst": "A focused starting point for analysts who need to query, clean, visualize, and ship insights fast.",
    engineer: "A direct path for developers who need to move from code generation to debugging, deployment, and automation.",
    pm: "A practical path for PMs who need to turn messy inputs into decisions, specs, updates, and execution plans.",
    designer: "A curated entry for designers who need faster concepting, stronger visuals, and better design communication.",
    marketer: "A role path for marketers who need to go from idea to content, campaigns, assets, and measurable reporting.",
    ops: "A practical entry for operators and platform teams who need to ship safely, debug production issues, and automate infrastructure work.",
    researcher: "A focused role path for researchers who need to turn source material into findings, reports, and decision-ready outputs.",
    founder: "A high-leverage role path for founders who need to cover product, operations, storytelling, and shipping with a small team.",
    sales: "A direct path for sales teams who need stronger proposals, cleaner decks, faster follow-up, and better account materials.",
    support: "A role path for support and success teams who need to standardize repetitive work, turn documents into answers, and move faster on customer issues.",
    "content-creator": "A focused role path for creators who need to produce content, shape visuals, and package ideas into assets people will actually consume.",
    consultant: "A practical path for consultants who need to move from research to synthesis to polished deliverables without losing speed.",
  },
  taskLabels: {
    "sql-analysis": "SQL analysis",
    "spreadsheet-cleaning": "Spreadsheet cleaning",
    dashboarding: "Dashboarding",
    reporting: "Reporting",
    "data-extraction": "Data extraction",
    "workflow-automation": "Workflow automation",
    "research-synthesis": "Research synthesis",
    "development-workflows": "Development workflows",
    "testing-debugging": "Testing & debugging",
    "deployment-ops": "Deployment & ops",
    "api-integration": "API integration",
    "prd-specs": "PRDs & specs",
    "planning-roadmapping": "Planning & roadmapping",
    "ui-ux-design": "UI & UX design",
    "design-critique": "Design critique",
    "presentation-building": "Presentation building",
    "visual-assets": "Visual assets",
    "content-production": "Content production",
    "campaign-planning": "Campaign planning",
    "landing-pages": "Landing pages",
    "document-authoring": "Document authoring",
  },
  queryLabels: {
    sql: "SQL",
    xlsx: "XLSX",
    csv: "CSV",
    dashboard: "Dashboard",
    report: "Report",
    pdf: "PDF",
    api: "API",
    test: "Test",
    debug: "Debug",
    deploy: "Deploy",
    code: "Code",
    infra: "Infra",
    research: "Research",
    brief: "Brief",
    spec: "Spec",
    planning: "Planning",
    docs: "Docs",
    design: "Design",
    ui: "UI",
    prototype: "Prototype",
    visual: "Visual",
    slides: "Slides",
    critique: "Critique",
    content: "Content",
    campaign: "Campaign",
    "landing page": "Landing page",
    copy: "Copy",
    extract: "Extract",
    synthesis: "Synthesis",
    pitch: "Pitch",
    roadmap: "Roadmap",
    launch: "Launch",
    proposal: "Proposal",
    deck: "Deck",
    doc: "Doc",
    "follow-up": "Follow-up",
    email: "Email",
    support: "Support",
    automation: "Automation",
    document: "Document",
    response: "Response",
    ops: "Ops",
  },
  skillFilters: {
    kind: {
      official: "From official teams",
      community: "From the community",
    },
    sort: {
      featured: "Featured order",
      name: "Alphabetical",
      publisher: "By company",
    },
    trust: {
      official: "Official team",
      curated: "Reviewed source",
      untrusted: "Use with care",
    },
  },
};

const commonZh: Copy = {
  nav: {
    home: "首页",
    browseSkills: "找技能",
    roles: "按角色",
    github: "GitHub",
  },
  language: {
    short: "中",
    english: "English",
    chinese: "简体中文",
  },
  home: {
    eyebrow: "技能发现",
    title: "先把想做的事，变成能完成的结果。",
    subtitle:
      "你可以直接搜索，也可以从角色、任务，甚至一个兴趣或目标开始找。目的很简单：少走弯路，更快看到结果。",
    searchPlaceholder: "按 skill、发布方或使用场景搜索",
    searchButton: "搜索 skill",
    stats: {
      skills: "个 skill 已索引",
      publishers: "个发布方",
      official: "官方",
      community: "社区",
    },
    rolesHeading: "从你的角色、兴趣或目标开始。",
    tasksHeading: "或者直接从你想要的结果开始。",
    featuredHeading: "先看最值得打开的 skill。",
    roleIntro:
      "很多人不只是来找工作上的技能，也可能是想把周报做得更漂亮、把旅行计划整理好、把摄影或写作变得更顺手。先从你想实现的结果开始。",
    taskIntro:
      "如果你已经知道要做什么，这里通常能更快找到可以直接用的 skill。",
    featuredIntro:
      "如果你想更快看到成果，可以先从这些推荐看起。",
    goalExamples: [
      "把周报做得更清楚",
      "把旅行计划整理得更顺手",
      "把摄影、写作或剪辑流程变简单",
      "把日常重复工作变得更省时间",
    ],
  },
  roles: {
    eyebrow: "按角色浏览",
    title: "从你要完成的工作开始。",
    subtitle:
      "先选最接近你的起点，再从最可能有帮助的 skill 开始。",
    openCatalog: "查看全部",
    officialOnly: "只看官方出品",
    allRoles: "全部角色",
    curatedSkills: "个推荐技能",
    startWithOfficial: "先看更靠谱的 skill",
    openRole: "打开角色",
    viewAllSkills: "查看全部",
    taskHeading: "常见任务",
    taskIntro: "如果你知道要做什么，但还不知道该点哪个 skill，可以直接按任务找。",
    openAllRoleCatalog: "按任务找",
  },
  skills: {
    browseByTask: "按任务找",
    browseByRole: "按角色找",
    allTasks: "全部任务",
    allRoles: "全部角色",
    allSkills: "全部 skill",
    officialOnly: "官方出品",
    communityOnly: "社区整理",
    searchPlaceholder: "按 skill、公司或任务搜索",
    searchButton: "搜索",
    featuredOrder: "精选顺序",
    alphabetical: "按字母",
    byPublisher: "按公司",
    trustAll: "全部来源",
    trustOfficial: "官方出品",
    trustCurated: "人工整理",
    trustUntrusted: "请自行判断",
    enterpriseOnly: "优先大公司 / 官方",
    excludeMarketplace: "隐藏社区市场结果",
  },
  common: {
    open: "打开",
    browse: "浏览",
    featured: "精选",
    allPublishers: "全部公司",
    matchingSkills: "个匹配 skill",
    curatedSkills: "个推荐技能",
    broaderMatches: "个更多结果",
    officialEnterprisePicks: "先看更靠谱的推荐",
  },
  roleLabels: {
    "data-analyst": "数据分析师",
    engineer: "工程师",
    pm: "产品经理",
    designer: "设计师",
    marketer: "营销",
    ops: "运维 / DevOps",
    researcher: "研究员",
    founder: "创始人",
    sales: "销售",
    support: "客服 / 支持",
    "content-creator": "内容创作者",
    consultant: "顾问",
  },
  roleSummaries: {
    "data-analyst": "适合找 SQL、表格清洗、仪表盘、数据提取和周期性汇报相关的技能。",
    engineer: "适合找编码、调试、API、基础设施、测试和上线相关的技能。",
    pm: "适合找研究整理、PRD、汇报、规划和跨团队协作相关的技能。",
    designer: "适合找界面设计、视觉系统、原型、评审和提案输出相关的技能。",
    marketer: "适合找内容、活动策划、落地页、研究和复盘汇报相关的技能。",
    ops: "适合找部署、运维、故障处理、测试和环境流程相关的技能。",
    researcher: "适合找研究整理、文档阅读、信息提取、汇报和证据整理相关的技能。",
    founder: "适合找规划、产品方向、增长页面、路演材料和小团队执行相关的技能。",
    sales: "适合找方案、演示文稿、客户文档、汇报和跟进流程相关的技能。",
    support: "适合找重复流程、知识文档、信息提取、回复处理和内部协作相关的技能。",
    "content-creator": "适合找内容生产、视觉素材、落地页、活动配套和发布流程相关的技能。",
    consultant: "适合找研究、客户交付、汇报、演示文稿和文档密集型工作相关的技能。",
  },
  roleHeroes: {
    "data-analyst": "给需要快速查数、清洗、可视化并输出结论的数据分析师一个更直接的起点。",
    engineer: "给需要从写代码一路走到调试、部署和自动化的工程师一个更直接的入口。",
    pm: "给需要把杂乱信息整理成决策、需求、同步和推进计划的产品经理一个更顺手的入口。",
    designer: "给需要更快出概念、做视觉、讲方案的设计师一个更聚焦的起点。",
    marketer: "给需要从想法走到内容、活动、素材和结果复盘的营销团队一个更顺手的入口。",
    ops: "给需要稳定上线、排查线上问题并把基础设施流程自动化的团队一个更实用的入口。",
    researcher: "给需要把原始材料整理成结论、报告和可决策输出的研究人员一个更清晰的起点。",
    founder: "给需要同时兼顾产品、运营、表达和落地执行的创始人一个更高杠杆的入口。",
    sales: "给需要更快做方案、做演示、跟进客户和整理材料的销售团队一个更直接的入口。",
    support: "给需要标准化重复工作、把资料变成答案并更快处理问题的支持团队一个更实用的入口。",
    "content-creator": "给需要持续生产内容、组织视觉并把想法包装成成品的创作者一个更聚焦的入口。",
    consultant: "给需要从研究走到整理、再走到高质量交付的顾问一个更顺手的起点。",
  },
  taskLabels: {
    "sql-analysis": "SQL 分析",
    "spreadsheet-cleaning": "表格清洗",
    dashboarding: "仪表盘",
    reporting: "汇报",
    "data-extraction": "数据提取",
    "workflow-automation": "流程自动化",
    "research-synthesis": "研究综合",
    "development-workflows": "开发流程",
    "testing-debugging": "测试与调试",
    "deployment-ops": "部署与运维",
    "api-integration": "API 集成",
    "prd-specs": "PRD / 规格说明",
    "planning-roadmapping": "规划与路线图",
    "ui-ux-design": "UI / UX 设计",
    "design-critique": "设计评审",
    "presentation-building": "演示文稿",
    "visual-assets": "视觉素材",
    "content-production": "内容生产",
    "campaign-planning": "活动策划",
    "landing-pages": "落地页",
    "document-authoring": "文档撰写",
  },
  queryLabels: {
    sql: "SQL",
    xlsx: "XLSX",
    csv: "CSV",
    dashboard: "仪表盘",
    report: "汇报",
    pdf: "PDF",
    api: "API",
    test: "测试",
    debug: "调试",
    deploy: "部署",
    code: "代码",
    infra: "基础设施",
    research: "研究",
    brief: "简报",
    spec: "需求说明",
    planning: "规划",
    docs: "文档",
    design: "设计",
    ui: "UI",
    prototype: "原型",
    visual: "视觉",
    slides: "演示文稿",
    critique: "评审",
    content: "内容",
    campaign: "活动",
    "landing page": "落地页",
    copy: "文案",
    extract: "提取",
    synthesis: "整理",
    pitch: "路演",
    roadmap: "路线图",
    launch: "发布",
    proposal: "方案",
    deck: "演示稿",
    doc: "文档",
    "follow-up": "跟进",
    email: "邮件",
    support: "支持",
    automation: "自动化",
    document: "文档",
    response: "回复",
    ops: "运维",
  },
  skillFilters: {
    kind: {
      official: "官方出品",
      community: "社区整理",
    },
    sort: {
      featured: "精选顺序",
      name: "按字母",
      publisher: "按公司",
    },
    trust: {
      official: "官方出品",
      curated: "人工挑选",
      untrusted: "请自行判断",
    },
  },
};

const copies: Record<Locale, Copy> = {
  en: commonEn,
  "zh-CN": commonZh,
};

export function getCopy(locale: Locale) {
  return copies[locale];
}
