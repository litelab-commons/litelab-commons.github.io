#!/usr/bin/env python3
"""
janken.py - TCP/UDPじゃんけんゲーム
ネットワークプロトコルをじゃんけんで学ぼう！

使い方:
  python janken.py          # モード選択メニュー
  python janken.py --server # サーバーモード直接起動
  python janken.py --client # クライアントモード直接起動
"""

import asyncio
import websockets
import json
import http.server
import threading
import webbrowser
import argparse
import socket
import sys
import os
from pathlib import Path

# ================================
# HTML コンテンツ（埋め込み）
# ================================

HTML_CONTENT = r"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🎮 TCPじゃんけん - ネットワーク対戦</title>
<style>
  :root {
    --bg: #0f0e17;
    --surface: #1a1830;
    --card: #232140;
    --accent1: #ff6b6b;
    --accent2: #4ecdc4;
    --accent3: #ffe66d;
    --accent4: #a29bfe;
    --text: #fffffe;
    --text-sub: #a8a4c8;
    --syn: #4ecdc4;
    --ack: #a29bfe;
    --fin: #fd79a8;
    --rst: #ff6b6b;
    --data: #ffe66d;
    --established: #00b894;
    --font-display: "Dela Gothic One", "Yu Gothic UI", "Yu Gothic", Meiryo, system-ui, sans-serif;
    --font-sans: "Zen Maru Gothic", "Yu Gothic UI", "Yu Gothic", Meiryo, system-ui, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* 背景グリッド */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(78,205,196,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(78,205,196,0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 16px;
    position: relative;
    z-index: 1;
  }

  /* ヘッダー */
  .header {
    text-align: center;
    padding: 20px 0 16px;
  }

  .header h1 {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 5vw, 2.8rem);
    background: linear-gradient(135deg, var(--accent2), var(--accent4));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 2px;
  }

  .header .subtitle {
    font-size: 1rem;
    color: var(--text-sub);
    margin-top: 6px;
  }

  /* 接続パネル */
  #connect-panel {
    background: var(--surface);
    border: 2px solid var(--accent4);
    border-radius: 20px;
    padding: 28px;
    margin: 16px 0;
    text-align: center;
  }

  #connect-panel h2 {
    font-family: var(--font-display);
    font-size: 1.4rem;
    color: var(--accent4);
    margin-bottom: 16px;
  }

  .mode-badge {
    display: inline-block;
    padding: 6px 20px;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .mode-badge.server { background: var(--accent2); color: #0f0e17; }
  .mode-badge.client { background: var(--accent3); color: #0f0e17; }

  .input-row {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  input[type="text"] {
    background: var(--card);
    border: 2px solid var(--accent4);
    border-radius: 12px;
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 1.1rem;
    padding: 10px 16px;
    width: 220px;
    outline: none;
    transition: border-color 0.2s;
  }

  input[type="text"]:focus { border-color: var(--accent2); }

  .btn {
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 1rem;
    padding: 10px 24px;
    transition: all 0.2s;
    letter-spacing: 1px;
  }

  .btn:hover { transform: translateY(-2px); filter: brightness(1.15); }
  .btn:active { transform: translateY(0); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn-primary { background: var(--accent2); color: #0f0e17; }
  .btn-danger  { background: var(--accent1); color: #fff; }
  .btn-yellow  { background: var(--accent3); color: #0f0e17; }

  /* ステータスバー */
  .status-bar {
    background: var(--card);
    border-radius: 14px;
    padding: 12px 20px;
    margin: 10px 0;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.05rem;
    border: 2px solid transparent;
    transition: border-color 0.4s;
  }

  .status-bar.established { border-color: var(--established); }
  .status-bar.error { border-color: var(--rst); }

  .state-label {
    font-family: 'Dela Gothic One', cursive;
    font-size: 0.85rem;
    padding: 4px 12px;
    border-radius: 50px;
    background: var(--surface);
    color: var(--text-sub);
    transition: all 0.4s;
  }

  .state-label.active { background: var(--established); color: #0f0e17; }
  .state-label.error  { background: var(--rst); color: #fff; }

  /* メインゲームエリア */
  .game-area {
    background: var(--surface);
    border-radius: 20px;
    padding: 20px;
    margin: 10px 0;
    border: 2px solid var(--card);
  }

  .players-row {
    display: grid;
    grid-template-columns: 1fr 120px 1fr;
    gap: 10px;
    align-items: start;
    margin-bottom: 16px;
  }

  .player-card {
    background: var(--card);
    border-radius: 16px;
    padding: 16px;
    text-align: center;
    border: 2px solid transparent;
    transition: border-color 0.3s;
  }

  .player-card.active { border-color: var(--accent2); }

  .player-emoji {
    font-size: 3rem;
    display: block;
    margin-bottom: 6px;
    transition: transform 0.3s;
  }

  .player-card.shake .player-emoji {
    animation: shake 0.5s ease;
  }

  .player-name {
    font-family: 'Dela Gothic One', cursive;
    font-size: 1rem;
    color: var(--accent2);
  }

  .player-status {
    font-size: 1.3rem;
    margin-top: 8px;
    min-height: 2rem;
    transition: all 0.3s;
  }

  /* パケット飛行エリア */
  .packet-lane {
    position: relative;
    height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
  }

  .lane-line {
    width: 2px;
    height: 100%;
    background: linear-gradient(to bottom, transparent, var(--accent4), transparent);
    position: absolute;
    opacity: 0.3;
  }

  .flying-packet {
    position: absolute;
    font-size: 1.5rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    white-space: nowrap;
    font-family: 'Dela Gothic One', cursive;
    font-size: 0.75rem;
    pointer-events: none;
    z-index: 10;
  }

  .flying-packet.to-right {
    animation: flyRight 1s ease-in-out forwards;
  }

  .flying-packet.to-left {
    animation: flyLeft 1s ease-in-out forwards;
  }

  /* ボタンエリア */
  .handshake-area {
    margin: 12px 0;
  }

  .handshake-area h3 {
    font-family: 'Dela Gothic One', cursive;
    font-size: 1rem;
    color: var(--text-sub);
    margin-bottom: 10px;
    text-align: center;
  }

  .btn-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-packet {
    border: 3px solid;
    border-radius: 14px;
    cursor: pointer;
    font-family: 'Dela Gothic One', cursive;
    font-size: 1rem;
    padding: 10px 20px;
    background: transparent;
    transition: all 0.2s;
    letter-spacing: 1px;
  }

  .btn-packet:hover:not(:disabled) { transform: translateY(-3px); }
  .btn-packet:disabled { opacity: 0.3; cursor: not-allowed; }

  .btn-syn  { border-color: var(--syn);  color: var(--syn); }
  .btn-syn:hover:not(:disabled)  { background: var(--syn);  color: #0f0e17; }
  .btn-ack  { border-color: var(--ack);  color: var(--ack); }
  .btn-ack:hover:not(:disabled)  { background: var(--ack);  color: #fff; }
  .btn-fin  { border-color: var(--fin);  color: var(--fin); }
  .btn-fin:hover:not(:disabled)  { background: var(--fin);  color: #fff; }

  /* じゃんけんエリア */
  .janken-area {
    margin: 12px 0;
    text-align: center;
  }

  .janken-area h3 {
    font-family: 'Dela Gothic One', cursive;
    font-size: 1.1rem;
    color: var(--accent3);
    margin-bottom: 12px;
  }

  .janken-btns {
    display: flex;
    gap: 14px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-janken {
    background: var(--card);
    border: 3px solid var(--accent3);
    border-radius: 18px;
    color: var(--text);
    cursor: pointer;
    font-family: 'Dela Gothic One', cursive;
    font-size: 1rem;
    padding: 14px 22px;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 90px;
  }

  .btn-janken .emoji { font-size: 2.2rem; }
  .btn-janken:hover:not(:disabled) { background: var(--accent3); color: #0f0e17; transform: translateY(-4px) scale(1.05); }
  .btn-janken:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

  /* 勝敗表示 */
  .result-banner {
    text-align: center;
    padding: 16px;
    border-radius: 16px;
    margin: 10px 0;
    display: none;
    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .result-banner.win  { background: linear-gradient(135deg, #00b894, #00cec9); }
  .result-banner.lose { background: linear-gradient(135deg, #e17055, #d63031); }
  .result-banner.draw { background: linear-gradient(135deg, #fdcb6e, #e17055); }

  .result-banner .result-emoji { font-size: 3rem; }
  .result-banner .result-text {
    font-family: 'Dela Gothic One', cursive;
    font-size: 1.6rem;
    margin: 6px 0;
  }
  .result-banner .result-sub { font-size: 1rem; opacity: 0.9; }

  /* スコアボード */
  .scoreboard {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin: 10px 0;
  }

  .score-item {
    background: var(--card);
    border-radius: 12px;
    padding: 10px 20px;
    text-align: center;
    min-width: 80px;
  }

  .score-label {
    font-size: 0.85rem;
    color: var(--text-sub);
  }

  .score-num {
    font-family: 'Dela Gothic One', cursive;
    font-size: 2rem;
  }

  .score-win  { color: var(--accent2); }
  .score-lose { color: var(--accent1); }
  .score-draw { color: var(--accent3); }

  /* ログエリア */
  .log-area {
    background: #0a0915;
    border: 2px solid var(--card);
    border-radius: 14px;
    padding: 14px;
    margin: 10px 0;
    height: 200px;
    overflow-y: auto;
    font-size: 0.95rem;
    line-height: 1.7;
  }

  .log-entry {
    padding: 3px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    animation: fadeIn 0.3s ease;
  }

  .log-entry .log-time { color: var(--text-sub); font-size: 0.8rem; margin-right: 8px; }
  .log-entry .log-packet { font-weight: 700; margin-right: 6px; font-family: 'Dela Gothic One', cursive; font-size: 0.85rem; }

  .log-syn  { color: var(--syn); }
  .log-ack  { color: var(--ack); }
  .log-fin  { color: var(--fin); }
  .log-rst  { color: var(--rst); }
  .log-data { color: var(--data); }
  .log-sys  { color: var(--text-sub); font-style: italic; }
  .log-win  { color: var(--established); }
  .log-lose { color: var(--accent1); }

  /* UDPモードバナー */
  .udp-banner {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    border-radius: 14px;
    padding: 12px 20px;
    text-align: center;
    margin: 10px 0;
    display: none;
  }

  .udp-banner h3 {
    font-family: 'Dela Gothic One', cursive;
    font-size: 1.1rem;
    color: #fff;
  }

  /* アニメーション */
  @keyframes flyRight {
    0%   { left: 5%; opacity: 0; transform: scale(0.8); }
    20%  { opacity: 1; transform: scale(1); }
    80%  { opacity: 1; }
    100% { left: 85%; opacity: 0; transform: scale(0.8); }
  }

  @keyframes flyLeft {
    0%   { right: 5%; left: auto; opacity: 0; transform: scale(0.8); }
    20%  { opacity: 1; transform: scale(1); }
    80%  { opacity: 1; }
    100% { right: 85%; left: auto; opacity: 0; transform: scale(0.8); }
  }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-8px) rotate(-5deg); }
    40%     { transform: translateX(8px) rotate(5deg); }
    60%     { transform: translateX(-6px); }
    80%     { transform: translateX(6px); }
  }

  @keyframes popIn {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(78,205,196,0.4); }
    50%     { box-shadow: 0 0 0 12px rgba(78,205,196,0); }
  }

  .pulse { animation: pulse 1.5s infinite; }

  /* レスポンシブ */
  @media (max-width: 600px) {
    .players-row { grid-template-columns: 1fr 80px 1fr; }
    .player-emoji { font-size: 2.2rem; }
    .packet-lane { height: 80px; }
  }
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <h1>🎮 TCPじゃんけん</h1>
    <p class="subtitle">ネットワークのしくみをじゃんけんで学ぼう！</p>
  </div>

  <!-- 接続パネル -->
  <div id="connect-panel">
    <h2>⚙️ 接続設定</h2>
    <div id="mode-display"></div>
    <div id="server-waiting" style="display:none">
      <p style="font-size:1.1rem; color:var(--accent2); margin:8px 0">🟢 対戦相手の接続を待っています...</p>
      <p style="color:var(--text-sub); font-size:0.9rem">相手に教えるアドレス: <strong id="my-ip" style="color:var(--accent3)">取得中...</strong></p>
    </div>
    <div id="client-connect" style="display:none">
      <p style="margin-bottom:12px; font-size:1rem; color:var(--text-sub)">サーバーのIPアドレスを入力してください</p>
      <div class="input-row">
        <input type="text" id="server-ip" placeholder="例: 192.168.1.10" value="localhost">
        <button class="btn btn-primary" onclick="connectToServer()">🔌 接続する</button>
      </div>
    </div>
    <div id="connected-info" style="display:none">
      <p style="font-size:1.1rem; color:var(--established)">✅ 接続完了！ゲームを始めましょう</p>
    </div>
  </div>

  <!-- ゲーム本体 -->
  <div id="game-panel" style="display:none">

    <!-- ステータスバー -->
    <div class="status-bar" id="status-bar">
      <span style="font-size:1.2rem">📡</span>
      <span class="state-label" id="tcp-state">CLOSED</span>
      <span id="status-text" style="font-size:1.05rem">3ウェイ・ハンドシェイクを始めましょう！</span>
    </div>

    <!-- スコア -->
    <div class="scoreboard">
      <div class="score-item">
        <div class="score-label">勝ち 🎉</div>
        <div class="score-num score-win" id="score-win">0</div>
      </div>
      <div class="score-item">
        <div class="score-label">負け 😢</div>
        <div class="score-num score-lose" id="score-lose">0</div>
      </div>
      <div class="score-item">
        <div class="score-label">引き分け 🤝</div>
        <div class="score-num score-draw" id="score-draw">0</div>
      </div>
    </div>

    <!-- プレイヤーエリア -->
    <div class="game-area">
      <div class="players-row">
        <div class="player-card" id="player-card">
          <span class="player-emoji" id="player-emoji">🖥️</span>
          <div class="player-name">あなたのPC</div>
          <div class="player-status" id="player-status">😐</div>
        </div>

        <div class="packet-lane" id="packet-lane">
          <div class="lane-line"></div>
        </div>

        <div class="player-card" id="server-card">
          <span class="player-emoji" id="server-emoji">🖥️</span>
          <div class="player-name" id="server-name">サーバー</div>
          <div class="player-status" id="server-status">😴</div>
        </div>
      </div>

      <!-- ハンドシェイクボタン -->
      <div class="handshake-area" id="handshake-area">
        <h3>📦 パケットを送ろう！</h3>
        <div class="btn-row">
          <button class="btn-packet btn-syn" id="btn-syn" onclick="sendPacket('SYN')" disabled>
            📤 SYN<br><small style="font-size:0.7rem;font-family:inherit">接続要求</small>
          </button>
          <button class="btn-packet btn-ack" id="btn-ack" onclick="sendPacket('ACK')" disabled>
            📤 ACK<br><small style="font-size:0.7rem;font-family:inherit">確認応答</small>
          </button>
          <button class="btn-packet btn-fin" id="btn-fin" onclick="sendPacket('FIN')" disabled>
            📤 FIN<br><small style="font-size:0.7rem;font-family:inherit">切断要求</small>
          </button>
        </div>
      </div>

      <!-- じゃんけんボタン -->
      <div class="janken-area" id="janken-area">
        <h3>✊ じゃんけんで勝負！ ✌️ 🖐️</h3>
        <div class="janken-btns">
          <button class="btn-janken" id="btn-guu" onclick="sendJanken('グー')" disabled>
            <span class="emoji">✊</span>
            <span>グー</span>
          </button>
          <button class="btn-janken" id="btn-choki" onclick="sendJanken('チョキ')" disabled>
            <span class="emoji">✌️</span>
            <span>チョキ</span>
          </button>
          <button class="btn-janken" id="btn-paa" onclick="sendJanken('パー')" disabled>
            <span class="emoji">🖐️</span>
            <span>パー</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 勝敗バナー -->
    <div class="result-banner" id="result-banner">
      <div class="result-emoji" id="result-emoji"></div>
      <div class="result-text" id="result-text"></div>
      <div class="result-sub" id="result-sub"></div>
    </div>

    <!-- ログ -->
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
        <span style="font-family:'Dela Gothic One',cursive; font-size:0.9rem; color:var(--text-sub)">📋 通信ログ</span>
        <button class="btn btn-danger" style="font-size:0.8rem; padding:4px 12px" onclick="clearLog()">クリア</button>
      </div>
      <div class="log-area" id="log-area"></div>
    </div>

  </div><!-- /game-panel -->

</div><!-- /container -->

<script>
// ========================================
// 状態管理
// ========================================
let ws = null;
let myRole = null;       // 'client' or 'server'
let tcpState = 'CLOSED'; // TCP状態マシン
let waitingForJanken = false;
let scores = { win: 0, lose: 0, draw: 0 };
let packetQueue = [];

const JANKEN_EMOJI = { 'グー': '✊', 'チョキ': '✌️', 'パー': '🖐️' };
const PACKET_COLORS = {
  SYN: { bg:'#4ecdc4', text:'#0f0e17' },
  'SYN-ACK': { bg:'#a29bfe', text:'#fff' },
  ACK: { bg:'#a29bfe', text:'#fff' },
  FIN: { bg:'#fd79a8', text:'#fff' },
  RST: { bg:'#ff6b6b', text:'#fff' },
  DATA: { bg:'#ffe66d', text:'#0f0e17' },
};

// ========================================
// 初期化
// ========================================
window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  myRole = params.get('role') || 'client';

  const modeBadge = document.getElementById('mode-display');
  if (myRole === 'server') {
    modeBadge.innerHTML = '<div class="mode-badge server">🖥️ サーバーモード</div>';
    document.getElementById('server-waiting').style.display = 'block';
    document.getElementById('server-name').textContent = '相手のPC';
    fetchMyIP();
    initWebSocket('server');
  } else {
    modeBadge.innerHTML = '<div class="mode-badge client">💻 クライアントモード</div>';
    document.getElementById('client-connect').style.display = 'block';
  }
};

function fetchMyIP() {
  fetch('/myip').then(r => r.text()).then(ip => {
    document.getElementById('my-ip').textContent = ip + ':__PORT__';
  }).catch(() => {
    document.getElementById('my-ip').textContent = 'IPを確認できませんでした';
  });
}

// ========================================
// WebSocket 接続
// ========================================
function connectToServer() {
  const ip = document.getElementById('server-ip').value.trim() || 'localhost';
  initWebSocket('client', ip);
}

function initWebSocket(role, serverIp = 'localhost') {
  const port = __WS_PORT__;
  const host = role === 'server' ? 'localhost' : serverIp;
  const url = `ws://${host}:${port}/ws`;

  addLog('sys', `🔌 WebSocket接続中... ${url}`);
  ws = new WebSocket(url);

  ws.onopen = () => {
    addLog('sys', '✅ サーバーに接続しました');
    ws.send(JSON.stringify({ type: 'hello', role: role }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    handleMessage(msg);
  };

  ws.onerror = () => {
    addLog('sys', '❌ 接続エラー。サーバーが起動しているか確認してください。');
  };

  ws.onclose = () => {
    addLog('sys', '🔌 接続が切れました');
  };
}

// ========================================
// メッセージハンドラ
// ========================================
function handleMessage(msg) {
  switch(msg.type) {

    case 'game_start':
      document.getElementById('connect-panel').style.display = 'none';
      document.getElementById('connected-info').style.display = 'none';
      document.getElementById('game-panel').style.display = 'block';
      addLog('sys', '🎮 ゲーム開始！対戦相手が接続しました');
      setTcpState('CLOSED');
      if (myRole === 'client') {
        enableSYN();
      } else {
        setStatus('😴 クライアントからのSYNを待っています...', '相手のSYNパケットを待機中');
      }
      break;

    case 'packet':
      receivePacket(msg.packet, msg.from);
      break;

    case 'janken_result':
      showJankenResult(msg);
      break;

    case 'state_sync':
      syncState(msg.state);
      break;

    case 'error':
      addLog('sys', '⚠️ ' + msg.message);
      break;
  }
}

// ========================================
// TCP状態マシン
// ========================================
function setTcpState(state) {
  tcpState = state;
  const el = document.getElementById('tcp-state');
  el.textContent = state;
  el.className = 'state-label';

  const bar = document.getElementById('status-bar');
  bar.className = 'status-bar';

  if (state === 'ESTABLISHED') {
    el.classList.add('active');
    bar.classList.add('established');
    setServerEmotion('😄');
    setPlayerEmotion('😄');
  } else if (state === 'CLOSED' || state === 'RST') {
    if (state === 'RST') {
      el.classList.add('error');
      bar.classList.add('error');
      setServerEmotion('😡');
      setPlayerEmotion('😱');
      shakeCard('server-card');
      shakeCard('player-card');
    } else {
      setServerEmotion('😴');
      setPlayerEmotion('😐');
    }
  }
}

function enableSYN() {
  document.getElementById('btn-syn').disabled = false;
  document.getElementById('btn-syn').classList.add('pulse');
  setStatus('📤 SYNパケットを送ってみよう！', '最初のパケットを送ってハンドシェイク開始！');
  setPlayerEmotion('🤔');
}

function enableACK() {
  document.getElementById('btn-ack').disabled = false;
  document.getElementById('btn-ack').classList.add('pulse');
  setStatus('📤 ACKパケットを送ろう！', 'SYN-ACKを受け取った！ACKで確認応答しよう');
  setPlayerEmotion('😊');
}

function enableJanken() {
  ['btn-guu','btn-choki','btn-paa'].forEach(id => {
    document.getElementById(id).disabled = false;
  });
  setStatus('🎮 じゃんけんで勝負！', 'コネクションが確立した！好きな手を選ぼう！');
  setPlayerEmotion('🤩');
  setServerEmotion('🤩');

  // お祝いエフェクト
  showEstablishedCelebration();
}

function enableFIN() {
  document.getElementById('btn-fin').disabled = false;
  document.getElementById('btn-fin').classList.add('pulse');
}

function disableAllButtons() {
  ['btn-syn','btn-ack','btn-fin','btn-guu','btn-choki','btn-paa'].forEach(id => {
    const el = document.getElementById(id);
    el.disabled = true;
    el.classList.remove('pulse');
  });
}

// ========================================
// パケット送信
// ========================================
function sendPacket(packetType) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  // ボタン無効化
  document.getElementById('btn-' + packetType.toLowerCase()).disabled = true;
  document.getElementById('btn-' + packetType.toLowerCase()).classList.remove('pulse');

  // アニメーション（右へ飛ばす）
  flyPacket(packetType, 'right');

  // サーバーへ送信
  ws.send(JSON.stringify({ type: 'packet', packet: packetType }));

  // ログ
  const desc = getPacketDescription(packetType, 'send');
  addLog(packetType.toLowerCase().replace('-',''), `📤 ${packetType} 送信`, desc);

  // 状態更新
  if (packetType === 'SYN') {
    setTcpState('SYN_SENT');
    setStatus('⏳ SYN-ACKを待っています...', 'サーバーからの返答を待っています');
    setPlayerEmotion('🤞');
  } else if (packetType === 'ACK' && tcpState === 'SYN_RECEIVED') {
    setTcpState('ESTABLISHED');
    enableJanken();
  } else if (packetType === 'FIN') {
    setTcpState('FIN_WAIT');
    setStatus('👋 接続を終わらせています...', 'FINを送って切断処理開始');
  }
}

function sendJanken(hand) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  disableAllButtons();
  setPlayerEmotion(JANKEN_EMOJI[hand]);

  flyPacket(`${JANKEN_EMOJI[hand]} ${hand} (DATA)`, 'right', 'data');
  ws.send(JSON.stringify({ type: 'janken', hand: hand }));

  addLog('data', `📤 DATA 送信`, `手を選んだ！「${hand} ${JANKEN_EMOJI[hand]}」をDATAパケットとして送信中...`);
  setStatus('⏳ 相手の手を待っています...', 'DATAパケットを送った！相手の応答を待っています');
  setServerEmotion('🤔');
}

// ========================================
// パケット受信処理
// ========================================
function receivePacket(packetType, from) {
  // アニメーション（左から来る）
  flyPacket(packetType, 'left');

  const desc = getPacketDescription(packetType, 'receive');
  addLog(packetType.toLowerCase().replace('-','').replace(' ',''), `📥 ${packetType} 受信`, desc);

  if (packetType === 'SYN') {
    // サーバー側がSYN受信
    setTcpState('SYN_RECEIVED');
    setStatus('📥 SYNを受け取りました！', 'クライアントから接続要求が来た！自動でSYN-ACKを返します');
    setServerEmotion('😊');
    setTimeout(() => {
      flyPacket('SYN-ACK', 'right-to-left-from-server');
      ws.send(JSON.stringify({ type: 'packet', packet: 'SYN-ACK' }));
      addLog('synack', `📤 SYN-ACK 送信`, '「接続OKだよ！こちらも接続していい？」と返答しました');
    }, 800);

  } else if (packetType === 'SYN-ACK') {
    // クライアント側がSYN-ACK受信
    setTcpState('SYN_RECEIVED');
    setStatus('📥 SYN-ACKを受け取りました！', 'サーバーが「接続OK！」と返事をくれた。ACKを送ろう！');
    setServerEmotion('😊');
    setPlayerEmotion('😃');
    enableACK();

  } else if (packetType === 'ACK' && tcpState === 'SYN_RECEIVED') {
    // サーバー側がACK受信 → ESTABLISHED
    setTcpState('ESTABLISHED');
    setStatus('🎉 ESTABLISHED！接続完了！', 'ハンドシェイク成功！じゃんけんができるようになった！');
    enableJanken();

  } else if (packetType === 'FIN') {
    setStatus('📥 FINを受け取りました', '相手が接続を終わらせたいと言っています');
    setTimeout(() => {
      flyPacket('ACK', 'right');
      ws.send(JSON.stringify({ type: 'packet', packet: 'ACK' }));
      addLog('ack', '📤 ACK 送信', 'FINへの確認応答を返しました');
      setTimeout(() => {
        flyPacket('FIN', 'right');
        ws.send(JSON.stringify({ type: 'packet', packet: 'FIN' }));
        addLog('fin', '📤 FIN 送信', 'こちらからも接続終了を通知します');
        setTcpState('CLOSED');
        setStatus('✅ 通信終了', '4ウェイ切断完了！お疲れ様でした');
        setTimeout(() => {
          setTcpState('CLOSED');
          enableSYN();
          addLog('sys', '♻️ 新しいゲームの準備ができました！');
        }, 1500);
      }, 600);
    }, 600);

  } else if (packetType === 'RST') {
    handleRST();
  }
}

function handleRST() {
  setTcpState('RST');
  disableAllButtons();
  setStatus('💥 RST！接続がリセットされました！', 'パケットの順番を間違えた！最初からやり直しです');
  addLog('rst', '💥 RST 受信', '接続が強制リセットされた！手順を正しい順番で送らないとRSTが来ます');

  setTimeout(() => {
    setTcpState('CLOSED');
    if (myRole === 'client') enableSYN();
    else setStatus('😴 SYNを待っています', '相手のSYNパケットを待機中');
    addLog('sys', '♻️ リセット完了。もう一度チャレンジしましょう！');
  }, 2500);
}

// ========================================
// じゃんけん結果
// ========================================
function showJankenResult(msg) {
  const myHand = msg.your_hand;
  const opHand = msg.opponent_hand;
  const result = msg.result;

  setServerEmotion(JANKEN_EMOJI[opHand]);
  addLog('data', `📥 DATA+ACK 受信`, `相手の手：「${opHand} ${JANKEN_EMOJI[opHand]}」`);

  const banner = document.getElementById('result-banner');
  banner.style.display = 'block';

  if (result === 'win') {
    scores.win++;
    banner.className = 'result-banner win';
    document.getElementById('result-emoji').textContent = '🎉';
    document.getElementById('result-text').textContent = '勝ち！！！';
    document.getElementById('result-sub').textContent = `${myHand} ${JANKEN_EMOJI[myHand]}  vs  ${opHand} ${JANKEN_EMOJI[opHand]}`;
    addLog('win', '🎉 勝ち！', `${myHand}で${opHand}に勝ちました！`);
  } else if (result === 'lose') {
    scores.lose++;
    banner.className = 'result-banner lose';
    document.getElementById('result-emoji').textContent = '😢';
    document.getElementById('result-text').textContent = '負け...';
    document.getElementById('result-sub').textContent = `${myHand} ${JANKEN_EMOJI[myHand]}  vs  ${opHand} ${JANKEN_EMOJI[opHand]}`;
    addLog('lose', '😢 負け', `${opHand}に負けました...`);
  } else {
    scores.draw++;
    banner.className = 'result-banner draw';
    document.getElementById('result-emoji').textContent = '🤝';
    document.getElementById('result-text').textContent = 'あいこ！';
    document.getElementById('result-sub').textContent = `${myHand} ${JANKEN_EMOJI[myHand]}  vs  ${opHand} ${JANKEN_EMOJI[opHand]}`;
    addLog('sys', '🤝 あいこ', 'お互い同じ手！');
  }

  document.getElementById('score-win').textContent = scores.win;
  document.getElementById('score-lose').textContent = scores.lose;
  document.getElementById('score-draw').textContent = scores.draw;

  // FINボタン有効化
  setTimeout(() => {
    banner.style.display = 'none';
    enableFIN();
    setStatus('📤 FINを送って接続を終わらせよう', '勝負が終わった！FINパケットで通信を正しく終わらせよう');
    addLog('sys', '💡 ヒント: FINボタンを押して接続を終了させましょう');
  }, 3000);
}

// ========================================
// アニメーション
// ========================================
function flyPacket(label, direction, type = null) {
  const lane = document.getElementById('packet-lane');
  const el = document.createElement('div');
  el.className = 'flying-packet';

  // 色設定
  let color = PACKET_COLORS[label] || PACKET_COLORS['DATA'];
  if (!PACKET_COLORS[label]) {
    // じゃんけんDATAパケット
    color = { bg: '#ffe66d', text: '#0f0e17' };
  }

  el.style.background = color.bg;
  el.style.color = color.text;
  el.textContent = label;

  // 方向
  if (direction === 'right' || direction === 'right-from-client') {
    el.classList.add('to-right');
    el.style.left = '5%';
    el.style.top = (20 + Math.random() * 60) + '%';
  } else {
    el.classList.add('to-left');
    el.style.right = '5%';
    el.style.top = (20 + Math.random() * 60) + '%';
  }

  lane.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

function showEstablishedCelebration() {
  // 画面中央にお祝いメッセージ
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; inset: 0; display: flex; align-items: center;
    justify-content: center; z-index: 100; pointer-events: none;
  `;
  el.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #00b894, #4ecdc4);
      border-radius: 24px; padding: 30px 50px; text-align: center;
      font-family: 'Dela Gothic One', cursive;
      animation: popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275);
      box-shadow: 0 20px 60px rgba(0,184,148,0.4);
    ">
      <div style="font-size:3rem">🎉</div>
      <div style="font-size:1.8rem; color:#0f0e17">ESTABLISHED!</div>
      <div style="font-size:1rem; color:#0f0e17; margin-top:8px">接続完了！じゃんけんで勝負！</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function shakeCard(cardId) {
  const card = document.getElementById(cardId);
  card.classList.add('shake');
  setTimeout(() => card.classList.remove('shake'), 600);
}

// ========================================
// UI ヘルパー
// ========================================
function setStatus(text, subText = '') {
  document.getElementById('status-text').textContent = text + (subText ? '　' + subText : '');
}

function setPlayerEmotion(emoji) {
  document.getElementById('player-status').textContent = emoji;
}

function setServerEmotion(emoji) {
  document.getElementById('server-status').textContent = emoji;
}

function syncState(state) {
  tcpState = state;
}

function addLog(type, packet, description) {
  const log = document.getElementById('log-area');
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;

  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-packet log-${type}">${packet}</span>
    <span>${description}</span>
  `;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function clearLog() {
  document.getElementById('log-area').innerHTML = '';
}

function getPacketDescription(packet, direction) {
  const descs = {
    'SYN':     { send: '「接続していいですか？」と相手に挨拶を送りました（SYN: Synchronize）', receive: '相手から「接続していいですか？」という挨拶が届きました' },
    'SYN-ACK': { send: '「いいですよ！こちらもよろしく！」と返答しました', receive: '相手から「接続OKです！こちらもよろしく」と返答が届きました（SYN-ACK）' },
    'ACK':     { send: '「了解しました！」と確認応答を送りました（ACK: Acknowledgement）', receive: '相手から「了解！」という確認応答が届きました' },
    'FIN':     { send: '「そろそろ終わりにしましょう」と切断要求を送りました（FIN: Finish）', receive: '相手から「終わりにしましょう」という切断要求が届きました' },
    'RST':     { send: 'リセットパケットを送りました', receive: '⚠️ 手順が間違っています！RST（Reset）で接続が強制終了されました' },
  };
  return descs[packet]?.[direction] || `${packet}パケット（${direction === 'send' ? '送信' : '受信'}）`;
}
</script>
</body>
</html>
"""

# ================================
# WebSocket サーバーロジック
# ================================

class GameSession:
    """2人のプレイヤー間のゲームセッション管理"""

    def __init__(self):
        self.players = {}       # role -> websocket
        self.tcp_state = 'CLOSED'
        self.pending_janken = {}  # role -> hand

    def add_player(self, role, ws):
        self.players[role] = ws

    def get_opponent_ws(self, role):
        opp = 'server' if role == 'client' else 'client'
        return self.players.get(opp)

    def both_connected(self):
        return 'client' in self.players and 'server' in self.players

    async def broadcast(self, msg):
        for ws in self.players.values():
            try:
                await ws.send(json.dumps(msg))
            except:
                pass

    async def send_to(self, role, msg):
        ws = self.players.get(role)
        if ws:
            try:
                await ws.send(json.dumps(msg))
            except:
                pass

    async def relay_packet(self, from_role, packet_type):
        """パケットを相手に中継し、ゲームロジックを処理"""
        to_role = 'server' if from_role == 'client' else 'client'

        # RST判定（不正な順序）
        if self.is_invalid_packet(from_role, packet_type):
            await self.send_rst(from_role)
            return

        # 状態更新
        self.update_tcp_state(from_role, packet_type)

        # 相手に中継
        await self.send_to(to_role, {
            'type': 'packet',
            'packet': packet_type,
            'from': from_role
        })

    def is_invalid_packet(self, from_role, packet_type):
        """不正なパケット順序の検出"""
        state = self.tcp_state
        if from_role == 'client':
            if packet_type == 'SYN' and state not in ['CLOSED', 'ESTABLISHED']:
                return True
            if packet_type == 'ACK' and state != 'SYN_RCVD':
                return True
        if from_role == 'server':
            if packet_type == 'SYN-ACK' and state != 'SYN_SENT':
                return True
        return False

    def update_tcp_state(self, from_role, packet_type):
        if packet_type == 'SYN':
            self.tcp_state = 'SYN_SENT'
        elif packet_type == 'SYN-ACK':
            self.tcp_state = 'SYN_RCVD'
        elif packet_type == 'ACK' and self.tcp_state == 'SYN_RCVD':
            self.tcp_state = 'ESTABLISHED'
        elif packet_type == 'FIN':
            self.tcp_state = 'FIN_WAIT'
        elif packet_type == 'ACK' and self.tcp_state == 'FIN_WAIT':
            self.tcp_state = 'CLOSE_WAIT'
        elif self.tcp_state == 'CLOSE_WAIT':
            self.tcp_state = 'CLOSED'

    async def send_rst(self, to_role):
        self.tcp_state = 'CLOSED'
        await self.send_to(to_role, {
            'type': 'packet',
            'packet': 'RST',
            'from': 'server'
        })

    async def handle_janken(self, from_role, hand):
        """じゃんけん処理"""
        self.pending_janken[from_role] = hand

        # 両方揃ったら勝敗判定
        if len(self.pending_janken) == 2:
            client_hand = self.pending_janken.get('client')
            server_hand = self.pending_janken.get('server')

            result_client = judge(client_hand, server_hand)
            result_server = judge(server_hand, client_hand)

            await self.send_to('client', {
                'type': 'janken_result',
                'your_hand': client_hand,
                'opponent_hand': server_hand,
                'result': result_client
            })
            await self.send_to('server', {
                'type': 'janken_result',
                'your_hand': server_hand,
                'opponent_hand': client_hand,
                'result': result_server
            })

            self.pending_janken = {}


def judge(my_hand, opponent_hand):
    wins = {'グー': 'チョキ', 'チョキ': 'パー', 'パー': 'グー'}
    if my_hand == opponent_hand:
        return 'draw'
    elif wins[my_hand] == opponent_hand:
        return 'win'
    else:
        return 'lose'


# グローバルセッション
session = GameSession()
role_map = {}  # ws_id -> role


async def ws_handler(websocket):
    """WebSocket接続ハンドラ"""
    ws_id = id(websocket)
    role = None

    try:
        async for raw in websocket:
            msg = json.loads(raw)

            if msg['type'] == 'hello':
                role = msg['role']
                role_map[ws_id] = role
                session.add_player(role, websocket)
                print(f"[接続] {role} が参加しました")

                if session.both_connected():
                    print("[ゲーム] 2人揃いました！ゲーム開始！")
                    await session.broadcast({'type': 'game_start'})

            elif msg['type'] == 'packet':
                if role:
                    await session.relay_packet(role, msg['packet'])

            elif msg['type'] == 'janken':
                if role:
                    hand = msg['hand']
                    # 相手にも通知（アニメーション用）
                    opp = session.get_opponent_ws(role)
                    if opp:
                        await opp.send(json.dumps({
                            'type': 'packet',
                            'packet': f"{hand} (DATA)",
                            'from': role
                        }))
                    await session.handle_janken(role, hand)

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if role and ws_id in role_map:
            del role_map[ws_id]
            if role in session.players:
                del session.players[role]
            print(f"[切断] {role} が退出しました")


# ================================
# HTTP サーバー（HTML配信）
# ================================

def make_html(ws_port, role, my_ip):
    """HTMLにポート・ロール・IPを埋め込む"""
    html = HTML_CONTENT
    html = html.replace('__WS_PORT__', str(ws_port))
    html = html.replace('__PORT__', f':{ws_port}')
    return html


class GameHTTPHandler(http.server.BaseHTTPRequestHandler):
    ws_port = 8765
    my_ip = 'localhost'
    role = 'client'

    def do_GET(self):
        if self.path == '/myip':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"{self.my_ip}:{self.ws_port}".encode())

        elif self.path.startswith('/'):
            # ロールをURLパラメータから取得
            role = self.role
            if '?role=' in self.path:
                role = self.path.split('?role=')[1].split('&')[0]

            html = make_html(self.ws_port, role, self.my_ip)
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))

    def log_message(self, format, *args):
        pass  # ログ抑制


def get_local_ip():
    """外部通信を使わず、OSが持つホスト名解決からローカルIPを推定する。"""
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET, socket.SOCK_DGRAM):
            ip = info[4][0]
            if not ip.startswith('127.'):
                return ip
    except:
        pass
    return 'localhost'


def start_http_server(http_port, ws_port, my_ip, role):
    GameHTTPHandler.ws_port = ws_port
    GameHTTPHandler.my_ip = my_ip
    GameHTTPHandler.role = role

    server = http.server.HTTPServer(('0.0.0.0', http_port), GameHTTPHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


# ================================
# メイン
# ================================

async def run_websocket_server(ws_port):
    async with websockets.serve(ws_handler, '0.0.0.0', ws_port):
        print(f"[WS] WebSocketサーバー起動中 ポート:{ws_port}")
        await asyncio.Future()  # 永続実行


def main():
    parser = argparse.ArgumentParser(description='TCPじゃんけんゲーム')
    parser.add_argument('--server', action='store_true', help='サーバーモードで起動')
    parser.add_argument('--client', action='store_true', help='クライアントモードで起動')
    parser.add_argument('--ws-port', type=int, default=8765, help='WebSocketポート番号')
    parser.add_argument('--http-port', type=int, default=8080, help='HTTPポート番号')
    args = parser.parse_args()

    # モード選択
    if args.server:
        role = 'server'
    elif args.client:
        role = 'client'
    else:
        print("=" * 50)
        print("🎮  TCPじゃんけんゲーム  🎮")
        print("=" * 50)
        print()
        print("  [S] サーバーモード（待ち受け側）")
        print("  [C] クライアントモード（接続する側）")
        print()
        choice = input("どちらで起動しますか？ (S/C): ").strip().upper()
        role = 'server' if choice == 'S' else 'client'

    my_ip = get_local_ip()
    ws_port = args.ws_port
    http_port = args.http_port

    print()
    print(f"🌐 あなたのIPアドレス: {my_ip}")
    print(f"📡 WebSocketポート: {ws_port}")
    print(f"🖥️  HTTPポート: {http_port}")
    print()

    # HTTPサーバー起動
    start_http_server(http_port, ws_port, my_ip, role)

    # ブラウザを開く
    url = f"http://localhost:{http_port}/?role={role}"
    print(f"🚀 ブラウザを開いています: {url}")

    if role == 'server':
        print()
        print(f"📋 クライアントへの接続情報:")
        print(f"   IPアドレス: {my_ip}")
        print(f"   相手は python janken.py --client で起動後、")
        print(f"   ブラウザで {my_ip} を入力してください")

    print()
    print("✅ ゲームが起動しました！ブラウザを確認してください")
    print("   Ctrl+C で終了")
    print()

    webbrowser.open(url)

    # WebSocketサーバー起動（メインループ）
    try:
        asyncio.run(run_websocket_server(ws_port))
    except KeyboardInterrupt:
        print("\n👋 ゲームを終了しました")


if __name__ == '__main__':
    main()
