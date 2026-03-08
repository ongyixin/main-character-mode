// shared/types.ts
var DEFAULT_SETTINGS = {
  apiBaseUrl: "http://localhost:3001",
  activeCharacterId: null,
  proactiveComments: true,
  trackActivity: true
};
var GROUP_COLORS = ["#FF80C0", "#80D4FF", "#FFDE00", "#80FF9A"];

// shared/storage.ts
var KEYS = {
  CHARACTERS: "mcm_ext_characters",
  SETTINGS: "mcm_ext_settings",
  ACTIVITY: "mcm_ext_activity",
  CHAT_PREFIX: "mcm_ext_chat_",
  PENDING_GROUP: "mcm_ext_pending_group",
  GROUP_SESSION: "mcm_ext_group_session"
};
var MAX_CHAT_MESSAGES = 20;
async function getCharacters() {
  const result = await chrome.storage.local.get(KEYS.CHARACTERS);
  return result[KEYS.CHARACTERS] ?? [];
}
async function setCharacters(characters) {
  await chrome.storage.local.set({ [KEYS.CHARACTERS]: characters });
}
async function getCharacterById(id) {
  const characters = await getCharacters();
  return characters.find((c) => c.id === id) ?? null;
}
async function updateCharacter(updated) {
  const characters = await getCharacters();
  const idx = characters.findIndex((c) => c.id === updated.id);
  if (idx >= 0) {
    characters[idx] = updated;
  } else {
    characters.push(updated);
  }
  await setCharacters(characters);
}
async function getSettings() {
  const result = await chrome.storage.local.get(KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...result[KEYS.SETTINGS] };
}
async function getActiveCharacter() {
  const settings = await getSettings();
  if (!settings.activeCharacterId) return null;
  return getCharacterById(settings.activeCharacterId);
}
async function getActivity() {
  const result = await chrome.storage.local.get(KEYS.ACTIVITY);
  return result[KEYS.ACTIVITY] ?? [];
}
function buildActivityDigest(entries, maxEntries = 10) {
  if (entries.length === 0) return "No recent browsing activity.";
  const recent = entries.slice(-maxEntries).filter((e) => e.title && e.domain).reverse();
  const lines = recent.map((e) => {
    const mins = Math.round(e.timeSpentMs / 6e4);
    const timeStr = mins > 0 ? ` (${mins}m)` : "";
    return `${e.title} [${e.domain}]${timeStr}`;
  });
  return "Recently visited: " + lines.join(", ") + ".";
}
function chatKey(characterId) {
  return `${KEYS.CHAT_PREFIX}${characterId}`;
}
async function getChatHistory(characterId) {
  const key = chatKey(characterId);
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}
async function saveChatHistory(history) {
  const key = chatKey(history.characterId);
  const trimmed = {
    ...history,
    messages: history.messages.slice(-MAX_CHAT_MESSAGES)
  };
  await chrome.storage.local.set({ [key]: trimmed });
}
async function clearChatHistory(characterId) {
  await chrome.storage.local.remove(chatKey(characterId));
}
var MAX_GROUP_MESSAGES = 60;
async function getPendingGroup() {
  const r = await chrome.storage.local.get(KEYS.PENDING_GROUP);
  return r[KEYS.PENDING_GROUP] ?? null;
}
async function clearPendingGroup() {
  await chrome.storage.local.remove(KEYS.PENDING_GROUP);
}
async function getGroupSession() {
  const r = await chrome.storage.local.get(KEYS.GROUP_SESSION);
  return r[KEYS.GROUP_SESSION] ?? null;
}
async function saveGroupSession(session) {
  const trimmed = {
    ...session,
    messages: session.messages.slice(-MAX_GROUP_MESSAGES)
  };
  await chrome.storage.local.set({ [KEYS.GROUP_SESSION]: trimmed });
}
async function clearGroupSession() {
  await chrome.storage.local.remove(KEYS.GROUP_SESSION);
}

// shared/api.ts
async function getBaseUrl() {
  const settings = await getSettings();
  return settings.apiBaseUrl.replace(/\/$/, "");
}
async function recallChat(character, mode, message, browserContext) {
  const baseUrl = await getBaseUrl();
  const body = {
    character,
    interactionMode: mode,
    message,
    ...browserContext ? { browserContext } : {}
  };
  const res = await fetch(`${baseUrl}/api/recall`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`/api/recall failed (${res.status}): ${text}`);
  }
  return res.json();
}
async function groupRecallChat(character, mode, userMessage, groupContext, browserContext) {
  const baseUrl = await getBaseUrl();
  const body = {
    character,
    interactionMode: mode,
    message: userMessage,
    groupContext,
    ...browserContext ? { browserContext } : {}
  };
  const res = await fetch(`${baseUrl}/api/recall`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`/api/recall (group) failed (${res.status}): ${text}`);
  }
  return res.json();
}
async function fetchSuggestion(mode, characterName, personality) {
  try {
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}/api/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, characterName, personality })
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.suggestion ?? "";
  } catch {
    return "";
  }
}

// sidepanel/sidepanel.ts
var REL_THRESHOLDS = [
  [80, "DEVOTED", "#FF80C0"],
  [40, "FRIENDLY", "#7FE080"],
  [-40, "NEUTRAL", "#FFDE00"],
  [-80, "HOSTILE", "#FF8040"],
  [-Infinity, "ENEMY", "#FF4040"]
];
function getRelMeta(score) {
  for (const [threshold, label, color] of REL_THRESHOLDS) {
    if (score >= threshold) return { label, color };
  }
  return { label: "ENEMY", color: "#FF4040" };
}
var PORTRAIT_THEMES = [
  { keywords: ["jealous", "envious", "bitter"], emoji: "\u{1F624}", gradient: "linear-gradient(135deg, #2d0a4e, #4a0080, #6d0070)" },
  { keywords: ["romantic", "longing", "love"], emoji: "\u{1F339}", gradient: "linear-gradient(135deg, #4a0010, #8b1a3a, #4a0010)" },
  { keywords: ["mysterious", "cryptic", "secret"], emoji: "\u{1F56F}\uFE0F", gradient: "linear-gradient(135deg, #0a0a0a, #1a1a2e, #0a0a0a)" },
  { keywords: ["comedic", "chaotic", "clown"], emoji: "\u{1F3AD}", gradient: "linear-gradient(135deg, #4a2800, #7a4a00, #4a2800)" },
  { keywords: ["sage", "wise", "oracle"], emoji: "\u{1F52E}", gradient: "linear-gradient(135deg, #001040, #001870, #001040)" },
  { keywords: ["villain", "dark", "sinister"], emoji: "\u{1F480}", gradient: "linear-gradient(135deg, #0a0000, #200000, #0a0000)" },
  { keywords: ["anxious", "nervous", "worried"], emoji: "\u{1F630}", gradient: "linear-gradient(135deg, #001a1a, #003a3a, #001a1a)" }
];
var DEFAULT_THEME = { emoji: "\u2726", gradient: "linear-gradient(135deg, #0a0028, #1a0050, #0a0028)" };
function getPortraitTheme(personality) {
  const lower = personality.toLowerCase();
  for (const t of PORTRAIT_THEMES) {
    if (t.keywords.some((k) => lower.includes(k))) return t;
  }
  return DEFAULT_THEME;
}
var screenEmpty = document.getElementById("screen-empty");
var screenChat = document.getElementById("screen-chat");
var screenGroup = document.getElementById("screen-group");
var charPortrait = document.getElementById("char-portrait");
var charName = document.getElementById("char-name");
var charLabel = document.getElementById("char-label");
var charState = document.getElementById("char-state");
var relLabel = document.getElementById("rel-label");
var relBarFill = document.getElementById("rel-bar-fill");
var relScore = document.getElementById("rel-score");
var contextBadge = document.getElementById("context-badge");
var contextBadgeText = document.getElementById("context-badge-text");
var contextBadgeClear = document.getElementById("context-badge-clear");
var activityStatus = document.getElementById("activity-status");
var activityText = document.getElementById("activity-text");
var btnShowFeed = document.getElementById("btn-show-feed");
var activityFeed = document.getElementById("activity-feed");
var activityFeedList = document.getElementById("activity-feed-list");
var btnHideFeed = document.getElementById("btn-hide-feed");
var chatMessages = document.getElementById("chat-messages");
var typingIndicator = document.getElementById("typing-indicator");
var modeSelector = document.getElementById("mode-selector");
var btnSuggest = document.getElementById("btn-suggest");
var inputMessage = document.getElementById("input-message");
var btnSend = document.getElementById("btn-send");
var toggleContext = document.getElementById("toggle-context");
var btnClearHistory = document.getElementById("btn-clear-history");
var activeCharacter = null;
var chatHistory = null;
var currentMode = "befriend";
var pendingContextQuery = null;
var currentTab = null;
var groupSession = null;
var groupMode = "befriend";
var groupSending = false;
async function init() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  if (tabs[0]?.url && tabs[0]?.title) {
    currentTab = { url: tabs[0].url, title: tabs[0].title };
    if (tabs[0].url.startsWith("http://") || tabs[0].url.startsWith("https://")) {
      showActivityBar(tabs[0].title);
    }
  }
  const pending = await getPendingGroup();
  if (pending && pending.length >= 2) {
    await clearPendingGroup();
    const members = pending.map((char, i) => ({
      character: char,
      color: GROUP_COLORS[i % GROUP_COLORS.length]
    }));
    await startGroupChat(members);
    return;
  }
  const existingGroup = await getGroupSession();
  if (existingGroup) {
    groupSession = existingGroup;
    renderGroupScreen(existingGroup);
    showScreen("group");
    return;
  }
  const character = await getActiveCharacter();
  if (!character) {
    showScreen("empty");
    return;
  }
  await loadCharacter(character);
}
async function loadCharacter(character) {
  activeCharacter = character;
  const history = await getChatHistory(character.id);
  chatHistory = history ?? {
    characterId: character.id,
    messages: [],
    relationshipScore: character.relationshipScore,
    emotionalState: character.emotionalState
  };
  renderHeader(character);
  renderHistory(chatHistory);
  showScreen("chat");
}
function showScreen(screen) {
  screenEmpty.classList.toggle("hidden", screen !== "empty");
  screenChat.classList.toggle("hidden", screen !== "chat");
  screenGroup.classList.toggle("hidden", screen !== "group");
}
function renderHeader(character) {
  const theme = getPortraitTheme(character.personality);
  charPortrait.style.background = theme.gradient;
  if (character.portraitUrl) {
    charPortrait.innerHTML = `<img src="${escapeHtml(character.portraitUrl)}" alt="${escapeHtml(character.name)}" />`;
  } else {
    charPortrait.innerHTML = theme.emoji;
    charPortrait.style.fontSize = "24px";
  }
  charName.textContent = character.name;
  charLabel.textContent = character.objectLabel;
  charState.textContent = character.emotionalState.toUpperCase();
  updateRelBar(character.relationshipScore);
}
function updateRelBar(score) {
  const { label, color } = getRelMeta(score);
  const pct = (score + 100) / 200 * 100;
  relLabel.textContent = label;
  relLabel.style.color = color;
  relBarFill.style.width = `${pct}%`;
  relBarFill.style.background = color;
  relScore.textContent = (score > 0 ? "+" : "") + score;
}
function updateEmotionalState(state) {
  charState.textContent = state.toUpperCase();
}
function showActivityBar(title) {
  activityText.textContent = title;
  activityStatus.classList.remove("hidden");
}
function hideActivityBar() {
  activityStatus.classList.add("hidden");
  activityFeed.classList.add("hidden");
}
async function renderActivityFeed() {
  const entries = await getActivity();
  activityFeedList.innerHTML = "";
  if (entries.length === 0) {
    activityFeedList.innerHTML = `<div class="activity-empty">No activity logged yet. Browse some pages first.</div>`;
    return;
  }
  const recent = [...entries].reverse().slice(0, 20);
  for (const entry of recent) {
    const el = document.createElement("div");
    el.className = "activity-entry";
    const mins = Math.round(entry.timeSpentMs / 6e4);
    const timeStr = mins > 0 ? `${mins}m` : "<1m";
    const relTime = formatRelativeTime(entry.timestamp);
    el.innerHTML = `
      <span class="activity-entry-domain">${escapeHtml(entry.domain)}</span>
      <span class="activity-entry-title" title="${escapeHtml(entry.title)}">${escapeHtml(entry.title)}</span>
      <span class="activity-entry-time">${timeStr} \xB7 ${relTime}</span>
    `;
    activityFeedList.appendChild(el);
  }
}
function formatRelativeTime(ts) {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 6e4);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
btnShowFeed.addEventListener("click", async () => {
  await renderActivityFeed();
  activityFeed.classList.remove("hidden");
});
btnHideFeed.addEventListener("click", () => {
  activityFeed.classList.add("hidden");
});
function showContextBadge(text) {
  contextBadgeText.textContent = text;
  contextBadge.classList.remove("hidden");
}
function hideContextBadge() {
  contextBadge.classList.add("hidden");
  pendingContextQuery = null;
}
contextBadgeClear.addEventListener("click", hideContextBadge);
function renderHistory(history) {
  chatMessages.innerHTML = "";
  for (const msg of history.messages) {
    appendMessageToDOM(msg, false);
  }
  scrollToBottom();
}
function appendMessageToDOM(msg, animate = true) {
  const el = buildMessageEl(msg, animate);
  chatMessages.appendChild(el);
}
function buildMessageEl(msg, _animate) {
  const wrapper = document.createElement("div");
  wrapper.className = `msg msg-${msg.role}`;
  wrapper.dataset.id = msg.id;
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = msg.text;
  wrapper.appendChild(bubble);
  if (msg.role !== "system") {
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    meta.appendChild(Object.assign(document.createElement("span"), { textContent: time }));
    if (msg.interactionMode) {
      const tag = document.createElement("span");
      tag.className = "msg-mode-tag";
      tag.textContent = msg.interactionMode.toUpperCase();
      meta.appendChild(tag);
    }
    if (msg.relationshipDelta !== void 0 && msg.relationshipDelta !== 0) {
      const delta = document.createElement("span");
      const sign = msg.relationshipDelta > 0 ? "+" : "";
      delta.className = `rel-delta ${msg.relationshipDelta > 0 ? "pos" : "neg"}`;
      delta.textContent = `${sign}${msg.relationshipDelta}`;
      meta.appendChild(delta);
    }
    wrapper.appendChild(meta);
  }
  return wrapper;
}
async function typewriterAppend(text, msgId) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg msg-character";
  wrapper.dataset.id = msgId;
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  bubble.appendChild(cursor);
  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  scrollToBottom();
  const CHAR_DELAY_MS = 18;
  for (let i = 0; i < text.length; i++) {
    bubble.insertBefore(document.createTextNode(text[i]), cursor);
    if (i % 3 === 0) scrollToBottom();
    await sleep(CHAR_DELAY_MS);
  }
  cursor.remove();
  return;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
modeSelector.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    modeSelector.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
  });
});
async function buildBrowserContext(selectedText) {
  if (!toggleContext.checked) return void 0;
  const settings = await getSettings();
  if (!settings.trackActivity) return void 0;
  const activity = await getActivity();
  const digest = buildActivityDigest(activity);
  const tab = currentTab;
  if (!tab?.url) return void 0;
  try {
    const url = new URL(tab.url);
    return {
      currentUrl: tab.url,
      currentTitle: tab.title,
      currentDomain: url.hostname.replace(/^www\./, ""),
      activityDigest: digest,
      ...selectedText ? { selectedText } : {}
    };
  } catch {
    return void 0;
  }
}
async function sendMessage(text) {
  if (!activeCharacter || !chatHistory) return;
  const trimmed = text.trim();
  if (!trimmed) return;
  inputMessage.value = "";
  btnSend.disabled = true;
  btnSuggest.disabled = true;
  const userMsg = {
    id: `msg_${Date.now()}_user`,
    role: "user",
    text: trimmed,
    timestamp: Date.now(),
    interactionMode: currentMode
  };
  chatHistory.messages.push(userMsg);
  appendMessageToDOM(userMsg);
  scrollToBottom();
  typingIndicator.classList.remove("hidden");
  try {
    const selectedText = pendingContextQuery?.selectedText;
    const browserCtx = await buildBrowserContext(selectedText);
    const result = await recallChat(activeCharacter, currentMode, trimmed, browserCtx);
    typingIndicator.classList.add("hidden");
    const charMsgId = `msg_${Date.now()}_char`;
    await typewriterAppend(result.response, charMsgId);
    const charMsg = {
      id: charMsgId,
      role: "character",
      text: result.response,
      timestamp: Date.now(),
      relationshipDelta: result.relationshipDelta,
      interactionMode: currentMode
    };
    const wrapper = chatMessages.querySelector(`[data-id="${charMsgId}"]`);
    if (wrapper) {
      const meta = document.createElement("div");
      meta.className = "msg-meta";
      const time = new Date(charMsg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      meta.appendChild(Object.assign(document.createElement("span"), { textContent: time }));
      if (result.relationshipDelta !== 0) {
        const sign = result.relationshipDelta > 0 ? "+" : "";
        const delta = Object.assign(document.createElement("span"), {
          className: `rel-delta ${result.relationshipDelta > 0 ? "pos" : "neg"}`,
          textContent: `${sign}${result.relationshipDelta}`
        });
        meta.appendChild(delta);
      }
      wrapper.appendChild(meta);
    }
    chatHistory.messages.push(charMsg);
    chatHistory.relationshipScore = result.newRelationshipToUser;
    chatHistory.emotionalState = result.emotionalStateUpdate;
    const updatedCharacter = {
      ...activeCharacter,
      relationshipScore: result.newRelationshipToUser,
      emotionalState: result.emotionalStateUpdate,
      interactionCount: activeCharacter.interactionCount + 1
    };
    activeCharacter = updatedCharacter;
    await updateCharacter(updatedCharacter);
    updateRelBar(result.newRelationshipToUser);
    updateEmotionalState(result.emotionalStateUpdate);
    if (pendingContextQuery) hideContextBadge();
    await saveChatHistory(chatHistory);
  } catch (err) {
    typingIndicator.classList.add("hidden");
    const errMsg = {
      id: `msg_${Date.now()}_sys`,
      role: "system",
      text: `Connection error: ${String(err)}. Check the API URL in settings.`,
      timestamp: Date.now()
    };
    chatHistory.messages.push(errMsg);
    appendMessageToDOM(errMsg);
    scrollToBottom();
    await saveChatHistory(chatHistory);
  } finally {
    btnSend.disabled = false;
    btnSuggest.disabled = false;
    inputMessage.focus();
  }
}
btnSend.addEventListener("click", () => {
  sendMessage(inputMessage.value);
});
inputMessage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage(inputMessage.value);
  }
});
btnSuggest.addEventListener("click", async () => {
  if (!activeCharacter) return;
  btnSuggest.disabled = true;
  btnSuggest.textContent = "\u2026";
  const suggestion = await fetchSuggestion(currentMode, activeCharacter.name, activeCharacter.personality);
  btnSuggest.textContent = "\u2726";
  btnSuggest.disabled = false;
  if (suggestion) {
    inputMessage.value = suggestion;
    inputMessage.focus();
  }
});
btnClearHistory.addEventListener("click", async () => {
  if (!activeCharacter) return;
  await clearChatHistory(activeCharacter.id);
  chatHistory = {
    characterId: activeCharacter.id,
    messages: [],
    relationshipScore: activeCharacter.relationshipScore,
    emotionalState: activeCharacter.emotionalState
  };
  chatMessages.innerHTML = "";
});
var groupPortraits = document.getElementById("group-portraits");
var groupMembersLabel = document.getElementById("group-members-label");
var groupChatMessages = document.getElementById("group-chat-messages");
var groupTypingIndicator = document.getElementById("group-typing-indicator");
var groupTypingName = document.getElementById("group-typing-name");
var groupInputMessage = document.getElementById("group-input-message");
var groupBtnSend = document.getElementById("group-btn-send");
var groupBtnClear = document.getElementById("group-btn-clear");
var btnLeaveGroup = document.getElementById("btn-leave-group");
var groupModeSelector = document.getElementById("group-mode-selector");
groupModeSelector.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    groupModeSelector.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    groupMode = btn.dataset.mode;
  });
});
async function startGroupChat(members) {
  const existing = await getGroupSession();
  const memberIds = members.map((m) => m.character.id).sort().join(",");
  const existingIds = existing?.members.map((m) => m.character.id).sort().join(",");
  if (existing && memberIds === existingIds) {
    groupSession = existing;
  } else {
    groupSession = {
      members,
      messages: [],
      createdAt: Date.now()
    };
    await saveGroupSession(groupSession);
  }
  renderGroupScreen(groupSession);
  showScreen("group");
}
function renderGroupScreen(session) {
  groupPortraits.innerHTML = "";
  for (const member of session.members) {
    const theme = getPortraitTheme(member.character.personality);
    const mini = document.createElement("div");
    mini.className = "group-portrait-mini";
    mini.style.background = theme.gradient;
    mini.style.borderColor = member.color;
    if (member.character.portraitUrl) {
      mini.innerHTML = `<img src="${escapeHtml(member.character.portraitUrl)}" alt="" />`;
    } else {
      mini.textContent = theme.emoji;
    }
    groupPortraits.appendChild(mini);
  }
  groupMembersLabel.textContent = session.members.map((m) => m.character.name).join(" \xB7 ");
  groupChatMessages.innerHTML = "";
  for (const msg of session.messages) {
    appendGroupMessageToDOM(msg, false);
  }
  groupScrollToBottom();
}
function appendGroupMessageToDOM(msg, animate = true) {
  const wrapper = document.createElement("div");
  if (msg.role === "user") {
    wrapper.className = "msg msg-user";
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = msg.text;
    wrapper.appendChild(bubble);
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    meta.appendChild(Object.assign(document.createElement("span"), { textContent: time }));
    wrapper.appendChild(meta);
  } else {
    wrapper.className = "msg msg-group-char";
    const label = document.createElement("div");
    label.className = "msg-speaker-label";
    label.textContent = msg.speakerName;
    label.style.color = msg.speakerColor ?? "#FF80C0";
    wrapper.appendChild(label);
    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.style.borderLeftColor = msg.speakerColor ?? "#FF80C0";
    bubble.textContent = msg.text;
    wrapper.appendChild(bubble);
    const meta = document.createElement("div");
    meta.className = "msg-meta";
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    meta.appendChild(Object.assign(document.createElement("span"), { textContent: time }));
    wrapper.appendChild(meta);
  }
  groupChatMessages.appendChild(wrapper);
  if (animate) groupScrollToBottom();
}
async function groupTypewriterAppend(text, speakerName, speakerColor) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg msg-group-char";
  const label = document.createElement("div");
  label.className = "msg-speaker-label";
  label.textContent = speakerName;
  label.style.color = speakerColor;
  wrapper.appendChild(label);
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.style.borderLeftColor = speakerColor;
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  bubble.appendChild(cursor);
  wrapper.appendChild(bubble);
  groupChatMessages.appendChild(wrapper);
  groupScrollToBottom();
  const CHAR_DELAY_MS = 16;
  for (let i = 0; i < text.length; i++) {
    bubble.insertBefore(document.createTextNode(text[i]), cursor);
    if (i % 3 === 0) groupScrollToBottom();
    await sleep(CHAR_DELAY_MS);
  }
  cursor.remove();
  return wrapper;
}
function groupScrollToBottom() {
  groupChatMessages.scrollTop = groupChatMessages.scrollHeight;
}
async function sendGroupMessage(text) {
  if (!groupSession || groupSending) return;
  const trimmed = text.trim();
  if (!trimmed) return;
  groupSending = true;
  groupInputMessage.value = "";
  groupBtnSend.disabled = true;
  const userMsg = {
    id: `gm_${Date.now()}_user`,
    role: "user",
    speakerName: "You",
    text: trimmed,
    timestamp: Date.now(),
    interactionMode: groupMode
  };
  groupSession.messages.push(userMsg);
  appendGroupMessageToDOM(userMsg);
  for (const member of groupSession.members) {
    const otherMembers = groupSession.members.filter((m) => m.character.id !== member.character.id).map((m) => ({
      name: m.character.name,
      personality: m.character.personality,
      emotionalState: m.character.emotionalState
    }));
    const recentMessages = groupSession.messages.slice(-12).map((m) => ({
      speakerName: m.speakerName,
      text: m.text
    }));
    groupTypingName.textContent = member.character.name;
    groupTypingName.style.color = member.color;
    groupTypingIndicator.classList.remove("hidden");
    groupScrollToBottom();
    try {
      const browserCtx = await buildBrowserContext();
      const result = await groupRecallChat(
        member.character,
        groupMode,
        trimmed,
        { otherCharacters: otherMembers, recentMessages },
        browserCtx
      );
      groupTypingIndicator.classList.add("hidden");
      const wrapper = await groupTypewriterAppend(result.response, member.character.name, member.color);
      const meta = document.createElement("div");
      meta.className = "msg-meta";
      const time = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      meta.appendChild(Object.assign(document.createElement("span"), { textContent: time }));
      wrapper.appendChild(meta);
      const charMsg = {
        id: `gm_${Date.now()}_${member.character.id}`,
        role: "character",
        speakerName: member.character.name,
        speakerCharacterId: member.character.id,
        speakerColor: member.color,
        text: result.response,
        timestamp: Date.now(),
        interactionMode: groupMode
      };
      groupSession.messages.push(charMsg);
      await sleep(300);
    } catch (err) {
      groupTypingIndicator.classList.add("hidden");
      const errMsg = {
        id: `gm_${Date.now()}_err`,
        role: "character",
        speakerName: member.character.name,
        speakerColor: member.color,
        text: `[Connection error: ${String(err)}]`,
        timestamp: Date.now()
      };
      groupSession.messages.push(errMsg);
      appendGroupMessageToDOM(errMsg);
    }
  }
  await saveGroupSession(groupSession);
  groupSending = false;
  groupBtnSend.disabled = false;
  groupInputMessage.focus();
}
groupBtnSend.addEventListener("click", () => sendGroupMessage(groupInputMessage.value));
groupInputMessage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendGroupMessage(groupInputMessage.value);
  }
});
groupBtnClear.addEventListener("click", async () => {
  if (!groupSession) return;
  groupSession.messages = [];
  await saveGroupSession(groupSession);
  groupChatMessages.innerHTML = "";
});
btnLeaveGroup.addEventListener("click", async () => {
  groupSession = null;
  await clearGroupSession();
  const character = await getActiveCharacter();
  if (character) {
    await loadCharacter(character);
  } else {
    showScreen("empty");
  }
});
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CONTEXT_MENU_QUERY") {
    pendingContextQuery = {
      selectedText: message.selectedText,
      sourceUrl: message.sourceUrl,
      sourceTitle: message.sourceTitle
    };
    const label = message.selectedText ? `"${message.selectedText.slice(0, 60)}${message.selectedText.length > 60 ? "\u2026" : ""}"` : `From: ${message.sourceTitle}`;
    showContextBadge(`Context: ${label}`);
    if (message.selectedText) {
      inputMessage.value = `What do you think about this? "${message.selectedText.slice(0, 120)}"`;
    }
    inputMessage.focus();
    return;
  }
  if (message.type === "PROACTIVE_COMMENT" && activeCharacter && chatHistory) {
    const proactiveMsg = {
      id: `msg_${Date.now()}_char`,
      role: "character",
      text: message.text,
      timestamp: Date.now(),
      relationshipDelta: message.relationshipDelta
    };
    chatHistory.messages.push(proactiveMsg);
    appendMessageToDOM(proactiveMsg);
    scrollToBottom();
    if (message.newRelationshipScore !== void 0) {
      chatHistory.relationshipScore = message.newRelationshipScore;
      updateRelBar(message.newRelationshipScore);
    }
    if (message.emotionalState) {
      chatHistory.emotionalState = message.emotionalState;
      updateEmotionalState(message.emotionalState);
    }
    saveChatHistory(chatHistory).catch(() => {
    });
    return;
  }
  if (message.type === "TAB_CHANGED") {
    const entry = message.entry;
    if (entry?.url && entry?.title) {
      currentTab = { url: entry.url, title: entry.title };
      if (entry.url.startsWith("http://") || entry.url.startsWith("https://")) {
        showActivityBar(entry.title);
      } else {
        hideActivityBar();
      }
      if (!activityFeed.classList.contains("hidden")) {
        renderActivityFeed().catch(() => {
        });
      }
    }
    return;
  }
  if (message.type === "SET_ACTIVE_CHARACTER") {
    init().catch(console.error);
    return;
  }
  if (message.type === "START_GROUP_CHAT") {
    const characters = message.characters;
    const members = characters.map((char, i) => ({
      character: char,
      color: GROUP_COLORS[i % GROUP_COLORS.length]
    }));
    startGroupChat(members).catch(console.error);
    return;
  }
});
init().catch(console.error);
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc2hhcmVkL3R5cGVzLnRzIiwgIi4uL3NoYXJlZC9zdG9yYWdlLnRzIiwgIi4uL3NoYXJlZC9hcGkudHMiLCAic2lkZXBhbmVsLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBTaGFyZWQgdHlwZXMgZm9yIHRoZSBNQ00gQ29tcGFuaW9uIENocm9tZSBleHRlbnNpb24uXG4vLyBNaXJyb3JzIHRoZSBlc3NlbnRpYWwgdHlwZXMgZnJvbSB0aGUgbWFpbiBhcHAncyBzcmMvdHlwZXMvaW5kZXgudHMuXG4vLyBLZWVwIGluIHN5bmMgbWFudWFsbHkgaWYgdGhlIG1haW4gYXBwIHR5cGVzIGNoYW5nZS5cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoYXJhY3RlciB0eXBlcyAobWlycm9yZWQgZnJvbSBtYWluIGFwcCkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIFN0b3J5R2VucmUgPVxuICB8IFwiZGF0aW5nX3NpbVwiXG4gIHwgXCJteXN0ZXJ5XCJcbiAgfCBcImZhbnRhc3lcIlxuICB8IFwic3Vydml2YWxcIlxuICB8IFwid29ya3BsYWNlX2RyYW1hXCJcbiAgfCBcInNvYXBfb3BlcmFcIjtcblxuZXhwb3J0IHR5cGUgSW50ZXJhY3Rpb25Nb2RlID1cbiAgfCBcImZsaXJ0XCJcbiAgfCBcImludGVycm9nYXRlXCJcbiAgfCBcInJlY3J1aXRcIlxuICB8IFwiYmVmcmllbmRcIlxuICB8IFwicm9hc3RcIlxuICB8IFwiYXBvbG9naXplXCI7XG5cbmV4cG9ydCB0eXBlIENoYXJhY3RlckV4cHJlc3Npb24gPVxuICB8IFwibmV1dHJhbFwiXG4gIHwgXCJ0YWxraW5nXCJcbiAgfCBcImhhcHB5XCJcbiAgfCBcImFuZ3J5XCJcbiAgfCBcInNhZFwiXG4gIHwgXCJzdXJwcmlzZWRcIjtcblxuLyoqIEEgY2hhcmFjdGVyIHNhdmVkIHRvIHRoZSBwbGF5ZXIncyBwZXJtYW5lbnQgY29sbGVjdGlvbiBpbmRleC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2F2ZWRDaGFyYWN0ZXIge1xuICBpZDogc3RyaW5nO1xuICBvYmplY3RMYWJlbDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIHBlcnNvbmFsaXR5OiBzdHJpbmc7XG4gIHZvaWNlU3R5bGU6IHN0cmluZztcbiAgZW1vdGlvbmFsU3RhdGU6IHN0cmluZztcbiAgcG9ydHJhaXRVcmw/OiBzdHJpbmc7XG4gIHBvcnRyYWl0cz86IFBhcnRpYWw8UmVjb3JkPENoYXJhY3RlckV4cHJlc3Npb24sIHN0cmluZz4+O1xuICBnZW5yZTogU3RvcnlHZW5yZTtcbiAgcmVsYXRpb25zaGlwU2NvcmU6IG51bWJlcjtcbiAgc2F2ZWRBdDogbnVtYmVyO1xuICBtZW1vcmllczogc3RyaW5nW107XG4gIGludGVyYWN0aW9uQ291bnQ6IG51bWJlcjtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEV4dGVuc2lvbi1zcGVjaWZpYyB0eXBlcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqIEJyb3dzZXIgY29udGV4dCBpbmplY3RlZCBpbnRvIC9hcGkvcmVjYWxsIGNhbGxzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBCcm93c2VyQ29udGV4dCB7XG4gIGN1cnJlbnRVcmw6IHN0cmluZztcbiAgY3VycmVudFRpdGxlOiBzdHJpbmc7XG4gIGN1cnJlbnREb21haW46IHN0cmluZztcbiAgc2VsZWN0ZWRUZXh0Pzogc3RyaW5nO1xuICAvKiogUHJvc2Ugc3VtbWFyeSBvZiByZWNlbnQgYnJvd3NpbmcgYWN0aXZpdHkuICovXG4gIGFjdGl2aXR5RGlnZXN0OiBzdHJpbmc7XG59XG5cbi8qKiBPbmUgZW50cnkgaW4gdGhlIHJvbGxpbmcgdGFiIGFjdGl2aXR5IGxvZy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aXZpdHlFbnRyeSB7XG4gIHVybDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBkb21haW46IHN0cmluZztcbiAgdGltZXN0YW1wOiBudW1iZXI7XG4gIC8qKiBIb3cgbG9uZyB0aGUgdXNlciBzcGVudCBvbiB0aGlzIHBhZ2UvdGFiIGluIG1zLiAwIGlmIHN0aWxsIGFjdGl2ZS4gKi9cbiAgdGltZVNwZW50TXM6IG51bWJlcjtcbn1cblxuLyoqIFBlcnNpc3RlZCBleHRlbnNpb24gc2V0dGluZ3MuICovXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVuc2lvblNldHRpbmdzIHtcbiAgLyoqIEJhc2UgVVJMIG9mIHRoZSBNQ00gTmV4dC5qcyBhcHAgKGUuZy4gaHR0cDovL2xvY2FsaG9zdDozMDAwKS4gKi9cbiAgYXBpQmFzZVVybDogc3RyaW5nO1xuICAvKiogSUQgb2YgdGhlIGN1cnJlbnRseSBhY3RpdmUgY2hhcmFjdGVyLiBudWxsIGlmIG5vbmUgc2VsZWN0ZWQuICovXG4gIGFjdGl2ZUNoYXJhY3RlcklkOiBzdHJpbmcgfCBudWxsO1xuICAvKiogV2hldGhlciB0aGUgY2hhcmFjdGVyIHNob3VsZCBwcm9hY3RpdmVseSBjb21tZW50IG9uIGJyb3dzaW5nIGFjdGl2aXR5LiAqL1xuICBwcm9hY3RpdmVDb21tZW50czogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgdG8gdHJhY2sgdGFiIGFjdGl2aXR5IGF0IGFsbC4gKi9cbiAgdHJhY2tBY3Rpdml0eTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEV4dGVuc2lvblNldHRpbmdzID0ge1xuICBhcGlCYXNlVXJsOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMVwiLFxuICBhY3RpdmVDaGFyYWN0ZXJJZDogbnVsbCxcbiAgcHJvYWN0aXZlQ29tbWVudHM6IHRydWUsXG4gIHRyYWNrQWN0aXZpdHk6IHRydWUsXG59O1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgR3JvdXAgY2hhdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqIENvbG9yIGFzc2lnbmVkIHRvIGEgY2hhcmFjdGVyIGluIHRoZSBncm91cCBjaGF0IFVJLiAqL1xuZXhwb3J0IGNvbnN0IEdST1VQX0NPTE9SUyA9IFtcIiNGRjgwQzBcIiwgXCIjODBENEZGXCIsIFwiI0ZGREUwMFwiLCBcIiM4MEZGOUFcIl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBpbnRlcmZhY2UgR3JvdXBNZW1iZXIge1xuICBjaGFyYWN0ZXI6IFNhdmVkQ2hhcmFjdGVyO1xuICAvKiogSGV4IGNvbG9yIGZvciB0aGlzIG1lbWJlcidzIGxhYmVsICsgYnViYmxlIGFjY2VudCBpbiB0aGUgZ3JvdXAgY2hhdCBmZWVkLiAqL1xuICBjb2xvcjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEdyb3VwQ2hhdE1lc3NhZ2Uge1xuICBpZDogc3RyaW5nO1xuICByb2xlOiBcInVzZXJcIiB8IFwiY2hhcmFjdGVyXCI7XG4gIHNwZWFrZXJOYW1lOiBzdHJpbmc7XG4gIHNwZWFrZXJDaGFyYWN0ZXJJZD86IHN0cmluZztcbiAgLyoqIFRoZSBjb2xvciBvZiB0aGUgc3BlYWtpbmcgY2hhcmFjdGVyICh1bmRlZmluZWQgZm9yIHVzZXIgbWVzc2FnZXMpLiAqL1xuICBzcGVha2VyQ29sb3I/OiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgdGltZXN0YW1wOiBudW1iZXI7XG4gIGludGVyYWN0aW9uTW9kZT86IEludGVyYWN0aW9uTW9kZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHcm91cENoYXRTZXNzaW9uIHtcbiAgbWVtYmVyczogR3JvdXBNZW1iZXJbXTtcbiAgbWVzc2FnZXM6IEdyb3VwQ2hhdE1lc3NhZ2VbXTtcbiAgY3JlYXRlZEF0OiBudW1iZXI7XG59XG5cbi8qKlxuICogR3JvdXAgY29udGV4dCBpbmplY3RlZCBpbnRvIGVhY2ggY2hhcmFjdGVyJ3MgL2FwaS9yZWNhbGwgY2FsbCBzbyB0aGV5IGNhblxuICogcmVzcG9uZCB0byBlYWNoIG90aGVyIGFzIHdlbGwgYXMgdGhlIHVzZXIuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR3JvdXBDb250ZXh0IHtcbiAgb3RoZXJDaGFyYWN0ZXJzOiBBcnJheTx7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHBlcnNvbmFsaXR5OiBzdHJpbmc7XG4gICAgZW1vdGlvbmFsU3RhdGU6IHN0cmluZztcbiAgfT47XG4gIC8qKiBMYXN0IE4gbWVzc2FnZXMgZnJvbSB0aGUgZ3JvdXAgY29udmVyc2F0aW9uIChmb3IgaW4tdHVybiBjb250ZXh0KS4gKi9cbiAgcmVjZW50TWVzc2FnZXM6IEFycmF5PHtcbiAgICBzcGVha2VyTmFtZTogc3RyaW5nO1xuICAgIHRleHQ6IHN0cmluZztcbiAgfT47XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBNZXNzYWdlIHR5cGVzIChleHRlbnNpb24gaW50ZXJuYWwgbWVzc2FnaW5nKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IHR5cGUgRXh0ZW5zaW9uTWVzc2FnZSA9XG4gIHwgeyB0eXBlOiBcIklNUE9SVF9DSEFSQUNURVJTXCIgfVxuICB8IHsgdHlwZTogXCJDSEFSQUNURVJTX0lNUE9SVEVEXCI7IGNoYXJhY3RlcnM6IFNhdmVkQ2hhcmFjdGVyW10gfVxuICB8IHsgdHlwZTogXCJJTVBPUlRfRkFJTEVEXCI7IHJlYXNvbjogc3RyaW5nIH1cbiAgfCB7IHR5cGU6IFwiU0VUX0FDVElWRV9DSEFSQUNURVJcIjsgY2hhcmFjdGVySWQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcIk9QRU5fU0lERV9QQU5FTFwiIH1cbiAgfCB7IHR5cGU6IFwiU1RBUlRfR1JPVVBfQ0hBVFwiOyBjaGFyYWN0ZXJzOiBTYXZlZENoYXJhY3RlcltdIH1cbiAgfCB7IHR5cGU6IFwiQ09OVEVYVF9NRU5VX1FVRVJZXCI7IHNlbGVjdGVkVGV4dDogc3RyaW5nOyBzb3VyY2VVcmw6IHN0cmluZzsgc291cmNlVGl0bGU6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcIlRBQl9DSEFOR0VEXCI7IGVudHJ5OiBBY3Rpdml0eUVudHJ5IH07XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBBUEkgcGF5bG9hZHMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVjYWxsUmVxdWVzdCB7XG4gIGNoYXJhY3RlcjogU2F2ZWRDaGFyYWN0ZXI7XG4gIGludGVyYWN0aW9uTW9kZTogSW50ZXJhY3Rpb25Nb2RlO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIGJyb3dzZXJDb250ZXh0PzogQnJvd3NlckNvbnRleHQ7XG4gIGdyb3VwQ29udGV4dD86IEdyb3VwQ29udGV4dDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWNhbGxSZXNwb25zZSB7XG4gIHJlc3BvbnNlOiBzdHJpbmc7XG4gIHJlbGF0aW9uc2hpcERlbHRhOiBudW1iZXI7XG4gIG5ld1JlbGF0aW9uc2hpcFRvVXNlcjogbnVtYmVyO1xuICBlbW90aW9uYWxTdGF0ZVVwZGF0ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1Z2dlc3RSZXF1ZXN0IHtcbiAgbW9kZTogSW50ZXJhY3Rpb25Nb2RlO1xuICBjaGFyYWN0ZXJOYW1lOiBzdHJpbmc7XG4gIHBlcnNvbmFsaXR5OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VnZ2VzdFJlc3BvbnNlIHtcbiAgc3VnZ2VzdGlvbjogc3RyaW5nO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hhdCBoaXN0b3J5IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBDaGF0TWVzc2FnZVJvbGUgPSBcInVzZXJcIiB8IFwiY2hhcmFjdGVyXCIgfCBcInN5c3RlbVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIENoYXRNZXNzYWdlIHtcbiAgaWQ6IHN0cmluZztcbiAgcm9sZTogQ2hhdE1lc3NhZ2VSb2xlO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xuICAvKiogUmVsYXRpb25zaGlwIGRlbHRhIGZyb20gdGhpcyBleGNoYW5nZSAoY2hhcmFjdGVyIG1lc3NhZ2VzIG9ubHkpLiAqL1xuICByZWxhdGlvbnNoaXBEZWx0YT86IG51bWJlcjtcbiAgaW50ZXJhY3Rpb25Nb2RlPzogSW50ZXJhY3Rpb25Nb2RlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENoYXRIaXN0b3J5IHtcbiAgY2hhcmFjdGVySWQ6IHN0cmluZztcbiAgbWVzc2FnZXM6IENoYXRNZXNzYWdlW107XG4gIC8qKiBMYXN0IGtub3duIHJlbGF0aW9uc2hpcCBzY29yZSAoc3luY2VkIGJhY2sgdG8gU2F2ZWRDaGFyYWN0ZXIgb24gYWN0aXZpdHkpLiAqL1xuICByZWxhdGlvbnNoaXBTY29yZTogbnVtYmVyO1xuICBlbW90aW9uYWxTdGF0ZTogc3RyaW5nO1xufVxuIiwgIi8vIFR5cGVkIHdyYXBwZXJzIGFyb3VuZCBjaHJvbWUuc3RvcmFnZS5sb2NhbCBmb3IgdGhlIE1DTSBDb21wYW5pb24gZXh0ZW5zaW9uLlxuXG5pbXBvcnQgdHlwZSB7XG4gIFNhdmVkQ2hhcmFjdGVyLFxuICBFeHRlbnNpb25TZXR0aW5ncyxcbiAgQWN0aXZpdHlFbnRyeSxcbiAgQ2hhdEhpc3RvcnksXG4gIEdyb3VwQ2hhdFNlc3Npb24sXG59IGZyb20gXCIuL3R5cGVzLmpzXCI7XG5pbXBvcnQgeyBERUZBVUxUX1NFVFRJTkdTIH0gZnJvbSBcIi4vdHlwZXMuanNcIjtcblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFN0b3JhZ2Uga2V5cyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgS0VZUyA9IHtcbiAgQ0hBUkFDVEVSUzogXCJtY21fZXh0X2NoYXJhY3RlcnNcIixcbiAgU0VUVElOR1M6IFwibWNtX2V4dF9zZXR0aW5nc1wiLFxuICBBQ1RJVklUWTogXCJtY21fZXh0X2FjdGl2aXR5XCIsXG4gIENIQVRfUFJFRklYOiBcIm1jbV9leHRfY2hhdF9cIixcbiAgUEVORElOR19HUk9VUDogXCJtY21fZXh0X3BlbmRpbmdfZ3JvdXBcIixcbiAgR1JPVVBfU0VTU0lPTjogXCJtY21fZXh0X2dyb3VwX3Nlc3Npb25cIixcbn0gYXMgY29uc3Q7XG5cbmNvbnN0IE1BWF9BQ1RJVklUWV9FTlRSSUVTID0gNTA7XG5jb25zdCBNQVhfQ0hBVF9NRVNTQUdFUyA9IDIwO1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hhcmFjdGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENoYXJhY3RlcnMoKTogUHJvbWlzZTxTYXZlZENoYXJhY3RlcltdPiB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChLRVlTLkNIQVJBQ1RFUlMpO1xuICByZXR1cm4gKHJlc3VsdFtLRVlTLkNIQVJBQ1RFUlNdIGFzIFNhdmVkQ2hhcmFjdGVyW10pID8/IFtdO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0Q2hhcmFjdGVycyhjaGFyYWN0ZXJzOiBTYXZlZENoYXJhY3RlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IFtLRVlTLkNIQVJBQ1RFUlNdOiBjaGFyYWN0ZXJzIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q2hhcmFjdGVyQnlJZChpZDogc3RyaW5nKTogUHJvbWlzZTxTYXZlZENoYXJhY3RlciB8IG51bGw+IHtcbiAgY29uc3QgY2hhcmFjdGVycyA9IGF3YWl0IGdldENoYXJhY3RlcnMoKTtcbiAgcmV0dXJuIGNoYXJhY3RlcnMuZmluZCgoYykgPT4gYy5pZCA9PT0gaWQpID8/IG51bGw7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVDaGFyYWN0ZXIodXBkYXRlZDogU2F2ZWRDaGFyYWN0ZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY2hhcmFjdGVycyA9IGF3YWl0IGdldENoYXJhY3RlcnMoKTtcbiAgY29uc3QgaWR4ID0gY2hhcmFjdGVycy5maW5kSW5kZXgoKGMpID0+IGMuaWQgPT09IHVwZGF0ZWQuaWQpO1xuICBpZiAoaWR4ID49IDApIHtcbiAgICBjaGFyYWN0ZXJzW2lkeF0gPSB1cGRhdGVkO1xuICB9IGVsc2Uge1xuICAgIGNoYXJhY3RlcnMucHVzaCh1cGRhdGVkKTtcbiAgfVxuICBhd2FpdCBzZXRDaGFyYWN0ZXJzKGNoYXJhY3RlcnMpO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU2V0dGluZ3MgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTZXR0aW5ncygpOiBQcm9taXNlPEV4dGVuc2lvblNldHRpbmdzPiB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChLRVlTLlNFVFRJTkdTKTtcbiAgcmV0dXJuIHsgLi4uREVGQVVMVF9TRVRUSU5HUywgLi4uKHJlc3VsdFtLRVlTLlNFVFRJTkdTXSBhcyBQYXJ0aWFsPEV4dGVuc2lvblNldHRpbmdzPikgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFNldHRpbmdzKHBhcnRpYWw6IFBhcnRpYWw8RXh0ZW5zaW9uU2V0dGluZ3M+KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCBnZXRTZXR0aW5ncygpO1xuICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBbS0VZUy5TRVRUSU5HU106IHsgLi4uY3VycmVudCwgLi4ucGFydGlhbCB9IH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWN0aXZlQ2hhcmFjdGVyKCk6IFByb21pc2U8U2F2ZWRDaGFyYWN0ZXIgfCBudWxsPiB7XG4gIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgZ2V0U2V0dGluZ3MoKTtcbiAgaWYgKCFzZXR0aW5ncy5hY3RpdmVDaGFyYWN0ZXJJZCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBnZXRDaGFyYWN0ZXJCeUlkKHNldHRpbmdzLmFjdGl2ZUNoYXJhY3RlcklkKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldEFjdGl2ZUNoYXJhY3RlcihjaGFyYWN0ZXJJZDogc3RyaW5nIHwgbnVsbCk6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCBzZXRTZXR0aW5ncyh7IGFjdGl2ZUNoYXJhY3RlcklkOiBjaGFyYWN0ZXJJZCB9KTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIEFjdGl2aXR5IGxvZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFjdGl2aXR5KCk6IFByb21pc2U8QWN0aXZpdHlFbnRyeVtdPiB7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChLRVlTLkFDVElWSVRZKTtcbiAgcmV0dXJuIChyZXN1bHRbS0VZUy5BQ1RJVklUWV0gYXMgQWN0aXZpdHlFbnRyeVtdKSA/PyBbXTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFwcGVuZEFjdGl2aXR5KGVudHJ5OiBBY3Rpdml0eUVudHJ5KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgZ2V0QWN0aXZpdHkoKTtcbiAgY29uc3QgdXBkYXRlZCA9IFsuLi5leGlzdGluZywgZW50cnldLnNsaWNlKC1NQVhfQUNUSVZJVFlfRU5UUklFUyk7XG4gIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IFtLRVlTLkFDVElWSVRZXTogdXBkYXRlZCB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUxhc3RBY3Rpdml0eShwYXRjaDogUGFydGlhbDxBY3Rpdml0eUVudHJ5Pik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBleGlzdGluZyA9IGF3YWl0IGdldEFjdGl2aXR5KCk7XG4gIGlmIChleGlzdGluZy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgZXhpc3RpbmdbZXhpc3RpbmcubGVuZ3RoIC0gMV0gPSB7IC4uLmV4aXN0aW5nW2V4aXN0aW5nLmxlbmd0aCAtIDFdLCAuLi5wYXRjaCB9O1xuICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBbS0VZUy5BQ1RJVklUWV06IGV4aXN0aW5nIH0pO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgc2hvcnQgaHVtYW4tcmVhZGFibGUgcHJvc2UgZGlnZXN0IGZyb20gcmVjZW50IGFjdGl2aXR5IGVudHJpZXMsXG4gKiBzdWl0YWJsZSBmb3IgaW5qZWN0aW5nIGludG8gYW4gQUkgcHJvbXB0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRBY3Rpdml0eURpZ2VzdChlbnRyaWVzOiBBY3Rpdml0eUVudHJ5W10sIG1heEVudHJpZXMgPSAxMCk6IHN0cmluZyB7XG4gIGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwiTm8gcmVjZW50IGJyb3dzaW5nIGFjdGl2aXR5LlwiO1xuXG4gIGNvbnN0IHJlY2VudCA9IGVudHJpZXNcbiAgICAuc2xpY2UoLW1heEVudHJpZXMpXG4gICAgLmZpbHRlcigoZSkgPT4gZS50aXRsZSAmJiBlLmRvbWFpbilcbiAgICAucmV2ZXJzZSgpOyAvLyBtb3N0IHJlY2VudCBmaXJzdFxuXG4gIGNvbnN0IGxpbmVzID0gcmVjZW50Lm1hcCgoZSkgPT4ge1xuICAgIGNvbnN0IG1pbnMgPSBNYXRoLnJvdW5kKGUudGltZVNwZW50TXMgLyA2MDAwMCk7XG4gICAgY29uc3QgdGltZVN0ciA9IG1pbnMgPiAwID8gYCAoJHttaW5zfW0pYCA6IFwiXCI7XG4gICAgcmV0dXJuIGAke2UudGl0bGV9IFske2UuZG9tYWlufV0ke3RpbWVTdHJ9YDtcbiAgfSk7XG5cbiAgcmV0dXJuIFwiUmVjZW50bHkgdmlzaXRlZDogXCIgKyBsaW5lcy5qb2luKFwiLCBcIikgKyBcIi5cIjtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIENoYXQgaGlzdG9yeSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gY2hhdEtleShjaGFyYWN0ZXJJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke0tFWVMuQ0hBVF9QUkVGSVh9JHtjaGFyYWN0ZXJJZH1gO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q2hhdEhpc3RvcnkoY2hhcmFjdGVySWQ6IHN0cmluZyk6IFByb21pc2U8Q2hhdEhpc3RvcnkgfCBudWxsPiB7XG4gIGNvbnN0IGtleSA9IGNoYXRLZXkoY2hhcmFjdGVySWQpO1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoa2V5KTtcbiAgcmV0dXJuIChyZXN1bHRba2V5XSBhcyBDaGF0SGlzdG9yeSkgPz8gbnVsbDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmVDaGF0SGlzdG9yeShoaXN0b3J5OiBDaGF0SGlzdG9yeSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBrZXkgPSBjaGF0S2V5KGhpc3RvcnkuY2hhcmFjdGVySWQpO1xuICAvLyBDYXAgbWVzc2FnZXNcbiAgY29uc3QgdHJpbW1lZDogQ2hhdEhpc3RvcnkgPSB7XG4gICAgLi4uaGlzdG9yeSxcbiAgICBtZXNzYWdlczogaGlzdG9yeS5tZXNzYWdlcy5zbGljZSgtTUFYX0NIQVRfTUVTU0FHRVMpLFxuICB9O1xuICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBba2V5XTogdHJpbW1lZCB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyQ2hhdEhpc3RvcnkoY2hhcmFjdGVySWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5yZW1vdmUoY2hhdEtleShjaGFyYWN0ZXJJZCkpO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgR3JvdXAgY2hhdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgTUFYX0dST1VQX01FU1NBR0VTID0gNjA7XG5cbi8qKlxuICogU3RvcmUgdGhlIGNoYXJhY3RlcnMgdGhlIHVzZXIgc2VsZWN0ZWQgaW4gdGhlIHBvcHVwIHNvIHRoZSBzaWRlIHBhbmVsIGNhblxuICogcGljayB0aGVtIHVwIHdoZW4gaXQgb3BlbnMgKHBvcHVwIGNsb3NlcyBiZWZvcmUgdGhlIHNpZGUgcGFuZWwgaXMgcmVhZHkpLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0UGVuZGluZ0dyb3VwKGNoYXJhY3RlcnM6IFNhdmVkQ2hhcmFjdGVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgW0tFWVMuUEVORElOR19HUk9VUF06IGNoYXJhY3RlcnMgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQZW5kaW5nR3JvdXAoKTogUHJvbWlzZTxTYXZlZENoYXJhY3RlcltdIHwgbnVsbD4ge1xuICBjb25zdCByID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KEtFWVMuUEVORElOR19HUk9VUCk7XG4gIHJldHVybiAocltLRVlTLlBFTkRJTkdfR1JPVVBdIGFzIFNhdmVkQ2hhcmFjdGVyW10pID8/IG51bGw7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhclBlbmRpbmdHcm91cCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwucmVtb3ZlKEtFWVMuUEVORElOR19HUk9VUCk7XG59XG5cbi8qKiBDdXJyZW50IGFjdGl2ZSBncm91cCBzZXNzaW9uIChvbmx5IG9uZSBhdCBhIHRpbWUpLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEdyb3VwU2Vzc2lvbigpOiBQcm9taXNlPEdyb3VwQ2hhdFNlc3Npb24gfCBudWxsPiB7XG4gIGNvbnN0IHIgPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoS0VZUy5HUk9VUF9TRVNTSU9OKTtcbiAgcmV0dXJuIChyW0tFWVMuR1JPVVBfU0VTU0lPTl0gYXMgR3JvdXBDaGF0U2Vzc2lvbikgPz8gbnVsbDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmVHcm91cFNlc3Npb24oc2Vzc2lvbjogR3JvdXBDaGF0U2Vzc2lvbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB0cmltbWVkOiBHcm91cENoYXRTZXNzaW9uID0ge1xuICAgIC4uLnNlc3Npb24sXG4gICAgbWVzc2FnZXM6IHNlc3Npb24ubWVzc2FnZXMuc2xpY2UoLU1BWF9HUk9VUF9NRVNTQUdFUyksXG4gIH07XG4gIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IFtLRVlTLkdST1VQX1NFU1NJT05dOiB0cmltbWVkIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xlYXJHcm91cFNlc3Npb24oKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnJlbW92ZShLRVlTLkdST1VQX1NFU1NJT04pO1xufVxuIiwgIi8vIEFQSSBmZXRjaCBoZWxwZXJzIGZvciB0aGUgTUNNIENvbXBhbmlvbiBleHRlbnNpb24uXG4vLyBBbGwgY2FsbHMgcHJveHkgdGhyb3VnaCB0aGUgbWFpbiBhcHAncyBOZXh0LmpzIEFQSSByb3V0ZXMuXG5cbmltcG9ydCB0eXBlIHtcbiAgU2F2ZWRDaGFyYWN0ZXIsXG4gIEludGVyYWN0aW9uTW9kZSxcbiAgQnJvd3NlckNvbnRleHQsXG4gIEdyb3VwQ29udGV4dCxcbiAgUmVjYWxsUmVxdWVzdCxcbiAgUmVjYWxsUmVzcG9uc2UsXG4gIFN1Z2dlc3RSZXNwb25zZSxcbn0gZnJvbSBcIi4vdHlwZXMuanNcIjtcbmltcG9ydCB7IGdldFNldHRpbmdzIH0gZnJvbSBcIi4vc3RvcmFnZS5qc1wiO1xuXG5hc3luYyBmdW5jdGlvbiBnZXRCYXNlVXJsKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgZ2V0U2V0dGluZ3MoKTtcbiAgcmV0dXJuIHNldHRpbmdzLmFwaUJhc2VVcmwucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgL2FwaS9yZWNhbGwgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKlxuICogU2VuZCBhIGNoYXQgbWVzc2FnZSB0byBhIGNoYXJhY3RlciB2aWEgdGhlIHN0YXRlbGVzcyAvYXBpL3JlY2FsbCBlbmRwb2ludC5cbiAqIE9wdGlvbmFsbHkgaW5jbHVkZXMgYnJvd3NlciBjb250ZXh0IHNvIHRoZSBjaGFyYWN0ZXIgY2FuIHJlYWN0IHRvIHdoYXRcbiAqIHRoZSB1c2VyIGlzIGN1cnJlbnRseSBsb29raW5nIGF0LlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVjYWxsQ2hhdChcbiAgY2hhcmFjdGVyOiBTYXZlZENoYXJhY3RlcixcbiAgbW9kZTogSW50ZXJhY3Rpb25Nb2RlLFxuICBtZXNzYWdlOiBzdHJpbmcsXG4gIGJyb3dzZXJDb250ZXh0PzogQnJvd3NlckNvbnRleHRcbik6IFByb21pc2U8UmVjYWxsUmVzcG9uc2U+IHtcbiAgY29uc3QgYmFzZVVybCA9IGF3YWl0IGdldEJhc2VVcmwoKTtcblxuICBjb25zdCBib2R5OiBSZWNhbGxSZXF1ZXN0ID0ge1xuICAgIGNoYXJhY3RlcixcbiAgICBpbnRlcmFjdGlvbk1vZGU6IG1vZGUsXG4gICAgbWVzc2FnZSxcbiAgICAuLi4oYnJvd3NlckNvbnRleHQgPyB7IGJyb3dzZXJDb250ZXh0IH0gOiB7fSksXG4gIH07XG5cbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7YmFzZVVybH0vYXBpL3JlY2FsbGAsIHtcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgfSk7XG5cbiAgaWYgKCFyZXMub2spIHtcbiAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzLnRleHQoKS5jYXRjaCgoKSA9PiBcIlVua25vd24gZXJyb3JcIik7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAvYXBpL3JlY2FsbCBmYWlsZWQgKCR7cmVzLnN0YXR1c30pOiAke3RleHR9YCk7XG4gIH1cblxuICByZXR1cm4gcmVzLmpzb24oKSBhcyBQcm9taXNlPFJlY2FsbFJlc3BvbnNlPjtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIC9hcGkvcmVjYWxsIChncm91cCB2YXJpYW50KSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLyoqXG4gKiBMaWtlIHJlY2FsbENoYXQsIGJ1dCBhZGRzIGdyb3VwQ29udGV4dCBzbyB0aGUgY2hhcmFjdGVyIGtub3dzIHdobyBlbHNlIGlzIGluXG4gKiB0aGUgY29udmVyc2F0aW9uIGFuZCB3aGF0IHRoZXkndmUgYWxyZWFkeSBzYWlkIGluIHRoaXMgcm91bmQuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBncm91cFJlY2FsbENoYXQoXG4gIGNoYXJhY3RlcjogU2F2ZWRDaGFyYWN0ZXIsXG4gIG1vZGU6IEludGVyYWN0aW9uTW9kZSxcbiAgdXNlck1lc3NhZ2U6IHN0cmluZyxcbiAgZ3JvdXBDb250ZXh0OiBHcm91cENvbnRleHQsXG4gIGJyb3dzZXJDb250ZXh0PzogQnJvd3NlckNvbnRleHRcbik6IFByb21pc2U8UmVjYWxsUmVzcG9uc2U+IHtcbiAgY29uc3QgYmFzZVVybCA9IGF3YWl0IGdldEJhc2VVcmwoKTtcblxuICBjb25zdCBib2R5OiBSZWNhbGxSZXF1ZXN0ID0ge1xuICAgIGNoYXJhY3RlcixcbiAgICBpbnRlcmFjdGlvbk1vZGU6IG1vZGUsXG4gICAgbWVzc2FnZTogdXNlck1lc3NhZ2UsXG4gICAgZ3JvdXBDb250ZXh0LFxuICAgIC4uLihicm93c2VyQ29udGV4dCA/IHsgYnJvd3NlckNvbnRleHQgfSA6IHt9KSxcbiAgfTtcblxuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtiYXNlVXJsfS9hcGkvcmVjYWxsYCwge1xuICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpLFxuICB9KTtcblxuICBpZiAoIXJlcy5vaykge1xuICAgIGNvbnN0IHRleHQgPSBhd2FpdCByZXMudGV4dCgpLmNhdGNoKCgpID0+IFwiVW5rbm93biBlcnJvclwiKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYC9hcGkvcmVjYWxsIChncm91cCkgZmFpbGVkICgke3Jlcy5zdGF0dXN9KTogJHt0ZXh0fWApO1xuICB9XG5cbiAgcmV0dXJuIHJlcy5qc29uKCkgYXMgUHJvbWlzZTxSZWNhbGxSZXNwb25zZT47XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCAvYXBpL3N1Z2dlc3QgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbi8qKlxuICogRmV0Y2ggYSBzdWdnZXN0ZWQgbWVzc2FnZSBmb3IgdGhlIGdpdmVuIGludGVyYWN0aW9uIG1vZGUgYW5kIGNoYXJhY3Rlci5cbiAqIFJldHVybnMgYSBmYWxsYmFjayBzdHJpbmcgb24gZmFpbHVyZSBzbyB0aGUgVUkgbmV2ZXIgc2hvd3MgYW4gZXJyb3IgZm9yXG4gKiB3aGF0IGlzIGVzc2VudGlhbGx5IGEgbmljZS10by1oYXZlIGZlYXR1cmUuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaFN1Z2dlc3Rpb24oXG4gIG1vZGU6IEludGVyYWN0aW9uTW9kZSxcbiAgY2hhcmFjdGVyTmFtZTogc3RyaW5nLFxuICBwZXJzb25hbGl0eTogc3RyaW5nXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGJhc2VVcmwgPSBhd2FpdCBnZXRCYXNlVXJsKCk7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtiYXNlVXJsfS9hcGkvc3VnZ2VzdGAsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1vZGUsIGNoYXJhY3Rlck5hbWUsIHBlcnNvbmFsaXR5IH0pLFxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXMub2spIHJldHVybiBcIlwiO1xuXG4gICAgY29uc3QgZGF0YSA9IChhd2FpdCByZXMuanNvbigpKSBhcyBTdWdnZXN0UmVzcG9uc2U7XG4gICAgcmV0dXJuIGRhdGEuc3VnZ2VzdGlvbiA/PyBcIlwiO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ29ubmVjdGl2aXR5IGNoZWNrIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG4vKiogUmV0dXJucyB0cnVlIGlmIHRoZSBjb25maWd1cmVkIEFQSSBiYXNlIFVSTCBhcHBlYXJzIHRvIGJlIHJlYWNoYWJsZS4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja0FwaUNvbm5lY3Rpdml0eSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBiYXNlVXJsID0gYXdhaXQgZ2V0QmFzZVVybCgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke2Jhc2VVcmx9L2FwaS9yZWNhbGxgLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe30pLFxuICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDQwMDApLFxuICAgIH0pO1xuICAgIC8vIDQwMCA9IHJlYWNoYWJsZSBidXQgYmFkIHJlcXVlc3QgXHUyMDE0IHRoYXQncyBmaW5lLCB3ZSBqdXN0IG5lZWQgdG8gY29uZmlybSB0aGUgc2VydmVyIGlzIHVwXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMgPCA1MDA7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIiwgIi8vIE1DTSBDb21wYW5pb24gXHUyMDE0IFNpZGUgUGFuZWwgc2NyaXB0XG4vLyBNYWluIGNoYXQgVUk6IGNoYXJhY3RlciBkaXNwbGF5LCBtZXNzYWdlIHNlbmQvcmVjZWl2ZSwgYnJvd3NlciBjb250ZXh0IGluamVjdGlvbixcbi8vIGNvbnZlcnNhdGlvbiBoaXN0b3J5LCB0eXBld3JpdGVyIGVmZmVjdCwgcHJvYWN0aXZlIGNvbW1lbnQgZGlzcGxheS5cblxuaW1wb3J0IHtcbiAgZ2V0QWN0aXZlQ2hhcmFjdGVyLFxuICBnZXRBY3Rpdml0eSxcbiAgYnVpbGRBY3Rpdml0eURpZ2VzdCxcbiAgZ2V0Q2hhdEhpc3RvcnksXG4gIHNhdmVDaGF0SGlzdG9yeSxcbiAgY2xlYXJDaGF0SGlzdG9yeSxcbiAgdXBkYXRlQ2hhcmFjdGVyLFxuICBnZXRTZXR0aW5ncyxcbiAgZ2V0UGVuZGluZ0dyb3VwLFxuICBjbGVhclBlbmRpbmdHcm91cCxcbiAgZ2V0R3JvdXBTZXNzaW9uLFxuICBzYXZlR3JvdXBTZXNzaW9uLFxuICBjbGVhckdyb3VwU2Vzc2lvbixcbn0gZnJvbSBcIi4uL3NoYXJlZC9zdG9yYWdlLmpzXCI7XG5pbXBvcnQgeyByZWNhbGxDaGF0LCBmZXRjaFN1Z2dlc3Rpb24sIGdyb3VwUmVjYWxsQ2hhdCB9IGZyb20gXCIuLi9zaGFyZWQvYXBpLmpzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIFNhdmVkQ2hhcmFjdGVyLFxuICBJbnRlcmFjdGlvbk1vZGUsXG4gIENoYXRNZXNzYWdlLFxuICBDaGF0SGlzdG9yeSxcbiAgQnJvd3NlckNvbnRleHQsXG4gIEdyb3VwTWVtYmVyLFxuICBHcm91cENoYXRNZXNzYWdlLFxuICBHcm91cENoYXRTZXNzaW9uLFxufSBmcm9tIFwiLi4vc2hhcmVkL3R5cGVzLmpzXCI7XG5pbXBvcnQgeyBHUk9VUF9DT0xPUlMgfSBmcm9tIFwiLi4vc2hhcmVkL3R5cGVzLmpzXCI7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBSZWxhdGlvbnNoaXAgaGVscGVycyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgUkVMX1RIUkVTSE9MRFM6IFtudW1iZXIsIHN0cmluZywgc3RyaW5nXVtdID0gW1xuICBbODAsICBcIkRFVk9URURcIiwgIFwiI0ZGODBDMFwiXSxcbiAgWzQwLCAgXCJGUklFTkRMWVwiLCBcIiM3RkUwODBcIl0sXG4gIFstNDAsIFwiTkVVVFJBTFwiLCAgXCIjRkZERTAwXCJdLFxuICBbLTgwLCBcIkhPU1RJTEVcIiwgIFwiI0ZGODA0MFwiXSxcbiAgWy1JbmZpbml0eSwgXCJFTkVNWVwiLCBcIiNGRjQwNDBcIl0sXG5dO1xuXG5mdW5jdGlvbiBnZXRSZWxNZXRhKHNjb3JlOiBudW1iZXIpOiB7IGxhYmVsOiBzdHJpbmc7IGNvbG9yOiBzdHJpbmcgfSB7XG4gIGZvciAoY29uc3QgW3RocmVzaG9sZCwgbGFiZWwsIGNvbG9yXSBvZiBSRUxfVEhSRVNIT0xEUykge1xuICAgIGlmIChzY29yZSA+PSB0aHJlc2hvbGQpIHJldHVybiB7IGxhYmVsLCBjb2xvciB9O1xuICB9XG4gIHJldHVybiB7IGxhYmVsOiBcIkVORU1ZXCIsIGNvbG9yOiBcIiNGRjQwNDBcIiB9O1xufVxuXG5jb25zdCBQT1JUUkFJVF9USEVNRVM6IHsga2V5d29yZHM6IHN0cmluZ1tdOyBlbW9qaTogc3RyaW5nOyBncmFkaWVudDogc3RyaW5nIH1bXSA9IFtcbiAgeyBrZXl3b3JkczogW1wiamVhbG91c1wiLCBcImVudmlvdXNcIiwgXCJiaXR0ZXJcIl0sICAgIGVtb2ppOiBcIlx1RDgzRFx1REUyNFwiLCBncmFkaWVudDogXCJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjMmQwYTRlLCAjNGEwMDgwLCAjNmQwMDcwKVwiIH0sXG4gIHsga2V5d29yZHM6IFtcInJvbWFudGljXCIsIFwibG9uZ2luZ1wiLCBcImxvdmVcIl0sICAgICAgZW1vamk6IFwiXHVEODNDXHVERjM5XCIsIGdyYWRpZW50OiBcImxpbmVhci1ncmFkaWVudCgxMzVkZWcsICM0YTAwMTAsICM4YjFhM2EsICM0YTAwMTApXCIgfSxcbiAgeyBrZXl3b3JkczogW1wibXlzdGVyaW91c1wiLCBcImNyeXB0aWNcIiwgXCJzZWNyZXRcIl0sICBlbW9qaTogXCJcdUQ4M0RcdURENkZcdUZFMEZcIiwgZ3JhZGllbnQ6IFwibGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzBhMGEwYSwgIzFhMWEyZSwgIzBhMGEwYSlcIiB9LFxuICB7IGtleXdvcmRzOiBbXCJjb21lZGljXCIsIFwiY2hhb3RpY1wiLCBcImNsb3duXCJdLCAgICAgIGVtb2ppOiBcIlx1RDgzQ1x1REZBRFwiLCBncmFkaWVudDogXCJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjNGEyODAwLCAjN2E0YTAwLCAjNGEyODAwKVwiIH0sXG4gIHsga2V5d29yZHM6IFtcInNhZ2VcIiwgXCJ3aXNlXCIsIFwib3JhY2xlXCJdLCAgICAgICAgICAgZW1vamk6IFwiXHVEODNEXHVERDJFXCIsIGdyYWRpZW50OiBcImxpbmVhci1ncmFkaWVudCgxMzVkZWcsICMwMDEwNDAsICMwMDE4NzAsICMwMDEwNDApXCIgfSxcbiAgeyBrZXl3b3JkczogW1widmlsbGFpblwiLCBcImRhcmtcIiwgXCJzaW5pc3RlclwiXSwgICAgICBlbW9qaTogXCJcdUQ4M0RcdURDODBcIiwgZ3JhZGllbnQ6IFwibGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzBhMDAwMCwgIzIwMDAwMCwgIzBhMDAwMClcIiB9LFxuICB7IGtleXdvcmRzOiBbXCJhbnhpb3VzXCIsIFwibmVydm91c1wiLCBcIndvcnJpZWRcIl0sICAgIGVtb2ppOiBcIlx1RDgzRFx1REUzMFwiLCBncmFkaWVudDogXCJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjMDAxYTFhLCAjMDAzYTNhLCAjMDAxYTFhKVwiIH0sXG5dO1xuY29uc3QgREVGQVVMVF9USEVNRSA9IHsgZW1vamk6IFwiXHUyNzI2XCIsIGdyYWRpZW50OiBcImxpbmVhci1ncmFkaWVudCgxMzVkZWcsICMwYTAwMjgsICMxYTAwNTAsICMwYTAwMjgpXCIgfTtcblxuZnVuY3Rpb24gZ2V0UG9ydHJhaXRUaGVtZShwZXJzb25hbGl0eTogc3RyaW5nKSB7XG4gIGNvbnN0IGxvd2VyID0gcGVyc29uYWxpdHkudG9Mb3dlckNhc2UoKTtcbiAgZm9yIChjb25zdCB0IG9mIFBPUlRSQUlUX1RIRU1FUykge1xuICAgIGlmICh0LmtleXdvcmRzLnNvbWUoKGspID0+IGxvd2VyLmluY2x1ZGVzKGspKSkgcmV0dXJuIHQ7XG4gIH1cbiAgcmV0dXJuIERFRkFVTFRfVEhFTUU7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBET00gcmVmcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3Qgc2NyZWVuRW1wdHkgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNjcmVlbi1lbXB0eVwiKSBhcyBIVE1MRWxlbWVudDtcbmNvbnN0IHNjcmVlbkNoYXQgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzY3JlZW4tY2hhdFwiKSBhcyBIVE1MRWxlbWVudDtcbmNvbnN0IHNjcmVlbkdyb3VwICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzY3JlZW4tZ3JvdXBcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCBjaGFyUG9ydHJhaXQgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2hhci1wb3J0cmFpdFwiKSBhcyBIVE1MRWxlbWVudDtcbmNvbnN0IGNoYXJOYW1lICAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaGFyLW5hbWVcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCBjaGFyTGFiZWwgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2hhci1sYWJlbFwiKSBhcyBIVE1MRWxlbWVudDtcbmNvbnN0IGNoYXJTdGF0ZSAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaGFyLXN0YXRlXCIpIGFzIEhUTUxFbGVtZW50O1xuY29uc3QgcmVsTGFiZWwgICAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJlbC1sYWJlbFwiKSBhcyBIVE1MRWxlbWVudDtcbmNvbnN0IHJlbEJhckZpbGwgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyZWwtYmFyLWZpbGxcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCByZWxTY29yZSAgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVsLXNjb3JlXCIpIGFzIEhUTUxFbGVtZW50O1xuY29uc3QgY29udGV4dEJhZGdlICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRleHQtYmFkZ2VcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCBjb250ZXh0QmFkZ2VUZXh0ICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGV4dC1iYWRnZS10ZXh0XCIpIGFzIEhUTUxFbGVtZW50O1xuY29uc3QgY29udGV4dEJhZGdlQ2xlYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRleHQtYmFkZ2UtY2xlYXJcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCBhY3Rpdml0eVN0YXR1cyAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWN0aXZpdHktc3RhdHVzXCIpIGFzIEhUTUxFbGVtZW50O1xuY29uc3QgYWN0aXZpdHlUZXh0ICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFjdGl2aXR5LXRleHRcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCBidG5TaG93RmVlZCAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnRuLXNob3ctZmVlZFwiKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbmNvbnN0IGFjdGl2aXR5RmVlZCAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhY3Rpdml0eS1mZWVkXCIpIGFzIEhUTUxFbGVtZW50O1xuY29uc3QgYWN0aXZpdHlGZWVkTGlzdCAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFjdGl2aXR5LWZlZWQtbGlzdFwiKSBhcyBIVE1MRWxlbWVudDtcbmNvbnN0IGJ0bkhpZGVGZWVkICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJidG4taGlkZS1mZWVkXCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuY29uc3QgY2hhdE1lc3NhZ2VzICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNoYXQtbWVzc2FnZXNcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCB0eXBpbmdJbmRpY2F0b3IgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidHlwaW5nLWluZGljYXRvclwiKSBhcyBIVE1MRWxlbWVudDtcbmNvbnN0IG1vZGVTZWxlY3RvciAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb2RlLXNlbGVjdG9yXCIpIGFzIEhUTUxFbGVtZW50O1xuY29uc3QgYnRuU3VnZ2VzdCAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJ0bi1zdWdnZXN0XCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuY29uc3QgaW5wdXRNZXNzYWdlICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImlucHV0LW1lc3NhZ2VcIikgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcbmNvbnN0IGJ0blNlbmQgICAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJidG4tc2VuZFwiKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbmNvbnN0IHRvZ2dsZUNvbnRleHQgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0b2dnbGUtY29udGV4dFwiKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuY29uc3QgYnRuQ2xlYXJIaXN0b3J5ICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJ0bi1jbGVhci1oaXN0b3J5XCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU3RhdGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmxldCBhY3RpdmVDaGFyYWN0ZXI6IFNhdmVkQ2hhcmFjdGVyIHwgbnVsbCA9IG51bGw7XG5sZXQgY2hhdEhpc3Rvcnk6IENoYXRIaXN0b3J5IHwgbnVsbCA9IG51bGw7XG5sZXQgY3VycmVudE1vZGU6IEludGVyYWN0aW9uTW9kZSA9IFwiYmVmcmllbmRcIjtcbmxldCBwZW5kaW5nQ29udGV4dFF1ZXJ5OiB7IHNlbGVjdGVkVGV4dDogc3RyaW5nOyBzb3VyY2VVcmw6IHN0cmluZzsgc291cmNlVGl0bGU6IHN0cmluZyB9IHwgbnVsbCA9IG51bGw7XG5sZXQgY3VycmVudFRhYjogeyB1cmw6IHN0cmluZzsgdGl0bGU6IHN0cmluZyB9IHwgbnVsbCA9IG51bGw7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBHcm91cCBjaGF0IHN0YXRlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5sZXQgZ3JvdXBTZXNzaW9uOiBHcm91cENoYXRTZXNzaW9uIHwgbnVsbCA9IG51bGw7XG5sZXQgZ3JvdXBNb2RlOiBJbnRlcmFjdGlvbk1vZGUgPSBcImJlZnJpZW5kXCI7XG5sZXQgZ3JvdXBTZW5kaW5nID0gZmFsc2U7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBJbml0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5hc3luYyBmdW5jdGlvbiBpbml0KCkge1xuICAvLyBHZXQgdGhlIGN1cnJlbnQgYWN0aXZlIHRhYiBmb3IgY29udGV4dFxuICBjb25zdCB0YWJzID0gYXdhaXQgY2hyb21lLnRhYnMucXVlcnkoeyBhY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWUgfSkuY2F0Y2goKCkgPT4gW10pO1xuICBpZiAodGFic1swXT8udXJsICYmIHRhYnNbMF0/LnRpdGxlKSB7XG4gICAgY3VycmVudFRhYiA9IHsgdXJsOiB0YWJzWzBdLnVybCwgdGl0bGU6IHRhYnNbMF0udGl0bGUgfTtcbiAgICBpZiAodGFic1swXS51cmwuc3RhcnRzV2l0aChcImh0dHA6Ly9cIikgfHwgdGFic1swXS51cmwuc3RhcnRzV2l0aChcImh0dHBzOi8vXCIpKSB7XG4gICAgICBzaG93QWN0aXZpdHlCYXIodGFic1swXS50aXRsZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2sgaWYgdGhlIHBvcHVwIGxlZnQgYSBwZW5kaW5nIGdyb3VwIHRvIHN0YXJ0XG4gIGNvbnN0IHBlbmRpbmcgPSBhd2FpdCBnZXRQZW5kaW5nR3JvdXAoKTtcbiAgaWYgKHBlbmRpbmcgJiYgcGVuZGluZy5sZW5ndGggPj0gMikge1xuICAgIGF3YWl0IGNsZWFyUGVuZGluZ0dyb3VwKCk7XG4gICAgY29uc3QgbWVtYmVyczogR3JvdXBNZW1iZXJbXSA9IHBlbmRpbmcubWFwKChjaGFyLCBpKSA9PiAoe1xuICAgICAgY2hhcmFjdGVyOiBjaGFyLFxuICAgICAgY29sb3I6IEdST1VQX0NPTE9SU1tpICUgR1JPVVBfQ09MT1JTLmxlbmd0aF0sXG4gICAgfSkpO1xuICAgIGF3YWl0IHN0YXJ0R3JvdXBDaGF0KG1lbWJlcnMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHRoZXJlJ3MgYW4gYWN0aXZlIGdyb3VwIHNlc3Npb24gYWxyZWFkeVxuICBjb25zdCBleGlzdGluZ0dyb3VwID0gYXdhaXQgZ2V0R3JvdXBTZXNzaW9uKCk7XG4gIGlmIChleGlzdGluZ0dyb3VwKSB7XG4gICAgZ3JvdXBTZXNzaW9uID0gZXhpc3RpbmdHcm91cDtcbiAgICByZW5kZXJHcm91cFNjcmVlbihleGlzdGluZ0dyb3VwKTtcbiAgICBzaG93U2NyZWVuKFwiZ3JvdXBcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY2hhcmFjdGVyID0gYXdhaXQgZ2V0QWN0aXZlQ2hhcmFjdGVyKCk7XG4gIGlmICghY2hhcmFjdGVyKSB7XG4gICAgc2hvd1NjcmVlbihcImVtcHR5XCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGF3YWl0IGxvYWRDaGFyYWN0ZXIoY2hhcmFjdGVyKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZENoYXJhY3RlcihjaGFyYWN0ZXI6IFNhdmVkQ2hhcmFjdGVyKSB7XG4gIGFjdGl2ZUNoYXJhY3RlciA9IGNoYXJhY3RlcjtcblxuICBjb25zdCBoaXN0b3J5ID0gYXdhaXQgZ2V0Q2hhdEhpc3RvcnkoY2hhcmFjdGVyLmlkKTtcbiAgY2hhdEhpc3RvcnkgPSBoaXN0b3J5ID8/IHtcbiAgICBjaGFyYWN0ZXJJZDogY2hhcmFjdGVyLmlkLFxuICAgIG1lc3NhZ2VzOiBbXSxcbiAgICByZWxhdGlvbnNoaXBTY29yZTogY2hhcmFjdGVyLnJlbGF0aW9uc2hpcFNjb3JlLFxuICAgIGVtb3Rpb25hbFN0YXRlOiBjaGFyYWN0ZXIuZW1vdGlvbmFsU3RhdGUsXG4gIH07XG5cbiAgcmVuZGVySGVhZGVyKGNoYXJhY3Rlcik7XG4gIHJlbmRlckhpc3RvcnkoY2hhdEhpc3RvcnkpO1xuICBzaG93U2NyZWVuKFwiY2hhdFwiKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFNjcmVlbiBtYW5hZ2VtZW50IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBzaG93U2NyZWVuKHNjcmVlbjogXCJlbXB0eVwiIHwgXCJjaGF0XCIgfCBcImdyb3VwXCIpIHtcbiAgc2NyZWVuRW1wdHkuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGRlblwiLCBzY3JlZW4gIT09IFwiZW1wdHlcIik7XG4gIHNjcmVlbkNoYXQuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGRlblwiLCBzY3JlZW4gIT09IFwiY2hhdFwiKTtcbiAgc2NyZWVuR3JvdXAuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGRlblwiLCBzY3JlZW4gIT09IFwiZ3JvdXBcIik7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBIZWFkZXIgcmVuZGVyaW5nIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiByZW5kZXJIZWFkZXIoY2hhcmFjdGVyOiBTYXZlZENoYXJhY3Rlcikge1xuICBjb25zdCB0aGVtZSA9IGdldFBvcnRyYWl0VGhlbWUoY2hhcmFjdGVyLnBlcnNvbmFsaXR5KTtcbiAgY2hhclBvcnRyYWl0LnN0eWxlLmJhY2tncm91bmQgPSB0aGVtZS5ncmFkaWVudDtcbiAgaWYgKGNoYXJhY3Rlci5wb3J0cmFpdFVybCkge1xuICAgIGNoYXJQb3J0cmFpdC5pbm5lckhUTUwgPSBgPGltZyBzcmM9XCIke2VzY2FwZUh0bWwoY2hhcmFjdGVyLnBvcnRyYWl0VXJsKX1cIiBhbHQ9XCIke2VzY2FwZUh0bWwoY2hhcmFjdGVyLm5hbWUpfVwiIC8+YDtcbiAgfSBlbHNlIHtcbiAgICBjaGFyUG9ydHJhaXQuaW5uZXJIVE1MID0gdGhlbWUuZW1vamk7XG4gICAgY2hhclBvcnRyYWl0LnN0eWxlLmZvbnRTaXplID0gXCIyNHB4XCI7XG4gIH1cblxuICBjaGFyTmFtZS50ZXh0Q29udGVudCA9IGNoYXJhY3Rlci5uYW1lO1xuICBjaGFyTGFiZWwudGV4dENvbnRlbnQgPSBjaGFyYWN0ZXIub2JqZWN0TGFiZWw7XG4gIGNoYXJTdGF0ZS50ZXh0Q29udGVudCA9IGNoYXJhY3Rlci5lbW90aW9uYWxTdGF0ZS50b1VwcGVyQ2FzZSgpO1xuICB1cGRhdGVSZWxCYXIoY2hhcmFjdGVyLnJlbGF0aW9uc2hpcFNjb3JlKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVsQmFyKHNjb3JlOiBudW1iZXIpIHtcbiAgY29uc3QgeyBsYWJlbCwgY29sb3IgfSA9IGdldFJlbE1ldGEoc2NvcmUpO1xuICBjb25zdCBwY3QgPSAoKHNjb3JlICsgMTAwKSAvIDIwMCkgKiAxMDA7XG5cbiAgcmVsTGFiZWwudGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgcmVsTGFiZWwuc3R5bGUuY29sb3IgPSBjb2xvcjtcbiAgcmVsQmFyRmlsbC5zdHlsZS53aWR0aCA9IGAke3BjdH0lYDtcbiAgcmVsQmFyRmlsbC5zdHlsZS5iYWNrZ3JvdW5kID0gY29sb3I7XG4gIHJlbFNjb3JlLnRleHRDb250ZW50ID0gKHNjb3JlID4gMCA/IFwiK1wiIDogXCJcIikgKyBzY29yZTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlRW1vdGlvbmFsU3RhdGUoc3RhdGU6IHN0cmluZykge1xuICBjaGFyU3RhdGUudGV4dENvbnRlbnQgPSBzdGF0ZS50b1VwcGVyQ2FzZSgpO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQWN0aXZpdHkgYmFyICsgZmVlZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gc2hvd0FjdGl2aXR5QmFyKHRpdGxlOiBzdHJpbmcpIHtcbiAgYWN0aXZpdHlUZXh0LnRleHRDb250ZW50ID0gdGl0bGU7XG4gIGFjdGl2aXR5U3RhdHVzLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG59XG5cbmZ1bmN0aW9uIGhpZGVBY3Rpdml0eUJhcigpIHtcbiAgYWN0aXZpdHlTdGF0dXMuY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgYWN0aXZpdHlGZWVkLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbmRlckFjdGl2aXR5RmVlZCgpIHtcbiAgY29uc3QgZW50cmllcyA9IGF3YWl0IGdldEFjdGl2aXR5KCk7XG4gIGFjdGl2aXR5RmVlZExpc3QuaW5uZXJIVE1MID0gXCJcIjtcblxuICBpZiAoZW50cmllcy5sZW5ndGggPT09IDApIHtcbiAgICBhY3Rpdml0eUZlZWRMaXN0LmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiYWN0aXZpdHktZW1wdHlcIj5ObyBhY3Rpdml0eSBsb2dnZWQgeWV0LiBCcm93c2Ugc29tZSBwYWdlcyBmaXJzdC48L2Rpdj5gO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFNob3cgbW9zdCByZWNlbnQgZmlyc3QsIGNhcCBhdCAyMCBlbnRyaWVzXG4gIGNvbnN0IHJlY2VudCA9IFsuLi5lbnRyaWVzXS5yZXZlcnNlKCkuc2xpY2UoMCwgMjApO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIHJlY2VudCkge1xuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBlbC5jbGFzc05hbWUgPSBcImFjdGl2aXR5LWVudHJ5XCI7XG5cbiAgICBjb25zdCBtaW5zID0gTWF0aC5yb3VuZChlbnRyeS50aW1lU3BlbnRNcyAvIDYwMDAwKTtcbiAgICBjb25zdCB0aW1lU3RyID0gbWlucyA+IDAgPyBgJHttaW5zfW1gIDogXCI8MW1cIjtcbiAgICBjb25zdCByZWxUaW1lID0gZm9ybWF0UmVsYXRpdmVUaW1lKGVudHJ5LnRpbWVzdGFtcCk7XG5cbiAgICBlbC5pbm5lckhUTUwgPSBgXG4gICAgICA8c3BhbiBjbGFzcz1cImFjdGl2aXR5LWVudHJ5LWRvbWFpblwiPiR7ZXNjYXBlSHRtbChlbnRyeS5kb21haW4pfTwvc3Bhbj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiYWN0aXZpdHktZW50cnktdGl0bGVcIiB0aXRsZT1cIiR7ZXNjYXBlSHRtbChlbnRyeS50aXRsZSl9XCI+JHtlc2NhcGVIdG1sKGVudHJ5LnRpdGxlKX08L3NwYW4+XG4gICAgICA8c3BhbiBjbGFzcz1cImFjdGl2aXR5LWVudHJ5LXRpbWVcIj4ke3RpbWVTdHJ9IFx1MDBCNyAke3JlbFRpbWV9PC9zcGFuPlxuICAgIGA7XG4gICAgYWN0aXZpdHlGZWVkTGlzdC5hcHBlbmRDaGlsZChlbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9ybWF0UmVsYXRpdmVUaW1lKHRzOiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBkaWZmTXMgPSBEYXRlLm5vdygpIC0gdHM7XG4gIGNvbnN0IGRpZmZNaW4gPSBNYXRoLmZsb29yKGRpZmZNcyAvIDYwMDAwKTtcbiAgaWYgKGRpZmZNaW4gPCAxKSByZXR1cm4gXCJqdXN0IG5vd1wiO1xuICBpZiAoZGlmZk1pbiA8IDYwKSByZXR1cm4gYCR7ZGlmZk1pbn1tIGFnb2A7XG4gIGNvbnN0IGRpZmZIciA9IE1hdGguZmxvb3IoZGlmZk1pbiAvIDYwKTtcbiAgaWYgKGRpZmZIciA8IDI0KSByZXR1cm4gYCR7ZGlmZkhyfWggYWdvYDtcbiAgcmV0dXJuIGAke01hdGguZmxvb3IoZGlmZkhyIC8gMjQpfWQgYWdvYDtcbn1cblxuYnRuU2hvd0ZlZWQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgYXdhaXQgcmVuZGVyQWN0aXZpdHlGZWVkKCk7XG4gIGFjdGl2aXR5RmVlZC5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xufSk7XG5cbmJ0bkhpZGVGZWVkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gIGFjdGl2aXR5RmVlZC5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xufSk7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBDb250ZXh0IGJhZGdlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBzaG93Q29udGV4dEJhZGdlKHRleHQ6IHN0cmluZykge1xuICBjb250ZXh0QmFkZ2VUZXh0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgY29udGV4dEJhZGdlLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG59XG5cbmZ1bmN0aW9uIGhpZGVDb250ZXh0QmFkZ2UoKSB7XG4gIGNvbnRleHRCYWRnZS5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuICBwZW5kaW5nQ29udGV4dFF1ZXJ5ID0gbnVsbDtcbn1cblxuY29udGV4dEJhZGdlQ2xlYXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhpZGVDb250ZXh0QmFkZ2UpO1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2hhdCByZW5kZXJpbmcgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIHJlbmRlckhpc3RvcnkoaGlzdG9yeTogQ2hhdEhpc3RvcnkpIHtcbiAgY2hhdE1lc3NhZ2VzLmlubmVySFRNTCA9IFwiXCI7XG4gIGZvciAoY29uc3QgbXNnIG9mIGhpc3RvcnkubWVzc2FnZXMpIHtcbiAgICBhcHBlbmRNZXNzYWdlVG9ET00obXNnLCBmYWxzZSk7XG4gIH1cbiAgc2Nyb2xsVG9Cb3R0b20oKTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kTWVzc2FnZVRvRE9NKG1zZzogQ2hhdE1lc3NhZ2UsIGFuaW1hdGUgPSB0cnVlKSB7XG4gIGNvbnN0IGVsID0gYnVpbGRNZXNzYWdlRWwobXNnLCBhbmltYXRlKTtcbiAgY2hhdE1lc3NhZ2VzLmFwcGVuZENoaWxkKGVsKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRNZXNzYWdlRWwobXNnOiBDaGF0TWVzc2FnZSwgX2FuaW1hdGU6IGJvb2xlYW4pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB3cmFwcGVyLmNsYXNzTmFtZSA9IGBtc2cgbXNnLSR7bXNnLnJvbGV9YDtcbiAgd3JhcHBlci5kYXRhc2V0LmlkID0gbXNnLmlkO1xuXG4gIGNvbnN0IGJ1YmJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGJ1YmJsZS5jbGFzc05hbWUgPSBcIm1zZy1idWJibGVcIjtcbiAgYnViYmxlLnRleHRDb250ZW50ID0gbXNnLnRleHQ7XG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQoYnViYmxlKTtcblxuICBpZiAobXNnLnJvbGUgIT09IFwic3lzdGVtXCIpIHtcbiAgICBjb25zdCBtZXRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBtZXRhLmNsYXNzTmFtZSA9IFwibXNnLW1ldGFcIjtcblxuICAgIGNvbnN0IHRpbWUgPSBuZXcgRGF0ZShtc2cudGltZXN0YW1wKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogXCIyLWRpZ2l0XCIsIG1pbnV0ZTogXCIyLWRpZ2l0XCIgfSk7XG4gICAgbWV0YS5hcHBlbmRDaGlsZChPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpLCB7IHRleHRDb250ZW50OiB0aW1lIH0pKTtcblxuICAgIGlmIChtc2cuaW50ZXJhY3Rpb25Nb2RlKSB7XG4gICAgICBjb25zdCB0YWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIHRhZy5jbGFzc05hbWUgPSBcIm1zZy1tb2RlLXRhZ1wiO1xuICAgICAgdGFnLnRleHRDb250ZW50ID0gbXNnLmludGVyYWN0aW9uTW9kZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgbWV0YS5hcHBlbmRDaGlsZCh0YWcpO1xuICAgIH1cblxuICAgIGlmIChtc2cucmVsYXRpb25zaGlwRGVsdGEgIT09IHVuZGVmaW5lZCAmJiBtc2cucmVsYXRpb25zaGlwRGVsdGEgIT09IDApIHtcbiAgICAgIGNvbnN0IGRlbHRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBjb25zdCBzaWduID0gbXNnLnJlbGF0aW9uc2hpcERlbHRhID4gMCA/IFwiK1wiIDogXCJcIjtcbiAgICAgIGRlbHRhLmNsYXNzTmFtZSA9IGByZWwtZGVsdGEgJHttc2cucmVsYXRpb25zaGlwRGVsdGEgPiAwID8gXCJwb3NcIiA6IFwibmVnXCJ9YDtcbiAgICAgIGRlbHRhLnRleHRDb250ZW50ID0gYCR7c2lnbn0ke21zZy5yZWxhdGlvbnNoaXBEZWx0YX1gO1xuICAgICAgbWV0YS5hcHBlbmRDaGlsZChkZWx0YSk7XG4gICAgfVxuXG4gICAgd3JhcHBlci5hcHBlbmRDaGlsZChtZXRhKTtcbiAgfVxuXG4gIHJldHVybiB3cmFwcGVyO1xufVxuXG4vKipcbiAqIFR5cGV3cml0ZXIgZWZmZWN0IGZvciBpbmNvbWluZyBjaGFyYWN0ZXIgbWVzc2FnZXMuXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdHlwaW5nIGNvbXBsZXRlcy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gdHlwZXdyaXRlckFwcGVuZCh0ZXh0OiBzdHJpbmcsIG1zZ0lkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHdyYXBwZXIuY2xhc3NOYW1lID0gXCJtc2cgbXNnLWNoYXJhY3RlclwiO1xuICB3cmFwcGVyLmRhdGFzZXQuaWQgPSBtc2dJZDtcblxuICBjb25zdCBidWJibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBidWJibGUuY2xhc3NOYW1lID0gXCJtc2ctYnViYmxlXCI7XG5cbiAgY29uc3QgY3Vyc29yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGN1cnNvci5jbGFzc05hbWUgPSBcImN1cnNvclwiO1xuICBidWJibGUuYXBwZW5kQ2hpbGQoY3Vyc29yKTtcbiAgd3JhcHBlci5hcHBlbmRDaGlsZChidWJibGUpO1xuICBjaGF0TWVzc2FnZXMuYXBwZW5kQ2hpbGQod3JhcHBlcik7XG4gIHNjcm9sbFRvQm90dG9tKCk7XG5cbiAgY29uc3QgQ0hBUl9ERUxBWV9NUyA9IDE4O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyBpKyspIHtcbiAgICBidWJibGUuaW5zZXJ0QmVmb3JlKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHRbaV0pLCBjdXJzb3IpO1xuICAgIGlmIChpICUgMyA9PT0gMCkgc2Nyb2xsVG9Cb3R0b20oKTsgLy8ga2VlcCBzY3JvbGwgaW4gc3luYyBkdXJpbmcgdHlwaW5nXG4gICAgYXdhaXQgc2xlZXAoQ0hBUl9ERUxBWV9NUyk7XG4gIH1cblxuICBjdXJzb3IucmVtb3ZlKCk7XG4gIHJldHVybjtcbn1cblxuZnVuY3Rpb24gc2xlZXAobXM6IG51bWJlcikge1xuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHIpID0+IHNldFRpbWVvdXQociwgbXMpKTtcbn1cblxuZnVuY3Rpb24gc2Nyb2xsVG9Cb3R0b20oKSB7XG4gIGNoYXRNZXNzYWdlcy5zY3JvbGxUb3AgPSBjaGF0TWVzc2FnZXMuc2Nyb2xsSGVpZ2h0O1xufVxuXG5mdW5jdGlvbiBlc2NhcGVIdG1sKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKVxuICAgIC5yZXBsYWNlKC8+L2csIFwiJmd0O1wiKVxuICAgIC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIE1vZGUgc2VsZWN0b3IgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbm1vZGVTZWxlY3Rvci5xdWVyeVNlbGVjdG9yQWxsPEhUTUxCdXR0b25FbGVtZW50PihcIi5tb2RlLWJ0blwiKS5mb3JFYWNoKChidG4pID0+IHtcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgbW9kZVNlbGVjdG9yLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubW9kZS1idG5cIikuZm9yRWFjaCgoYikgPT4gYi5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpKTtcbiAgICBidG4uY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgICBjdXJyZW50TW9kZSA9IGJ0bi5kYXRhc2V0Lm1vZGUgYXMgSW50ZXJhY3Rpb25Nb2RlO1xuICB9KTtcbn0pO1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQnVpbGQgYnJvd3NlciBjb250ZXh0IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5hc3luYyBmdW5jdGlvbiBidWlsZEJyb3dzZXJDb250ZXh0KHNlbGVjdGVkVGV4dD86IHN0cmluZyk6IFByb21pc2U8QnJvd3NlckNvbnRleHQgfCB1bmRlZmluZWQ+IHtcbiAgaWYgKCF0b2dnbGVDb250ZXh0LmNoZWNrZWQpIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCBnZXRTZXR0aW5ncygpO1xuICBpZiAoIXNldHRpbmdzLnRyYWNrQWN0aXZpdHkpIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgY29uc3QgYWN0aXZpdHkgPSBhd2FpdCBnZXRBY3Rpdml0eSgpO1xuICBjb25zdCBkaWdlc3QgPSBidWlsZEFjdGl2aXR5RGlnZXN0KGFjdGl2aXR5KTtcblxuICBjb25zdCB0YWIgPSBjdXJyZW50VGFiO1xuXG4gIGlmICghdGFiPy51cmwpIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHRhYi51cmwpO1xuICAgIHJldHVybiB7XG4gICAgICBjdXJyZW50VXJsOiB0YWIudXJsLFxuICAgICAgY3VycmVudFRpdGxlOiB0YWIudGl0bGUsXG4gICAgICBjdXJyZW50RG9tYWluOiB1cmwuaG9zdG5hbWUucmVwbGFjZSgvXnd3d1xcLi8sIFwiXCIpLFxuICAgICAgYWN0aXZpdHlEaWdlc3Q6IGRpZ2VzdCxcbiAgICAgIC4uLihzZWxlY3RlZFRleHQgPyB7IHNlbGVjdGVkVGV4dCB9IDoge30pLFxuICAgIH07XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFNlbmQgbWVzc2FnZSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuYXN5bmMgZnVuY3Rpb24gc2VuZE1lc3NhZ2UodGV4dDogc3RyaW5nKSB7XG4gIGlmICghYWN0aXZlQ2hhcmFjdGVyIHx8ICFjaGF0SGlzdG9yeSkgcmV0dXJuO1xuXG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSByZXR1cm47XG5cbiAgaW5wdXRNZXNzYWdlLnZhbHVlID0gXCJcIjtcbiAgYnRuU2VuZC5kaXNhYmxlZCA9IHRydWU7XG4gIGJ0blN1Z2dlc3QuZGlzYWJsZWQgPSB0cnVlO1xuXG4gIC8vIEJ1aWxkIHVzZXIgbWVzc2FnZVxuICBjb25zdCB1c2VyTXNnOiBDaGF0TWVzc2FnZSA9IHtcbiAgICBpZDogYG1zZ18ke0RhdGUubm93KCl9X3VzZXJgLFxuICAgIHJvbGU6IFwidXNlclwiLFxuICAgIHRleHQ6IHRyaW1tZWQsXG4gICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgIGludGVyYWN0aW9uTW9kZTogY3VycmVudE1vZGUsXG4gIH07XG5cbiAgY2hhdEhpc3RvcnkubWVzc2FnZXMucHVzaCh1c2VyTXNnKTtcbiAgYXBwZW5kTWVzc2FnZVRvRE9NKHVzZXJNc2cpO1xuICBzY3JvbGxUb0JvdHRvbSgpO1xuXG4gIC8vIFNob3cgdHlwaW5nIGluZGljYXRvclxuICB0eXBpbmdJbmRpY2F0b3IuY2xhc3NMaXN0LnJlbW92ZShcImhpZGRlblwiKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHNlbGVjdGVkVGV4dCA9IHBlbmRpbmdDb250ZXh0UXVlcnk/LnNlbGVjdGVkVGV4dDtcbiAgICBjb25zdCBicm93c2VyQ3R4ID0gYXdhaXQgYnVpbGRCcm93c2VyQ29udGV4dChzZWxlY3RlZFRleHQpO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVjYWxsQ2hhdChhY3RpdmVDaGFyYWN0ZXIsIGN1cnJlbnRNb2RlLCB0cmltbWVkLCBicm93c2VyQ3R4KTtcblxuICAgIC8vIEhpZGUgdHlwaW5nIGluZGljYXRvciBiZWZvcmUgdHlwZXdyaXRlclxuICAgIHR5cGluZ0luZGljYXRvci5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuXG4gICAgY29uc3QgY2hhck1zZ0lkID0gYG1zZ18ke0RhdGUubm93KCl9X2NoYXJgO1xuXG4gICAgLy8gVHlwZXdyaXRlciByZW5kZXJcbiAgICBhd2FpdCB0eXBld3JpdGVyQXBwZW5kKHJlc3VsdC5yZXNwb25zZSwgY2hhck1zZ0lkKTtcblxuICAgIGNvbnN0IGNoYXJNc2c6IENoYXRNZXNzYWdlID0ge1xuICAgICAgaWQ6IGNoYXJNc2dJZCxcbiAgICAgIHJvbGU6IFwiY2hhcmFjdGVyXCIsXG4gICAgICB0ZXh0OiByZXN1bHQucmVzcG9uc2UsXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICByZWxhdGlvbnNoaXBEZWx0YTogcmVzdWx0LnJlbGF0aW9uc2hpcERlbHRhLFxuICAgICAgaW50ZXJhY3Rpb25Nb2RlOiBjdXJyZW50TW9kZSxcbiAgICB9O1xuXG4gICAgLy8gQXBwZW5kIG1ldGEgcm93IHRvIHRoZSBleGlzdGluZyB0eXBlZCBidWJibGVcbiAgICBjb25zdCB3cmFwcGVyID0gY2hhdE1lc3NhZ2VzLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWlkPVwiJHtjaGFyTXNnSWR9XCJdYCk7XG4gICAgaWYgKHdyYXBwZXIpIHtcbiAgICAgIGNvbnN0IG1ldGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgbWV0YS5jbGFzc05hbWUgPSBcIm1zZy1tZXRhXCI7XG4gICAgICBjb25zdCB0aW1lID0gbmV3IERhdGUoY2hhck1zZy50aW1lc3RhbXApLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiBcIjItZGlnaXRcIiwgbWludXRlOiBcIjItZGlnaXRcIiB9KTtcbiAgICAgIG1ldGEuYXBwZW5kQ2hpbGQoT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKSwgeyB0ZXh0Q29udGVudDogdGltZSB9KSk7XG5cbiAgICAgIGlmIChyZXN1bHQucmVsYXRpb25zaGlwRGVsdGEgIT09IDApIHtcbiAgICAgICAgY29uc3Qgc2lnbiA9IHJlc3VsdC5yZWxhdGlvbnNoaXBEZWx0YSA+IDAgPyBcIitcIiA6IFwiXCI7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gT2JqZWN0LmFzc2lnbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKSwge1xuICAgICAgICAgIGNsYXNzTmFtZTogYHJlbC1kZWx0YSAke3Jlc3VsdC5yZWxhdGlvbnNoaXBEZWx0YSA+IDAgPyBcInBvc1wiIDogXCJuZWdcIn1gLFxuICAgICAgICAgIHRleHRDb250ZW50OiBgJHtzaWdufSR7cmVzdWx0LnJlbGF0aW9uc2hpcERlbHRhfWAsXG4gICAgICAgIH0pO1xuICAgICAgICBtZXRhLmFwcGVuZENoaWxkKGRlbHRhKTtcbiAgICAgIH1cbiAgICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQobWV0YSk7XG4gICAgfVxuXG4gICAgY2hhdEhpc3RvcnkubWVzc2FnZXMucHVzaChjaGFyTXNnKTtcblxuICAgIC8vIFVwZGF0ZSBsb2NhbCBzdGF0ZSB3aXRoIG5ldyByZWxhdGlvbnNoaXAvZW1vdGlvbmFsIHN0YXRlXG4gICAgY2hhdEhpc3RvcnkucmVsYXRpb25zaGlwU2NvcmUgPSByZXN1bHQubmV3UmVsYXRpb25zaGlwVG9Vc2VyO1xuICAgIGNoYXRIaXN0b3J5LmVtb3Rpb25hbFN0YXRlID0gcmVzdWx0LmVtb3Rpb25hbFN0YXRlVXBkYXRlO1xuXG4gICAgLy8gVXBkYXRlIGNoYXJhY3RlciBpbiBzdG9yYWdlXG4gICAgY29uc3QgdXBkYXRlZENoYXJhY3RlcjogU2F2ZWRDaGFyYWN0ZXIgPSB7XG4gICAgICAuLi5hY3RpdmVDaGFyYWN0ZXIsXG4gICAgICByZWxhdGlvbnNoaXBTY29yZTogcmVzdWx0Lm5ld1JlbGF0aW9uc2hpcFRvVXNlcixcbiAgICAgIGVtb3Rpb25hbFN0YXRlOiByZXN1bHQuZW1vdGlvbmFsU3RhdGVVcGRhdGUsXG4gICAgICBpbnRlcmFjdGlvbkNvdW50OiBhY3RpdmVDaGFyYWN0ZXIuaW50ZXJhY3Rpb25Db3VudCArIDEsXG4gICAgfTtcbiAgICBhY3RpdmVDaGFyYWN0ZXIgPSB1cGRhdGVkQ2hhcmFjdGVyO1xuICAgIGF3YWl0IHVwZGF0ZUNoYXJhY3Rlcih1cGRhdGVkQ2hhcmFjdGVyKTtcblxuICAgIC8vIFVwZGF0ZSBoZWFkZXJcbiAgICB1cGRhdGVSZWxCYXIocmVzdWx0Lm5ld1JlbGF0aW9uc2hpcFRvVXNlcik7XG4gICAgdXBkYXRlRW1vdGlvbmFsU3RhdGUocmVzdWx0LmVtb3Rpb25hbFN0YXRlVXBkYXRlKTtcblxuICAgIC8vIENsZWFyIGNvbnRleHQgYmFkZ2UgYWZ0ZXIgaXQncyBiZWVuIHVzZWRcbiAgICBpZiAocGVuZGluZ0NvbnRleHRRdWVyeSkgaGlkZUNvbnRleHRCYWRnZSgpO1xuXG4gICAgLy8gUGVyc2lzdCBoaXN0b3J5XG4gICAgYXdhaXQgc2F2ZUNoYXRIaXN0b3J5KGNoYXRIaXN0b3J5KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdHlwaW5nSW5kaWNhdG9yLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG5cbiAgICBjb25zdCBlcnJNc2c6IENoYXRNZXNzYWdlID0ge1xuICAgICAgaWQ6IGBtc2dfJHtEYXRlLm5vdygpfV9zeXNgLFxuICAgICAgcm9sZTogXCJzeXN0ZW1cIixcbiAgICAgIHRleHQ6IGBDb25uZWN0aW9uIGVycm9yOiAke1N0cmluZyhlcnIpfS4gQ2hlY2sgdGhlIEFQSSBVUkwgaW4gc2V0dGluZ3MuYCxcbiAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICB9O1xuICAgIGNoYXRIaXN0b3J5Lm1lc3NhZ2VzLnB1c2goZXJyTXNnKTtcbiAgICBhcHBlbmRNZXNzYWdlVG9ET00oZXJyTXNnKTtcbiAgICBzY3JvbGxUb0JvdHRvbSgpO1xuICAgIGF3YWl0IHNhdmVDaGF0SGlzdG9yeShjaGF0SGlzdG9yeSk7XG4gIH0gZmluYWxseSB7XG4gICAgYnRuU2VuZC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIGJ0blN1Z2dlc3QuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICBpbnB1dE1lc3NhZ2UuZm9jdXMoKTtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgU2VuZCBidXR0b24gLyBFbnRlciBrZXkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmJ0blNlbmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgc2VuZE1lc3NhZ2UoaW5wdXRNZXNzYWdlLnZhbHVlKTtcbn0pO1xuXG5pbnB1dE1lc3NhZ2UuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgc2VuZE1lc3NhZ2UoaW5wdXRNZXNzYWdlLnZhbHVlKTtcbiAgfVxufSk7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBTdWdnZXN0IGJ1dHRvbiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuYnRuU3VnZ2VzdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICBpZiAoIWFjdGl2ZUNoYXJhY3RlcikgcmV0dXJuO1xuICBidG5TdWdnZXN0LmRpc2FibGVkID0gdHJ1ZTtcbiAgYnRuU3VnZ2VzdC50ZXh0Q29udGVudCA9IFwiXHUyMDI2XCI7XG5cbiAgY29uc3Qgc3VnZ2VzdGlvbiA9IGF3YWl0IGZldGNoU3VnZ2VzdGlvbihjdXJyZW50TW9kZSwgYWN0aXZlQ2hhcmFjdGVyLm5hbWUsIGFjdGl2ZUNoYXJhY3Rlci5wZXJzb25hbGl0eSk7XG5cbiAgYnRuU3VnZ2VzdC50ZXh0Q29udGVudCA9IFwiXHUyNzI2XCI7XG4gIGJ0blN1Z2dlc3QuZGlzYWJsZWQgPSBmYWxzZTtcblxuICBpZiAoc3VnZ2VzdGlvbikge1xuICAgIGlucHV0TWVzc2FnZS52YWx1ZSA9IHN1Z2dlc3Rpb247XG4gICAgaW5wdXRNZXNzYWdlLmZvY3VzKCk7XG4gIH1cbn0pO1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgQ2xlYXIgaGlzdG9yeSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuYnRuQ2xlYXJIaXN0b3J5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gIGlmICghYWN0aXZlQ2hhcmFjdGVyKSByZXR1cm47XG4gIGF3YWl0IGNsZWFyQ2hhdEhpc3RvcnkoYWN0aXZlQ2hhcmFjdGVyLmlkKTtcbiAgY2hhdEhpc3RvcnkgPSB7XG4gICAgY2hhcmFjdGVySWQ6IGFjdGl2ZUNoYXJhY3Rlci5pZCxcbiAgICBtZXNzYWdlczogW10sXG4gICAgcmVsYXRpb25zaGlwU2NvcmU6IGFjdGl2ZUNoYXJhY3Rlci5yZWxhdGlvbnNoaXBTY29yZSxcbiAgICBlbW90aW9uYWxTdGF0ZTogYWN0aXZlQ2hhcmFjdGVyLmVtb3Rpb25hbFN0YXRlLFxuICB9O1xuICBjaGF0TWVzc2FnZXMuaW5uZXJIVE1MID0gXCJcIjtcbn0pO1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgR3JvdXAgY2hhdCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgZ3JvdXBQb3J0cmFpdHMgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJncm91cC1wb3J0cmFpdHNcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCBncm91cE1lbWJlcnNMYWJlbCAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdyb3VwLW1lbWJlcnMtbGFiZWxcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCBncm91cENoYXRNZXNzYWdlcyAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdyb3VwLWNoYXQtbWVzc2FnZXNcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCBncm91cFR5cGluZ0luZGljYXRvciAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdyb3VwLXR5cGluZy1pbmRpY2F0b3JcIikgYXMgSFRNTEVsZW1lbnQ7XG5jb25zdCBncm91cFR5cGluZ05hbWUgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdyb3VwLXR5cGluZy1uYW1lXCIpIGFzIEhUTUxFbGVtZW50O1xuY29uc3QgZ3JvdXBJbnB1dE1lc3NhZ2UgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJncm91cC1pbnB1dC1tZXNzYWdlXCIpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5jb25zdCBncm91cEJ0blNlbmQgICAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdyb3VwLWJ0bi1zZW5kXCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuY29uc3QgZ3JvdXBCdG5DbGVhciAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJncm91cC1idG4tY2xlYXJcIikgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XG5jb25zdCBidG5MZWF2ZUdyb3VwICAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJ0bi1sZWF2ZS1ncm91cFwiKSBhcyBIVE1MQnV0dG9uRWxlbWVudDtcbmNvbnN0IGdyb3VwTW9kZVNlbGVjdG9yICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ3JvdXAtbW9kZS1zZWxlY3RvclwiKSBhcyBIVE1MRWxlbWVudDtcblxuZ3JvdXBNb2RlU2VsZWN0b3IucXVlcnlTZWxlY3RvckFsbDxIVE1MQnV0dG9uRWxlbWVudD4oXCIubW9kZS1idG5cIikuZm9yRWFjaCgoYnRuKSA9PiB7XG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgIGdyb3VwTW9kZVNlbGVjdG9yLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubW9kZS1idG5cIikuZm9yRWFjaCgoYikgPT4gYi5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpKTtcbiAgICBidG4uY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgICBncm91cE1vZGUgPSBidG4uZGF0YXNldC5tb2RlIGFzIEludGVyYWN0aW9uTW9kZTtcbiAgfSk7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gc3RhcnRHcm91cENoYXQobWVtYmVyczogR3JvdXBNZW1iZXJbXSkge1xuICAvLyBSZS11c2UgYW4gZXhpc3Rpbmcgc2Vzc2lvbiBpZiB0aGUgbWVtYmVyIHNldCBpcyB0aGUgc2FtZSwgb3RoZXJ3aXNlIHN0YXJ0IGZyZXNoXG4gIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgZ2V0R3JvdXBTZXNzaW9uKCk7XG4gIGNvbnN0IG1lbWJlcklkcyA9IG1lbWJlcnMubWFwKChtKSA9PiBtLmNoYXJhY3Rlci5pZCkuc29ydCgpLmpvaW4oXCIsXCIpO1xuICBjb25zdCBleGlzdGluZ0lkcyA9IGV4aXN0aW5nPy5tZW1iZXJzLm1hcCgobSkgPT4gbS5jaGFyYWN0ZXIuaWQpLnNvcnQoKS5qb2luKFwiLFwiKTtcblxuICBpZiAoZXhpc3RpbmcgJiYgbWVtYmVySWRzID09PSBleGlzdGluZ0lkcykge1xuICAgIGdyb3VwU2Vzc2lvbiA9IGV4aXN0aW5nO1xuICB9IGVsc2Uge1xuICAgIGdyb3VwU2Vzc2lvbiA9IHtcbiAgICAgIG1lbWJlcnMsXG4gICAgICBtZXNzYWdlczogW10sXG4gICAgICBjcmVhdGVkQXQ6IERhdGUubm93KCksXG4gICAgfTtcbiAgICBhd2FpdCBzYXZlR3JvdXBTZXNzaW9uKGdyb3VwU2Vzc2lvbik7XG4gIH1cblxuICByZW5kZXJHcm91cFNjcmVlbihncm91cFNlc3Npb24pO1xuICBzaG93U2NyZWVuKFwiZ3JvdXBcIik7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckdyb3VwU2NyZWVuKHNlc3Npb246IEdyb3VwQ2hhdFNlc3Npb24pIHtcbiAgLy8gSGVhZGVyIHBvcnRyYWl0c1xuICBncm91cFBvcnRyYWl0cy5pbm5lckhUTUwgPSBcIlwiO1xuICBmb3IgKGNvbnN0IG1lbWJlciBvZiBzZXNzaW9uLm1lbWJlcnMpIHtcbiAgICBjb25zdCB0aGVtZSA9IGdldFBvcnRyYWl0VGhlbWUobWVtYmVyLmNoYXJhY3Rlci5wZXJzb25hbGl0eSk7XG4gICAgY29uc3QgbWluaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbWluaS5jbGFzc05hbWUgPSBcImdyb3VwLXBvcnRyYWl0LW1pbmlcIjtcbiAgICBtaW5pLnN0eWxlLmJhY2tncm91bmQgPSB0aGVtZS5ncmFkaWVudDtcbiAgICBtaW5pLnN0eWxlLmJvcmRlckNvbG9yID0gbWVtYmVyLmNvbG9yO1xuICAgIGlmIChtZW1iZXIuY2hhcmFjdGVyLnBvcnRyYWl0VXJsKSB7XG4gICAgICBtaW5pLmlubmVySFRNTCA9IGA8aW1nIHNyYz1cIiR7ZXNjYXBlSHRtbChtZW1iZXIuY2hhcmFjdGVyLnBvcnRyYWl0VXJsKX1cIiBhbHQ9XCJcIiAvPmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1pbmkudGV4dENvbnRlbnQgPSB0aGVtZS5lbW9qaTtcbiAgICB9XG4gICAgZ3JvdXBQb3J0cmFpdHMuYXBwZW5kQ2hpbGQobWluaSk7XG4gIH1cblxuICAvLyBNZW1iZXIgbmFtZXMgbGluZVxuICBncm91cE1lbWJlcnNMYWJlbC50ZXh0Q29udGVudCA9IHNlc3Npb24ubWVtYmVycy5tYXAoKG0pID0+IG0uY2hhcmFjdGVyLm5hbWUpLmpvaW4oXCIgXHUwMEI3IFwiKTtcblxuICAvLyBSZW5kZXIgaGlzdG9yeVxuICBncm91cENoYXRNZXNzYWdlcy5pbm5lckhUTUwgPSBcIlwiO1xuICBmb3IgKGNvbnN0IG1zZyBvZiBzZXNzaW9uLm1lc3NhZ2VzKSB7XG4gICAgYXBwZW5kR3JvdXBNZXNzYWdlVG9ET00obXNnLCBmYWxzZSk7XG4gIH1cbiAgZ3JvdXBTY3JvbGxUb0JvdHRvbSgpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRHcm91cE1lc3NhZ2VUb0RPTShtc2c6IEdyb3VwQ2hhdE1lc3NhZ2UsIGFuaW1hdGUgPSB0cnVlKSB7XG4gIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gIGlmIChtc2cucm9sZSA9PT0gXCJ1c2VyXCIpIHtcbiAgICB3cmFwcGVyLmNsYXNzTmFtZSA9IFwibXNnIG1zZy11c2VyXCI7XG4gICAgY29uc3QgYnViYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBidWJibGUuY2xhc3NOYW1lID0gXCJtc2ctYnViYmxlXCI7XG4gICAgYnViYmxlLnRleHRDb250ZW50ID0gbXNnLnRleHQ7XG4gICAgd3JhcHBlci5hcHBlbmRDaGlsZChidWJibGUpO1xuICAgIGNvbnN0IG1ldGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG1ldGEuY2xhc3NOYW1lID0gXCJtc2ctbWV0YVwiO1xuICAgIGNvbnN0IHRpbWUgPSBuZXcgRGF0ZShtc2cudGltZXN0YW1wKS50b0xvY2FsZVRpbWVTdHJpbmcoW10sIHsgaG91cjogXCIyLWRpZ2l0XCIsIG1pbnV0ZTogXCIyLWRpZ2l0XCIgfSk7XG4gICAgbWV0YS5hcHBlbmRDaGlsZChPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpLCB7IHRleHRDb250ZW50OiB0aW1lIH0pKTtcbiAgICB3cmFwcGVyLmFwcGVuZENoaWxkKG1ldGEpO1xuICB9IGVsc2Uge1xuICAgIHdyYXBwZXIuY2xhc3NOYW1lID0gXCJtc2cgbXNnLWdyb3VwLWNoYXJcIjtcbiAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbGFiZWwuY2xhc3NOYW1lID0gXCJtc2ctc3BlYWtlci1sYWJlbFwiO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gbXNnLnNwZWFrZXJOYW1lO1xuICAgIGxhYmVsLnN0eWxlLmNvbG9yID0gbXNnLnNwZWFrZXJDb2xvciA/PyBcIiNGRjgwQzBcIjtcbiAgICB3cmFwcGVyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICBjb25zdCBidWJibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGJ1YmJsZS5jbGFzc05hbWUgPSBcIm1zZy1idWJibGVcIjtcbiAgICBidWJibGUuc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gbXNnLnNwZWFrZXJDb2xvciA/PyBcIiNGRjgwQzBcIjtcbiAgICBidWJibGUudGV4dENvbnRlbnQgPSBtc2cudGV4dDtcbiAgICB3cmFwcGVyLmFwcGVuZENoaWxkKGJ1YmJsZSk7XG4gICAgY29uc3QgbWV0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbWV0YS5jbGFzc05hbWUgPSBcIm1zZy1tZXRhXCI7XG4gICAgY29uc3QgdGltZSA9IG5ldyBEYXRlKG1zZy50aW1lc3RhbXApLnRvTG9jYWxlVGltZVN0cmluZyhbXSwgeyBob3VyOiBcIjItZGlnaXRcIiwgbWludXRlOiBcIjItZGlnaXRcIiB9KTtcbiAgICBtZXRhLmFwcGVuZENoaWxkKE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIiksIHsgdGV4dENvbnRlbnQ6IHRpbWUgfSkpO1xuICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQobWV0YSk7XG4gIH1cblxuICBncm91cENoYXRNZXNzYWdlcy5hcHBlbmRDaGlsZCh3cmFwcGVyKTtcbiAgaWYgKGFuaW1hdGUpIGdyb3VwU2Nyb2xsVG9Cb3R0b20oKTtcbn1cblxuLyoqXG4gKiBUeXBld3JpdGVyIGVmZmVjdCBmb3IgZ3JvdXAgY2hhcmFjdGVyIG1lc3NhZ2VzLlxuICogUmV0dXJucyB0aGUgd3JhcHBlciBlbGVtZW50IHNvIG1ldGEgcm93IGNhbiBiZSBhcHBlbmRlZCBhZnRlci5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ3JvdXBUeXBld3JpdGVyQXBwZW5kKFxuICB0ZXh0OiBzdHJpbmcsXG4gIHNwZWFrZXJOYW1lOiBzdHJpbmcsXG4gIHNwZWFrZXJDb2xvcjogc3RyaW5nXG4pOiBQcm9taXNlPEhUTUxFbGVtZW50PiB7XG4gIGNvbnN0IHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB3cmFwcGVyLmNsYXNzTmFtZSA9IFwibXNnIG1zZy1ncm91cC1jaGFyXCI7XG5cbiAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBsYWJlbC5jbGFzc05hbWUgPSBcIm1zZy1zcGVha2VyLWxhYmVsXCI7XG4gIGxhYmVsLnRleHRDb250ZW50ID0gc3BlYWtlck5hbWU7XG4gIGxhYmVsLnN0eWxlLmNvbG9yID0gc3BlYWtlckNvbG9yO1xuICB3cmFwcGVyLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICBjb25zdCBidWJibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBidWJibGUuY2xhc3NOYW1lID0gXCJtc2ctYnViYmxlXCI7XG4gIGJ1YmJsZS5zdHlsZS5ib3JkZXJMZWZ0Q29sb3IgPSBzcGVha2VyQ29sb3I7XG5cbiAgY29uc3QgY3Vyc29yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGN1cnNvci5jbGFzc05hbWUgPSBcImN1cnNvclwiO1xuICBidWJibGUuYXBwZW5kQ2hpbGQoY3Vyc29yKTtcbiAgd3JhcHBlci5hcHBlbmRDaGlsZChidWJibGUpO1xuICBncm91cENoYXRNZXNzYWdlcy5hcHBlbmRDaGlsZCh3cmFwcGVyKTtcbiAgZ3JvdXBTY3JvbGxUb0JvdHRvbSgpO1xuXG4gIGNvbnN0IENIQVJfREVMQVlfTVMgPSAxNjtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgYnViYmxlLmluc2VydEJlZm9yZShkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0W2ldKSwgY3Vyc29yKTtcbiAgICBpZiAoaSAlIDMgPT09IDApIGdyb3VwU2Nyb2xsVG9Cb3R0b20oKTtcbiAgICBhd2FpdCBzbGVlcChDSEFSX0RFTEFZX01TKTtcbiAgfVxuICBjdXJzb3IucmVtb3ZlKCk7XG5cbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIGdyb3VwU2Nyb2xsVG9Cb3R0b20oKSB7XG4gIGdyb3VwQ2hhdE1lc3NhZ2VzLnNjcm9sbFRvcCA9IGdyb3VwQ2hhdE1lc3NhZ2VzLnNjcm9sbEhlaWdodDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2VuZEdyb3VwTWVzc2FnZSh0ZXh0OiBzdHJpbmcpIHtcbiAgaWYgKCFncm91cFNlc3Npb24gfHwgZ3JvdXBTZW5kaW5nKSByZXR1cm47XG4gIGNvbnN0IHRyaW1tZWQgPSB0ZXh0LnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkKSByZXR1cm47XG5cbiAgZ3JvdXBTZW5kaW5nID0gdHJ1ZTtcbiAgZ3JvdXBJbnB1dE1lc3NhZ2UudmFsdWUgPSBcIlwiO1xuICBncm91cEJ0blNlbmQuZGlzYWJsZWQgPSB0cnVlO1xuXG4gIGNvbnN0IHVzZXJNc2c6IEdyb3VwQ2hhdE1lc3NhZ2UgPSB7XG4gICAgaWQ6IGBnbV8ke0RhdGUubm93KCl9X3VzZXJgLFxuICAgIHJvbGU6IFwidXNlclwiLFxuICAgIHNwZWFrZXJOYW1lOiBcIllvdVwiLFxuICAgIHRleHQ6IHRyaW1tZWQsXG4gICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgIGludGVyYWN0aW9uTW9kZTogZ3JvdXBNb2RlLFxuICB9O1xuXG4gIGdyb3VwU2Vzc2lvbi5tZXNzYWdlcy5wdXNoKHVzZXJNc2cpO1xuICBhcHBlbmRHcm91cE1lc3NhZ2VUb0RPTSh1c2VyTXNnKTtcblxuICAvLyBMZXQgZWFjaCBjaGFyYWN0ZXIgcmVzcG9uZCBpbiBzZXF1ZW5jZVxuICBmb3IgKGNvbnN0IG1lbWJlciBvZiBncm91cFNlc3Npb24ubWVtYmVycykge1xuICAgIC8vIEJ1aWxkIHRoZSBncm91cCBjb250ZXh0IGZvciB0aGlzIGNoYXJhY3RlcjogZXZlcnlvbmUgZWxzZSArIHJlY2VudCBtZXNzYWdlc1xuICAgIGNvbnN0IG90aGVyTWVtYmVycyA9IGdyb3VwU2Vzc2lvbi5tZW1iZXJzXG4gICAgICAuZmlsdGVyKChtKSA9PiBtLmNoYXJhY3Rlci5pZCAhPT0gbWVtYmVyLmNoYXJhY3Rlci5pZClcbiAgICAgIC5tYXAoKG0pID0+ICh7XG4gICAgICAgIG5hbWU6IG0uY2hhcmFjdGVyLm5hbWUsXG4gICAgICAgIHBlcnNvbmFsaXR5OiBtLmNoYXJhY3Rlci5wZXJzb25hbGl0eSxcbiAgICAgICAgZW1vdGlvbmFsU3RhdGU6IG0uY2hhcmFjdGVyLmVtb3Rpb25hbFN0YXRlLFxuICAgICAgfSkpO1xuXG4gICAgY29uc3QgcmVjZW50TWVzc2FnZXMgPSBncm91cFNlc3Npb24ubWVzc2FnZXMuc2xpY2UoLTEyKS5tYXAoKG0pID0+ICh7XG4gICAgICBzcGVha2VyTmFtZTogbS5zcGVha2VyTmFtZSxcbiAgICAgIHRleHQ6IG0udGV4dCxcbiAgICB9KSk7XG5cbiAgICAvLyBTaG93IHR5cGluZyBpbmRpY2F0b3Igd2l0aCB0aGlzIGNoYXJhY3RlcidzIG5hbWVcbiAgICBncm91cFR5cGluZ05hbWUudGV4dENvbnRlbnQgPSBtZW1iZXIuY2hhcmFjdGVyLm5hbWU7XG4gICAgZ3JvdXBUeXBpbmdOYW1lLnN0eWxlLmNvbG9yID0gbWVtYmVyLmNvbG9yO1xuICAgIGdyb3VwVHlwaW5nSW5kaWNhdG9yLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG4gICAgZ3JvdXBTY3JvbGxUb0JvdHRvbSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGJyb3dzZXJDdHggPSBhd2FpdCBidWlsZEJyb3dzZXJDb250ZXh0KCk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBncm91cFJlY2FsbENoYXQoXG4gICAgICAgIG1lbWJlci5jaGFyYWN0ZXIsXG4gICAgICAgIGdyb3VwTW9kZSxcbiAgICAgICAgdHJpbW1lZCxcbiAgICAgICAgeyBvdGhlckNoYXJhY3RlcnM6IG90aGVyTWVtYmVycywgcmVjZW50TWVzc2FnZXMgfSxcbiAgICAgICAgYnJvd3NlckN0eFxuICAgICAgKTtcblxuICAgICAgZ3JvdXBUeXBpbmdJbmRpY2F0b3IuY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcblxuICAgICAgY29uc3Qgd3JhcHBlciA9IGF3YWl0IGdyb3VwVHlwZXdyaXRlckFwcGVuZChyZXN1bHQucmVzcG9uc2UsIG1lbWJlci5jaGFyYWN0ZXIubmFtZSwgbWVtYmVyLmNvbG9yKTtcblxuICAgICAgLy8gQXBwZW5kIG1ldGEgcm93XG4gICAgICBjb25zdCBtZXRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG1ldGEuY2xhc3NOYW1lID0gXCJtc2ctbWV0YVwiO1xuICAgICAgY29uc3QgdGltZSA9IG5ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7IGhvdXI6IFwiMi1kaWdpdFwiLCBtaW51dGU6IFwiMi1kaWdpdFwiIH0pO1xuICAgICAgbWV0YS5hcHBlbmRDaGlsZChPYmplY3QuYXNzaWduKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpLCB7IHRleHRDb250ZW50OiB0aW1lIH0pKTtcbiAgICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQobWV0YSk7XG5cbiAgICAgIGNvbnN0IGNoYXJNc2c6IEdyb3VwQ2hhdE1lc3NhZ2UgPSB7XG4gICAgICAgIGlkOiBgZ21fJHtEYXRlLm5vdygpfV8ke21lbWJlci5jaGFyYWN0ZXIuaWR9YCxcbiAgICAgICAgcm9sZTogXCJjaGFyYWN0ZXJcIixcbiAgICAgICAgc3BlYWtlck5hbWU6IG1lbWJlci5jaGFyYWN0ZXIubmFtZSxcbiAgICAgICAgc3BlYWtlckNoYXJhY3RlcklkOiBtZW1iZXIuY2hhcmFjdGVyLmlkLFxuICAgICAgICBzcGVha2VyQ29sb3I6IG1lbWJlci5jb2xvcixcbiAgICAgICAgdGV4dDogcmVzdWx0LnJlc3BvbnNlLFxuICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgIGludGVyYWN0aW9uTW9kZTogZ3JvdXBNb2RlLFxuICAgICAgfTtcbiAgICAgIGdyb3VwU2Vzc2lvbi5tZXNzYWdlcy5wdXNoKGNoYXJNc2cpO1xuXG4gICAgICAvLyBTbWFsbCBwYXVzZSBzbyBpdCBmZWVscyBsaWtlIGEgbmF0dXJhbCBjb252ZXJzYXRpb24gdHVyblxuICAgICAgYXdhaXQgc2xlZXAoMzAwKTtcblxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgZ3JvdXBUeXBpbmdJbmRpY2F0b3IuY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcblxuICAgICAgY29uc3QgZXJyTXNnOiBHcm91cENoYXRNZXNzYWdlID0ge1xuICAgICAgICBpZDogYGdtXyR7RGF0ZS5ub3coKX1fZXJyYCxcbiAgICAgICAgcm9sZTogXCJjaGFyYWN0ZXJcIixcbiAgICAgICAgc3BlYWtlck5hbWU6IG1lbWJlci5jaGFyYWN0ZXIubmFtZSxcbiAgICAgICAgc3BlYWtlckNvbG9yOiBtZW1iZXIuY29sb3IsXG4gICAgICAgIHRleHQ6IGBbQ29ubmVjdGlvbiBlcnJvcjogJHtTdHJpbmcoZXJyKX1dYCxcbiAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgfTtcbiAgICAgIGdyb3VwU2Vzc2lvbi5tZXNzYWdlcy5wdXNoKGVyck1zZyk7XG4gICAgICBhcHBlbmRHcm91cE1lc3NhZ2VUb0RPTShlcnJNc2cpO1xuICAgIH1cbiAgfVxuXG4gIGF3YWl0IHNhdmVHcm91cFNlc3Npb24oZ3JvdXBTZXNzaW9uKTtcbiAgZ3JvdXBTZW5kaW5nID0gZmFsc2U7XG4gIGdyb3VwQnRuU2VuZC5kaXNhYmxlZCA9IGZhbHNlO1xuICBncm91cElucHV0TWVzc2FnZS5mb2N1cygpO1xufVxuXG5ncm91cEJ0blNlbmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHNlbmRHcm91cE1lc3NhZ2UoZ3JvdXBJbnB1dE1lc3NhZ2UudmFsdWUpKTtcblxuZ3JvdXBJbnB1dE1lc3NhZ2UuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGUpID0+IHtcbiAgaWYgKGUua2V5ID09PSBcIkVudGVyXCIgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgc2VuZEdyb3VwTWVzc2FnZShncm91cElucHV0TWVzc2FnZS52YWx1ZSk7XG4gIH1cbn0pO1xuXG5ncm91cEJ0bkNsZWFyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gIGlmICghZ3JvdXBTZXNzaW9uKSByZXR1cm47XG4gIGdyb3VwU2Vzc2lvbi5tZXNzYWdlcyA9IFtdO1xuICBhd2FpdCBzYXZlR3JvdXBTZXNzaW9uKGdyb3VwU2Vzc2lvbik7XG4gIGdyb3VwQ2hhdE1lc3NhZ2VzLmlubmVySFRNTCA9IFwiXCI7XG59KTtcblxuYnRuTGVhdmVHcm91cC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICAvLyBLZWVwIHRoZSBncm91cCBzZXNzaW9uIGluIHN0b3JhZ2UgKHVzZXIgY2FuIHJldHVybiksIGp1c3Qgc3dpdGNoIHRvIHNvbG9cbiAgZ3JvdXBTZXNzaW9uID0gbnVsbDtcbiAgYXdhaXQgY2xlYXJHcm91cFNlc3Npb24oKTtcbiAgY29uc3QgY2hhcmFjdGVyID0gYXdhaXQgZ2V0QWN0aXZlQ2hhcmFjdGVyKCk7XG4gIGlmIChjaGFyYWN0ZXIpIHtcbiAgICBhd2FpdCBsb2FkQ2hhcmFjdGVyKGNoYXJhY3Rlcik7XG4gIH0gZWxzZSB7XG4gICAgc2hvd1NjcmVlbihcImVtcHR5XCIpO1xuICB9XG59KTtcblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFJ1bnRpbWUgbWVzc2FnZSBoYW5kbGluZyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZTogYW55KSA9PiB7XG4gIC8vIENvbnRleHQgbWVudTogdXNlciBzZWxlY3RlZCB0ZXh0IG9uIGEgcGFnZSBhbmQgYXNrZWQgdGhlIGNoYXJhY3RlciBhYm91dCBpdFxuICBpZiAobWVzc2FnZS50eXBlID09PSBcIkNPTlRFWFRfTUVOVV9RVUVSWVwiKSB7XG4gICAgcGVuZGluZ0NvbnRleHRRdWVyeSA9IHtcbiAgICAgIHNlbGVjdGVkVGV4dDogbWVzc2FnZS5zZWxlY3RlZFRleHQsXG4gICAgICBzb3VyY2VVcmw6IG1lc3NhZ2Uuc291cmNlVXJsLFxuICAgICAgc291cmNlVGl0bGU6IG1lc3NhZ2Uuc291cmNlVGl0bGUsXG4gICAgfTtcblxuICAgIGNvbnN0IGxhYmVsID0gbWVzc2FnZS5zZWxlY3RlZFRleHRcbiAgICAgID8gYFwiJHttZXNzYWdlLnNlbGVjdGVkVGV4dC5zbGljZSgwLCA2MCl9JHttZXNzYWdlLnNlbGVjdGVkVGV4dC5sZW5ndGggPiA2MCA/IFwiXHUyMDI2XCIgOiBcIlwifVwiYFxuICAgICAgOiBgRnJvbTogJHttZXNzYWdlLnNvdXJjZVRpdGxlfWA7XG5cbiAgICBzaG93Q29udGV4dEJhZGdlKGBDb250ZXh0OiAke2xhYmVsfWApO1xuXG4gICAgLy8gUHJlLWZpbGwgYSBuYXR1cmFsIHByb21wdCBmb3IgdGhlIHVzZXJcbiAgICBpZiAobWVzc2FnZS5zZWxlY3RlZFRleHQpIHtcbiAgICAgIGlucHV0TWVzc2FnZS52YWx1ZSA9IGBXaGF0IGRvIHlvdSB0aGluayBhYm91dCB0aGlzPyBcIiR7bWVzc2FnZS5zZWxlY3RlZFRleHQuc2xpY2UoMCwgMTIwKX1cImA7XG4gICAgfVxuICAgIGlucHV0TWVzc2FnZS5mb2N1cygpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFByb2FjdGl2ZSBjb21tZW50IGZyb20gYmFja2dyb3VuZCB3b3JrZXJcbiAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJQUk9BQ1RJVkVfQ09NTUVOVFwiICYmIGFjdGl2ZUNoYXJhY3RlciAmJiBjaGF0SGlzdG9yeSkge1xuICAgIGNvbnN0IHByb2FjdGl2ZU1zZzogQ2hhdE1lc3NhZ2UgPSB7XG4gICAgICBpZDogYG1zZ18ke0RhdGUubm93KCl9X2NoYXJgLFxuICAgICAgcm9sZTogXCJjaGFyYWN0ZXJcIixcbiAgICAgIHRleHQ6IG1lc3NhZ2UudGV4dCBhcyBzdHJpbmcsXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICByZWxhdGlvbnNoaXBEZWx0YTogbWVzc2FnZS5yZWxhdGlvbnNoaXBEZWx0YSBhcyBudW1iZXIsXG4gICAgfTtcblxuICAgIGNoYXRIaXN0b3J5Lm1lc3NhZ2VzLnB1c2gocHJvYWN0aXZlTXNnKTtcbiAgICBhcHBlbmRNZXNzYWdlVG9ET00ocHJvYWN0aXZlTXNnKTtcbiAgICBzY3JvbGxUb0JvdHRvbSgpO1xuXG4gICAgaWYgKG1lc3NhZ2UubmV3UmVsYXRpb25zaGlwU2NvcmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY2hhdEhpc3RvcnkucmVsYXRpb25zaGlwU2NvcmUgPSBtZXNzYWdlLm5ld1JlbGF0aW9uc2hpcFNjb3JlIGFzIG51bWJlcjtcbiAgICAgIHVwZGF0ZVJlbEJhcihtZXNzYWdlLm5ld1JlbGF0aW9uc2hpcFNjb3JlIGFzIG51bWJlcik7XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLmVtb3Rpb25hbFN0YXRlKSB7XG4gICAgICBjaGF0SGlzdG9yeS5lbW90aW9uYWxTdGF0ZSA9IG1lc3NhZ2UuZW1vdGlvbmFsU3RhdGUgYXMgc3RyaW5nO1xuICAgICAgdXBkYXRlRW1vdGlvbmFsU3RhdGUobWVzc2FnZS5lbW90aW9uYWxTdGF0ZSBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIHNhdmVDaGF0SGlzdG9yeShjaGF0SGlzdG9yeSkuY2F0Y2goKCkgPT4ge30pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFRhYiBjaGFuZ2VkOiB1cGRhdGUgYWN0aXZpdHkgYmFyIGFuZCBsaXZlLXJlZnJlc2ggdGhlIGZlZWQgaWYgaXQncyBvcGVuXG4gIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiVEFCX0NIQU5HRURcIikge1xuICAgIGNvbnN0IGVudHJ5ID0gbWVzc2FnZS5lbnRyeSBhcyB7IHVybDogc3RyaW5nOyB0aXRsZTogc3RyaW5nIH07XG4gICAgaWYgKGVudHJ5Py51cmwgJiYgZW50cnk/LnRpdGxlKSB7XG4gICAgICBjdXJyZW50VGFiID0geyB1cmw6IGVudHJ5LnVybCwgdGl0bGU6IGVudHJ5LnRpdGxlIH07XG4gICAgICBpZiAoZW50cnkudXJsLnN0YXJ0c1dpdGgoXCJodHRwOi8vXCIpIHx8IGVudHJ5LnVybC5zdGFydHNXaXRoKFwiaHR0cHM6Ly9cIikpIHtcbiAgICAgICAgc2hvd0FjdGl2aXR5QmFyKGVudHJ5LnRpdGxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhpZGVBY3Rpdml0eUJhcigpO1xuICAgICAgfVxuICAgICAgLy8gUmVmcmVzaCB0aGUgZmVlZCBpbiB0aGUgYmFja2dyb3VuZCBpZiBpdCdzIGN1cnJlbnRseSB2aXNpYmxlXG4gICAgICBpZiAoIWFjdGl2aXR5RmVlZC5jbGFzc0xpc3QuY29udGFpbnMoXCJoaWRkZW5cIikpIHtcbiAgICAgICAgcmVuZGVyQWN0aXZpdHlGZWVkKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBBY3RpdmUgY2hhcmFjdGVyIGNoYW5nZWQgZnJvbSBwb3B1cFxuICBpZiAobWVzc2FnZS50eXBlID09PSBcIlNFVF9BQ1RJVkVfQ0hBUkFDVEVSXCIpIHtcbiAgICBpbml0KCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR3JvdXAgY2hhdCBpbml0aWF0ZWQgZnJvbSBwb3B1cCB3aGlsZSBzaWRlIHBhbmVsIHdhcyBhbHJlYWR5IG9wZW5cbiAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJTVEFSVF9HUk9VUF9DSEFUXCIpIHtcbiAgICBjb25zdCBjaGFyYWN0ZXJzID0gbWVzc2FnZS5jaGFyYWN0ZXJzIGFzIFNhdmVkQ2hhcmFjdGVyW107XG4gICAgY29uc3QgbWVtYmVyczogR3JvdXBNZW1iZXJbXSA9IGNoYXJhY3RlcnMubWFwKChjaGFyLCBpKSA9PiAoe1xuICAgICAgY2hhcmFjdGVyOiBjaGFyLFxuICAgICAgY29sb3I6IEdST1VQX0NPTE9SU1tpICUgR1JPVVBfQ09MT1JTLmxlbmd0aF0sXG4gICAgfSkpO1xuICAgIHN0YXJ0R3JvdXBDaGF0KG1lbWJlcnMpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuICAgIHJldHVybjtcbiAgfVxufSk7XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBCb290IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5pbml0KCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBaUZPLElBQU0sbUJBQXNDO0FBQUEsRUFDakQsWUFBWTtBQUFBLEVBQ1osbUJBQW1CO0FBQUEsRUFDbkIsbUJBQW1CO0FBQUEsRUFDbkIsZUFBZTtBQUNqQjtBQUtPLElBQU0sZUFBZSxDQUFDLFdBQVcsV0FBVyxXQUFXLFNBQVM7OztBQzlFdkUsSUFBTSxPQUFPO0FBQUEsRUFDWCxZQUFZO0FBQUEsRUFDWixVQUFVO0FBQUEsRUFDVixVQUFVO0FBQUEsRUFDVixhQUFhO0FBQUEsRUFDYixlQUFlO0FBQUEsRUFDZixlQUFlO0FBQ2pCO0FBR0EsSUFBTSxvQkFBb0I7QUFJMUIsZUFBc0IsZ0JBQTJDO0FBQy9ELFFBQU0sU0FBUyxNQUFNLE9BQU8sUUFBUSxNQUFNLElBQUksS0FBSyxVQUFVO0FBQzdELFNBQVEsT0FBTyxLQUFLLFVBQVUsS0FBMEIsQ0FBQztBQUMzRDtBQUVBLGVBQXNCLGNBQWMsWUFBNkM7QUFDL0UsUUFBTSxPQUFPLFFBQVEsTUFBTSxJQUFJLEVBQUUsQ0FBQyxLQUFLLFVBQVUsR0FBRyxXQUFXLENBQUM7QUFDbEU7QUFFQSxlQUFzQixpQkFBaUIsSUFBNEM7QUFDakYsUUFBTSxhQUFhLE1BQU0sY0FBYztBQUN2QyxTQUFPLFdBQVcsS0FBSyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSztBQUNoRDtBQUVBLGVBQXNCLGdCQUFnQixTQUF3QztBQUM1RSxRQUFNLGFBQWEsTUFBTSxjQUFjO0FBQ3ZDLFFBQU0sTUFBTSxXQUFXLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxRQUFRLEVBQUU7QUFDM0QsTUFBSSxPQUFPLEdBQUc7QUFDWixlQUFXLEdBQUcsSUFBSTtBQUFBLEVBQ3BCLE9BQU87QUFDTCxlQUFXLEtBQUssT0FBTztBQUFBLEVBQ3pCO0FBQ0EsUUFBTSxjQUFjLFVBQVU7QUFDaEM7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
