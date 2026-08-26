const APP_ORIGIN = "https://balanzzo.lovable.app";

export function getAuthRedirectUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_ORIGIN}${normalizedPath}`;
}

export function getSafeRedirectPath(value: string | null) {
  if (!value) return null;

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const parsedUrl = new URL(value);
    if (parsedUrl.hostname === "balanzzo.lovable.app") {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    return null;
  }

  return null;
}