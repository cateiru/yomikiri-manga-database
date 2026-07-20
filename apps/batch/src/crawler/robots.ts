export interface RobotsRules {
  isAllowed(path: string): boolean;
}

interface RobotsGroup {
  agents: string[];
  disallows: string[];
}

export function parseRobotsTxt(text: string, userAgent: string): RobotsRules {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0]?.trim();
    if (!line) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === "user-agent") {
      if (!current || current.disallows.length > 0) {
        current = { agents: [], disallows: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (key === "disallow" && current) {
      if (value) {
        current.disallows.push(value);
      }
    }
  }

  const uaToken = userAgent.toLowerCase();
  const matching = groups.filter((group) =>
    group.agents.some((agent) => agent !== "*" && uaToken.includes(agent)),
  );
  const wildcard = groups.filter((group) => group.agents.includes("*"));
  const target = matching.length > 0 ? matching : wildcard;
  const disallowPrefixes = target.flatMap((group) => group.disallows);

  return {
    isAllowed(path: string) {
      return !disallowPrefixes.some((prefix) => path.startsWith(prefix));
    },
  };
}

export async function fetchRobotsRules(
  baseUrl: string,
  userAgent: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RobotsRules> {
  const robotsUrl = new URL("/robots.txt", baseUrl).toString();

  try {
    const res = await fetchImpl(robotsUrl, { headers: { "User-Agent": userAgent } });
    if (!res.ok) {
      return { isAllowed: () => true };
    }
    const text = await res.text();
    return parseRobotsTxt(text, userAgent);
  } catch {
    return { isAllowed: () => true };
  }
}
