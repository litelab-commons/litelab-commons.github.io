const canvas = document.getElementById("canvas");
const wireLayer = document.getElementById("wireLayer");
const logs = document.getElementById("logs");
const stageValue = document.getElementById("stageValue");
const stableValue = document.getElementById("stableValue");
const cableValue = document.getElementById("cableValue");
const modeLabel = document.getElementById("modeLabel");
const stageBadge = document.getElementById("stageBadge");
const missionTitle = document.getElementById("missionTitle");
const missionText = document.getElementById("missionText");
const lessonText = document.getElementById("lessonText");
const checklist = document.getElementById("checklist");
const prevStageBtn = document.getElementById("prevStageBtn");
const nextStageBtn = document.getElementById("nextStageBtn");
const testBtn = document.getElementById("testBtn");
const stormBtn = document.getElementById("stormBtn");
const manualTab = document.getElementById("manualTab");
const dhcpTab = document.getElementById("dhcpTab");
const dhcpFlow = document.getElementById("dhcpFlow");
const selectedName = document.getElementById("selectedName");
const tipText = document.getElementById("tipText");
const devicePopover = document.getElementById("devicePopover");
const devicePopoverClose = document.getElementById("devicePopoverClose");
const devicePhoto = document.getElementById("devicePhoto");
const deviceTypeLabel = document.getElementById("deviceTypeLabel");
const deviceInfoTitle = document.getElementById("deviceInfoTitle");
const deviceInfoText = document.getElementById("deviceInfoText");
const deviceSpecs = document.getElementById("deviceSpecs");
const ipSelect = document.getElementById("ipSelect");
const subnetSelect = document.getElementById("subnetSelect");
const gatewaySelect = document.getElementById("gatewaySelect");
const dnsSelect = document.getElementById("dnsSelect");
const firewallSelect = document.getElementById("firewallSelect");
const routerPanel = document.getElementById("routerPanel");
const routerLanSelect = document.getElementById("routerLanSelect");
const routerWanSelect = document.getElementById("routerWanSelect");
const packetElements = [...document.querySelectorAll(".packet")];
const dnsQueryPacket = document.querySelector(".dns-query");
const dnsReplyPacket = document.querySelector(".dns-reply");
const blockedPacket = document.querySelector(".blocked-packet");

const deviceInfo = {
  pc: {
    label: "Client",
    text: "利用者が操作する端末です。WebアクセスやDNS問い合わせは、ここから始まります。",
    specs: { Role: "通信の送信元", Ports: "1", Example: "Laptop / Desktop" },
    icon: "pc"
  },
  switch: {
    label: "Layer 2",
    text: "同じLANの機器をまとめる装置です。MACアドレスを見て、必要なポートへフレームを流します。",
    specs: { Role: "LANを広げる", Ports: "4", Loop: "発生しうる" },
    icon: "switch"
  },
  server: {
    label: "Server",
    text: "サービスを提供する機器です。このラボではWebページを返すサーバーとして扱います。",
    specs: { Role: "Web応答", Port: "TCP 443", Address: "10.0.0.20 / 192.168.1.20" },
    icon: "server"
  },
  dhcp: {
    label: "Address Service",
    text: "PCへIPアドレス、サブネット、ゲートウェイ、DNSを自動配布します。",
    specs: { Flow: "DORA", Pool: "192.168.1.30-80", Port: "UDP 67/68" },
    icon: "dhcp"
  },
  router: {
    label: "Layer 3",
    text: "異なるネットワーク同士をつなぐ装置です。複数のインターフェイスに別々のIPを持ちます。",
    specs: { LAN: "192.168.1.1/24", Web: "10.0.0.1/24", Role: "経路選択" },
    icon: "router"
  },
  dns: {
    label: "Name Service",
    text: "web.local のような名前を、通信で使うIPアドレスへ変換します。",
    specs: { Record: "web.local", Answer: "10.0.0.20", Port: "UDP 53" },
    icon: "dns"
  },
  firewall: {
    label: "Security",
    text: "通信の宛先、プロトコル、ポート番号を見て、許可または遮断します。",
    specs: { Rule: "TCP 443", Default: "Block", Role: "境界防御" },
    icon: "firewall"
  }
};

const deviceImages = {
  pc: "./assets/pc.png",
  switch: "./assets/switch.png",
  server: "./assets/web-server.png",
  dhcp: "./assets/dhcp.png",
  router: "./assets/router.png",
  dns: "./assets/dns.png",
  firewall: "./assets/firewall.png"
};

const stages = [
  {
    title: "まずはケーブルで同じLANを作ろう",
    text: "PC、Switch-A、Web Serverをケーブルで接続します。アドレスは最初から同じLANにしてあるので、まずは物理的につながる感覚を掴みましょう。",
    lesson: "スイッチは同じLANを広げる機器です。PCとサーバーを同じスイッチにつなぐと、同じネットワーク内で通信できます。",
    intro: "Stage 1: PC、Switch-A、Web Serverを接続して通信テストしてください。",
    criteria: [
      { id: "pcSwitch", label: "PC-1 と Switch-A を接続", test: () => state.connections.has(keyOf("PC-1", "Switch-A")) },
      { id: "switchServer", label: "Switch-A と Web Server を接続", test: () => state.connections.has(keyOf("Switch-A", "Web-Server")) },
      { id: "test", label: "通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      setDeviceConfig("PC-1", "192.168.1.10", 24);
      setDeviceConfig("Web-Server", "192.168.1.20", 24);
      devices["PC-1"].dhcp = false;
    }
  },
  {
    title: "同じLANのIPアドレスを選ぼう",
    text: "線がつながっていても、IPアドレスのネットワークが違うと通信できません。PCとWeb Serverが同じ 192.168.1.x/24 になるように設定してからテストします。",
    lesson: "/24 では 192.168.1.x が同じネットワークです。192.168.2.x や 10.0.0.x は別のネットワークとして扱われます。",
    intro: "Stage 2: Web ServerのIPを直して、同じLANで通信できるようにしてください。",
    criteria: [
      { id: "path", label: "PC-1 から Web Server まで接続", test: () => connected("PC-1", "Web-Server") },
      { id: "sameNetwork", label: "PC-1 と Web Server が同じネットワーク", test: () => sameSubnet(devices["PC-1"], devices["Web-Server"]) },
      { id: "uniqueIp", label: "IPアドレスが重複していない", test: () => uniqueIps("PC-1", "Web-Server", "DHCP") },
      { id: "test", label: "通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-A", "Web-Server");
      setDeviceConfig("PC-1", "192.168.1.10", 24);
      setDeviceConfig("Web-Server", "192.168.2.10", 24);
      devices["PC-1"].dhcp = false;
      state.selected = "Web-Server";
    }
  },
  {
    title: "DHCPでPCにアドレスを配ろう",
    text: "今度はPCのアドレスを手動で選ばず、DHCPサーバーから自動でもらいます。PC、Switch-A、DHCPが同じLANでつながっている必要があります。",
    lesson: "DHCPは Discover、Offer、Request、Ack の流れで、IPアドレス、サブネット、ゲートウェイ、DNSをまとめて配ります。",
    intro: "Stage 3: DHCPをSwitch-Aへ接続し、PC-1でDHCPを実行してください。",
    criteria: [
      { id: "dhcpWire", label: "DHCP と Switch-A を接続", test: () => state.connections.has(keyOf("DHCP", "Switch-A")) },
      { id: "dhcpAssigned", label: "PC-1 がDHCPで 192.168.1.30 を取得", test: () => devices["PC-1"].dhcp && devices["PC-1"].ip === "192.168.1.30" },
      { id: "test", label: "取得後に通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-A", "Web-Server");
      setDeviceConfig("PC-1", "192.168.1.10", 24);
      setDeviceConfig("Web-Server", "192.168.1.20", 24);
      devices["PC-1"].dhcp = false;
      state.selected = "PC-1";
    }
  },
  {
    title: "スイッチのループを直そう",
    text: "スイッチ同士を輪っかにすると、通信が回り続けて不安定になります。ループ例を作って赤い警告を確認し、ケーブルを1本外してから通信テストを成功させましょう。",
    lesson: "スイッチはブロードキャストを転送します。輪っかがあると同じ通信が回り続けるため、現実のネットワークではSTPなどで防ぎます。",
    intro: "Stage 4: ループ例を作る、ケーブルを1本外す、通信テスト成功の順に進めてください。",
    criteria: [
      { id: "loopSeen", label: "ループ発生を一度確認", test: () => state.loopSeen },
      { id: "loopFixed", label: "スイッチ間ループを解消", test: () => state.loopSeen && !hasSwitchLoop() },
      { id: "test", label: "通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-A", "Web-Server");
      setDeviceConfig("PC-1", "192.168.1.10", 24);
      setDeviceConfig("Web-Server", "192.168.1.20", 24);
      devices["PC-1"].dhcp = false;
      state.loopSeen = false;
    }
  },
  {
    level: "中級",
    title: "別ネットワークへルーターで届けよう",
    text: "PC側LANは 192.168.1.x、Web Server側は 10.0.0.x です。違うネットワークへ出るため、ルーターを経由し、PCにデフォルトゲートウェイを設定します。",
    lesson: "同じLAN外へ送る時、PCは宛先へ直接送らずデフォルトゲートウェイへ渡します。ルーターは別ネットワークへの道案内役です。",
    intro: "中級 1: Switch-A、Router、Firewall、Web Serverをつなぎ、PCのゲートウェイを 192.168.1.1 にしてください。",
    criteria: [
      { id: "routerPath", label: "PC-1 から Router 経由で Web Server まで接続", test: () => connected("PC-1", "Web-Server") && connected("PC-1", "Router") },
      { id: "gateway", label: "PC-1 のゲートウェイが Router LAN側", test: () => devices["PC-1"].gateway === routerLanIp() },
      { id: "routerIf", label: "Routerが 192.168.1.1/24 と 10.0.0.1/24 を持つ", test: () => devices.Router.lan === "192.168.1.1/24" && devices.Router.wan === "10.0.0.1/24" },
      { id: "differentNetwork", label: "PC-1 と Web Server は別ネットワーク", test: () => !sameSubnet(devices["PC-1"], devices["Web-Server"]) },
      { id: "test", label: "通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-A", "Router");
      ensureConnection("Router", "Firewall");
      ensureConnection("Firewall", "Web-Server");
      setDeviceConfig("PC-1", "192.168.1.10", 24, "なし", "なし");
      setDeviceConfig("Web-Server", "10.0.0.20", 24);
      devices.Router.lan = "192.168.1.1/24";
      devices.Router.wan = "10.0.0.1/24";
      devices.Firewall.allow443 = true;
      state.selected = "PC-1";
    },
    validate: validateRoutedWeb
  },
  {
    level: "中級",
    title: "DNSで名前を使えるようにしよう",
    text: "IPアドレスでは届く状態から、名前でもアクセスできるようにします。DNSサーバーをLANへ接続し、PCのDNS設定を 192.168.1.53 にしてください。",
    lesson: "DNSは web.local のような名前をIPアドレスへ変換します。通信経路が正しくても、DNS設定がないと名前ではアクセスできません。",
    intro: "中級 2: DNSをSwitch-Aへ接続し、PC-1のDNSを 192.168.1.53 にしてください。",
    criteria: [
      { id: "dnsWire", label: "DNS と Switch-A を接続", test: () => state.connections.has(keyOf("DNS", "Switch-A")) },
      { id: "dnsSet", label: "PC-1 のDNSが 192.168.1.53", test: () => devices["PC-1"].dns === "192.168.1.53" },
      { id: "test", label: "名前解決込みの通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-A", "Router");
      ensureConnection("Router", "Firewall");
      ensureConnection("Firewall", "Web-Server");
      setDeviceConfig("PC-1", "192.168.1.10", 24, "192.168.1.1", "なし");
      setDeviceConfig("Web-Server", "10.0.0.20", 24);
      devices.Firewall.allow443 = true;
      state.selected = "PC-1";
    },
    validate: validateDnsWeb
  },
  {
    level: "中級",
    title: "HTTPSだけファイアウォールで許可しよう",
    text: "最後の関門はファイアウォールです。Web ServerへHTTPSでアクセスするため、Firewallで TCP 443 を許可します。",
    lesson: "ファイアウォールはポート番号を見て通信を通すか止めるか判断します。HTTPSでは一般的に TCP 443 を使います。",
    intro: "中級 3: Firewallを選び、TCP 443を許可して通信テストしてください。",
    criteria: [
      { id: "fwPath", label: "通信経路に Firewall が入っている", test: () => connected("Router", "Firewall") && connected("Firewall", "Web-Server") },
      { id: "fwAllow", label: "Firewall が TCP 443 を許可", test: () => devices.Firewall.allow443 },
      { id: "test", label: "HTTPS通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-A", "Router");
      ensureConnection("Router", "Firewall");
      ensureConnection("Firewall", "Web-Server");
      ensureConnection("DNS", "Switch-A");
      setDeviceConfig("PC-1", "192.168.1.10", 24, "192.168.1.1", "192.168.1.53");
      setDeviceConfig("Web-Server", "10.0.0.20", 24);
      devices.Firewall.allow443 = false;
      state.selected = "Firewall";
    },
    validate: validateDnsWeb
  },
  {
    level: "中級",
    title: "中級まとめ: 社内PCからWebへ",
    text: "配線、ゲートウェイ、DNS、ファイアウォールをまとめて確認します。どこか1つ欠けると通信は止まります。",
    lesson: "別ネットワークのWebへ届くには、物理経路、IP設定、ゲートウェイ、DNS、ファイアウォール許可がそろう必要があります。",
    intro: "中級 4: これまでの設定をそろえて通信テストを成功させてください。",
    criteria: [
      { id: "path", label: "PCからWeb Serverまで経路がある", test: () => connected("PC-1", "Web-Server") },
      { id: "gateway", label: "ゲートウェイがRouter LAN側", test: () => devices["PC-1"].gateway === routerLanIp() },
      { id: "routerIf", label: "Routerの2つのインターフェイスが正しい", test: () => devices.Router.lan === "192.168.1.1/24" && devices.Router.wan === "10.0.0.1/24" },
      { id: "dns", label: "DNSが正しい", test: () => devices["PC-1"].dns === "192.168.1.53" },
      { id: "fw", label: "FirewallがTCP 443を許可", test: () => devices.Firewall.allow443 },
      { id: "test", label: "通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-A", "Router");
      ensureConnection("Router", "Firewall");
      ensureConnection("Firewall", "Web-Server");
      ensureConnection("DNS", "Switch-A");
      setDeviceConfig("PC-1", "192.168.1.10", 24, "なし", "なし");
      setDeviceConfig("Web-Server", "10.0.0.20", 24);
      devices.Firewall.allow443 = false;
      state.selected = "PC-1";
    },
    validate: validateDnsWeb
  },
  {
    level: "上級",
    title: "冗長経路をループなしで残そう",
    text: "スイッチを複数使うと障害に強くできますが、輪っかを作ると通信が不安定になります。ループを一度確認し、1本だけ外して通信できる経路を残します。",
    lesson: "冗長化では、つながっていることと輪っかになっていないことを同時に満たす必要があります。現実ではSTPなどが、この整理を自動化します。",
    intro: "上級 1: ループ例を作り、Switch-A と Switch-C の直結を外してから通信テストしてください。",
    criteria: [
      { id: "loopSeen", label: "ループ発生を一度確認", test: () => state.loopSeen },
      { id: "path", label: "Switch-B 経由でPCからWeb Serverまで届く", test: () => connected("PC-1", "Web-Server") && state.connections.has(keyOf("Switch-A", "Switch-B")) && state.connections.has(keyOf("Switch-B", "Switch-C")) },
      { id: "loopFixed", label: "スイッチ間ループが残っていない", test: () => !hasSwitchLoop() },
      { id: "test", label: "通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-C", "Web-Server");
      setDeviceConfig("PC-1", "192.168.1.10", 24);
      setDeviceConfig("Web-Server", "192.168.1.20", 24);
      devices["PC-1"].dhcp = false;
      state.loopSeen = false;
    },
    validate: validateAdvancedLan
  },
  {
    level: "上級",
    title: "ルーターのWeb側を切り分けよう",
    text: "物理経路とPCのゲートウェイが正しくても、ルーターのWeb側インターフェイスが違うネットワークだと届きません。Router設定を確認して直します。",
    lesson: "経路の切り分けでは、PCのデフォルトゲートウェイ、ルーターの両側インターフェイス、サーバー側ネットワークを分けて確認します。",
    intro: "上級 2: RouterのWeb側とPCのゲートウェイを正しく設定して通信テストしてください。",
    criteria: [
      { id: "gateway", label: "PC-1 のゲートウェイが Router LAN側", test: () => devices["PC-1"].gateway === routerLanIp() },
      { id: "routerWan", label: "Router Web側が 10.0.0.1/24", test: () => devices.Router.wan === "10.0.0.1/24" },
      { id: "path", label: "Router経由でWeb Serverまで経路がある", test: () => connected("PC-1", "Web-Server") && connected("PC-1", "Router") },
      { id: "test", label: "通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-A", "Router");
      ensureConnection("Router", "Firewall");
      ensureConnection("Firewall", "Web-Server");
      setDeviceConfig("PC-1", "192.168.1.10", 24, "なし", "なし");
      setDeviceConfig("Web-Server", "10.0.0.20", 24);
      devices.Router.lan = "192.168.1.1/24";
      devices.Router.wan = "172.16.0.1/24";
      devices.Firewall.allow443 = true;
      state.selected = "Router";
    },
    validate: validateRoutedWeb
  },
  {
    level: "上級",
    title: "総合障害をまとめて直そう",
    text: "最後は、経路、ゲートウェイ、DNS、ファイアウォールをまとめて確認します。通信が止まる原因を順番に潰して、名前解決込みでWebへ届けます。",
    lesson: "ネットワーク障害は、線、IP、経路、名前解決、フィルタのどこで止まっているかを分けると見通しがよくなります。",
    intro: "上級 3: ゲートウェイ、DNS、Firewallをそろえて通信テストしてください。",
    criteria: [
      { id: "path", label: "PCからWeb Serverまで経路がある", test: () => connected("PC-1", "Web-Server") },
      { id: "gateway", label: "ゲートウェイがRouter LAN側", test: () => devices["PC-1"].gateway === routerLanIp() },
      { id: "dnsWire", label: "DNS と Switch-A が接続済み", test: () => state.connections.has(keyOf("DNS", "Switch-A")) },
      { id: "dns", label: "DNSが正しい", test: () => devices["PC-1"].dns === "192.168.1.53" },
      { id: "fw", label: "FirewallがTCP 443を許可", test: () => devices.Firewall.allow443 },
      { id: "test", label: "通信テスト成功", test: () => state.testOk }
    ],
    setup: () => {
      ensureConnection("PC-1", "Switch-A");
      ensureConnection("Switch-A", "Router");
      ensureConnection("Router", "Firewall");
      ensureConnection("Firewall", "Web-Server");
      ensureConnection("DNS", "Switch-A");
      setDeviceConfig("PC-1", "192.168.1.10", 24, "なし", "なし");
      setDeviceConfig("Web-Server", "10.0.0.20", 24);
      devices.Router.lan = "192.168.1.1/24";
      devices.Router.wan = "10.0.0.1/24";
      devices.Firewall.allow443 = false;
      state.selected = "PC-1";
    },
    validate: validateDnsWeb
  }
];

const devices = {
  "PC-1": { type: "pc", ports: 1, x: 10, y: 54, ip: "192.168.1.10", subnet: 24, gateway: "なし", dns: "なし", dhcp: false },
  "Switch-A": { type: "switch", ports: 4, x: 42, y: 45 },
  "Switch-B": { type: "switch", ports: 4, x: 45, y: 70 },
  "Switch-C": { type: "switch", ports: 4, x: 62, y: 70 },
  "Web-Server": { type: "server", ports: 1, x: 78, y: 54, ip: "192.168.1.20", subnet: 24, gateway: "なし", dns: "なし", dhcp: false },
  DHCP: { type: "dhcp", ports: 1, x: 69, y: 24, ip: "192.168.1.54", subnet: 24, gateway: "なし", dns: "なし", dhcp: false },
  Router: { type: "router", ports: 4, x: 54, y: 42, lan: "192.168.1.1/24", wan: "10.0.0.1/24" },
  DNS: { type: "dns", ports: 1, x: 34, y: 22, ip: "192.168.1.53", subnet: 24, gateway: "なし", dns: "なし", dhcp: false },
  Firewall: { type: "firewall", ports: 2, x: 68, y: 42, allow443: false }
};

const spawnZones = {
  "PC-1": { x: [8, 24], y: [30, 72] },
  "Switch-A": { x: [34, 52], y: [28, 60] },
  "Switch-B": { x: [32, 56], y: [62, 84] },
  "Switch-C": { x: [55, 74], y: [62, 84] },
  "Web-Server": { x: [74, 91], y: [36, 76] },
  DHCP: { x: [58, 82], y: [14, 34] },
  Router: { x: [48, 60], y: [34, 56] },
  DNS: { x: [26, 44], y: [14, 34] },
  Firewall: { x: [64, 76], y: [34, 58] }
};

const state = {
  stageIndex: 0,
  selected: "PC-1",
  pendingCable: "",
  connections: new Set(),
  stable: 100,
  testOk: false,
  loopSeen: false,
  beginnerCleared: false,
  drag: null,
  suppressClick: false,
  packetLoop: false,
  pendingWebAfterDns: false,
  packetTimers: [],
  packetAnimations: []
};

const keyOf = (a, b) => [a, b].sort().join("|");
const randomBetween = (min, max) => Math.random() * (max - min) + min;

function setDeviceConfig(id, ip, subnet, gateway = "なし", dns = "なし") {
  devices[id].ip = ip;
  devices[id].subnet = subnet;
  devices[id].gateway = gateway;
  devices[id].dns = dns;
}

function ensureConnection(a, b) {
  state.connections.add(keyOf(a, b));
}

function addLog(kind, text, bad = false) {
  const entry = document.createElement("p");
  entry.className = bad ? "bad" : "";
  entry.innerHTML = `<span>${kind}</span>${text}`;
  logs.prepend(entry);
}

function clearModes() {
  canvas.classList.remove("testing", "storm");
  dhcpFlow.classList.remove("run");
  stopPacketExchange();
}

function setStable(value) {
  state.stable = Math.max(0, Math.min(100, value));
  stableValue.textContent = `${state.stable}%`;
}

function selectDevice(id) {
  state.selected = id;
  selectedName.textContent = id;
  renderSettings();

  if (!state.pendingCable) {
    state.pendingCable = id;
    addLog("CABLE", `${id} を選択。接続先を選んでください。`);
  } else if (state.pendingCable === id) {
    state.pendingCable = "";
    addLog("CABLE", "ケーブル選択を解除しました。");
  } else {
    toggleConnection(state.pendingCable, id);
    state.pendingCable = "";
  }
  updateDeviceClasses();
}

function toggleConnection(a, b) {
  const key = keyOf(a, b);
  if (state.connections.has(key)) {
    state.connections.delete(key);
    addLog("UNPLUG", `${a} と ${b} のケーブルを外しました。`);
  } else {
    const blocked = [a, b].find((id) => usedPorts(id) >= devices[id].ports);
    if (blocked) {
      addLog("PORT", `${blocked} の空きポートがありません。先に別のケーブルを外してください。`, true);
      return;
    }
    state.connections.add(key);
    addLog("PLUG", `${a} と ${b} をケーブルで接続しました。`);
  }
  state.testOk = false;
  clearModes();
  if (hasSwitchLoop()) state.loopSeen = true;
  render();
}

function usedPorts(id) {
  let count = 0;
  for (const key of state.connections) {
    if (key.split("|").includes(id)) count += 1;
  }
  return count;
}

function neighbors(id, switchOnly = false) {
  const list = [];
  for (const key of state.connections) {
    const [a, b] = key.split("|");
    if (a === id && (!switchOnly || devices[b].type === "switch")) list.push(b);
    if (b === id && (!switchOnly || devices[a].type === "switch")) list.push(a);
  }
  return list;
}

function connected(from, to, allowTypes = null) {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const current = queue.shift();
    if (current === to) return true;
    for (const next of neighbors(current)) {
      if (seen.has(next)) continue;
      if (allowTypes && !allowTypes.includes(devices[next].type) && next !== to) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return false;
}

function shortestPath(from, to, allowTypes = null) {
  const seen = new Set([from]);
  const queue = [[from]];
  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];
    if (current === to) return path;
    for (const next of neighbors(current)) {
      if (seen.has(next)) continue;
      if (allowTypes && !allowTypes.includes(devices[next].type) && next !== to) continue;
      seen.add(next);
      queue.push([...path, next]);
    }
  }
  return [];
}

function ipToNumber(ip) {
  return ip.split(".").reduce((total, octet) => (total << 8) + Number(octet), 0) >>> 0;
}

function sameSubnet(a, b) {
  const bits = Math.min(a.subnet, b.subnet);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipToNumber(a.ip) & mask) === (ipToNumber(b.ip) & mask);
}

function uniqueIps(...ids) {
  const ips = ids.map((id) => devices[id].ip).filter(Boolean);
  return new Set(ips).size === ips.length;
}

function validateDirectLan() {
  if (!connected("PC-1", "Web-Server")) {
    return "PC-1 から Web Server までケーブル経路がつながっていません。";
  }
  if (!sameSubnet(devices["PC-1"], devices["Web-Server"])) {
    return "IPアドレスが同じネットワークではありません。今回は 192.168.1.x/24 同士にしましょう。";
  }
  if (!uniqueIps("PC-1", "Web-Server", "DHCP", "DNS")) {
    return "IPアドレスが重複しています。同じLAN内では、各機器に別々のIPアドレスが必要です。";
  }
  return "";
}

function validateAdvancedLan() {
  const directError = validateDirectLan();
  if (directError) return directError;
  if (!state.loopSeen) {
    return "まずループ例を作って、スイッチ間ループが起きる状態を確認してください。";
  }
  if (hasSwitchLoop()) {
    return "まだスイッチ間ループが残っています。Switch-A と Switch-C の直結など、1本外して輪をほどいてください。";
  }
  if (!state.connections.has(keyOf("Switch-A", "Switch-B")) || !state.connections.has(keyOf("Switch-B", "Switch-C"))) {
    return "Switch-B を通る経路を残してください。Switch-A、Switch-B、Switch-C の順につながっている必要があります。";
  }
  return "";
}

function validateRoutedWeb() {
  if (!connected("PC-1", "Web-Server")) {
    return "PC-1 から Web Server まで物理経路がつながっていません。";
  }
  if (!connected("PC-1", "Router")) {
    return "別ネットワークへ出るためのRouterまで届いていません。";
  }
  if (sameSubnet(devices["PC-1"], devices["Web-Server"])) {
    return "このステージではPC側とサーバー側を別ネットワークにして、ルーター経由にしましょう。";
  }
  if (devices.Router.lan !== "192.168.1.1/24" || devices.Router.wan !== "10.0.0.1/24") {
    return "RouterのLAN側を 192.168.1.1/24、Web側を 10.0.0.1/24 に設定してください。";
  }
  if (devices["PC-1"].gateway !== routerLanIp()) {
    return `PC-1のデフォルトゲートウェイを Router LAN側の ${routerLanIp()} に設定してください。`;
  }
  if (!uniqueIps("PC-1", "Web-Server", "DHCP", "DNS")) {
    return "IPアドレスが重複しています。各機器に別々のIPアドレスが必要です。";
  }
  return "";
}

function routerLanIp() {
  return devices.Router.lan.split("/")[0];
}

function validateDnsWeb() {
  const routedError = validateRoutedWeb();
  if (routedError) return routedError;
  if (!state.connections.has(keyOf("DNS", "Switch-A"))) {
    return "名前でアクセスするには、DNSをSwitch-Aへ接続してください。";
  }
  if (devices["PC-1"].dns !== "192.168.1.53") {
    return "PC-1のDNSを 192.168.1.53 に設定してください。";
  }
  if (!devices.Firewall.allow443) {
    return "FirewallでTCP 443が止まっています。HTTPSを通すにはTCP 443を許可してください。";
  }
  return "";
}

function hasSwitchLoop() {
  const switchIds = Object.entries(devices)
    .filter(([, device]) => device.type === "switch")
    .map(([id]) => id);
  const seen = new Set();

  function visit(id, parent) {
    seen.add(id);
    for (const next of neighbors(id, true)) {
      if (next === parent) continue;
      if (seen.has(next)) return true;
      if (visit(next, id)) return true;
    }
    return false;
  }

  return switchIds.some((id) => !seen.has(id) && visit(id, ""));
}

function pathData(a, b) {
  const from = devices[a];
  const to = devices[b];
  const ax = from.x * 9;
  const ay = from.y * 5.6;
  const bx = to.x * 9;
  const by = to.y * 5.6;
  const lift = Math.abs(ax - bx) * 0.12 + 16;
  const c1x = ax + (bx - ax) * 0.36;
  const c2x = ax + (bx - ax) * 0.64;
  const c1y = ay - lift;
  const c2y = by - lift;
  return `M${ax} ${ay} C${c1x} ${c1y} ${c2x} ${c2y} ${bx} ${by}`;
}

function renderWires() {
  wireLayer.innerHTML = "";
  const loop = hasSwitchLoop();
  const route = state.testOk ? shortestPath("PC-1", "Web-Server") : [];
  const dnsRoute = state.testOk && stages[state.stageIndex].validate === validateDnsWeb ? shortestPath("PC-1", "DNS", ["pc", "switch", "dns"]) : [];
  const routeKeys = new Set(route.slice(0, -1).map((id, index) => keyOf(id, route[index + 1])));
  const dnsRouteKeys = new Set(dnsRoute.slice(0, -1).map((id, index) => keyOf(id, dnsRoute[index + 1])));
  for (const key of state.connections) {
    const [a, b] = key.split("|");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const bothSwitches = devices[a].type === "switch" && devices[b].type === "switch";
    const stateClass = loop && bothSwitches ? "loop" : dnsRouteKeys.has(key) ? "dns-good" : routeKeys.has(key) ? "good" : "live";
    path.setAttribute("class", `wire ${stateClass}`);
    path.setAttribute("d", pathData(a, b));
    wireLayer.append(path);
  }
}

function updateDeviceClasses() {
  const visible = visibleDevicesForStage();
  document.querySelectorAll(".device").forEach((device) => {
    const id = device.dataset.device;
    device.classList.toggle("hidden", !visible.has(id));
    device.classList.toggle("selected", id === state.selected);
    device.classList.toggle("pending", id === state.pendingCable);
    device.classList.toggle("dragging", state.drag?.id === id);
  });
}

function visibleDevicesForStage() {
  const base = ["PC-1", "Switch-A", "Web-Server"];
  if (state.stageIndex === 2) return new Set([...base, "DHCP"]);
  if (state.stageIndex === 3) return new Set([...base, "Switch-B", "Switch-C"]);
  if ((stages[state.stageIndex].level || "初級") === "上級") {
    return new Set([...base, "Switch-B", "Switch-C", "Router", "Firewall", "DNS"]);
  }
  if ((stages[state.stageIndex].level || "初級") === "中級") {
    return new Set([...base, "Router", "Firewall", "DNS"]);
  }
  return new Set(base);
}

function positionDeviceElement(id) {
  const button = document.querySelector(`.device[data-device="${id}"]`);
  if (!button) return;
  button.style.left = `${devices[id].x}%`;
  button.style.top = `${devices[id].y}%`;
}

function showDeviceInfo(id) {
  const device = devices[id];
  const info = deviceInfo[device.type];
  if (!info) return;
  state.pendingCable = "";
  selectedName.textContent = id;
  state.selected = id;
  renderSettings();
  updateDeviceClasses();

  const liveSpecs = { ...info.specs };
  if (device.ip) liveSpecs.IP = `${device.ip}/${device.subnet}`;
  if (device.type === "router") {
    liveSpecs.LAN = device.lan;
    liveSpecs.Web = device.wan;
  }
  if (device.type === "firewall") {
    liveSpecs.Rule = device.allow443 ? "TCP 443 allow" : "TCP 443 block";
  }
  if (device.ports) liveSpecs.Used = `${usedPorts(id)}/${device.ports} ports`;

  deviceTypeLabel.textContent = info.label;
  deviceInfoTitle.textContent = id;
  deviceInfoText.textContent = info.text;
  devicePhoto.innerHTML = `<img src="${deviceImages[info.icon]}" alt="">`;
  deviceSpecs.innerHTML = Object.entries(liveSpecs)
    .map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`)
    .join("");

  const x = Math.min(70, Math.max(2, device.x + 3));
  const y = Math.min(70, Math.max(4, device.y - 8));
  devicePopover.style.left = `${x}%`;
  devicePopover.style.top = `${y}%`;
  devicePopover.classList.add("visible");
  addLog("INFO", `${id} の機器情報を表示。`);
}

function devicePhotoSvg(type) {
  const icons = {
    pc: `<svg viewBox="0 0 96 96"><rect x="18" y="18" width="60" height="42" rx="5"></rect><path d="M40 72h16M48 60v12"></path><path d="M26 26h44"></path></svg>`,
    switch: `<svg viewBox="0 0 96 96"><rect x="15" y="30" width="66" height="32" rx="5"></rect><path d="M25 43h7M40 43h7M55 43h7M70 43h7M28 62v10M48 62v10M68 62v10"></path></svg>`,
    server: `<svg viewBox="0 0 96 96"><rect x="26" y="12" width="44" height="72" rx="5"></rect><path d="M36 28h24M36 44h24M36 60h16"></path><path d="M61 70h.1"></path></svg>`,
    dhcp: `<svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="14"></circle><path d="M48 14v20M48 62v20M14 48h20M62 48h20M28 24l10 12M68 24L58 36M28 72l10-12M68 72L58 60"></path></svg>`,
    router: `<svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="24"></circle><path d="M48 24v48M24 48h48M33 33L20 20M63 33l13-13M33 63L20 76M63 63l13 13"></path></svg>`,
    dns: `<svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="30"></circle><path d="M18 48h60M48 18c10 10 10 50 0 60M48 18c-10 10-10 50 0 60"></path></svg>`,
    firewall: `<svg viewBox="0 0 96 96"><path d="M48 12l30 12v22c0 22-12 34-30 40C30 80 18 68 18 46V24l30-12z"></path><path d="M36 48l9 9 17-22"></path></svg>`
  };
  return icons[type] || icons.pc;
}

function randomizeDevicePositions() {
  Object.entries(spawnZones).forEach(([id, zone]) => {
    devices[id].x = Number(randomBetween(zone.x[0], zone.x[1]).toFixed(1));
    devices[id].y = Number(randomBetween(zone.y[0], zone.y[1]).toFixed(1));
    positionDeviceElement(id);
  });
}

function canvasPercentFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(6, Math.min(94, ((event.clientX - rect.left) / rect.width) * 100)),
    y: Math.max(10, Math.min(90, ((event.clientY - rect.top) / rect.height) * 100))
  };
}

function startDrag(event, id) {
  if (event.button !== 0) return;
  const point = canvasPercentFromEvent(event);
  state.drag = {
    id,
    startClientX: event.clientX,
    startClientY: event.clientY,
    offsetX: point.x - devices[id].x,
    offsetY: point.y - devices[id].y,
    moved: false
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  updateDeviceClasses();
}

function moveDrag(event) {
  if (!state.drag) return;
  const drag = state.drag;
  const distance = Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY);
  if (distance > 4) drag.moved = true;
  if (!drag.moved) return;

  const point = canvasPercentFromEvent(event);
  devices[drag.id].x = point.x - drag.offsetX;
  devices[drag.id].y = point.y - drag.offsetY;
  devices[drag.id].x = Math.max(6, Math.min(94, devices[drag.id].x));
  devices[drag.id].y = Math.max(10, Math.min(90, devices[drag.id].y));
  positionDeviceElement(drag.id);
  renderWires();
  setPacketRoute();
}

function endDrag(event) {
  if (!state.drag) return;
  const wasMoved = state.drag.moved;
  state.drag = null;
  if (wasMoved) {
    state.suppressClick = true;
    addLog("MOVE", `${event.currentTarget.dataset.device} を移動。ケーブルも追従しました。`);
    window.setTimeout(() => {
      state.suppressClick = false;
    }, 0);
  }
  updateDeviceClasses();
}

function renderDeviceLabels() {
  document.querySelectorAll(".device").forEach((button) => {
    const id = button.dataset.device;
    const small = button.querySelector("small");
    const device = devices[id];
  if (device.ip) {
    small.textContent = device.dhcp ? `${device.ip} via DHCP` : device.ip;
    } else if (device.type === "switch") {
      small.textContent = `${usedPorts(id)}/${device.ports} ports`;
    } else if (device.type === "router") {
      small.textContent = `${device.lan} | ${device.wan}`;
    } else if (device.type === "firewall") {
      small.textContent = device.allow443 ? "TCP 443 allow" : "TCP 443 block";
    }
  });
}

function renderSettings() {
  const device = devices[state.selected];
  selectedName.textContent = state.selected;
  const configurable = Boolean(device.ip);
  ipSelect.disabled = !configurable || device.dhcp;
  subnetSelect.disabled = !configurable || device.dhcp;
  gatewaySelect.disabled = !configurable || device.dhcp;
  dnsSelect.disabled = !configurable || device.dhcp;
  firewallSelect.disabled = device.type !== "firewall";
  routerPanel.classList.toggle("visible", device.type === "router");
  routerLanSelect.value = devices.Router.lan;
  routerWanSelect.value = devices.Router.wan;
  manualTab.disabled = !configurable;
  dhcpTab.disabled = device.type !== "pc";

  if (!configurable) {
    ipSelect.value = "192.168.1.10";
    subnetSelect.value = "/24 - 255.255.255.0";
    gatewaySelect.value = "なし";
    dnsSelect.value = "なし";
    firewallSelect.value = devices.Firewall.allow443 ? "TCP 443 を許可" : "TCP 443 を遮断";
    return;
  }

  ensureSelectOption(ipSelect, device.ip);
  ensureSelectOption(gatewaySelect, device.gateway);
  ensureSelectOption(dnsSelect, device.dns);
  ipSelect.value = device.ip;
  subnetSelect.value = `/${device.subnet} - ${subnetText(device.subnet)}`;
  gatewaySelect.value = device.gateway;
  dnsSelect.value = device.dns;
  firewallSelect.value = devices.Firewall.allow443 ? "TCP 443 を許可" : "TCP 443 を遮断";
  manualTab.classList.toggle("active", !device.dhcp);
  dhcpTab.classList.toggle("active", device.dhcp);
}

function ensureSelectOption(select, value) {
  if (!value) return;
  const exists = [...select.options].some((option) => option.value === value);
  if (exists) return;
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  select.append(option);
}

function subnetText(bits) {
  if (bits === 16) return "255.255.0.0";
  if (bits === 30) return "point to point";
  return "255.255.255.0";
}

function updateSettingsFromPanel() {
  const device = devices[state.selected];
  if (device.type === "router") {
    devices.Router.lan = routerLanSelect.value;
    devices.Router.wan = routerWanSelect.value;
    state.testOk = false;
    clearModes();
    render();
    addLog("SET", `Router を LAN:${devices.Router.lan} / Web:${devices.Router.wan} に設定。`);
    return;
  }
  if (device.type === "firewall") {
    devices.Firewall.allow443 = firewallSelect.value !== "TCP 443 を遮断";
    state.testOk = false;
    clearModes();
    render();
    addLog("SET", `Firewall を ${firewallSelect.value} に設定。`);
    return;
  }
  if (!device.ip || device.dhcp) return;
  device.ip = ipSelect.value;
  device.subnet = Number(subnetSelect.value.match(/\/(\d+)/)[1]);
  device.gateway = gatewaySelect.value;
  device.dns = dnsSelect.value;
  state.testOk = false;
  clearModes();
  render();
  addLog("SET", `${state.selected} を ${device.ip}/${device.subnet} に設定。`);
}

function updateChecklist() {
  const stage = stages[state.stageIndex];
  checklist.innerHTML = "";
  for (const criterion of stage.criteria) {
    const label = document.createElement("label");
    const checked = criterion.test();
    label.innerHTML = `<input type="checkbox" disabled ${checked ? "checked" : ""}> ${criterion.label}`;
    checklist.append(label);
  }
  nextStageBtn.disabled = !stageComplete();
  prevStageBtn.disabled = state.stageIndex === 0;
}

function stageComplete() {
  return stages[state.stageIndex].criteria.every((criterion) => criterion.test());
}

function levelStageInfo() {
  const stage = stages[state.stageIndex];
  const level = stage.level || "初級";
  const levelStages = stages.filter((item) => (item.level || "初級") === level);
  const levelIndex = levelStages.indexOf(stage);
  return { level, levelIndex, levelStages };
}

function updateCableCount() {
  cableValue.textContent = `${state.connections.size}本`;
}

function setPacketRoute() {
  const pc = devices["PC-1"];
  const route = shortestPath("PC-1", "Web-Server");
  const midpoint = route.length > 2 ? devices[route[Math.floor(route.length / 2)]] : null;
  const sw = midpoint || (sameSubnet(devices["PC-1"], devices["Web-Server"]) ? devices["Switch-A"] : devices.Router);
  const server = devices["Web-Server"];
  const dns = devices.DNS;
  canvas.style.setProperty("--packet-start-x", `${pc.x}%`);
  canvas.style.setProperty("--packet-start-y", `${pc.y}%`);
  canvas.style.setProperty("--packet-mid-x", `${sw.x}%`);
  canvas.style.setProperty("--packet-mid-y", `${sw.y}%`);
  canvas.style.setProperty("--packet-end-x", `${server.x}%`);
  canvas.style.setProperty("--packet-end-y", `${server.y}%`);
  canvas.style.setProperty("--dns-x", `${dns.x}%`);
  canvas.style.setProperty("--dns-y", `${dns.y}%`);
}

function setStormRoute() {
  const a = devices["Switch-A"];
  const b = devices["Switch-B"];
  const c = devices["Switch-C"];
  canvas.style.setProperty("--storm-a-x", `${a.x}%`);
  canvas.style.setProperty("--storm-a-y", `${a.y}%`);
  canvas.style.setProperty("--storm-b-x", `${b.x}%`);
  canvas.style.setProperty("--storm-b-y", `${b.y}%`);
  canvas.style.setProperty("--storm-c-x", `${c.x}%`);
  canvas.style.setProperty("--storm-c-y", `${c.y}%`);
}

function restartAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function startPacketExchange(clear = true) {
  state.packetLoop = true;
  state.pendingWebAfterDns = false;
  if (clear) stopPacketAnimations();
  launchExchange(".packet-one", ".reply-one");
  state.packetTimers.push(window.setTimeout(() => launchExchange(".packet-two", ".reply-two"), 520));
}

function startDnsThenWebExchange() {
  state.packetLoop = true;
  state.pendingWebAfterDns = true;
  stopPacketAnimations();
  const queryPath = shortestPath("PC-1", "DNS", ["pc", "switch", "dns"]);
  if (!queryPath.length) return;
  state.packetTimers.push(window.setTimeout(() => launchExchange(".packet-one", ".reply-one"), 260));
  animatePacketAlong(dnsQueryPacket, queryPath, 820, () => {
    if (!state.packetLoop) return;
    animatePacketAlong(dnsReplyPacket, [...queryPath].reverse(), 820, () => {
      if (!state.packetLoop) return;
      state.pendingWebAfterDns = false;
      addLog("DNS", "DNS Replyで web.local = 10.0.0.20 を受け取りました。");
      startPacketExchange(false);
    });
  });
}

function stopPacketExchange() {
  state.packetLoop = false;
  state.pendingWebAfterDns = false;
  state.packetTimers.forEach((timer) => window.clearTimeout(timer));
  state.packetTimers = [];
  state.packetAnimations.forEach((animation) => {
    animation.cancelled = true;
    window.cancelAnimationFrame(animation.frameId);
  });
  state.packetAnimations = [];
  stopPacketAnimations();
}

function stopPacketAnimations() {
  packetElements.forEach((packet) => packet.classList.remove("requesting", "replying", "dns-requesting", "dns-answering", "blocked-stop"));
  packetElements.forEach((packet) => {
    packet.style.opacity = "0";
    packet.style.removeProperty("left");
    packet.style.removeProperty("top");
  });
}

function showFirewallBlock() {
  const route = shortestPath("PC-1", "Firewall");
  if (!route.length) return;
  state.packetLoop = true;
  animatePacketAlong(blockedPacket, route, Math.max(760, route.length * 300), () => {
    state.packetLoop = false;
    blockedPacket.classList.add("blocked-stop");
    blockedPacket.style.opacity = "1";
    blockedPacket.style.left = `${devices.Firewall.x}%`;
    blockedPacket.style.top = `${devices.Firewall.y}%`;
    state.packetTimers.push(window.setTimeout(() => {
      blockedPacket.classList.remove("blocked-stop");
      blockedPacket.style.opacity = "0";
    }, 1500));
  });
}

function launchExchange(requestSelector, replySelector) {
  if (!state.packetLoop) return;
  const request = document.querySelector(requestSelector);
  const reply = document.querySelector(replySelector);
  const route = shortestPath("PC-1", "Web-Server");
  if (!route.length) {
    addLog("TRACE", "パケット経路を計算できませんでした。配線を確認してください。", true);
    return;
  }
  const duration = Math.max(1300, route.length * 460);
  animatePacketAlong(request, route, duration, () => {
    if (!state.packetLoop) return;
    animatePacketAlong(reply, [...route].reverse(), duration, () => {
      if (!state.packetLoop) return;
      state.packetTimers.push(window.setTimeout(() => launchExchange(requestSelector, replySelector), 620));
    });
  });
}

function animatePacketAlong(packet, route, duration, onDone) {
  const points = route.map((id) => ({ x: devices[id].x, y: devices[id].y }));
  if (points.length < 2) {
    onDone?.();
    return;
  }

  const started = performance.now();
  const animation = { cancelled: false, frameId: 0 };
  state.packetAnimations.push(animation);
  packet.style.left = `${points[0].x}%`;
  packet.style.top = `${points[0].y}%`;
  packet.style.opacity = "1";

  function frame(now) {
    if (!state.packetLoop || animation.cancelled) {
      packet.style.opacity = "0";
      return;
    }

    const progress = Math.min(1, (now - started) / duration);
    const scaled = progress * (points.length - 1);
    const index = Math.min(points.length - 2, Math.floor(scaled));
    const local = scaled - index;
    const from = points[index];
    const to = points[index + 1];
    packet.style.left = `${from.x + (to.x - from.x) * local}%`;
    packet.style.top = `${from.y + (to.y - from.y) * local}%`;
    packet.style.opacity = progress < 0.01 || progress > 0.99 ? "0" : "1";

    if (progress < 1) {
      animation.frameId = window.requestAnimationFrame(frame);
    } else {
      packet.style.opacity = "0";
      state.packetAnimations = state.packetAnimations.filter((item) => item !== animation);
      onDone?.();
    }
  }

  animation.frameId = window.requestAnimationFrame(frame);
}

function render() {
  const stage = stages[state.stageIndex];
  const { level, levelIndex, levelStages } = levelStageInfo();
  document.querySelectorAll(".difficulty button").forEach((button) => {
    button.classList.toggle("active", button.textContent.trim() === level);
  });
  const displayIndex = levelIndex + 1;
  stageValue.textContent = `${displayIndex}/${levelStages.length}`;
  stageBadge.textContent = `${level} ${displayIndex}`;
  missionTitle.textContent = stage.title;
  missionText.textContent = stage.text;
  lessonText.textContent = stage.lesson;
  renderWires();
  renderDeviceLabels();
  renderSettings();
  updateDeviceClasses();
  updateChecklist();
  updateCableCount();
  setPacketRoute();
  setStormRoute();
  const isLastLevelStage = levelIndex === levelStages.length - 1;
  nextStageBtn.textContent = isLastLevelStage ? `${level}クリア` : "次へ";
  canvas.classList.toggle("storm", hasSwitchLoop());
  if (hasSwitchLoop()) {
    modeLabel.textContent = "loop detected";
    tipText.textContent = "スイッチ同士が輪になっています。ケーブルを1本外すとループが止まります。";
  } else if (state.beginnerCleared) {
    modeLabel.textContent = "beginner clear";
    tipText.textContent = "中級クリアです。次は冗長化、STP、コスト制限を入れる上級へ広げられます。";
  } else if (stageComplete() && isLastLevelStage) {
    tipText.textContent = `${level}の全ミッション達成です。「${level}クリア」を押して完了しましょう。`;
  } else if (stageComplete()) {
    tipText.textContent = "ステージ成功です。左の「次へ」で次のミッションへ進めます。";
  } else {
    tipText.textContent = "Cableモードで機器を2つ選ぶと、ケーブルを接続または解除できます。";
  }
}

function fail(text) {
  state.testOk = false;
  clearModes();
  setStable(state.stable - 12);
  modeLabel.textContent = "failed";
  addLog("NG", text, true);
  if (text.includes("Firewall") && text.includes("TCP 443")) {
    showFirewallBlock();
  }
  render();
}

function runTest() {
  clearModes();
  if (hasSwitchLoop()) {
    fail("ループがあるため通信が不安定です。スイッチ間のケーブルを1本外してください。");
    return;
  }
  const stage = stages[state.stageIndex];
  const error = stage.validate ? stage.validate() : validateDirectLan();
  if (error) {
    fail(error);
    return;
  }

  state.testOk = true;
  setStable(Math.min(100, state.stable + 5));
  modeLabel.textContent = "packet flow";
  canvas.classList.add("testing");
  if (stage.validate === validateDnsWeb) {
    startDnsThenWebExchange();
    addLog("DNS", "青いDNS Queryで web.local を名前解決してから、Web通信を開始します。");
  } else {
    startPacketExchange();
    addLog("OK", "黄色のEcho Requestが到達し、紫のEcho ReplyがPC-1へ戻りました。");
  }
  render();
}

function runDhcp() {
  state.selected = "PC-1";
  const pc = devices["PC-1"];
  clearModes();
  if (!connected("PC-1", "DHCP", ["pc", "switch", "dhcp"])) {
    fail("DHCP Discover がDHCPサーバーへ届きません。PC、Switch、DHCPを同じLANで接続してください。");
    renderSettings();
    return;
  }

  pc.dhcp = true;
  pc.ip = "192.168.1.30";
  pc.subnet = 24;
  pc.gateway = "192.168.1.1";
  pc.dns = "192.168.1.53";
  dhcpFlow.classList.add("run");
  modeLabel.textContent = "dhcp";
  setStable(100);
  addLog("DHCP", "Discover > Offer > Request > Ack で PC-1 に 192.168.1.30 を配布。");
  render();
}

function setManualMode() {
  const pc = devices["PC-1"];
  pc.dhcp = false;
  state.selected = "PC-1";
  clearModes();
  addLog("SET", "PC-1 を手動設定へ戻しました。");
  render();
}

function createLoopExample() {
  state.connections.add(keyOf("Switch-A", "Switch-B"));
  state.connections.add(keyOf("Switch-B", "Switch-C"));
  state.connections.add(keyOf("Switch-A", "Switch-C"));
  state.testOk = false;
  state.loopSeen = true;
  clearModes();
  setStable(42);
  modeLabel.textContent = "loop detected";
  addLog("WARN", "スイッチ間ループを作成。赤い光が回り続けます。", true);
  render();
}

function loadStage(index) {
  state.stageIndex = Math.max(0, Math.min(stages.length - 1, index));
  state.connections.clear();
  state.selected = "PC-1";
  state.pendingCable = "";
  state.stable = 100;
  state.testOk = false;
  state.loopSeen = false;
  state.beginnerCleared = false;
  devices["PC-1"].ip = "192.168.1.10";
  devices["PC-1"].subnet = 24;
  devices["PC-1"].gateway = "なし";
  devices["PC-1"].dns = "なし";
  devices["PC-1"].dhcp = false;
  devices["Web-Server"].ip = "192.168.1.20";
  devices["Web-Server"].subnet = 24;
  devices["Web-Server"].gateway = "なし";
  devices["Web-Server"].dns = "なし";
  setDeviceConfig("DHCP", "192.168.1.54", 24);
  setDeviceConfig("DNS", "192.168.1.53", 24);
  devices.Router.lan = "192.168.1.1/24";
  devices.Router.wan = "10.0.0.1/24";
  devices.Firewall.allow443 = false;
  clearModes();
  randomizeDevicePositions();
  stages[state.stageIndex].setup();
  setStable(100);
  modeLabel.textContent = "normal";
  logs.innerHTML = "";
  addLog("INFO", stages[state.stageIndex].intro);
  render();
}

function resetLab() {
  loadStage(state.stageIndex);
}

function nextStage() {
  if (!stageComplete()) return;
  const { level, levelIndex, levelStages } = levelStageInfo();
  if (levelIndex >= levelStages.length - 1) {
    state.beginnerCleared = true;
    modeLabel.textContent = `${level} clear`;
    addLog("CLEAR", `${level}クリア。次の難易度は上のボタンから選べます。`);
    render();
    return;
  }
  loadStage(state.stageIndex + 1);
}

function prevStage() {
  if (state.stageIndex <= 0) return;
  loadStage(state.stageIndex - 1);
}

document.querySelectorAll(".device").forEach((device) => {
  device.addEventListener("pointerdown", (event) => startDrag(event, device.dataset.device));
  device.addEventListener("pointermove", moveDrag);
  device.addEventListener("pointerup", endDrag);
  device.addEventListener("pointercancel", endDrag);
  device.addEventListener("click", (event) => {
    if (state.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    selectDevice(device.dataset.device);
  });
  device.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showDeviceInfo(device.dataset.device);
  });
});

devicePopoverClose.addEventListener("click", () => {
  devicePopover.classList.remove("visible");
});

document.querySelectorAll(".difficulty button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".difficulty button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const label = button.textContent.trim();
    if (label === "初級") {
      loadStage(0);
    } else if (label === "中級") {
      loadStage(4);
    } else {
      loadStage(8);
    }
  });
});

[ipSelect, subnetSelect, gatewaySelect, dnsSelect, firewallSelect, routerLanSelect, routerWanSelect].forEach((select) => {
  select.addEventListener("change", updateSettingsFromPanel);
});

testBtn.addEventListener("click", runTest);
stormBtn.addEventListener("click", createLoopExample);
dhcpTab.addEventListener("click", runDhcp);
manualTab.addEventListener("click", setManualMode);
nextStageBtn.addEventListener("click", nextStage);
prevStageBtn.addEventListener("click", prevStage);
loadStage(0);
