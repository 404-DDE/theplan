const endpoint = document.getElementById("comments").dataset.apiUrl;
const scrollArea = document.getElementById("comment-scroll-area");
const list = document.getElementById("comment-list");
const count = document.getElementById("comment-count");
const form = document.getElementById("comment-form");
const message = document.getElementById("comment-message");
const send = form.querySelector("button[type='submit']");
const more = document.getElementById("load-older-comments");
const status = document.getElementById("comment-status");

const commentTemplate = document.createElement("template");
commentTemplate.innerHTML = `
  <li class="comment-row">
    <span class="comment-star" aria-hidden="true">★</span>
    <div><span class="comment-text"></span><time class="comment-time"></time><button type="button" class="comment-action">删除</button></div>
  </li>
`;

const storagePrefix = "theplan:tutorial-comment:";
const temporaryKeys = new Map();
const entries = new Map();
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "medium", hour12: false });
let nextCursor = "";
let loadState = "idle";
let hasLoadedFirstPage = false;
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

function checkResponse(response) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

function updateCount() {
  count.textContent = `${entries.size}${nextCursor ? "+" : ""}`;
}

async function deleteComment(id, button) {
  button.disabled = true;
  try {
    const response = await requestComments(`${endpoint}/${id}`, "DELETE", { deleteKey: readKey(id) });
    const alreadyRemoved = response.status === 404;
    if (!alreadyRemoved) checkResponse(response);

    entries.get(id).remove();
    entries.delete(id);
    forgetKey(id);
    updateCount();
    status.textContent = alreadyRemoved ? "这条留言已不在列表中。" : "留言已删除。";
  } catch (error) {
    console.error("Could not delete comment", error);
    status.textContent = "删除失败，请重试。";
    button.disabled = false;
  }
}

function addComment(comment, prepend = false) {
  if (entries.has(comment.id)) return;

  const entry = commentTemplate.content.firstElementChild.cloneNode(true);
  entry.querySelector(".comment-text").textContent = comment.body;

  const time = entry.querySelector(".comment-time");
  time.dateTime = comment.createdAt;
  time.textContent = dateFormat.format(new Date(comment.createdAt));

  const deleteButton = entry.querySelector("button");
  if (readKey(comment.id)) {
    deleteButton.addEventListener("click", () => deleteComment(comment.id, deleteButton));
  } else {
    deleteButton.remove();
  }

  if (prepend) list.prepend(entry);
  else list.append(entry);
  entries.set(comment.id, entry);
}

async function loadComments() {
  if (loadState === "loading") return;

  loadState = "loading";
  more.disabled = true;

  const before = nextCursor;
  const progress = before ? more : status;
  progress.textContent = "正在加载留言…";
  if (!before) more.hidden = true;

  try {
    const url = new URL(endpoint);
    if (before) url.searchParams.set("before", before);
    const response = await requestComments(url);
    checkResponse(response);

    const page = await response.json();
    nextCursor = page.nextCursor;
    for (const comment of page.comments) addComment(comment);
    updateCount();

    more.textContent = "更早的留言";
    more.hidden = !nextCursor;
    if (!hasLoadedFirstPage) {
      form.hidden = false;
      status.textContent = entries.size ? "" : "还没有留言。";
      hasLoadedFirstPage = true;
    }
    loadState = "idle";
  } catch (error) {
    console.error("Could not load comments", error);
    loadState = "failed";
    if (!hasLoadedFirstPage) status.textContent = "加载失败，请重试。";
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
    if (response.status === 409) {
      forgetKey(pendingComment.id);
      pendingComment = undefined;
    }
    checkResponse(response);

    const { comment } = await response.json();
    addComment(comment, true);
    scrollArea.scrollTop = 0;
    updateCount();
    pendingComment = undefined;
    form.reset();
    status.textContent = saved ? "留言已发送。" : "留言已发送。请在离开本页前删除，浏览器无法保存删除权限。";
  } catch (error) {
    console.error("Could not publish comment", error);
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
    if (nextCursor && loadState === "idle" && remaining <= 40) loadComments();
  }, { passive: true });
  loadComments();
} else {
  status.textContent = "留言区暂未开放。";
}
