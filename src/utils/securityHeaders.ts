import { SECURITY_HEADERS } from './security';

/**
 * Utility to apply security headers to HTTP responses
 * These headers provide additional protection against common web vulnerabilities
 */
export function applySecurityHeaders(response: Response): Response {
  // Create a new response with security headers
  const secureResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      ...SECURITY_HEADERS
    }
  });

  return secureResponse;
}

/**
 * Middleware function to add security headers to all responses
 * Can be used in edge functions or service workers
 */
export function securityHeadersMiddleware(
  request: Request,
  next: (request: Request) => Promise<Response>
): Promise<Response> {
  return next(request).then(response => applySecurityHeaders(response));
}

/**
 * Meta tags for client-side security headers
 * These can be added to the HTML head for additional protection
 */
export const SECURITY_META_TAGS = [
  {
    name: 'referrer',
    content: 'strict-origin-when-cross-origin'
  },
  {
    httpEquiv: 'X-Content-Type-Options',
    content: 'nosniff'
  },
  {
    httpEquiv: 'X-Frame-Options',
    content: 'DENY'
  },
  {
    httpEquiv: 'X-XSS-Protection',
    content: '1; mode=block'
  },
  {
    httpEquiv: 'Content-Security-Policy',
    content: SECURITY_HEADERS['Content-Security-Policy']
  }
];

/**
 * Inject security meta tags into HTML document head
 * Call this function in your main index.html or app initialization
 */
export function injectSecurityMetaTags(): void {
  if (typeof document === 'undefined') return;

  SECURITY_META_TAGS.forEach(tag => {
    const metaTag = document.createElement('meta');
    
    if (tag.name) {
      metaTag.name = tag.name;
    }
    
    if (tag.httpEquiv) {
      metaTag.httpEquiv = tag.httpEquiv;
    }
    
    metaTag.content = tag.content;
    
    // Check if tag already exists
    const existingTag = document.querySelector(
      tag.name 
        ? `meta[name="${tag.name}"]` 
        : `meta[http-equiv="${tag.httpEquiv}"]`
    );
    
    if (!existingTag) {
      document.head.appendChild(metaTag);
    }
  });
}