// Shared settings for the chat page and the admin page.
// TOPIC is the ntfy.sh channel both pages talk through. Change it to start a fresh, empty channel.
window.PUKAN = {
  TOPIC: "pukan-ai-b9d8b2b623e586bd",
  RELAY: "https://ntfy.sh/",
  BOT_NAME: "พู่กัน",
  MAX_LEN: 1000,
  // speed: how fast the fake token streaming runs for this model (1 = normal).
  MODELS: [
    { id: "ultra", name: "พู่กัน 4.5 Ultra", desc: "ฉลาดที่สุด เหมาะกับงานซับซ้อน", speed: 1 },
    { id: "flash", name: "พู่กัน 4.5 Flash", desc: "ตอบไวทันใจ เหมาะกับคำถามทั่วไป", speed: 2.4 },
    { id: "think", name: "พู่กัน Think", desc: "คิดอย่างละเอียดก่อนตอบ ใช้เวลานานขึ้น", speed: 0.8 }
  ]
};

window.PUKAN.model = function (id) {
  var list = window.PUKAN.MODELS;
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return list[0];
};

window.PUKAN.publish = function (msg) {
  return fetch(window.PUKAN.RELAY + window.PUKAN.TOPIC, {
    method: "POST",
    body: JSON.stringify(msg)
  }).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r;
  });
};

// Calls onMsg(parsedMessage, serverTimeMs) for every chat message on the channel,
// including the last 12 hours of history on connect.
window.PUKAN.subscribe = function (onMsg, onState) {
  var es = new EventSource(window.PUKAN.RELAY + window.PUKAN.TOPIC + "/sse?since=12h");
  es.onopen = function () { onState && onState(true); };
  es.onerror = function () { onState && onState(false); };
  es.onmessage = function (e) {
    var d;
    try { d = JSON.parse(e.data); } catch (_) { return; }
    if (d.event !== "message" || !d.message) return;
    var m;
    try { m = JSON.parse(d.message); } catch (_) { return; }
    if (!m || m.v !== 1 || !m.sid || !m.id) return;
    onMsg(m, (d.time || 0) * 1000);
  };
  return es;
};

window.PUKAN.uid = function (n) {
  var a = new Uint8Array(n || 8);
  crypto.getRandomValues(a);
  return Array.from(a, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
};

window.PUKAN.esc = function (s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
};

// Tiny formatter: **bold**, `code`, line breaks, and "- " bullet lines.
window.PUKAN.fmt = function (s) {
  var html = window.PUKAN.esc(s)
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  return html.split("\n").map(function (line) {
    return /^[-•] /.test(line) ? "<span class=\"li\">" + line.slice(2) + "</span>" : line;
  }).join("<br>");
};

window.PUKAN.store = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
window.PUKAN.load = function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } };
