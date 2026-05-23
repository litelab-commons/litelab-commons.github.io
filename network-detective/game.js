const devices = {
  pc: {
    label: "PC1 が選択されています",
    image: "./assets/learning-pc-clean.png",
    imageProblem: "./assets/learning-pc-sad-clean.png",
    point: "PC1はIP、サブネット、ゲートウェイ、DNSを使って通信を始めます。",
    mode: "pc"
  },
  switch: {
    label: "スイッチ が選択されています",
    image: "./assets/learning-switch-clean.png",
    point: "スイッチは同じLANの中でフレームを届けます。IP設定は持たないことが多いです。",
    mode: "readonly"
  },
  router: {
    label: "ルーター が選択されています",
    image: "./assets/learning-router-clean.png",
    imageProblem: "./assets/learning-router-clean.png",
    imageSolved: "./assets/learning-router-happy-clean.png",
    point: "ルーターは別ネットワークへの出口です。ゲートウェイやルートが正しいか確認しましょう。",
    mode: "router"
  },
  dns: {
    label: "DNSサーバー が選択されています",
    image: "./assets/learning-dns-clean.png",
    point: "DNSは www.example.com を 93.184.216.34 に変換しています。",
    mode: "readonly"
  },
  web: {
    label: "Webサーバー が選択されています",
    image: "./assets/learning-web-clean.png",
    point: "Webサーバーは 93.184.216.34 で、HTTP/HTTPSのリクエストを待っています。",
    mode: "readonly"
  }
};

const baseRows = {
  ip: [
    ["14:31:11.210", "pc", "PC1 (192.168.2.10)", "web", "Webサーバー (192.168.1.20)", "icmp", "同じLANにいるか確認", "sent", "送信済み"],
    ["14:31:11.255", "switch", "スイッチ", "pc", "PC1 (192.168.2.10)", "icmp", "宛先ネットワークが違います", "drop", "✕ 破棄"]
  ],
  gateway: [
    ["14:32:04.110", "pc", "PC1 (192.168.1.10)", "web", "Webサーバー (93.184.216.34)", "tcp", "外部ネットワークへ送信", "sent", "送信済み"],
    ["14:32:04.151", "pc", "PC1 (192.168.1.10)", "router", "ルーター", "icmp", "デフォルトゲートウェイが未設定です", "drop", "✕ 破棄"]
  ],
  dns: [
    ["14:33:27.008", "pc", "PC1 (192.168.1.10)", "dns", "DNSサーバー (未設定)", "dns", "www.example.com のIPアドレスは？", "sent", "送信済み"],
    ["14:33:27.030", "pc", "PC1 (192.168.1.10)", "dns", "DNSサーバー", "dns", "問い合わせ先がありません", "drop", "✕ 破棄"]
  ],
  route: [
    ["14:35:21.123", "pc", "PC1 (192.168.1.10)", "dns", "DNSサーバー (8.8.8.8)", "dns", "クエリ: www.example.com のIPアドレスは？", "sent", "送信済み"],
    ["14:35:21.246", "dns", "DNSサーバー (8.8.8.8)", "pc", "PC1 (192.168.1.10)", "dns", "応答: www.example.com = 93.184.216.34", "received", "受信済み"],
    ["14:35:21.789", "pc", "PC1 (192.168.1.10)", "web", "Webサーバー (93.184.216.34)", "tcp", "SYN パケット", "sent", "送信済み"],
    ["14:35:21.790", "router", "ルーター (192.168.1.1)", "web", "Webサーバー (93.184.216.34)", "tcp", "ルートが見つかりません", "drop", "✕ 破棄"],
    ["14:35:22.001", "pc", "PC1 (192.168.1.10)", "web", "Webサーバー (93.184.216.34)", "icmp", "Destination Unreachable", "received", "受信済み"]
  ],
  web: [
    ["14:37:10.101", "pc", "PC1 (192.168.1.10)", "dns", "DNSサーバー (8.8.8.8)", "dns", "www.example.com を名前解決", "sent", "送信済み"],
    ["14:37:10.180", "dns", "DNSサーバー (8.8.8.8)", "pc", "PC1 (192.168.1.10)", "dns", "93.184.216.34 を返却", "received", "受信済み"],
    ["14:37:10.260", "pc", "PC1 (192.168.1.10)", "web", "Webサーバー (93.184.216.34)", "http", "GET /", "sent", "送信済み"]
  ]
};

const successRows = {
  ip: [
    ["14:31:20.500", "pc", "PC1 (192.168.1.10)", "switch", "スイッチ", "icmp", "同じLANとして認識しました", "received", "受信済み"]
  ],
  gateway: [
    ["14:32:18.330", "pc", "PC1 (192.168.1.10)", "router", "ルーター (192.168.1.1)", "tcp", "ゲートウェイへ送信できました", "sent", "送信済み"]
  ],
  dns: [
    ["14:33:41.900", "dns", "DNSサーバー (8.8.8.8)", "pc", "PC1 (192.168.1.10)", "dns", "www.example.com = 93.184.216.34", "received", "受信済み"]
  ],
  route: [
    ["14:36:03.000", "router", "ルーター (192.168.1.1)", "web", "Webサーバー (93.184.216.34)", "tcp", "ルートを設定しました。パケットを再送します", "sent", "送信済み"],
    ["14:36:03.108", "router", "ルーター (192.168.1.1)", "web", "Webサーバー (93.184.216.34)", "tcp", "デフォルトルート 0.0.0.0/0 を使用", "sent", "送信済み"]
  ],
  web: [
    ["14:37:10.420", "web", "Webサーバー (93.184.216.34)", "pc", "PC1 (192.168.1.10)", "http", "200 OK", "received", "受信済み"]
  ]
};

const stages = [
  {
    key: "ip",
    title: "ステージ1: IPアドレスを合わせよう",
    copy: "PC1を同じLANに参加させて、スイッチまで通信できるようにしよう！",
    selected: "pc",
    problemDevice: "pc",
    warningTitle: "PC1のIPアドレスが違うネットワークです",
    warningText: "192.168.1.x のLANに入るように、PC1のIPを直そう！",
    statusTitle: "PC1の状態",
    status: [
      ["bad", "✕ 192.168.2.10 は別のネットワークです"],
      ["warn", "△ ケーブルは接続されています"],
      ["ok", "● サブネットマスクは /24 です"]
    ],
    solvedStatus: [
      ["ok", "● PC1は 192.168.1.0/24 に参加しています"],
      ["ok", "● スイッチへ到達できます"],
      ["ok", "● 次は外部への出口を設定します"]
    ],
    missions: ["PC1のIPアドレスを確認しよう", "192.168.1.x の未使用IPに変更しよう", "同じLANとして認識されるか確認しよう"],
    point: "同じLANでは、IPアドレスのネットワーク部がそろっている必要があります。/24なら 192.168.1.x が同じLANです。",
    coach: "PC1の住所だけズレています。<br>まずは同じLANに入れてあげよう！",
    solvedCoach: "いい感じ！PC1が同じLANに入りました。<br>次は外へ出る出口です。",
    setup: () => {
      state.values.ip = "192.168.2.10";
      state.values.gateway = "なし";
      state.values.dns = "なし";
      state.values.route = "missing";
    },
    solved: () => isUsableLanIp(state.values.ip),
    apply: () => {
      state.values.ip = els.ipAddress.value.trim();
    }
  },
  {
    key: "gateway",
    title: "ステージ2: 出口を設定しよう",
    copy: "PC1から別ネットワークへ出るため、デフォルトゲートウェイを設定しよう！",
    selected: "pc",
    problemDevice: "pc",
    warningTitle: "外へ出る出口が未設定です",
    warningText: "PC1にルーターのIPアドレスをゲートウェイとして教えよう！",
    statusTitle: "PC1の状態",
    status: [
      ["ok", "● PC1のIPアドレスは正しいです"],
      ["bad", "✕ デフォルトゲートウェイがありません"],
      ["warn", "△ DNS設定はまだ使いません"]
    ],
    solvedStatus: [
      ["ok", "● デフォルトゲートウェイは 192.168.1.1 です"],
      ["ok", "● 別ネットワークへ出る準備ができました"],
      ["ok", "● 次は名前解決です"]
    ],
    missions: ["PC1のIPが正しいことを確認しよう", "ゲートウェイを 192.168.1.1 にしよう", "ルーターへ渡せるか確認しよう"],
    point: "宛先が同じLANではない時、PCはデフォルトゲートウェイへパケットを渡します。",
    coach: "外への出口が空っぽです。<br>ルーターの住所を入れよう！",
    solvedCoach: "出口が見つかりました！<br>次は名前をIPに変換します。",
    setup: () => {
      state.values.ip = "192.168.1.10";
      state.values.gateway = "なし";
      state.values.dns = "なし";
      state.values.route = "missing";
    },
    solved: () => state.values.gateway === "192.168.1.1",
    apply: () => {
      state.values.gateway = els.gateway.value.trim();
    }
  },
  {
    key: "dns",
    title: "ステージ3: DNSを設定しよう",
    copy: "www.example.com という名前をIPアドレスに変換できるようにしよう！",
    selected: "pc",
    problemDevice: "pc",
    warningTitle: "DNSサーバーが未設定です",
    warningText: "PC1にDNSサーバーのIPアドレスを設定しよう！",
    statusTitle: "名前解決の状態",
    status: [
      ["ok", "● ゲートウェイは設定済みです"],
      ["bad", "✕ DNS問い合わせ先がありません"],
      ["warn", "△ WebサーバーのIPがまだ分かりません"]
    ],
    solvedStatus: [
      ["ok", "● DNSサーバーは 8.8.8.8 です"],
      ["ok", "● www.example.com をIPへ変換できます"],
      ["ok", "● 次は経路の確認です"]
    ],
    missions: ["DNS設定欄を確認しよう", "DNSを 8.8.8.8 にしよう", "名前解決ができるか確認しよう"],
    point: "DNSは名前をIPアドレスに変える仕組みです。名前でアクセスする前に、PCがDNSサーバーを知っている必要があります。",
    coach: "名前を聞く相手がまだいません。<br>DNSサーバーを設定しよう！",
    solvedCoach: "名前解決OK！<br>いよいよWebサーバーへの道を見ます。",
    setup: () => {
      state.values.ip = "192.168.1.10";
      state.values.gateway = "192.168.1.1";
      state.values.dns = "なし";
      state.values.route = "missing";
    },
    solved: () => state.values.dns === "8.8.8.8",
    apply: () => {
      state.values.dns = els.dnsAddress.value.trim();
    }
  },
  {
    key: "route",
    title: "ステージ4: 名前でアクセスしよう",
    copy: "PC1からWebサーバーへ、名前（www.example.com）でアクセスできるように設定しよう！",
    selected: "router",
    problemDevice: "router",
    warningTitle: "ルーターでパケットが止まっています",
    warningText: "ルーターの設定を確認して、先に進めるようにしよう！",
    statusTitle: "ルーターの状態",
    status: [
      ["bad", "✕ インターネット側へのルートがありません"],
      ["warn", "△ NATは設定されています"],
      ["ok", "● DNS問い合わせは転送されています"]
    ],
    solvedStatus: [
      ["ok", "● インターネット側へのルートがあります"],
      ["ok", "● NATは設定されています"],
      ["ok", "● Webサーバーへ転送できます"]
    ],
    missions: ["PC1のIPアドレスを設定しよう", "PC1のデフォルトゲートウェイを設定しよう", "DNSサーバーのIPアドレスを設定しよう", "ルーターの経路を設定しよう", "Webサーバーへ進めるか確認しよう"],
    point: "DNSが成功しても、ルーターが外への道を知らないとWebサーバーには届きません。",
    coach: "ナイス！あと少し！<br>ルーターの設定を見直そう！",
    solvedCoach: "ルーターが道を覚えました！<br>最後にWebアクセスを確認しよう。",
    setup: () => {
      state.values.ip = "192.168.1.10";
      state.values.gateway = "192.168.1.1";
      state.values.dns = "8.8.8.8";
      state.values.route = "missing";
    },
    solved: () => state.values.route === "default",
    apply: () => {
      state.values.route = els.routeSelect.value;
    }
  },
  {
    key: "web",
    title: "ステージ5: Webサーバーにアクセスしよう",
    copy: "すべての設定がそろった状態で、www.example.com のページを表示しよう！",
    selected: "web",
    problemDevice: "web",
    warningTitle: "最後の確認です",
    warningText: "通信テストを実行して、HTTP 200 OK が返るか見てみよう！",
    statusTitle: "Webアクセスの状態",
    status: [
      ["ok", "● IP、ゲートウェイ、DNSは設定済みです"],
      ["ok", "● ルーターの経路も設定済みです"],
      ["warn", "△ まだWeb応答を確認していません"]
    ],
    solvedStatus: [
      ["ok", "● DNS解決に成功しました"],
      ["ok", "● TCP接続に成功しました"],
      ["ok", "● HTTP 200 OK を受信しました"]
    ],
    missions: ["DNS解決を確認しよう", "TCPでWebサーバーへ接続しよう", "HTTP 200 OK を受け取ろう"],
    point: "Webページが表示されるまでには、DNS、経路、TCP接続、HTTP応答が順番に動きます。",
    coach: "準備は整っています。<br>最後にアクセス確認を押そう！",
    solvedCoach: "クリア！名前でWebサーバーにアクセスできました。",
    setup: () => {
      state.values.ip = "192.168.1.10";
      state.values.gateway = "192.168.1.1";
      state.values.dns = "8.8.8.8";
      state.values.route = "default";
      state.values.webOk = false;
    },
    solved: () => state.values.webOk,
    apply: () => {
      state.values.webOk = true;
    }
  }
];

const noteData = {
  terms: [
    { stage: 0, title: "IPアドレス", body: "ネットワーク上の住所です。同じLANで通信するには、ネットワーク部がそろっている必要があります。" },
    { stage: 0, title: "サブネットマスク", body: "IPアドレスのどこまでをネットワークとして見るかを決める線引きです。/24 は 255.255.255.0 です。" },
    { stage: 1, title: "デフォルトゲートウェイ", body: "別ネットワークへ出るとき、PCが最初にパケットを渡すルーターです。" },
    { stage: 2, title: "DNS", body: "www.example.com のような名前を、通信で使うIPアドレスへ変換する仕組みです。" },
    { stage: 3, title: "ルーティング", body: "ルーターが宛先ネットワークへ進む道を選ぶことです。道を知らないとパケットは止まります。" },
    { stage: 4, title: "HTTP 200 OK", body: "Webサーバーがリクエストに成功してページを返せる、という代表的な応答です。" }
  ],
  mistakes: [
    { stage: 0, title: "別セグメントのIP", body: "192.168.2.x のようにネットワーク部が違うと、同じLANとして扱えません。" },
    { stage: 0, title: "IPアドレス重複", body: "ルーターやDNSなど、すでに使われているIPをPCに設定すると衝突します。" },
    { stage: 1, title: "ゲートウェイ未設定", body: "外部ネットワークへ送る出口がなく、PCの中で通信が止まります。" },
    { stage: 2, title: "DNS未設定", body: "経路が正しくても、名前をIPに変換できず、名前でアクセスできません。" },
    { stage: 3, title: "ルート未設定", body: "DNSが成功しても、ルーターが外への道を知らないとWebサーバーへ届きません。" },
    { stage: 4, title: "最後の応答未確認", body: "設定がそろっても、HTTP 200 OK を確認して初めてWebアクセス成功です。" }
  ],
  flow: [
    { stage: 0, items: ["PC", "Switch"], body: "同じLAN内では、PCからスイッチへ直接届けます。" },
    { stage: 1, items: ["PC", "Default Gateway", "Router"], body: "別ネットワークへ行く時は、PCがゲートウェイへ渡します。" },
    { stage: 2, items: ["PC", "DNS", "PC"], body: "名前をDNSに聞き、IPアドレスを受け取ります。" },
    { stage: 3, items: ["PC", "DNS", "Router", "Internet", "Web"], body: "名前解決後、ルーターがインターネット側へ転送します。" },
    { stage: 4, items: ["PC", "TCP", "HTTP", "200 OK"], body: "TCPで接続し、HTTPでページを受け取ります。" }
  ],
  quiz: [
    { stage: 0, q: "192.168.1.99/24 は 192.168.1.0/24 の同じLAN？", a: "はい。同じLANです。ただし未使用IPである必要があります。" },
    { stage: 1, q: "別ネットワークへ出る時、PCは最初にどこへ渡す？", a: "デフォルトゲートウェイです。" },
    { stage: 2, q: "DNSの役割は？", a: "名前をIPアドレスへ変換することです。" },
    { stage: 3, q: "DNSが成功してもWebへ届かない原因は？", a: "ルーターが外へのルートを知らない、などが考えられます。" },
    { stage: 4, q: "Webアクセス成功を示す代表的なHTTP応答は？", a: "HTTP 200 OK です。" }
  ]
};

const state = {
  stageIndex: 0,
  completed: new Set(),
  selected: "pc",
  filter: "all",
  values: {
    ip: "192.168.2.10",
    subnet: "255.255.255.0",
    gateway: "なし",
    dns: "なし",
    route: "missing",
    nat: "on",
    routerLanIp: "192.168.1.1",
    routerWanIp: "203.0.113.1",
    webOk: false
  }
};

const els = {
  stageTitle: document.getElementById("stageTitle"),
  stageStepper: document.getElementById("stageStepper"),
  missionCopy: document.getElementById("missionCopy"),
  missionList: document.getElementById("missionList"),
  selectedDevice: document.getElementById("selectedDevice"),
  pointText: document.getElementById("pointText"),
  coachText: document.getElementById("coachText"),
  warningTitle: document.getElementById("warningTitle"),
  warningText: document.getElementById("warningText"),
  pcSettings: [...document.querySelectorAll(".pc-settings")],
  routerSettings: document.querySelector(".router-settings"),
  ipAddress: document.getElementById("ipAddress"),
  subnetMask: document.getElementById("subnetMask"),
  gateway: document.getElementById("gateway"),
  dnsAddress: document.getElementById("dnsAddress"),
  routeSelect: document.getElementById("routeSelect"),
  natSelect: document.getElementById("natSelect"),
  routerLanIp: document.getElementById("routerLanIp"),
  routerWanIp: document.getElementById("routerWanIp"),
  applyButton: document.getElementById("applyButton"),
  nextStageButton: document.getElementById("nextStageButton"),
  packetRows: document.getElementById("packetRows"),
  board: document.querySelector(".network-board"),
  routerNode: document.querySelector(".node.router"),
  routerStatus: document.getElementById("routerStatus"),
  pcLabel: document.getElementById("pcLabel"),
  routerLabel: document.getElementById("routerLabel"),
  dnsLabel: document.getElementById("dnsLabel"),
  webLabel: document.getElementById("webLabel"),
  noteDialog: document.getElementById("noteDialog"),
  noteProgress: document.getElementById("noteProgress"),
  noteContent: document.getElementById("noteContent")
};

let activeNoteTab = "today";

function currentStage() {
  return stages[state.stageIndex];
}

function parseIpv4(value) {
  const parts = value.trim().split(".");
  if (parts.length !== 4) return null;
  const numbers = parts.map((part) => Number(part));
  if (numbers.some((number, index) => !Number.isInteger(number) || number < 0 || number > 255 || String(number) !== parts[index])) return null;
  return numbers;
}

function isUsableLanIp(value) {
  const ip = parseIpv4(value);
  if (!ip) return false;
  const [a, b, c, d] = ip;
  if (a !== 192 || b !== 168 || c !== 1) return false;
  if (d < 2 || d > 254) return false;
  const used = new Set(["192.168.1.1", "192.168.1.20", "192.168.1.53"]);
  return !used.has(value.trim());
}

function stageSolved(stage = currentStage()) {
  return stage.solved();
}

function statusLines(stage, solved) {
  return (solved ? stage.solvedStatus : stage.status)
    .map(([tone, text]) => `<p class="${tone}">${text}</p>`)
    .join("");
}

function renderStepper() {
  [...els.stageStepper.querySelectorAll("button")].forEach((button, index) => {
    const done = state.completed.has(index);
    button.className = "";
    button.classList.toggle("done", done);
    button.classList.toggle("current", index === state.stageIndex);
    button.classList.toggle("locked", index > Math.max(state.stageIndex, ...state.completed) + 1);
    button.textContent = done ? "✓" : String(index + 1);
  });
}

function renderMissions() {
  const stage = currentStage();
  const solved = stageSolved(stage);
  const currentIndex = Math.max(0, stage.missions.length - 2);
  els.missionList.innerHTML = stage.missions.map((label, index) => {
    let status = "locked";
    if (index < currentIndex) status = "done";
    if (index === currentIndex) status = "current";
    if (solved) status = "done";
    const badge = status === "done" ? "✓" : status === "current" ? "進行中" : "未完了";
    const badgeClass = status === "current" ? "badge current" : "badge";
    return `<li class="mission-item ${status}"><span>${label}</span><b class="${badgeClass}">${badge}</b></li>`;
  }).join("");
}

function renderDevice() {
  const device = devices[state.selected];
  const solved = stageSolved();
  const image = imageForDevice(state.selected, solved);
  els.selectedDevice.innerHTML = `<img src="${image}" alt=""><strong>${device.label}</strong>`;
  els.pointText.textContent = solved ? currentStage().solvedCoach.replace("<br>", " ") : device.point;
  document.querySelectorAll(".node").forEach((node) => {
    node.classList.toggle("selected", node.dataset.device === state.selected);
  });

  const showRouter = device.mode === "router";
  els.pcSettings.forEach((section) => {
    section.hidden = showRouter;
    section.classList.toggle("is-hidden", showRouter);
  });
  els.routerSettings.hidden = !showRouter;
  els.routerSettings.classList.toggle("is-hidden", !showRouter);
}

function imageForDevice(deviceId, solved = stageSolved()) {
  const stage = currentStage();
  const device = devices[deviceId];
  if (!device) return "";
  if (!solved && stage.problemDevice === deviceId && device.imageProblem) return device.imageProblem;
  if (solved && stage.problemDevice === deviceId && device.imageSolved) return device.imageSolved;
  if (deviceId === "router" && stage.problemDevice !== "router") return devices.router.imageSolved;
  return device.image;
}

function rowTemplate(row) {
  const [time, sourceType, source, targetType, target, protocol, body, stateName, status] = row;
  if (state.filter !== "all" && state.filter !== protocol) return "";
  return `
    <tr class="${stateName === "drop" ? "error" : ""}">
      <td>${time}</td>
      <td><span class="source ${sourceType}">${source}</span></td>
      <td><span class="target ${targetType}">${target}</span></td>
      <td><span class="protocol ${protocol}">${protocol.toUpperCase()}</span></td>
      <td>${body}</td>
      <td><span class="status ${stateName}">${status}</span></td>
    </tr>
  `;
}

function renderLogs(extraRows = []) {
  const stage = currentStage();
  const rows = [...baseRows[stage.key]];
  if (stageSolved(stage)) rows.push(...successRows[stage.key]);
  rows.push(...extraRows);
  els.packetRows.innerHTML = rows.map(rowTemplate).join("");
}

function renderSettingsValues() {
  els.ipAddress.value = state.values.ip;
  els.subnetMask.value = state.values.subnet;
  els.gateway.value = state.values.gateway;
  els.dnsAddress.value = state.values.dns;
  els.routeSelect.value = state.values.route;
  els.natSelect.value = state.values.nat;
  els.routerLanIp.value = state.values.routerLanIp;
  els.routerWanIp.value = state.values.routerWanIp;
  els.pcLabel.textContent = state.values.ip;
  els.routerLabel.textContent = "192.168.1.1";
  els.dnsLabel.textContent = state.values.dns === "なし" ? "未設定" : state.values.dns;
  els.webLabel.innerHTML = "93.184.216.34<br>(www.example.com)";
}

function renderNetworkState() {
  const stage = currentStage();
  const solved = stageSolved(stage);
  document.querySelectorAll(".node").forEach((node) => {
    const deviceId = node.dataset.device;
    const img = node.querySelector("img");
    if (img) img.src = imageForDevice(deviceId, solved);
    const isProblem = !solved && stage.problemDevice === deviceId;
    const isFixed = solved && stage.problemDevice === deviceId;
    node.classList.toggle("unhappy", isProblem);
    node.classList.toggle("fixed", isFixed);
  });
  els.board.classList.toggle("solved", solved);
  els.warningTitle.textContent = solved ? "原因を取り除きました" : stage.warningTitle;
  els.warningText.textContent = solved ? "パケットが次の目的地へ進めるようになりました。" : stage.warningText;
  els.routerStatus.innerHTML = `<h3>${stage.statusTitle}</h3>${statusLines(stage, solved)}`;
}

function render() {
  const stage = currentStage();
  const solved = stageSolved(stage);
  els.stageTitle.textContent = stage.title;
  els.missionCopy.textContent = stage.copy;
  els.coachText.innerHTML = solved ? stage.solvedCoach : stage.coach;
  els.applyButton.textContent = stage.key === "web" ? "✓ アクセスを確認" : "✓ 設定を適用";
  els.nextStageButton.hidden = !solved || state.stageIndex === stages.length - 1;
  renderSettingsValues();
  renderStepper();
  renderMissions();
  renderDevice();
  renderNetworkState();
  renderLogs();
}

function selectDevice(deviceId) {
  state.selected = deviceId;
  renderDevice();
}

function completeStage() {
  if (stageSolved()) {
    state.completed.add(state.stageIndex);
  } else {
    state.completed.delete(state.stageIndex);
  }
}

function applySettings(event = { preventDefault() {} }) {
  event.preventDefault();
  const stage = currentStage();
  stage.apply();
  completeStage();
  render();
}

function unlockedStageCount() {
  return state.completed.size;
}

function isUnlocked(item) {
  return state.completed.has(item.stage);
}

function renderNoteCard(item, lockedLabel = "未解放") {
  const unlocked = isUnlocked(item);
  return `
    <article class="note-card ${unlocked ? "" : "locked"}">
      <h3>${unlocked ? item.title : lockedLabel}</h3>
      <p>${unlocked ? item.body : "対応するステージをクリアすると追加されます。"}</p>
    </article>
  `;
}

function renderTodayNote() {
  const learned = stages
    .map((stage, index) => ({ stage, index }))
    .filter(({ index }) => state.completed.has(index));

  if (!learned.length) {
    return `<div class="note-card"><h3>まだノートは空です</h3><p>ステージをクリアすると、今回わかったことがここに追加されます。</p></div>`;
  }

  return `<div class="note-grid">${learned.map(({ stage, index }) => `
    <article class="note-card">
      <h3>ステージ${index + 1}</h3>
      <p>${stage.solvedCoach.replace("<br>", " ")} ${stage.point}</p>
    </article>
  `).join("")}</div>`;
}

function renderTermsNote() {
  return `<div class="note-grid">${noteData.terms.map((item) => renderNoteCard(item)).join("")}</div>`;
}

function renderFlowNote() {
  return `<div class="note-flow">${noteData.flow.map((item) => {
    const unlocked = isUnlocked(item);
    return `
      <article class="note-card ${unlocked ? "" : "locked"}">
        <h3>${unlocked ? `ステージ${item.stage + 1}の通信` : "未解放の通信フロー"}</h3>
        <div class="flow-line">${(unlocked ? item.items : ["?", "?", "?"]).map((label, index) => `${index ? "<b>→</b>" : ""}<span>${label}</span>`).join("")}</div>
        <p>${unlocked ? item.body : "対応するステージをクリアすると流れが見えるようになります。"}</p>
      </article>
    `;
  }).join("")}</div>`;
}

function renderMistakesNote() {
  return `<div class="note-grid">${noteData.mistakes.map((item) => renderNoteCard(item)).join("")}</div>`;
}

function renderQuizNote() {
  return `<div class="note-quiz">${noteData.quiz.map((item) => {
    const unlocked = isUnlocked(item);
    return `
      <article class="quiz-item ${unlocked ? "" : "locked"}">
        <strong>${unlocked ? item.q : "未解放の復習問題"}</strong>
        <p>${unlocked ? item.a : "ステージをクリアすると問題と答えが表示されます。"}</p>
      </article>
    `;
  }).join("")}</div>`;
}

function renderNote() {
  els.noteProgress.textContent = `${unlockedStageCount()}/${stages.length}`;
  document.querySelectorAll(".note-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.noteTab === activeNoteTab);
  });

  const renderers = {
    today: renderTodayNote,
    terms: renderTermsNote,
    flow: renderFlowNote,
    mistakes: renderMistakesNote,
    quiz: renderQuizNote
  };
  els.noteContent.innerHTML = renderers[activeNoteTab]();
}

function loadStage(index) {
  state.stageIndex = Math.max(0, Math.min(stages.length - 1, index));
  const stage = currentStage();
  state.selected = stage.selected;
  state.filter = "all";
  stage.setup();
  document.querySelectorAll(".filters button[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });
  render();
}

function nextStage() {
  if (!stageSolved()) return;
  completeStage();
  if (state.stageIndex < stages.length - 1) {
    loadStage(state.stageIndex + 1);
  }
}

function reset() {
  const current = state.stageIndex;
  state.completed.delete(current);
  loadStage(current);
}

document.querySelectorAll(".node").forEach((node) => {
  node.addEventListener("click", () => selectDevice(node.dataset.device));
});

document.querySelectorAll(".filters button[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".filters button[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderLogs();
  });
});

els.stageStepper.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => loadStage(Number(button.dataset.stage)));
});

document.getElementById("settingsForm").addEventListener("submit", applySettings);
document.getElementById("resetMission").addEventListener("click", reset);
document.getElementById("undoButton").addEventListener("click", reset);
document.getElementById("clearLog").addEventListener("click", () => {
  els.packetRows.innerHTML = "";
});
els.nextStageButton.addEventListener("click", nextStage);
els.routeSelect.addEventListener("change", () => selectDevice("router"));
document.getElementById("hintButton").addEventListener("click", () => {
  selectDevice(currentStage().selected);
  els.pointText.textContent = currentStage().point;
});
document.getElementById("noteButton").addEventListener("click", () => {
  renderNote();
  if (typeof els.noteDialog.showModal === "function") {
    els.noteDialog.showModal();
  }
});
document.getElementById("closeNote").addEventListener("click", () => {
  els.noteDialog.close();
});
document.querySelectorAll(".note-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    activeNoteTab = button.dataset.noteTab;
    renderNote();
  });
});
document.getElementById("settingsButton").addEventListener("click", () => selectDevice(currentStage().selected));
document.getElementById("menuButton").addEventListener("click", () => {
  state.filter = "all";
  renderLogs();
});

loadStage(0);

window.__networkLearning = {
  state,
  stages,
  applySettings,
  loadStage,
  nextStage,
  reset,
  render,
  renderNote
};
