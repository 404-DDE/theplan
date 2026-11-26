const pageSize = 30;
const maxCommentLength = 500;
const maxRequestBytes = 4096;
const commentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const deleteKeyPattern = /^[0-9a-f]{64}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const publicColumns = "id, body, created_at AS createdAt";

async function readPayload(request) {
  const type = request.headers.get("Content-Type")?.split(";")[0].trim();
  if (type !== "application/json" || !request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxRequestBytes) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  }
}

async function hashDeleteKey(deleteKey) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(deleteKey));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function listComments(db, url, json) {
  const before = url.searchParams.get("before");
  let cursorFilter = "";
  const queryValues = [];
  if (before !== null) {
    const [createdAt, id, extra] = before.split("/");
    if (!timestampPattern.test(createdAt) || !commentIdPattern.test(id) || extra !== undefined) {
      return json({ error: "invalid_cursor" }, 400);
    }
    cursorFilter = " WHERE (created_at, id) < (?, ?)";
    queryValues.push(createdAt, id);
  }

  const { results } = await db.prepare(
    `SELECT ${publicColumns} FROM tutorial_comments${cursorFilter}
     ORDER BY created_at DESC, id DESC LIMIT ?`,
  ).bind(...queryValues, pageSize + 1).all();
  const comments = results.slice(0, pageSize);
  const last = comments.at(-1);
  const nextCursor = results.length > pageSize ? `${last.createdAt}/${last.id}` : null;
  return json({ comments, nextCursor });
}

async function publishComment(db, request, json) {
  const data = await readPayload(request);
  const body = typeof data?.body === "string" ? data.body.trim() : "";
  if (typeof data?.id !== "string" || !commentIdPattern.test(data.id) ||
      typeof data.deleteKey !== "string" || !deleteKeyPattern.test(data.deleteKey) ||
      !body || body.length > maxCommentLength) {
    return json({ error: "invalid_comment" }, 400);
  }

  const { id, deleteKey } = data;
  const hash = await hashDeleteKey(deleteKey);
  const createdAt = new Date().toISOString();
  const result = await db.prepare(
    `INSERT INTO tutorial_comments (id, body, created_at, delete_key_hash)
     VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
  ).bind(id, body, createdAt, hash).run();
  if (result.meta.changes) return json({ comment: { id, body, createdAt } }, 201);

  const existing = await db.prepare(
    `SELECT ${publicColumns} FROM tutorial_comments WHERE id = ? AND delete_key_hash = ?`,
  ).bind(id, hash).first();
  if (existing?.body === body) return json({ comment: existing });
  return json({ error: "comment_conflict" }, 409);
}

async function removeComment(db, request, id, headers, json) {
  const data = await readPayload(request);
  if (typeof data?.deleteKey !== "string" || !deleteKeyPattern.test(data.deleteKey)) {
    return json({ error: "invalid_delete_key" }, 400);
  }

  const hash = await hashDeleteKey(data.deleteKey);
  const result = await db.prepare("DELETE FROM tutorial_comments WHERE id = ? AND delete_key_hash = ?")
    .bind(id, hash).run();
  if (result.meta.changes) return new Response(null, { status: 204, headers });

  const existing = await db.prepare("SELECT id FROM tutorial_comments WHERE id = ?").bind(id).first();
  return existing ? json({ error: "forbidden" }, 403) : json({ error: "comment_not_found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const headers = new Headers({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Origin",
    });
    const json = (body, status = 200) => Response.json(body, { status, headers });
    if (origin && origin !== env.SITE_ORIGIN) return json({ error: "forbidden_origin" }, 403);
    if (!origin && request.method !== "GET") return json({ error: "forbidden_origin" }, 403);
    if (origin) headers.set("Access-Control-Allow-Origin", origin);

    const collection = url.pathname === "/comments";
    const id = url.pathname.startsWith("/comments/") ? url.pathname.slice("/comments/".length) : "";
    if (!collection && !commentIdPattern.test(id)) return json({ error: "not_found" }, 404);

    if (request.method === "OPTIONS") {
      headers.set("Access-Control-Allow-Methods", collection ? "GET, POST, OPTIONS" : "DELETE, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      headers.set("Access-Control-Max-Age", "600");
      return new Response(null, { status: 204, headers });
    }

    try {
      if (collection && request.method === "GET") return await listComments(env.COMMENTS, url, json);
      if (collection && request.method === "POST") return await publishComment(env.COMMENTS, request, json);
      if (!collection && request.method === "DELETE") {
        return await removeComment(env.COMMENTS, request, id, headers, json);
      }
      return json({ error: "method_not_allowed" }, 405);
    } catch {
      return json({ error: "unavailable" }, 503);
    }
  },
};
