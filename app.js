const $ = (id) => document.getElementById(id);
const modes = {
  chat: ["AI Assistant","✦ General"],
  study: ["Study mode","▤ Study"],
  code: ["Coding studio","⌘ Code"],
  write: ["Writing studio","✎ Writing"],
  translate: ["Translator","文 Translate"],
  summarize: ["Summarizer","☷ Summary"],
  brainstorm: ["Idea lab","✧ Ideas"]
};
let mode = "chat";
let chats = [];
let current = { id: Date.now(), title: "New chat", messages: [] };
let pendingImage = null;
let deferredInstall = null;

function loadHistory() {
  try { chats = JSON.parse(localStorage.getItem("nexora_chats") || "[]"); } catch { chats = []; }
  renderHistory();
}
function saveHistory() {
  if (!$("saveHistory").checked) return;
  const all = [current, ...chats.filter(c => c.id !== current.id)].slice(0, 30);
  localStorage.setItem("nexora_chats", JSON.stringify(all));
  chats = all.filter(c => c.id !== current.id);
  renderHistory();
}
function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";
  if (!chats.length) { list.innerHTML = '<p class="muted tiny">Your chats appear here.</p>'; return; }
  chats.slice(0, 12).forEach(c => {
    const b = document.createElement("button");
    b.className = "history-item"; b.textContent = c.title || "Chat";
    b.onclick = () => { current = JSON.parse(JSON.stringify(c)); renderMessages(); if (innerWidth < 760) $("sidebar").classList.remove("open"); };
    list.appendChild(b);
  });
}
function setMode(next) {
  mode = next in modes ? next : "chat";
  $("modeTitle").textContent = modes[mode][0];
  $("modePill").textContent = modes[mode][1];
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function renderMessages() {
  $("welcome").classList.toggle("hidden", current.messages.length > 0);
  const root = $("messages"); root.innerHTML = "";
  current.messages.forEach((m, i) => {
    const row = document.createElement("div"); row.className = `message ${m.role}`;
    const avatar = document.createElement("div"); avatar.className = "message-avatar"; avatar.textContent = m.role === "user" ? "Y" : "N";
    const wrap = document.createElement("div");
    const bubble = document.createElement("div"); bubble.className = "bubble";
    if (m.imagePreview && m.role === "user") {
      const img = document.createElement("img"); img.src = m.imagePreview; bubble.appendChild(img);
    }
    const text = document.createElement("div"); text.textContent = m.text || ""; bubble.appendChild(text);
    wrap.appendChild(bubble);
    if (m.role === "assistant") {
      const actions = document.createElement("div"); actions.className = "message-actions";
      const copy = document.createElement("button"); copy.textContent = "Copy"; copy.onclick = () => navigator.clipboard?.writeText(m.text || "");
      const speak = document.createElement("button"); speak.textContent = "Read aloud"; speak.onclick = () => speakText(m.text || "");
      actions.append(copy, speak); wrap.appendChild(actions);
    }
    row.append(avatar, wrap); root.appendChild(row);
  });
  $("chatArea").scrollTop = $("chatArea").scrollHeight;
}
function newChat() {
  if (current.messages.length) saveHistory();
  current = { id: Date.now(), title: "New chat", messages: [] };
  renderMessages(); $("promptInput").focus();
}
function addMessage(role, text, image = null) {
  current.messages.push({ role, text, image: image ? {data:image.data,mimeType:image.mimeType} : null, imagePreview:image?.preview || null });
  if (role === "user" && current.title === "New chat") current.title = (text || "Image question").slice(0, 34);
  renderMessages(); saveHistory();
}
async function sendMessage() {
  const text = $("promptInput").value.trim();
  if (!text && !pendingImage) return;
  const image = pendingImage;
  pendingImage = null; $("attachmentPreview").classList.add("hidden"); $("attachmentPreview").textContent = "";
  $("promptInput").value = ""; $("promptInput").style.height = "auto";
  addMessage("user", text, image);
  $("typing").classList.remove("hidden"); $("sendBtn").disabled = true;
  try {
    const payloadMessages = current.messages.map(m => ({role:m.role,text:m.text,image:m.image}));
    const response = await fetch("/api/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:payloadMessages,mode,language:$("languageSelect").value})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    addMessage("assistant", data.answer);
  } catch (err) {
    addMessage("assistant", `I couldn't complete that request. ${err.message}\n\nCheck that the backend is running and your API key is configured.`);
  } finally {
    $("typing").classList.add("hidden"); $("sendBtn").disabled = false; $("promptInput").focus();
  }
}
function speakText(text) {
  if (!("speechSynthesis" in window)) return alert("Text-to-speech is not supported in this browser.");
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); speechSynthesis.speak(u);
}
$("sendBtn").onclick = sendMessage;
$("promptInput").addEventListener("keydown", e => { if(e.key==="Enter" && !e.shiftKey){e.preventDefault();sendMessage();} });
$("promptInput").addEventListener("input", e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,140)+"px"; });
$("newChat").onclick = newChat;
document.querySelectorAll(".nav-item").forEach(b => b.onclick = () => { setMode(b.dataset.mode); if(innerWidth<760) $("sidebar").classList.remove("open"); });
document.querySelectorAll(".suggestion").forEach(b => b.onclick = () => { $("promptInput").value=b.dataset.prompt; sendMessage(); });
$("themeBtn").onclick = () => { document.body.classList.toggle("dark"); localStorage.setItem("nexora_dark",document.body.classList.contains("dark")?"1":"0"); };
$("menuBtn").onclick = () => $("sidebar").classList.toggle("open");
$("settingsBtn").onclick = () => $("settingsDialog").showModal();
$("closeSettings").onclick = () => $("settingsDialog").close();
$("clearAll").onclick = () => { if(confirm("Delete all chats saved on this device?")){localStorage.removeItem("nexora_chats");chats=[];newChat();renderHistory();$("settingsDialog").close();} };
$("saveHistory").onchange = () => { if(!$("saveHistory").checked){localStorage.removeItem("nexora_chats");chats=[];renderHistory();} else saveHistory(); };
$("reduceMotion").onchange = e => document.body.classList.toggle("reduce-motion",e.target.checked);
$("speakBtn").onclick = () => { const last=[...current.messages].reverse().find(m=>m.role==="assistant"); if(last) speakText(last.text); };
$("fileInput").onchange = async e => {
  const f=e.target.files[0]; if(!f)return;
  if(f.size>7*1024*1024){alert("Please choose a file under 7 MB.");e.target.value="";return;}
  if(f.type.startsWith("image/")){
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(",")[1]);r.onerror=reject;r.readAsDataURL(f);});
    pendingImage={data,mimeType:f.type,preview:URL.createObjectURL(f)};
    $("attachmentPreview").textContent="Attached image: "+f.name+" (add a question, then send)";
  } else {
    const text=await f.text(); $("promptInput").value += `\n\nFile: ${f.name}\n${text.slice(0,18000)}`;
    $("attachmentPreview").textContent="Text file added to your message: "+f.name;
  }
  $("attachmentPreview").classList.remove("hidden"); e.target.value="";
};
$("voiceBtn").onclick = () => {
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return alert("Voice input is not supported in this browser. Try Chrome on Android.");
  const rec=new SR(); rec.lang=$("languageSelect").value==="Nepali"?"ne-NP":$("languageSelect").value==="Hindi"?"hi-IN":"en-US";
  rec.onresult=e=>{$("promptInput").value += ( $("promptInput").value ? " " : "") + e.results[0][0].transcript;};
  rec.onerror=()=>alert("Voice input could not start. Check microphone permission.");
  rec.start();
};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").textContent="⇩ Install app";});
$("installBtn").onclick=async()=>{if(deferredInstall){deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;}else alert("On Android Chrome, open the browser menu and choose 'Install app' or 'Add to Home screen'.");};
if(localStorage.getItem("nexora_dark")==="1")document.body.classList.add("dark");
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
loadHistory(); setMode("chat"); renderMessages();