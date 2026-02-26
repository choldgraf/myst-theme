import React, { useContext } from 'react';

const BaseUrlContext = React.createContext<{
  baseurl?: string;
}>({});

export function BaseUrlProvider({
  baseurl,
  children,
}: {
  baseurl?: string;
  children: React.ReactNode;
}) {
  return <BaseUrlContext.Provider value={{ baseurl }}>{children}</BaseUrlContext.Provider>;
}

export function useBaseurl() {
  const data = useContext(BaseUrlContext);
  return data?.baseurl;
}

/**
 * Check if a URL is external. Optionally pass internal domain patterns
 * (space-separated, e.g. "example.com *.example.com") to treat matching URLs as internal.
 * Wildcard `*` matches a single subdomain level (e.g. `*.example.com` matches
 * `docs.example.com` but not `a.b.example.com`).
 */
export function isExternalUrl(url?: string, internalDomains?: string) {
  if (!url) return false;
  if (!/^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/.test(url)) return false;
  if (internalDomains) {
    const matched = internalDomains
      .trim()
      .split(/\s+/)
      .some((pattern) => {
        const escaped = pattern.replace(/\./g, '\\.').replace(/\*/g, '[^/]+');
        return new RegExp(`^https?://${escaped}([:/?#]|$)`, 'i').test(url);
      });
    if (matched) return false;
  }
  return true;
}

export function withBaseurl(url?: string, baseurl?: string) {
  if (!baseurl || isExternalUrl(url)) {
    return url as string;
  }
  return baseurl + url;
}
