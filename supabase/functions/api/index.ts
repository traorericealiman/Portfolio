// Edge Function "api" : remplace l'ancien backend Flask.
// Mêmes routes, mêmes formats JSON, donc le frontend n'a besoin que d'une nouvelle URL de base.
//
// Secrets (supabase secrets set ...) :
//   ADMIN_TOKEN_SECRET   : longue chaîne aléatoire qui signe les jetons de session admin (obligatoire)
//   ALLOWED_ORIGINS      : origines autorisées, séparées par des virgules (recommandé)
//   ALLOW_ADMIN_REGISTER : "true" pour autoriser la création du premier compte admin (désactivé sinon)
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.
import { createClient } from "npm:@supabase/supabase-js@2";
import { scrypt } from "npm:@noble/hashes@1.5.0/scrypt";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const TOKEN_SECRET = Deno.env.get("ADMIN_TOKEN_SECRET") ?? "";
const TOKEN_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 jours
const MAX_HISTORY_DAYS = 400;
const MAX_BODY_BYTES = 8 * 1024 * 1024; // images en base64 comprises
const MAX_IMAGE_CHARS = 6 * 1024 * 1024;
const MAX_TEXT_CHARS = 5000;

// Anti brute force sur /admin/login : échecs autorisés par fenêtre glissante.
const LOGIN_WINDOW_MIN = 15;
const LOGIN_MAX_FAILS_PER_USER = 10;
const LOGIN_MAX_FAILS_PER_IP = 20;

const enc = new TextEncoder();

// --- Utilitaires HTTP --------------------------------------------------------

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "*").split(",").map((s) => s.trim());

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow = allowedOrigins.includes("*")
    ? "*"
    : allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "content-type, x-admin-key, authorization, apikey",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(req: Request, body: unknown, status = 200, cache = "no-store"): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": cache,
    },
  });
}

async function readBody(req: Request): Promise<Record<string, any>> {
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new HttpError(413, "Requête trop volumineuse");
  if (!text) return {};
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
    return data;
  } catch {
    throw new HttpError(400, "JSON invalide");
  }
}

// Les messages d'erreur de la base restent dans les logs : ils ne doivent pas
// révéler le schéma aux visiteurs.
// deno-lint-ignore no-explicit-any
function check(res: { data: any; error: { message: string } | null }): any {
  if (res.error) {
    console.error("db", res.error);
    throw new HttpError(500, "Erreur serveur");
  }
  // null n'arrive que pour maybeSingle() sans résultat, que les appelants testent eux-mêmes.
  return res.data;
}

function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "inconnue";
}

// --- Validation des champs écrits par l'admin --------------------------------

function str(value: unknown, field: string, max = MAX_TEXT_CHARS): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new HttpError(400, `Champ invalide : ${field}`);
  if (value.length > max) throw new HttpError(400, `Champ trop long : ${field}`);
  return value;
}

// Liens : http(s), mailto, ancre ou chemin relatif. Bloque javascript:, data:, etc.
function url(value: unknown, field: string): string {
  const v = str(value, field, 2000).trim();
  if (!v || v === "#" || /^\/(?!\/)/.test(v) || /^(https?:\/\/|mailto:)/i.test(v)) return v;
  throw new HttpError(400, `Lien invalide : ${field} (http:// ou https:// attendu)`);
}

// Images : URL http(s), chemin relatif, ou image encodée en base64 (pas de SVG, qui peut contenir du script).
function image(value: unknown, field: string): string {
  const v = str(value, field, MAX_IMAGE_CHARS).trim();
  if (!v || /^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v)) return v;
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/=\s]+$/i.test(v)) return v;
  throw new HttpError(400, `Image invalide : ${field}`);
}

// Couleurs utilisées dans des styles : refuse tout ce qui pourrait charger une ressource.
function color(value: unknown, field: string): string {
  const v = str(value, field, 64).trim();
  if (!v || /^#[0-9a-f]{3,8}$/i.test(v) || /^(rgb|hsl)a?\([\d\s.,%/]+\)$/i.test(v) || /^[a-z]+$/i.test(v)) return v;
  throw new HttpError(400, `Couleur invalide : ${field}`);
}

function bool(value: unknown, field: string): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value !== "boolean") throw new HttpError(400, `Champ invalide : ${field}`);
  return value;
}

function strList(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 50) throw new HttpError(400, `Champ invalide : ${field}`);
  return value.map((v) => str(v, field, 100));
}

function month(value: unknown, field: string): string {
  const v = str(value, field, 7).trim();
  if (!v || /^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return v;
  throw new HttpError(400, `Date invalide : ${field} (AAAA-MM attendu)`);
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

// --- Mots de passe -----------------------------------------------------------
// Nouveau format : pbkdf2$<itérations>$<sel base64>$<hash base64>
// Les hashes Werkzeug (scrypt:... / pbkdf2:...) créés par l'ancien backend restent lisibles.

const PBKDF2_ITERATIONS = 210_000;

const toHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number, hash: string, bytes: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash, salt: salt as BufferSource, iterations }, key, bytes * 8);
  return new Uint8Array(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await pbkdf2(password, salt, PBKDF2_ITERATIONS, "SHA-256", 32);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(derived)}`;
}

// Hash factice : quand le compte n'existe pas, on fait quand même le calcul pour
// que le temps de réponse ne révèle pas quels noms d'utilisateur existent.
const DUMMY_HASH = `pbkdf2$${PBKDF2_ITERATIONS}$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`;

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (stored.startsWith("pbkdf2$")) {
      const [, iter, salt, hash] = stored.split("$");
      const expected = fromB64(hash);
      const derived = await pbkdf2(password, fromB64(salt), Number(iter), "SHA-256", expected.length);
      return timingSafeEqual(derived, expected);
    }
    // Hashes Werkzeug : "<méthode>$<sel>$<hash hex>"
    const [method, salt, hashHex] = stored.split("$");
    const expected = Uint8Array.from(hashHex.match(/../g) ?? [], (h) => parseInt(h, 16));
    if (method.startsWith("scrypt:")) {
      const [, n, r, p] = method.split(":").map(Number);
      const derived = scrypt(enc.encode(password), enc.encode(salt), {
        N: n, r, p, dkLen: expected.length, maxmem: 256 * 1024 * 1024,
      });
      return timingSafeEqual(derived, expected);
    }
    if (method.startsWith("pbkdf2:")) {
      const [, algo, iter] = method.split(":");
      const hash = algo.toUpperCase().replace("SHA", "SHA-");
      const derived = await pbkdf2(password, enc.encode(salt), Number(iter), hash, expected.length);
      return timingSafeEqual(derived, expected);
    }
  } catch (err) {
    console.error("verifyPassword", err);
  }
  return false;
}

function checkNewPassword(password: string) {
  if (password.length < 12) throw new HttpError(400, "Le mot de passe doit faire au moins 12 caractères");
  if (password.length > 256) throw new HttpError(400, "Mot de passe trop long");
}

// --- Jetons de session admin (HMAC-SHA256) -----------------------------------
// Le jeton embarque une empreinte du hash du mot de passe : changer le mot de
// passe (ou supprimer le compte) invalide aussitôt toutes les sessions ouvertes.

const b64url = (b: Uint8Array) => toB64(b).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const fromB64url = (s: string) => fromB64(s.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(s.length / 4) * 4, "="));

async function hmacKey() {
  if (TOKEN_SECRET.length < 32) throw new HttpError(500, "ADMIN_TOKEN_SECRET absent ou trop court (32 caractères minimum)");
  return crypto.subtle.importKey("raw", enc.encode(TOKEN_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function passwordFingerprint(passwordHash: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(passwordHash)))).slice(0, 16);
}

async function makeToken(username: string, passwordHash: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({
    u: username,
    v: await passwordFingerprint(passwordHash),
    exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_S,
  })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

async function requireAdmin(req: Request): Promise<string> {
  const token = req.headers.get("X-Admin-Key") ?? "";
  const [payload, sig] = token.split(".");
  if (!payload || !sig || token.length > 1000) throw new HttpError(401, "Non autorisé");

  let data: { u?: string; v?: string; exp?: number };
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(), fromB64url(sig) as BufferSource, enc.encode(payload));
    if (!ok) throw new Error();
    data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, "Non autorisé");
  }
  if (!data.u || !data.v || !data.exp || data.exp < Date.now() / 1000) throw new HttpError(401, "Non autorisé");

  const user = check(await db.from("admin_users").select("password_hash").eq("username", data.u).maybeSingle());
  if (!user || (await passwordFingerprint(user.password_hash)) !== data.v) throw new HttpError(401, "Non autorisé");
  return data.u;
}

// --- Anti brute force --------------------------------------------------------

async function assertLoginAllowed(ip: string, username: string) {
  const since = new Date(Date.now() - LOGIN_WINDOW_MIN * 60_000).toISOString();
  const [byUser, byIp] = await Promise.all([
    db.from("login_attempts").select("*", { count: "exact", head: true }).eq("username", username).gte("at", since),
    db.from("login_attempts").select("*", { count: "exact", head: true }).eq("ip", ip).gte("at", since),
  ]);
  if (byUser.error || byIp.error) {
    console.error("login_attempts", byUser.error ?? byIp.error);
    throw new HttpError(500, "Erreur serveur");
  }
  if ((byUser.count ?? 0) >= LOGIN_MAX_FAILS_PER_USER || (byIp.count ?? 0) >= LOGIN_MAX_FAILS_PER_IP) {
    throw new HttpError(429, `Trop de tentatives. Réessaie dans ${LOGIN_WINDOW_MIN} minutes.`);
  }
}

async function recordLoginFailure(ip: string, username: string) {
  await db.from("login_attempts").insert({ ip, username: username.slice(0, 100) });
  // Ménage occasionnel des vieilles tentatives
  if (Math.random() < 0.05) {
    await db.from("login_attempts").delete().lt("at", new Date(Date.now() - 86_400_000).toISOString());
  }
}

// --- Images : servies à part, avec une URL versionnée ---------------------------
// Les images sont stockées en base64 dans la base. Les renvoyer dans /content
// faisait plusieurs Mo par visite : /content renvoie maintenant une URL par image
// (/image/<table>/<id>?v=<empreinte>), que le navigateur met en cache pour un an.

const PUBLIC_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1/api`;
const EMPTY_MD5 = "d41d8cd98f00b204e9800998ecf8427e";
const IMAGE_TABLES = { competitions: "image", creations: "image", projects: "image", profile: "photo_url" } as const;

function imageUrl(table: keyof typeof IMAGE_TABLES, id: string | number, hash: string | undefined, raw: string | undefined) {
  if (hash === undefined) return raw ?? ""; // colonne d'empreinte absente : ancien comportement
  return hash === EMPTY_MD5 ? "" : `${PUBLIC_BASE}/image/${table}/${id}?v=${hash.slice(0, 12)}`;
}

// L'Admin renvoie ces URL telles quelles quand l'image n'a pas changé : on garde alors l'image en base.
const isOwnImageUrl = (v: unknown) => typeof v === "string" && v.includes("/functions/v1/api/image/");

async function serveImage(table: string, id: string, versioned: boolean): Promise<Response> {
  if (!Object.hasOwn(IMAGE_TABLES, table) || !ID_RE.test(id)) throw new HttpError(404, "Image introuvable");
  const col = IMAGE_TABLES[table as keyof typeof IMAGE_TABLES];
  const row = check(await db.from(table).select(col).eq("id", id).maybeSingle());
  const value: string = (row?.[col] ?? "").trim();

  if (/^https?:\/\//i.test(value)) return Response.redirect(value, 302);
  const m = value.match(/^data:(image\/(?:png|jpe?g|webp|gif|avif));base64,(.+)$/is);
  if (!m) throw new HttpError(404, "Image introuvable");
  const bytes = Uint8Array.from(atob(m[2].replace(/\s/g, "")), (c) => c.charCodeAt(0));
  return new Response(bytes, {
    headers: {
      "Content-Type": m[1].toLowerCase(),
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// --- Sérialisation (snake_case DB -> camelCase JSON) -------------------------

const serializers = {
  profile: (r: any) => r && ({
    description: r.description, email: r.email, phone: r.phone,
    photoUrl: imageUrl("profile", r.id ?? 1, r.photo_hash, r.photo_url),
    github: r.github, linkedin: r.linkedin, facebook: r.facebook,
  }),
  competitions: (r: any) => ({
    id: r.id, title: r.title, project: r.project, result: r.result, description: r.description,
    image: imageUrl("competitions", r.id, r.image_hash, r.image), date: r.date ?? "",
  }),
  creations: (r: any) => ({
    id: r.id, title: r.title, category: r.category, color: r.color,
    image: imageUrl("creations", r.id, r.image_hash, r.image),
  }),
  projects: (r: any) => ({
    id: r.id, title: r.title, description: r.description, tech: r.tech ?? [], accent: r.accent, bg: r.bg,
    textColor: r.text_color, isDark: r.is_dark, year: r.year, category: r.category, github: r.github,
    link: r.link, image: imageUrl("projects", r.id, r.image_hash, r.image),
  }),
};

// Ressources en liste : [clé JSON, colonne SQL, valeur par défaut, validation]
type Check = (value: unknown, field: string) => unknown;
type Field = [string, string, unknown, Check];
const LISTS: Record<"competitions" | "creations" | "projects", { prefix: string; fields: Field[] }> = {
  competitions: {
    prefix: "comp",
    fields: [["title", "title", "", str], ["project", "project", "", str], ["result", "result", "", str],
      ["description", "description", "", str], ["image", "image", "", image], ["date", "date", "", month]],
  },
  creations: {
    prefix: "creation",
    fields: [["title", "title", "", str], ["category", "category", "", str], ["color", "color", "#0A66C2", color],
      ["image", "image", "", image]],
  },
  projects: {
    prefix: "project",
    fields: [["title", "title", "", str], ["description", "description", "", str], ["tech", "tech", [], strList],
      ["accent", "accent", "#0A66C2", color], ["bg", "bg", "#F5F4F0", color], ["textColor", "text_color", "#0A0A0A", color],
      ["isDark", "is_dark", false, bool], ["year", "year", "", str], ["category", "category", "", str],
      ["github", "github", "#", url], ["link", "link", "#", url], ["image", "image", "", image]],
  },
};

function toRow(fields: Field[], data: Record<string, any>) {
  return Object.fromEntries(
    fields
      .filter(([key, col]) => !(col === "image" && isOwnImageUrl(data[key])))
      .map(([key, col, def, validate]) => [col, validate(data[key] ?? def, key)]),
  );
}

// Colonnes renvoyées au site : tout sauf l'image elle-même (remplacée par son empreinte).
const lightColumns = (table: keyof typeof LISTS) =>
  ["id", ...LISTS[table].fields.map(([, col]) => col).filter((c) => c !== "image"), "image_hash"].join(",");
const PROFILE_COLUMNS = "id,description,email,phone,github,linkedin,facebook,photo_hash";

async function listRows(table: keyof typeof LISTS) {
  const light = await db.from(table).select(lightColumns(table)).order("position").order("created_at");
  if (!light.error) return light.data as any[];
  // Migration des empreintes pas encore appliquée : on renvoie tout, comme avant.
  console.warn("listRows: repli sur select(*)", light.error.message);
  return check(await db.from(table).select("*").order("position").order("created_at"));
}

async function getProfileRow() {
  const light = await db.from("profile").select(PROFILE_COLUMNS).eq("id", 1).maybeSingle();
  if (!light.error) return light.data;
  return check(await db.from("profile").select("*").eq("id", 1).maybeSingle());
}

// --- Statistiques ------------------------------------------------------------

const METRIC_TO_COLUMN: Record<string, string> = {
  visits: "visits", cvDownloads: "cv_downloads", whatsappClicks: "whatsapp_clicks",
  githubClicks: "github_clicks", linkedinClicks: "linkedin_clicks", facebookClicks: "facebook_clicks",
};

const serializeDay = (r: any) => ({
  date: r.day,
  ...Object.fromEntries(Object.entries(METRIC_TO_COLUMN).map(([key, col]) => [key, r[col] ?? 0])),
});

async function getStats() {
  const rows: any[] = check(await db.from("daily_stats").select("*").order("day", { ascending: false }));
  const totals = Object.fromEntries(
    Object.entries(METRIC_TO_COLUMN).map(([key, col]) => [key, rows.reduce((s, r) => s + (r[col] ?? 0), 0)]),
  );
  const last = rows.find((r) => r.visits > 0);
  return {
    ...totals,
    lastVisit: last ? `${last.day}T00:00:00.000Z` : null,
    history: rows.slice(0, MAX_HISTORY_DAYS).reverse().map(serializeDay),
  };
}

// --- Routeur -----------------------------------------------------------------

async function handle(req: Request): Promise<Response> {
  // "/functions/v1/api/content" (ou "/api/content" en local) -> "/content"
  const path = new URL(req.url).pathname.replace(/^.*?\/api(?=\/|$)/, "").replace(/\/+$/, "") || "/";
  const method = req.method;
  const seg = path.split("/").filter(Boolean);
  const [root, id] = seg;

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) throw new HttpError(413, "Requête trop volumineuse");

  if (method === "GET" && path === "/health") return json(req, { status: "ok" });

  if (method === "GET" && root === "image" && seg.length === 3) {
    return serveImage(seg[1], seg[2], new URL(req.url).searchParams.has("v"));
  }

  // Contenu public (sans les images) : le navigateur peut le garder 30 s,
  // puis le resservir en le rafraîchissant en arrière-plan.
  if (method === "GET" && path === "/content") {
    const [profile, competitions, creations, projects] = await Promise.all([
      getProfileRow(), listRows("competitions"), listRows("creations"), listRows("projects"),
    ]);
    return json(req, {
      profile: serializers.profile(profile),
      competitions: competitions.map(serializers.competitions),
      creations: creations.map(serializers.creations),
      projects: projects.map(serializers.projects),
    }, 200, "public, max-age=30, stale-while-revalidate=600");
  }

  if (root === "profile" && seg.length === 1) {
    if (method === "GET") return json(req, serializers.profile(await getProfileRow()));
    if (method === "PUT") {
      await requireAdmin(req);
      const d = await readBody(req);
      const email = str(d.email, "email", 254).trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Email invalide");
      const row = check(await db.from("profile").upsert({
        id: 1,
        description: str(d.description, "description"),
        email,
        phone: str(d.phone, "phone", 40),
        ...(isOwnImageUrl(d.photoUrl) ? {} : { photo_url: image(d.photoUrl, "photoUrl") }),
        github: url(d.github, "github"),
        linkedin: url(d.linkedin, "linkedin"),
        facebook: url(d.facebook, "facebook"),
      }).select().single());
      return json(req, serializers.profile(row));
    }
  }

  if (root && Object.hasOwn(LISTS, root) && seg.length <= 2) {
    const table = root as keyof typeof LISTS;
    const { prefix, fields } = LISTS[table];
    const serialize: (r: any) => unknown = serializers[table];
    if (id && !ID_RE.test(id)) throw new HttpError(400, "Identifiant invalide");

    if (method === "GET" && !id) return json(req, (await listRows(table)).map(serialize));

    if (method === "POST" && !id) {
      await requireAdmin(req);
      const d = await readBody(req);
      const newId = d.id ? str(d.id, "id", 64) : `${prefix}-${Date.now()}`;
      if (!ID_RE.test(newId)) throw new HttpError(400, "Identifiant invalide");
      const row = toRow(fields, d);
      const last = check(await db.from(table).select("position").order("position", { ascending: false }).limit(1));
      const position = last.length ? (last[0].position ?? -1) + 1 : 0;
      const created = check(await db.from(table).insert({ id: newId, position, ...row }).select().single());
      return json(req, serialize(created), 201);
    }

    if (method === "PUT" && id) {
      await requireAdmin(req);
      const row = check(await db.from(table).update(toRow(fields, await readBody(req))).eq("id", id).select().maybeSingle());
      if (!row) throw new HttpError(404, "Introuvable");
      return json(req, serialize(row));
    }

    if (method === "DELETE" && id) {
      await requireAdmin(req);
      const rows = check(await db.from(table).delete().eq("id", id).select("id"));
      if (!rows.length) throw new HttpError(404, "Introuvable");
      return json(req, { ok: true });
    }
  }

  // Statistiques
  if (root === "stats") {
    // Les statistiques de fréquentation ne regardent que l'admin.
    if (method === "GET" && seg.length === 1) {
      await requireAdmin(req);
      return json(req, await getStats());
    }

    if (method === "POST" && id === "increment") {
      const { metric } = await readBody(req);
      if (typeof metric !== "string" || !Object.hasOwn(METRIC_TO_COLUMN, metric)) {
        throw new HttpError(400, "Métrique inconnue");
      }
      check(await db.rpc("increment_stat", { metric: METRIC_TO_COLUMN[metric] }));
      return json(req, { ok: true });
    }

    if (method === "POST" && id === "reset") {
      await requireAdmin(req);
      check(await db.from("daily_stats").delete().not("day", "is", null));
      return json(req, { ok: true });
    }
  }

  // Authentification admin
  if (root === "admin" && method === "GET" && id === "verify") {
    await requireAdmin(req);
    return json(req, { ok: true });
  }

  if (root === "admin" && method === "POST") {
    const body = await readBody(req);

    if (id === "login") {
      const username = str(body.username, "username", 100).trim();
      const password = str(body.password, "password", 256);
      if (!username || !password) throw new HttpError(400, "Nom d'utilisateur et mot de passe requis");
      const ip = clientIp(req);
      await assertLoginAllowed(ip, username);

      const user = check(await db.from("admin_users").select("username, password_hash").eq("username", username).maybeSingle());
      const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
      if (!user || !ok) {
        await recordLoginFailure(ip, username);
        throw new HttpError(401, "Identifiants invalides");
      }

      let passwordHash = user.password_hash;
      // Migre silencieusement les anciens hashes Werkzeug vers le nouveau format.
      if (!passwordHash.startsWith("pbkdf2$")) {
        passwordHash = await hashPassword(password);
        check(await db.from("admin_users").update({ password_hash: passwordHash }).eq("username", user.username));
      }
      await db.from("login_attempts").delete().eq("username", user.username);
      return json(req, { token: await makeToken(user.username, passwordHash), username: user.username });
    }

    if (id === "register") {
      // Amorçage uniquement, et seulement si explicitement autorisé par un secret.
      if (Deno.env.get("ALLOW_ADMIN_REGISTER") !== "true") throw new HttpError(403, "Inscription désactivée");
      const { count, error } = await db.from("admin_users").select("*", { count: "exact", head: true });
      if (error) check({ data: null, error });
      if ((count ?? 0) > 0) throw new HttpError(403, "Un compte admin existe déjà");
      const username = str(body.username, "username", 100).trim();
      const password = str(body.password, "password", 256);
      if (!username) throw new HttpError(400, "Nom d'utilisateur requis");
      checkNewPassword(password);
      const passwordHash = await hashPassword(password);
      check(await db.from("admin_users").insert({ username, password_hash: passwordHash }));
      return json(req, { token: await makeToken(username, passwordHash), username }, 201);
    }

    if (id === "change-password") {
      // Le compte modifié est celui du jeton, jamais un nom envoyé dans la requête.
      const username = await requireAdmin(req);
      const current = str(body.currentPassword, "currentPassword", 256);
      const next = str(body.newPassword, "newPassword", 256);
      if (!current || !next) throw new HttpError(400, "Champs manquants");
      checkNewPassword(next);
      const user = check(await db.from("admin_users").select("password_hash").eq("username", username).maybeSingle());
      if (!user || !(await verifyPassword(current, user.password_hash))) throw new HttpError(401, "Mot de passe actuel incorrect");
      const passwordHash = await hashPassword(next);
      check(await db.from("admin_users").update({ password_hash: passwordHash }).eq("username", username));
      // Les anciens jetons deviennent invalides ; on renvoie un jeton neuf pour cette session.
      return json(req, { ok: true, token: await makeToken(username, passwordHash) });
    }
  }

  throw new HttpError(404, "Route introuvable");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  try {
    return await handle(req);
  } catch (err) {
    if (err instanceof HttpError) return json(req, { error: err.message }, err.status);
    console.error(err);
    return json(req, { error: "Erreur serveur" }, 500);
  }
});
