const section = document.querySelector("#tutorial-comments");
const endpoint = section.dataset.apiUrl;
const scrollArea = document.querySelector("#comment-scroll");
const list = document.querySelector("#comment-list");
const count = document.querySelector("#comment-count");
const form = document.querySelector("#comment-form");
const message = document.querySelector("#comment-message");
const send = form.querySelector("button[type='submit']");
const more = document.querySelector("#more-comments");
const status = document.querySelector("#comment-status");
const storagePrefix = "theplan:tutorial-comment:";
const temporaryKeys = new Map();
const entries = new Map();
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "medium", hour12: false });
let nextCursor = "";
let loadFailed = false;
let pendingComment;

function readKey(id) {
  try {
    return localStorage.getItem(storagePrefix + id) || temporaryKeys.get(id);
  } catch {
    return temporaryKeys.get(id);
  }
}

function saveKey(id, deleteKey) {
  try {
    localStorage.setItem(storagePrefix + id, deleteKey);
    return true;
  } catch {
    temporaryKeys.set(id, deleteKey);
    return false;
  }
}

function forgetKey(id) {
  temporaryKeys.delete(id);
  try {
    localStorage.removeItem(storagePrefix + id);
  } catch {
    // The browser may have disabled access to storage.
  }
}

async function requestComments(url, method = "GET", payload) {
  return fetch(url, {
    method,
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(12000),
  });
}

function updateCount() {
  count.textContent = `${entries.size}${nextCursor ? "+" : ""}`;
}

async function deleteComment(id, button) {
  button.disabled = true;
  try {
    const response = await requestComments(`${endpoint}/${id}`, "DELETE", { deleteKey: readKey(id) });
    if (!response.ok && response.status !== 404) throw new Error("Delete failed");

    const alreadyRemoved = response.status === 404;
    entries.get(id).remove();
    entries.delete(id);
    forgetKey(id);
    updateCount();
    status.textContent = alreadyRemoved ? "这条留言已不在列表中。" : "留言已删除。";
  } catch {
    status.textContent = "删除失败，请重试。";
    button.disabled = false;
  }
}

function addComment(comment, prepend = false) {
  if (entries.has(comment.id)) return;
  const entry = document.createElement("li");
  entry.className = "comment-entry";

  const star = document.createElement("span");
  star.className = "comment-star";
  star.setAttribute("aria-hidden", "true");
  star.textContent = "★";

  const line = document.createElement("div");
  const text = document.createElement("span");
  text.className = "comment-text";
  text.textContent = comment.body;

  const time = document.createElement("time");
  time.className = "comment-time";
  time.dateTime = comment.createdAt;
  time.textContent = dateFormat.format(new Date(comment.createdAt));
  line.append(text, time);

  if (readKey(comment.id)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "comment-action";
    button.textContent = "删除";
    button.addEventListener("click", () => deleteComment(comment.id, button));
    line.append(button);
  }

  entry.append(star, line);
  if (prepend) list.prepend(entry);
  else list.append(entry);
  entries.set(comment.id, entry);
}

async function loadComments() {
  if (more.disabled) return;
  more.disabled = true;
  if (nextCursor) {
    more.textContent = "正在加载留言…";
  } else {
    status.textContent = "正在加载留言…";
    more.hidden = true;
  }
  try {
    const url = new URL(endpoint);
    if (nextCursor) url.searchParams.set("before", nextCursor);
    const response = await requestComments(url);
    if (!response.ok) throw new Error("Load failed");

    const page = await response.json();
    nextCursor = page.nextCursor;
    for (const comment of page.comments) addComment(comment);
    updateCount();
    loadFailed = false;
    more.textContent = "更早的留言";
    more.hidden = !nextCursor;
    if (form.hidden) {
      form.hidden = false;
      status.textContent = entries.size ? "" : "还没有留言。";
    }
  } catch {
    loadFailed = true;
    if (form.hidden) status.textContent = "加载失败，请重试。";
    more.textContent = "重试加载留言";
    more.hidden = false;
  } finally {
    more.disabled = false;
  }
}

async function publishComment(event) {
  event.preventDefault();
  if (send.disabled) return;
  const body = message.value.trim();
  if (!body) {
    status.textContent = "请写下留言再发送。";
    return;
  }

  send.disabled = true;
  message.readOnly = true;
  status.textContent = "正在发送留言…";
  try {
    if (pendingComment?.body !== body) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const deleteKey = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
      pendingComment = { id: crypto.randomUUID(), deleteKey, body };
    }

    const saved = saveKey(pendingComment.id, pendingComment.deleteKey);
    const response = await requestComments(endpoint, "POST", pendingComment);
    if (!response.ok) {
      if (response.status === 409) {
        forgetKey(pendingComment.id);
        pendingComment = undefined;
      }
      throw new Error("Publish failed");
    }

    const { comment } = await response.json();
    addComment(comment, true);
    scrollArea.scrollTop = 0;
    updateCount();
    pendingComment = undefined;
    form.reset();
    status.textContent = saved ? "留言已发送。" : "留言已发送。请在离开本页前删除，浏览器无法保存删除权限。";
  } catch {
    status.textContent = "发送失败，留言已保留。请重试。";
  } finally {
    send.disabled = false;
    message.readOnly = false;
  }
}

if (endpoint) {
  form.addEventListener("submit", publishComment);
  more.addEventListener("click", loadComments);
  scrollArea.addEventListener("scroll", () => {
    const remaining = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
    if (nextCursor && !loadFailed && remaining <= 40) loadComments();
  }, { passive: true });
  loadComments();
} else {
  status.textContent = "留言区暂未开放。";
}
