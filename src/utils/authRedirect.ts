const FALLBACK_ORIGIN = "https://balanzzo.lovable.app";
const ALLOWED_HOSTS = ["balanzzo.lovable.app", "balanzzo.com.br", "www.balanzzo.com.br"];

/**
 * Sempre volta para o MESMO endereço em que o cliente está (balanzzo.com.br
 * ou balanzzo.lovable.app). Mandar o login do Google para outro domínio fazia
 * a sessão ficar salva num endereço e o cliente navegar em outro, preso no
 * "Verificando assinatura".
 */
export function getAuthRedirectUrl(path = "/login") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = typeof window !== "undefined" ? window.location.origin : FALLBACK_ORIGIN;
  return `${origin}${normalizedPath}`;
}

export function getSafeRedirectPath(value: string | null) {
  if (!value) return null;

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const parsedUrl = new URL(value);
    if (ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
      return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    }
  } catch {
    return null;
  }

  return null;
}
