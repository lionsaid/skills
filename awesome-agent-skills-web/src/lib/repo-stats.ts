export type RepoStats = {
  stars: number | null;
  forks: number | null;
};

export function getRepositoryKey(url: string, publisher: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "github.com") {
      const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
      if (!owner || !repo) {
        return null;
      }

      return `${owner}/${repo}`;
    }

    if (parsed.hostname === "officialskills.sh") {
      return `${publisher}/skills`;
    }
  } catch {
    return null;
  }

  return null;
}
