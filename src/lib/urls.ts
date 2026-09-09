export function getSafeHttpUrl(
  value: string | undefined,
  baseUrl = typeof window === "undefined" ? "http://localhost/" : window.location.origin,
): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim(), baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
