import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in the Supabase project keys."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // PKCE keeps the OAuth callback in the query string, which is compatible
    // with HashRouter (hash-based callbacks would collide with the route).
    flowType: "pkce",
  },
});

/**
 * Google sign-in is intentionally disabled for now. When the Google provider is
 * configured in the Supabase dashboard, set this to true — the redirect flow is
 * already wired in AuthContext.
 */
export const GOOGLE_AUTH_ENABLED = false;

const STORAGE_PUBLIC_URL = `${supabaseUrl}/storage/v1/object/public/product-images`;
const LEGACY_UPLOAD_PREFIX = "/uploads/";

const PLACEHOLDER_IMAGE = `${import.meta.env.BASE_URL}placeholder-product.svg`;

/** Resolves legacy `/uploads/...` paths (now in Supabase Storage) and absolute URLs. */
export function resolveImage(image?: string | null, fallback = PLACEHOLDER_IMAGE): string {
  if (!image) return fallback;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith(LEGACY_UPLOAD_PREFIX)) {
    return `${STORAGE_PUBLIC_URL}/legacy/${image.slice(LEGACY_UPLOAD_PREFIX.length)}`;
  }
  return image;
}

export { PLACEHOLDER_IMAGE };

export const PRODUCT_IMAGES_BUCKET = "product-images";
