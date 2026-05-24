const params = new URLSearchParams(location.search);
const instructorAllowed = params.get("instructor") === "1" && params.get("key") === "csirt2026";

const scenarios = [
  {
    id: "portal-outage",
    sender: "総務部 渡辺さん",
    text: "勤怠入力ページが 502 Bad Gateway で開けません。部署内の何人かも同じです。",
    correct: "watch",
    sourceName: null,
    evidence: "Webサーバー側のアプリ再起動ログあり。端末側の不審プロセスやファイル変更はありません。",
    simple: "単一サービスのWebエラーです。ランサムウェアの典型サインはありません。",
    instructor: "推奨: 様子見。サービス障害として扱い、他の高リスク報告を優先します。"
  },
  {
    id: "mfa-fatigue",
    sender: "役員室 小林さん",
    text: "Microsoft 365の承認通知が何度も来ます。自分ではログインしていません。1回だけ承認したかもしれません。",
    correct: "investigate",
    sourceName: null,
    evidence: "海外IPからMFA承認要求が連続。1件の成功ログがありますが、端末暗号化はありません。",
    simple: "これは認証侵害の疑いです。端末隔離より、ログ確認とセッション無効化が先です。",
    instructor: "推奨: 要調査。初級版では防御フェーズへ進めず、認証ログ確認の重要性だけ伝えます。"
  },
  {
    id: "share-rename",
    sender: "総務部 山田さん",
    text: "共有フォルダの部署テンプレートがまとめて名前変更されています。拡張子が見慣れない文字になっているファイルもあります。",
    correct: "isolate",
    sourceName: "経理PC-A",
    evidence: "File Serverで短時間に312ファイルの拡張子変更。更新元は SATO-PC です。",
    simple: "拡張子が大量に変わるのは暗号化の典型サインです。更新元端末を止めます。",
    instructor: "推奨: 緊急隔離。共有フォルダの大量リネームは横展開済みの可能性が高く、防御フェーズへつなげます。"
  },
  {
    id: "mail-loader",
    sender: "営業部 鈴木さん",
    text: "取引先名のメールに添付されていた請求書を開いたら、一瞬だけ黒い画面が出ました。ファイルは空でした。",
    correct: "isolate",
    sourceName: "営業PC-B",
    evidence: "添付ファイル実行後に powershell.exe が起動。外部への通信もあります。",
    simple: "黒い画面は、不正なプログラムが裏で動いたサインです。すぐ隔離します。",
    instructor: "推奨: 緊急隔離。添付ファイル、黒い画面、PowerShell、外部通信がそろっており初期侵入と判断します。"
  }
];

const state = {
  screen: "intro",
  current: 0,
  investigated: new Set(),
  history: [],
  score: 0,
  loss: 0,
  impact: "低",
  axes: {
    containment: 50,
    evidence: 50,
    recovery: 50,
    continuity: 80
  },
  instructorOn: false,
  selectedIncident: null,
  defenseStep: 0,
  defenseTimer: null,
  scanned: false,
  defense: {
    pc: "hidden",
    file: "hidden",
    ad: "hidden",
    backup: "hidden",
    pcIsolated: false,
    sharesStopped: false,
    adProtected: false,
    backupCut: false
  },
  commandHistory: []
};

const $ = (id) => document.getElementById(id);
const yen = (value) => "¥" + value.toLocaleString("ja-JP");

function axisColor(value) {
  if (value >= 65) return "var(--good)";
  if (value >= 40) return "var(--warn)";
  return "var(--bad)";
}

function switchScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  $(name + "Screen").classList.add("active");
  state.screen = name;
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function shiftAxes(delta) {
  Object.entries(delta).forEach(([key, value]) => {
    state.axes[key] = clamp(state.axes[key] + value);
  });
  updateMetrics();
}

function updateMetrics() {
  $("scoreMetric").textContent = state.score;
  $("lossMetric").textContent = yen(state.loss);
  $("impactMetric").textContent = state.impact;
  $("containmentMetric").textContent = state.axes.containment;
  $("recoveryMetric").textContent = state.axes.recovery;
}

function resetGame() {
  clearInterval(state.defenseTimer);
  state.current = 0;
  state.investigated = new Set();
  state.history = [];
  state.score = 0;
  state.loss = 0;
  state.impact = "低";
  state.axes = { containment: 50, evidence: 50, recovery: 50, continuity: 80 };
  state.selectedIncident = null;
  state.commandHistory = [];
  updateMetrics();
  switchScreen("intro");
}

function startGame() {
  resetGame();
  switchScreen("triage");
  renderTriage();
}

function currentScenario() {
  return scenarios[state.current];
}

function renderTriage() {
  const scenario = currentScenario();
  if (!scenario) {
    finishGame();
    return;
  }

  $("triageProgress").textContent = `${state.current + 1} / ${scenarios.length}`;
  $("reportSender").textContent = scenario.sender;
  $("reportText").textContent = scenario.text;
  $("evidenceBox").textContent = state.investigated.has(scenario.id)
    ? scenario.evidence
    : "証拠確認をすると、判断材料が表示されます。";
  $("evidenceButton").disabled = state.investigated.has(scenario.id);
  renderInstructor();
}

function gatherEvidence() {
  const scenario = currentScenario();
  if (!scenario || state.investigated.has(scenario.id)) return;
  state.investigated.add(scenario.id);
  state.loss += 15000;
  shiftAxes({ evidence: 8, continuity: -2 });
  renderTriage();
}

function chooseTriage(action) {
  const scenario = currentScenario();
  if (!scenario) return;

  const correct = action === scenario.correct;
  const investigated = state.investigated.has(scenario.id);
  state.history.push({
    sender: scenario.sender,
    text: scenario.text,
    selected: action,
    correct: scenario.correct,
    isCorrect: correct,
    investigated,
    explanation: scenario.simple
  });

  if (correct) {
    state.score += investigated ? 30 : 22;
    shiftAxes({ containment: 4, evidence: investigated ? 4 : 0 });
  } else {
    state.loss += 120000;
    state.score = Math.max(0, state.score - 5);
    shiftAxes({ containment: -8, evidence: -4, recovery: -3 });
  }

  if (scenario.correct === "isolate" && action !== "watch") {
    state.selectedIncident = scenario;
    startDefense(scenario);
    return;
  }

  if (scenario.correct === "isolate" && action === "watch") {
    state.selectedIncident = scenario;
    state.loss += 250000;
    startDefense(scenario);
    return;
  }

  state.current += 1;
  renderTriage();
}

function startDefense(scenario) {
  clearInterval(state.defenseTimer);
  switchScreen("defense");
  $("sourceNodeLabel").textContent = scenario.sourceName || "不明端末";
  state.defenseStep = 0;
  state.scanned = false;
  state.defense = {
    pc: "infected",
    file: "hidden",
    ad: "hidden",
    backup: "hidden",
    pcIsolated: false,
    sharesStopped: false,
    adProtected: false,
    backupCut: false
  };
  state.commandHistory = [];
  $("defenseLog").innerHTML = "";
  $("defensePhaseText").textContent = "まず調査で状態を確認しましょう";
  log("info", "防御フェーズ開始。感染端末だけでなく、共有・AD・バックアップも守ります。");
  log("info", "まず「調査する」で現在の状態を確認してください。");
  paintNetwork();
  renderInstructor();
  state.defenseTimer = setInterval(progressAttack, 6500);
}

function progressAttack() {
  if (state.screen !== "defense") return;
  state.defenseStep += 1;
  state.loss += 50000;

  if (state.defenseStep === 1 && !state.defense.pcIsolated && !state.defense.sharesStopped) {
    state.defense.file = "warning";
    log("warn", "共有フォルダへの大量アクセスが始まりました。");
  } else if (state.defenseStep === 2 && !state.defense.sharesStopped) {
    state.defense.file = "infected";
    state.loss += 160000;
    state.impact = "中";
    log("bad", "File Serverに暗号化の兆候。共有停止が必要です。");
  } else if (state.defenseStep === 3 && state.defense.file === "infected") {
    if (!state.defense.adProtected) {
      state.defense.ad = "warning";
      log("warn", "ADへの不審な認証要求が増えています。");
    }
    if (!state.defense.backupCut) {
      state.defense.backup = "warning";
      log("warn", "バックアップ領域へのアクセスが発生しています。");
    }
  } else if (state.defenseStep === 4 && state.defense.file === "infected") {
    if (!state.defense.adProtected) {
      state.defense.ad = "infected";
      state.impact = "重大";
      state.loss += 400000;
      log("bad", "AD侵害。全社展開リスクが高まりました。");
    }
    if (!state.defense.backupCut) {
      state.defense.backup = "infected";
      state.loss += 500000;
      log("bad", "バックアップが暗号化され、復旧力が大きく低下しました。");
    }
  }

  if (state.defenseStep >= 5) finishGame();
  updateMetrics();
  paintNetwork();
}

function runCommand(command) {
  if (command === "scan") {
    state.scanned = true;
    state.loss += 60000;
    state.axes.evidence = clamp(state.axes.evidence + 8);
    log("info", "調査を実行。各機器の状態を表示しました。");
    paintNetwork();
    updateMetrics();
    return;
  }

  if (!state.scanned) {
    log("warn", "先に調査して状態を確認しましょう。根拠なしの操作は避けます。");
    return;
  }

  if (command === "pc") {
    if (state.defense.pcIsolated) return;
    state.defense.pcIsolated = true;
    state.defense.pc = "isolated";
    state.score += 30;
    state.commandHistory.push("感染端末隔離");
    shiftAxes({ containment: 16, evidence: 4, continuity: -4 });
    log("good", "感染端末を隔離しました。起点からの横展開を止めます。");
  }

  if (command === "shares") {
    if (state.defense.sharesStopped) return;
    state.defense.sharesStopped = true;
    state.score += state.defense.file === "infected" || state.defense.file === "warning" ? 25 : 12;
    state.impact = state.impact === "重大" ? "重大" : "中";
    state.commandHistory.push("共有停止");
    shiftAxes({ containment: 14, recovery: 6, continuity: -14 });
    log("good", "共有フォルダを停止しました。File Server経由の感染拡大を抑えます。");
  }

  if (command === "ad") {
    if (state.defense.adProtected) return;
    state.defense.adProtected = true;
    state.defense.ad = state.defense.ad === "infected" ? "isolated" : "safe";
    state.score += state.defense.ad === "isolated" ? 10 : 25;
    state.commandHistory.push("AD保護");
    shiftAxes({ containment: 12, recovery: 6, continuity: -8 });
    log("good", "ADを保護しました。認証基盤から全社へ広がるリスクを下げます。");
  }

  if (command === "backup") {
    if (state.defense.backupCut) return;
    state.defense.backupCut = true;
    state.defense.backup = state.defense.backup === "infected" ? "isolated" : "safe";
    state.score += state.defense.backup === "safe" ? 25 : 8;
    state.commandHistory.push("バックアップ切断");
    shiftAxes({ containment: 6, recovery: state.defense.backup === "safe" ? 20 : -12, continuity: -5 });
    log("good", "バックアップを切断しました。復旧に必要なデータを守ります。");
  }

  paintNetwork();
  updateMetrics();

  if (isStable()) {
    state.score += 35;
    finishGame();
  }
}

function isStable() {
  return state.defense.pcIsolated
    && state.defense.sharesStopped
    && state.defense.adProtected
    && state.defense.backupCut;
}

function displayStatus(status) {
  if (!state.scanned && status !== "isolated" && status !== "safe") return "hidden-state";
  if (status === "hidden") return "hidden-state";
  return status;
}

function paintNetwork() {
  ["pc", "file", "ad", "backup"].forEach((id) => {
    const node = $("node-" + id);
    node.setAttribute("class", "net-node " + displayStatus(state.defense[id]));
  });

  const pcFile = $("line-pc-file");
  const fileAd = $("line-file-ad");
  const fileBackup = $("line-file-backup");
  pcFile.setAttribute("class", "net-link " + linkClass("pc", "file", state.defense.pcIsolated || state.defense.sharesStopped));
  fileAd.setAttribute("class", "net-link " + linkClass("file", "ad", state.defense.sharesStopped || state.defense.adProtected));
  fileBackup.setAttribute("class", "net-link " + linkClass("file", "backup", state.defense.sharesStopped || state.defense.backupCut));
}

function linkClass(from, to, cut) {
  if (cut) return "cut";
  if (!state.scanned) return "";
  if (state.defense[to] === "infected" || state.defense[from] === "infected") return "infected";
  if (state.defense[to] === "warning" || state.defense[from] === "warning") return "warning";
  return "";
}

function log(type, text) {
  const time = new Date().toLocaleTimeString("ja-JP", { hour12: false });
  $("defenseLog").insertAdjacentHTML("beforeend", `<p class="${type}">[${time}] ${text}</p>`);
  $("defenseLog").scrollTop = $("defenseLog").scrollHeight;
}

function labelFor(action) {
  return {
    watch: "様子見",
    investigate: "要調査",
    isolate: "緊急隔離"
  }[action] || action;
}

function renderInstructor() {
  document.querySelectorAll(".instructor-only").forEach((el) => {
    el.hidden = !instructorAllowed;
  });

  if (!instructorAllowed) return;
  $("instructorToggle").textContent = state.instructorOn ? "講師モード ON" : "講師モード OFF";

  const triageCard = $("triageInstructor");
  const scenario = currentScenario();
  if (triageCard && scenario) {
    triageCard.style.display = state.instructorOn && state.screen === "triage" ? "block" : "none";
    triageCard.innerHTML = `<strong>講師メモ</strong><br>${scenario.instructor}`;
  }

  const defenseCard = $("defenseInstructor");
  if (defenseCard) {
    defenseCard.style.display = state.instructorOn && state.screen === "defense" ? "block" : "none";
    defenseCard.innerHTML = "<strong>推奨対応順</strong><br>1. 調査する<br>2. 感染端末隔離<br>3. 共有停止<br>4. AD保護<br>5. バックアップ切断";
  }
}

function finishGame() {
  clearInterval(state.defenseTimer);
  switchScreen("result");
  const success = state.score >= 90 && state.axes.recovery >= 55;
  $("resultTitle").textContent = success ? "初動対応は良好です" : "訓練完了";
  $("resultSummary").textContent = success
    ? "感染源から重要資産まで、被害の広がりを段階的に止められました。"
    : "初動から防御まで体験しました。次は、共有・AD・バックアップの守りをもう少し早く意識してみましょう。";
  $("resultScore").textContent = state.score;

  $("damageSummary").innerHTML = [
    ["推定被害額", yen(state.loss)],
    ["業務影響", state.impact],
    ["実行した防御", state.commandHistory.length ? state.commandHistory.join(" / ") : "なし"],
    ["調査コスト", state.scanned ? yen(60000) : yen(0)]
  ].map(([label, value]) => `<div class="summary-row"><span>${label}</span><strong>${value}</strong></div>`).join("");

  const axes = [
    ["封じ込め", state.axes.containment],
    ["証拠保全", state.axes.evidence],
    ["復旧力", state.axes.recovery],
    ["業務継続", state.axes.continuity]
  ];
  $("axisList").innerHTML = axes.map(([label, value]) => `
    <div class="axis-row">
      <span>${label}<div class="axis-track"><i style="width:${value}%;background:${axisColor(value)}"></i></div></span>
      <strong style="color:${axisColor(value)}">${value}</strong>
    </div>
  `).join("");

  $("historyList").innerHTML = state.history.map((item) => `
    <div class="history-row">
      <div class="badge ${item.isCorrect ? "ok" : "ng"}">${item.isCorrect ? "✓" : "!"}</div>
      <div>
        <strong>${item.sender}</strong><br>
        <span>あなたの判断: ${labelFor(item.selected)} / 推奨: ${labelFor(item.correct)} / ${item.investigated ? "証拠確認あり" : "証拠確認なし"}</span><br>
        <span>${item.explanation}</span>
      </div>
    </div>
  `).join("");

  $("hintList").innerHTML = buildHints().map((hint) => `<li>${hint}</li>`).join("");
}

function buildHints() {
  const hints = [];
  if (state.history.some((h) => !h.isCorrect)) {
    hints.push("誤判定がありました。本文だけで迷う場合は、証拠確認でプロセス・ファイル変更・認証ログを見ると安定します。");
  }
  if (!state.commandHistory.includes("共有停止")) {
    hints.push("共有停止が未実行です。感染端末を止めても、共有フォルダが動いたままだと横展開が続きます。");
  }
  if (!state.commandHistory.includes("AD保護")) {
    hints.push("AD保護が未実行です。認証基盤を取られると全社展開のリスクが上がります。");
  }
  if (!state.commandHistory.includes("バックアップ切断")) {
    hints.push("バックアップ切断が未実行です。復旧データを守ることは、身代金に頼らないための生命線です。");
  }
  if (!hints.length) {
    hints.push("よい流れです。感染端末、共有、AD、バックアップの順に守る考え方を持ち帰ってください。");
  }
  return hints;
}

function copyReport() {
  const text = [
    "ランサムウェア初動対応訓練 Basic レポート",
    `スコア: ${state.score}pt`,
    `推定被害額: ${yen(state.loss)}`,
    `業務影響: ${state.impact}`,
    `封じ込め: ${state.axes.containment}`,
    `証拠保全: ${state.axes.evidence}`,
    `復旧力: ${state.axes.recovery}`,
    `業務継続: ${state.axes.continuity}`,
    "",
    "判断履歴:",
    ...state.history.map((h, i) => `${i + 1}. ${h.sender}: ${labelFor(h.selected)} / 推奨 ${labelFor(h.correct)}`),
    "",
    "改善ポイント:",
    ...buildHints().map((h, i) => `${i + 1}. ${h}`)
  ].join("\n");

  navigator.clipboard?.writeText(text);
}

$("startButton").addEventListener("click", startGame);
$("restartButton").addEventListener("click", resetGame);
$("againButton").addEventListener("click", startGame);
$("copyButton").addEventListener("click", copyReport);
$("evidenceButton").addEventListener("click", gatherEvidence);
document.querySelectorAll("[data-triage]").forEach((button) => {
  button.addEventListener("click", () => chooseTriage(button.dataset.triage));
});
document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => runCommand(button.dataset.command));
});

if (instructorAllowed) {
  $("instructorToggle").hidden = false;
  $("instructorToggle").addEventListener("click", () => {
    state.instructorOn = !state.instructorOn;
    renderInstructor();
  });
}

updateMetrics();
renderInstructor();
