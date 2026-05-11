/**
 * ai-chat.js
 * CoalCarbon IQ — AI Assistant powered by DeepSeek
 */

(function initAIChat() {
  const API_BASE = 'https://carboniq-3cxa.onrender.com/api';
  let conversationHistory = [];
  let mineContext = null;
  let isOpen = false;
  let isLoading = false;
  let aiProvider = 'deepseek'; // shown in UI

  // ── CSS ─────────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .ai-fab {
      position: fixed; bottom: 2rem; right: 2rem; z-index: 500;
      width: 62px; height: 62px; border-radius: 50%;
      background: linear-gradient(135deg, #4d9ef6, #1a73e8);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
      box-shadow: 0 4px 28px rgba(26,115,232,0.55);
      transition: transform 0.3s, box-shadow 0.3s;
      animation: fabPulse 3s ease-in-out infinite;
    }
    .ai-fab:hover { transform: scale(1.1); box-shadow: 0 8px 40px rgba(26,115,232,0.75); }
    @keyframes fabPulse {
      0%,100% { box-shadow: 0 4px 28px rgba(26,115,232,0.55); }
      50%      { box-shadow: 0 4px 48px rgba(26,115,232,0.85); }
    }
    .ai-fab-badge {
      position: absolute; top: -5px; right: -5px;
      background: #f4a261; color: #0a0c0f;
      font-size: 0.55rem; font-weight: 900;
      padding: 2px 5px; border-radius: 8px;
      letter-spacing: 0.04em;
    }

    /* ── Panel ─────────────────────────────────────────────────────────── */
    .ai-panel {
      position: fixed; bottom: 6.5rem; right: 2rem; z-index: 499;
      width: 430px; max-height: 640px;
      background: #141820; border: 1px solid #2a3548;
      border-radius: 18px; overflow: hidden;
      display: flex; flex-direction: column;
      box-shadow: 0 24px 70px rgba(0,0,0,0.65);
      transform: translateY(24px) scale(0.94);
      opacity: 0; pointer-events: none;
      transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s;
    }
    .ai-panel.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: all; }

    /* ── Header ─────────────────────────────────────────────────────────── */
    .ai-header {
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, rgba(26,115,232,0.18), rgba(26,115,232,0.06));
      border-bottom: 1px solid #2a3548;
      display: flex; align-items: center; gap: 10px;
    }
    .ai-logo {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg, #1a73e8, #4d9ef6);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
      box-shadow: 0 2px 12px rgba(26,115,232,0.4);
    }
    .ai-header-name { font-family:'Syne',sans-serif; font-weight:700; font-size:1rem; color:#d4e0f0; }
    .ai-header-sub  { font-family:'Space Mono',monospace; font-size:0.62rem; color:#7a9bb5; }
    .ai-provider-pill {
      margin-left: auto;
      display: flex; align-items: center; gap: 5px;
      background: rgba(26,115,232,0.12); border: 1px solid rgba(26,115,232,0.3);
      border-radius: 20px; padding: 3px 10px;
      font-family:'Space Mono',monospace; font-size:0.6rem; color:#4d9ef6;
    }
    .ai-provider-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #4d9ef6;
      animation: aiBlink 2s infinite;
    }
    @keyframes aiBlink { 0%,100%{opacity:1} 50%{opacity:0.25} }

    /* ── Messages ───────────────────────────────────────────────────────── */
    .ai-messages {
      flex: 1; overflow-y: auto; padding: 1rem;
      display: flex; flex-direction: column; gap: 0.8rem;
      min-height: 200px; max-height: 380px;
    }
    .ai-messages::-webkit-scrollbar { width: 4px; }
    .ai-messages::-webkit-scrollbar-thumb { background: #2a3548; border-radius: 2px; }

    .ai-msg {
      max-width: 90%; padding: 0.8rem 1rem;
      border-radius: 14px; font-size: 0.875rem;
      line-height: 1.65; animation: msgIn 0.3s ease;
    }
    @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

    .ai-msg.user {
      align-self: flex-end;
      background: rgba(244,162,97,0.12); border: 1px solid rgba(244,162,97,0.25);
      color: #d4e0f0; border-bottom-right-radius: 4px;
    }
    .ai-msg.assistant {
      align-self: flex-start;
      background: rgba(26,115,232,0.09); border: 1px solid rgba(26,115,232,0.22);
      color: #d4e0f0; border-bottom-left-radius: 4px;
    }
    .ai-msg.assistant strong { color: #4d9ef6; }
    .ai-msg.assistant em { color: #f4a261; font-style: normal; }
    .ai-msg.assistant code {
      background: rgba(26,115,232,0.15); padding: 2px 6px;
      border-radius: 4px; font-family: monospace; font-size: 0.82em;
    }
    .ai-msg-meta {
      font-size: 0.6rem; color: #3d5270; margin-top: 5px;
      font-family:'Space Mono',monospace; display:flex; justify-content:flex-end; gap:8px;
    }

    .ai-typing {
      align-self: flex-start;
      background: rgba(26,115,232,0.09); border: 1px solid rgba(26,115,232,0.22);
      border-radius: 14px; padding: 0.75rem 1rem;
      display: flex; gap: 5px; align-items: center;
    }
    .ai-typing span {
      width: 6px; height: 6px; border-radius: 50%; background: #4d9ef6;
      animation: bounce 1.2s ease-in-out infinite;
    }
    .ai-typing span:nth-child(2) { animation-delay:.2s }
    .ai-typing span:nth-child(3) { animation-delay:.4s }
    @keyframes bounce {0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}}

    /* ── Quick prompts ───────────────────────────────────────────────────── */
    .ai-quick-row {
      padding: 0 1rem 0.5rem;
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .ai-qbtn {
      background: rgba(26,115,232,0.08); border: 1px solid rgba(26,115,232,0.22);
      border-radius: 20px; padding: 5px 12px;
      font-size: 0.74rem; color: #7a9bb5; cursor: pointer;
      transition: all 0.2s; font-family:'Rajdhani',sans-serif; font-weight:600;
      white-space: nowrap;
    }
    .ai-qbtn:hover { background:rgba(26,115,232,0.18); color:#4d9ef6; border-color:#4d9ef6; }

    /* ── Action bar ─────────────────────────────────────────────────────── */
    .ai-action-bar {
      display: flex; gap: 5px; padding: 0 1rem 0.75rem;
    }
    .ai-abtn {
      flex: 1; background: rgba(255,255,255,0.04); border: 1px solid #2a3548;
      border-radius: 7px; padding: 7px 6px; color: #7a9bb5; cursor: pointer;
      font-size: 0.7rem; font-family:'Rajdhani',sans-serif; font-weight:600;
      text-transform: uppercase; letter-spacing:0.05em; transition: all 0.2s; text-align:center;
    }
    .ai-abtn:hover { background:rgba(244,162,97,0.08); color:#f4a261; border-color:rgba(244,162,97,0.3); }

    /* ── Input ──────────────────────────────────────────────────────────── */
    .ai-input-bar {
      border-top: 1px solid #2a3548; padding: 0.75rem 1rem;
      display: flex; gap: 8px; align-items: flex-end;
      background: rgba(0,0,0,0.2);
    }
    .ai-textarea {
      flex: 1; background: #0e1217; border: 1px solid #2a3548;
      border-radius: 10px; color: #d4e0f0; padding: 10px 14px;
      font-family:'Rajdhani',sans-serif; font-size: 0.9rem;
      outline: none; resize: none; max-height: 100px;
      transition: border-color 0.2s; line-height: 1.5;
    }
    .ai-textarea:focus { border-color: #4d9ef6; box-shadow: 0 0 0 3px rgba(26,115,232,0.1); }
    .ai-textarea::placeholder { color: #3d5270; }
    .ai-send {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #1a73e8, #4d9ef6);
      border: none; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; transition: transform 0.2s, opacity 0.2s;
      box-shadow: 0 2px 12px rgba(26,115,232,0.4);
    }
    .ai-send:hover { transform: scale(1.08); }
    .ai-send:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

    @media(max-width:480px) {
      .ai-panel { width: calc(100vw - 2rem); right: 1rem; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <button class="ai-fab" id="aiFab" title="CoalCarbon AI — DeepSeek powered">
      🤖
      <div class="ai-fab-badge">AI</div>
    </button>

    <div class="ai-panel" id="aiPanel">

      <div class="ai-header">
        <div class="ai-logo">🤖</div>
        <div>
          <div class="ai-header-name">CoalCarbon AI</div>
          <div class="ai-header-sub">Powered by DeepSeek</div>
        </div>
        <div class="ai-provider-pill" id="aiProviderPill">
          <div class="ai-provider-dot"></div>
          <span id="aiProviderLabel">DeepSeek</span>
        </div>
      </div>

      <div class="ai-messages" id="aiMessages">
        <div class="ai-msg assistant">
          👋 Hello! I'm <strong>CoalCarbon AI</strong> powered by <strong>DeepSeek</strong>.<br><br>
          I specialize in Indian coal mine carbon neutrality. I can help with:<br>
          • Interpreting your emission calculations<br>
          • Technology & afforestation recommendations<br>
          • Carbon credit schemes (ICM, VCS, Gold Standard)<br>
          • Indian regulatory compliance (PAT, CAMPA, NDC)<br>
          • Customized 5–10 year decarbonization roadmaps<br><br>
          <em>Run the calculator first, then click "Analyze My Report" for personalized AI insights!</em>
        </div>
      </div>

      <div class="ai-quick-row">
        <button class="ai-qbtn" onclick="aiQuickAsk('What are the best emission reduction strategies for Indian coal mines?')">Top Strategies</button>
        <button class="ai-qbtn" onclick="aiQuickAsk('Explain the Indian Carbon Market (ICM) and how to earn carbon credits')">ICM Credits</button>
        <button class="ai-qbtn" onclick="aiQuickAsk('How effective is methane capture in underground coal mines?')">Methane Capture</button>
        <button class="ai-qbtn" onclick="aiQuickAsk('Which afforestation species sequester the most carbon in Jharkhand?')">Afforestation</button>
        <button class="ai-qbtn" onclick="aiQuickAsk('Explain the PAT scheme and how coal mines can benefit')">PAT Scheme</button>
        <button class="ai-qbtn" onclick="aiQuickAsk('What government grants are available for green technology in Indian coal mines?')">Govt Grants</button>
      </div>

      <div class="ai-action-bar">
        <button class="ai-abtn" onclick="aiAnalyzeReport()">🔍 Analyze Report</button>
        <button class="ai-abtn" onclick="aiGetAfforestation()">🌳 Afforestation</button>
        <button class="ai-abtn" onclick="aiGetRoadmap()">🗺️ Tech Roadmap</button>
        <button class="ai-abtn" onclick="aiClearChat()">🗑️ Clear</button>
      </div>

      <div class="ai-input-bar">
        <textarea class="ai-textarea" id="aiInput"
          placeholder="Ask about carbon neutrality, regulations, technology..."
          rows="1"
          onkeydown="aiHandleKey(event)"
          oninput="aiAutoResize(this)"></textarea>
        <button class="ai-send" id="aiSendBtn" onclick="aiSend()">➤</button>
      </div>

    </div>
  `);

  // ── Toggle ───────────────────────────────────────────────────────────────────
  document.getElementById('aiFab').addEventListener('click', () => {
    isOpen = !isOpen;
    document.getElementById('aiPanel').classList.toggle('open', isOpen);
    const fab = document.getElementById('aiFab');
    fab.innerHTML = isOpen ? '✕' : '🤖<div class="ai-fab-badge">AI</div>';
    if (isOpen) { checkStatus(); document.getElementById('aiInput').focus(); }
  });

  // ── Check backend AI status ──────────────────────────────────────────────────
  async function checkStatus() {
    try {
      const res = await fetch(`${API_BASE}/ai/status`, { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      if (data.data) {
        const pill = document.getElementById('aiProviderPill');
        const label = document.getElementById('aiProviderLabel');
        if (data.data.available) {
          aiProvider = data.data.primary || 'deepseek';
          if (label) label.textContent = aiProvider === 'deepseek' ? 'DeepSeek ✓' : 'Claude ✓';
          if (pill)  pill.style.borderColor = 'rgba(46,196,182,0.4)';
        } else {
          if (label) label.textContent = 'No Key';
          if (pill)  { pill.style.borderColor = 'rgba(244,162,97,0.4)'; pill.style.color = '#f4a261'; }
        }
      }
    } catch (_) {}
  }

  // ── Send ─────────────────────────────────────────────────────────────────────
  async function aiSend() {
    const input = document.getElementById('aiInput');
    const q = input.value.trim();
    if (!q || isLoading) return;
    addMsg('user', q);
    input.value = ''; input.style.height = 'auto';
    conversationHistory.push({ role: 'user', content: q });
    await callAI(q);
  }

  async function callAI(question) {
    isLoading = true;
    document.getElementById('aiSendBtn').disabled = true;
    const typer = addTyping();

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, mineContext, conversationHistory: conversationHistory.slice(-8) }),
        signal: AbortSignal.timeout(60000)
      });
      const data = await res.json();
      typer.remove();

      if (data.success && data.data?.response) {
        const reply = data.data.response;
        addMsg('assistant', fmt(reply), data.data.provider);
        conversationHistory.push({ role: 'assistant', content: reply });
      } else {
        throw new Error(data.error || 'Empty response');
      }
    } catch (err) {
      typer.remove();
      if (err.name === 'TimeoutError') {
        addMsg('assistant', '⏱️ Request timed out (60s). DeepSeek may be processing a large response. Try a shorter question.');
      } else if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        addMsg('assistant', `🔌 **Backend not running.** To start:\n\n\`\`\`\ncd backend\nnpm install\nnpm start\n\`\`\`\n\nThe .env file already has your DeepSeek API key configured!`);
      } else {
        addMsg('assistant', `⚠️ Error: ${err.message}`);
      }
    } finally {
      isLoading = false;
      document.getElementById('aiSendBtn').disabled = false;
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  window.aiQuickAsk = function(q) {
    if (!isOpen) document.getElementById('aiFab').click();
    document.getElementById('aiInput').value = q;
    aiSend();
  };

  window.aiAnalyzeReport = async function() {
    if (!window.lastReport) {
      if (!isOpen) document.getElementById('aiFab').click();
      addMsg('assistant', '📋 Please run the **Calculator** first to generate report data, then I can provide a full AI-powered analysis!');
      return;
    }
    if (!isOpen) document.getElementById('aiFab').click();
    addMsg('user', '📊 Please analyze my mine\'s carbon report');
    isLoading = true;
    document.getElementById('aiSendBtn').disabled = true;
    const typer = addTyping();
    try {
      const res = await fetch(`${API_BASE}/ai/analyze`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ reportData: window.lastReport }),
        signal: AbortSignal.timeout(60000)
      });
      const data = await res.json();
      typer.remove();
      if (data.success && data.data?.analysis) addMsg('assistant', fmt(data.data.analysis), data.data.provider);
      else throw new Error(data.error || 'No analysis returned');
    } catch (err) {
      typer.remove();
      addMsg('assistant', `❌ Could not analyze: ${err.message}. Make sure the backend is running with your DeepSeek key.`);
    } finally {
      isLoading = false;
      document.getElementById('aiSendBtn').disabled = false;
    }
  };

  window.aiGetAfforestation = function() {
    if (!window.lastReport) {
      if (!isOpen) document.getElementById('aiFab').click();
      addMsg('assistant', '🌳 Run the calculator first so I can tailor the afforestation plan to your mine\'s actual CO₂ gap!');
      return;
    }
    const s = window.lastReport.summary;
    window.aiQuickAsk(`Create a detailed afforestation strategy for ${s.mineName} in ${(s.state||'').replace(/_/g,' ')} to offset ${Math.round(window.lastReport.gapAnalysis?.gap||0).toLocaleString()} tCO2e/year`);
  };

  window.aiGetRoadmap = function() {
    if (!window.lastReport) {
      if (!isOpen) document.getElementById('aiFab').click();
      addMsg('assistant', '🗺️ Run the calculator first to get a mine-specific technology roadmap!');
      return;
    }
    const s = window.lastReport.summary;
    window.aiQuickAsk(`Create a 10-year technology decarbonization roadmap for ${s.mineName} (${s.mineType} mine, ${Math.round(s.totalEmissions_tCO2e||0).toLocaleString()} tCO2e/year baseline)`);
  };

  window.aiClearChat = function() {
    conversationHistory = [];
    document.getElementById('aiMessages').innerHTML =
      '<div class="ai-msg assistant">💬 Conversation cleared! Ask me anything about coal mine carbon neutrality.</div>';
  };

  window.setAIMineContext = function(ctx) { mineContext = ctx; };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function addMsg(role, content, provider) {
    const el = document.createElement('div');
    el.className = `ai-msg ${role}`;
    const time = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    const prov = provider ? `<span>${provider}</span>` : '';
    el.innerHTML = content + `<div class="ai-msg-meta">${prov}<span>${time}</span></div>`;
    document.getElementById('aiMessages').appendChild(el);
    document.getElementById('aiMessages').scrollTop = 9999;
    return el;
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'ai-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    document.getElementById('aiMessages').appendChild(el);
    document.getElementById('aiMessages').scrollTop = 9999;
    return el;
  }

  function fmt(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/^#{1,3}\s(.+)$/gm, '<strong style="color:#4d9ef6;display:block;margin-top:0.5em">$1</strong>');
  }

  window.aiAutoResize = function(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  };

  window.aiHandleKey = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); aiSend(); }
  };

})();
