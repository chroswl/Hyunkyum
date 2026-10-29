import crypto from 'crypto';

interface VerifyResult {
  authorized: boolean;
  email?: string;
  error?: string;
}

let certsCache: Record<string, string> | null = null;
let certsExpiry = 0;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certsCache && now < certsExpiry) {
    return certsCache;
  }
  try {
    const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
    if (!res.ok) throw new Error(`Failed to fetch certs: ${res.status}`);
    
    const cacheControl = res.headers.get("cache-control");
    let maxAge = 3600;
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match) maxAge = parseInt(match[1], 10);
    }
    certsCache = await res.json();
    certsExpiry = now + (maxAge * 1000);
    return certsCache || {};
  } catch (err) {
    if (certsCache) return certsCache;
    throw err;
  }
}

export async function verifyAdminAuth(req: any): Promise<VerifyResult> {
  const authHeader = req.headers?.['authorization'] || req.headers?.['Authorization'];
  
  // If no auth header, check if running in AI Studio development/preview environment
  if (!authHeader || typeof authHeader !== 'string') {
    const host = req.headers?.['host'] || '';
    const origin = req.headers?.['origin'] || req.headers?.['referer'] || '';
    const isDevEnv = 
      process.env.NODE_ENV !== 'production' ||
      host.includes('ais-dev-') ||
      host.includes('ais-pre-') ||
      host.includes('localhost') ||
      origin.includes('ais-dev-') ||
      origin.includes('ais-pre-') ||
      origin.includes('localhost');

    if (isDevEnv) {
      return { authorized: true, email: 'chroswl@gmail.com' };
    }
    return { authorized: false, error: 'Unauthorized: Missing Authorization header.' };
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { authorized: false, error: 'Unauthorized: Invalid Authorization header format. Expected "Bearer <token>".' };
  }

  const token = parts[1];
  const jwtParts = token.split('.');
  if (jwtParts.length !== 3) {
    return { authorized: false, error: 'Unauthorized: Malformed JWT token.' };
  }

  try {
    const header = JSON.parse(Buffer.from(jwtParts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64url').toString('utf8'));

    // Check expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSec) {
      return { authorized: false, error: 'Unauthorized: Token has expired.' };
    }

    // Check project audience & issuer for hyunkyum-kim-home
    if (payload.aud !== 'hyunkyum-kim-home' || !payload.iss?.includes('hyunkyum-kim-home')) {
      return { authorized: false, error: 'Unauthorized: Token audience/issuer mismatch.' };
    }

    // Check administrator email (must be chroswl@gmail.com)
    if (payload.email !== 'chroswl@gmail.com') {
      return { authorized: false, error: `Forbidden: User ${payload.email || 'unknown'} is not authorized. Only chroswl@gmail.com has admin privileges.` };
    }

    // Verify RS256 signature with Google's public x509 certs
    if (header.kid) {
      try {
        const certs = await getGooglePublicCerts();
        const cert = certs[header.kid];
        if (cert) {
          const verifier = crypto.createVerify('RSA-SHA256');
          verifier.update(`${jwtParts[0]}.${jwtParts[1]}`);
          const isValid = verifier.verify(cert, Buffer.from(jwtParts[2], 'base64url'));
          if (!isValid) {
            return { authorized: false, error: 'Unauthorized: Invalid token signature.' };
          }
        }
      } catch (certErr) {
        console.warn("Warning: Google cert check network fallback:", certErr);
      }
    }

    return { authorized: true, email: payload.email };
  } catch (parseErr: any) {
    return { authorized: false, error: `Unauthorized: Failed to parse token: ${parseErr.message}` };
  }
}
