"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SkillSourcePreviewProps = {
  locale: "en" | "zh-CN";
  skillName: string;
  sourceUrl: string;
  repository?: string;
  discoveryPath?: string;
};

type LoadState = "idle" | "loading" | "ready" | "error";

type CachedPreview = {
  content: string;
  fetchedAt: number;
};

const PREVIEW_CACHE_PREFIX = "skill-source-preview:v2:";
const PREVIEW_CACHE_TTL_MS = 60 * 60 * 1000;
const inFlightPreviewRequests = new Map<string, Promise<string>>();

function toRawGithubUrl(sourceUrl: string) {
  try {
    const parsed = new URL(sourceUrl);

    if (parsed.hostname !== "github.com") {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts.length < 5 || parts[2] !== "blob") {
      return null;
    }

    const [owner, repo, , branch, ...pathParts] = parts;
    const filePath = pathParts.join("/");

    if (!filePath) {
      return null;
    }

    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
  } catch {
    return null;
  }
}

function toBlobGithubUrl(repository?: string, discoveryPath?: string) {
  if (!repository || !discoveryPath) {
    return null;
  }

  const cleanedPath = discoveryPath.replace(/^\/+/, "");

  if (!cleanedPath) {
    return null;
  }

  return `https://github.com/${repository}/blob/main/${cleanedPath}`;
}

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, "");
}

function getCacheKey(rawUrl: string) {
  return `${PREVIEW_CACHE_PREFIX}${rawUrl}`;
}

function readCachedPreview(rawUrl: string): CachedPreview | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(getCacheKey(rawUrl));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedPreview;
    if (
      typeof parsed?.content !== "string" ||
      typeof parsed?.fetchedAt !== "number" ||
      Date.now() - parsed.fetchedAt > PREVIEW_CACHE_TTL_MS
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCachedPreview(rawUrl: string, content: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: CachedPreview = { content, fetchedAt: Date.now() };
    window.sessionStorage.setItem(getCacheKey(rawUrl), JSON.stringify(payload));
  } catch {
    // Ignore cache write failures.
  }
}

async function fetchPreviewMarkdown(rawUrl: string) {
  const existing = inFlightPreviewRequests.get(rawUrl);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    const response = await fetch(rawUrl, {
      headers: {
        Accept: "text/plain, text/markdown;q=0.9, */*;q=0.1",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const markdown = stripFrontmatter(await response.text()).trim();
    if (!markdown) {
      throw new Error("empty");
    }

    return markdown;
  })();

  inFlightPreviewRequests.set(rawUrl, request);

  try {
    return await request;
  } finally {
    inFlightPreviewRequests.delete(rawUrl);
  }
}

export function SkillSourcePreview({
  locale,
  skillName,
  sourceUrl,
  repository,
  discoveryPath,
}: SkillSourcePreviewProps) {
  const [state, setState] = useState<LoadState>("idle");
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const autoLoadRef = useRef<string | null>(null);
  const githubPageUrl = useMemo(
    () => toBlobGithubUrl(repository, discoveryPath) ?? sourceUrl,
    [repository, discoveryPath, sourceUrl],
  );
  const rawUrl = useMemo(
    () => toRawGithubUrl(githubPageUrl) ?? toRawGithubUrl(sourceUrl),
    [githubPageUrl, sourceUrl],
  );

  const copy = {
    title: locale === "zh-CN" ? "SKILL.md 原文" : "SKILL.md source",
    subtitle:
      locale === "zh-CN"
        ? "直接从 GitHub 加载原文，不会存到本站。"
        : "Loaded directly from GitHub and not stored on this site.",
    load: locale === "zh-CN" ? "重新加载" : "Reload",
    loading: locale === "zh-CN" ? "正在从 GitHub 加载…" : "Loading from GitHub...",
    reload: locale === "zh-CN" ? "重新加载" : "Reload",
    viewGithub: locale === "zh-CN" ? "在 GitHub 查看" : "View on GitHub",
    unavailable:
      locale === "zh-CN"
            ? "这个 skill 目前没有可直接预览的 GitHub 原文链接。"
        : "This skill does not currently expose a previewable GitHub source link.",
    failed:
      locale === "zh-CN"
        ? "原文加载失败。你仍然可以去 GitHub 查看完整内容。"
        : "The source content could not be loaded. You can still open the full content on GitHub.",
    fetched:
      locale === "zh-CN"
        ? `已为 ${skillName} 加载 GitHub 原文。`
        : `Loaded GitHub source for ${skillName}.`,
    idleHint:
      locale === "zh-CN"
        ? "页面打开后会自动请求 GitHub 原文，内容较大时可能需要一点时间。"
        : "This preview loads from GitHub automatically when the page opens.",
    heading:
      locale === "zh-CN" ? "直接预览 GitHub 里的 skill 内容" : "Preview the GitHub skill content directly",
    cached:
      locale === "zh-CN" ? "本次会话已缓存，避免重复抓取。" : "Cached for this session to avoid repeated fetches.",
  };

  async function loadPreview(force = false) {
    if (!rawUrl) {
      setState("error");
      setErrorMessage(copy.unavailable);
      return;
    }

    const cached = readCachedPreview(rawUrl);
    if (cached && !force) {
      setContent(cached.content);
      setState("ready");
      setErrorMessage("");
      return;
    }

    setState("loading");
    setErrorMessage("");

    try {
      const markdown = await fetchPreviewMarkdown(rawUrl);
      setContent(markdown);
      writeCachedPreview(rawUrl, markdown);
      setState("ready");
    } catch {
      setState("error");
      setErrorMessage(copy.failed);
    }
  }

  useEffect(() => {
    if (!rawUrl || autoLoadRef.current === rawUrl) {
      return;
    }

    autoLoadRef.current = rawUrl;
    void loadPreview();
  }, [rawUrl]);

  return (
    <section className="mt-8 detail-shell overflow-hidden rounded-[2rem] border p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow muted">{copy.title}</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
            {copy.heading}
          </h2>
          <p className="muted mt-3 max-w-3xl text-sm leading-7">
            {copy.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="action-primary inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-65"
            disabled={state === "loading"}
            onClick={() => void loadPreview(true)}
            type="button"
          >
            {state === "loading" ? copy.loading : copy.reload}
          </button>
          <a
            className="detail-chip inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition"
            href={githubPageUrl}
            rel="noreferrer"
            target="_blank"
          >
            {copy.viewGithub}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      {state === "idle" && !rawUrl ? (
        <div className="mt-6 rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] px-5 py-5">
          <p className="text-sm leading-7 text-[var(--ink-muted)]">{copy.idleHint}</p>
        </div>
      ) : null}

      {state === "loading" ? (
        <div className="mt-6 rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] p-5">
          <div className="space-y-3">
            <div className="h-5 w-40 animate-pulse rounded-full bg-black/6 dark:bg-white/8" />
            <div className="h-4 w-full animate-pulse rounded-full bg-black/6 dark:bg-white/8" />
            <div className="h-4 w-[92%] animate-pulse rounded-full bg-black/6 dark:bg-white/8" />
            <div className="h-4 w-[85%] animate-pulse rounded-full bg-black/6 dark:bg-white/8" />
            <div className="h-28 animate-pulse rounded-[1rem] bg-black/6 dark:bg-white/8" />
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <div className="mt-6 rounded-[1.5rem] border border-[#edd7d7] bg-[#fff5f5] px-5 py-5 text-[#9b4b4b] dark:border-[#6d4040] dark:bg-[rgba(140,50,50,0.14)] dark:text-[#ffb1b1]">
          <p className="text-sm leading-7">{errorMessage}</p>
        </div>
      ) : null}

      {state === "ready" ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-[1.25rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] px-4 py-4 sm:px-5">
            <p className="text-sm leading-7 text-[var(--ink-muted)]">{copy.fetched}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              {copy.cached}
            </p>
          </div>
          <article className="markdown-preview rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-strong)] px-5 py-6 sm:px-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </div>
      ) : null}
    </section>
  );
}
