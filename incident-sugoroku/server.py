"""
サイバーすごろく - Cyber Sugoroku Server
Windows PCで起動 → 同一LAN内の参加者がブラウザで接続
"""
import asyncio
import json
import math
import random
import socket
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, List, Optional, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import uvicorn

# ============================================================
# ゲーム盤面の設定（30マス）
# サイバーセキュリティ教育的なイベントを各マスに配置
# ============================================================

BOARD_SIZE = 30
INITIAL_BUDGET = 100
MAX_ROUNDS = 20
MIN_ROUNDS = 5
MAX_ROUND_LIMIT = 50
ROUND_BONUS = 3
GOAL_RANK_BONUSES = {1: 40, 2: 25, 3: 15}
GOAL_DEFAULT_BONUS = 10
GOAL_GIFT_TIERS = (6, 4, 2)
RANSOMWARE_OUTBREAK_CHANCES = (1.0, 0.7, 0.45, 0.3)
RANSOMWARE_FALLBACK_CHANCE = 0.2
RANSOMWARE_DORMANT_STEPS = -1
RANSOMWARE_DORMANT_BUDGET_DELTA = -5
RANSOMWARE_DEFENSE_FIELDS = (
    ("backup", "バックアップ"),
    ("edr", "EDR"),
    ("csirt", "CSIRT"),
    ("bcp", "BCP"),
)

# マス目のイベント定義: (タイプ, タイトル, 説明, 効果)
# タイプ: "good"(緑), "bad"(赤), "event"(黄), "normal"(無し)
# 効果: 進む/戻るマス数（0なら効果なし）
SQUARES = [
    {"type": "start", "title": "スタート", "desc": "サイバー演習開始！", "effect": 0},
    {"type": "normal", "title": "ログ確認", "desc": "いつも通り監視ログを確認", "effect": 0},
    {"type": "good", "title": "MFA設定", "desc": "多要素認証を有効化！+1マス", "effect": 1},
    {"type": "bad", "title": "フィッシングメール", "desc": "怪しいリンクを踏んでしまった... -2マス", "effect": -2},
    {"type": "good", "title": "パッチ適用", "desc": "OSを最新に更新した！+1マス", "effect": 1},
    {"type": "event", "title": "セキュリティ研修", "desc": "知識が増えた！追加で1〜3マス進む", "effect": "reroll"},
    {"type": "bad", "title": "USB拾い食い", "desc": "怪しいUSBを挿してしまった -2マス", "effect": -2},
    {"type": "good", "title": "バックアップ", "desc": "定期バックアップ実施！+1マス", "effect": 1},
    {"type": "normal", "title": "取引先確認", "desc": "送信先と添付ファイルを再確認", "effect": 0},
    {"type": "good", "title": "EDR導入", "desc": "エンドポイント保護強化！+1マス", "effect": 1},
    {"type": "bad", "title": "設定ミス", "desc": "公開設定のまま運用してしまった -2マス", "effect": -2},
    {"type": "event", "title": "CSIRT訓練", "desc": "対応訓練を実施！1回休み", "effect": "skip"},
    {"type": "bad", "title": "ランサムウェア感染", "desc": "ファイルが暗号化された！全社インシデント発生", "effect": "back_to_start"},
    {"type": "normal", "title": "復旧手順確認", "desc": "復旧手順書を点検", "effect": 0},
    {"type": "bad", "title": "弱いパスワード", "desc": "辞書攻撃にやられた -2マス", "effect": -2},
    {"type": "good", "title": "脆弱性診断", "desc": "問題を早期発見！+1マス", "effect": 1},
    {"type": "bad", "title": "標的型攻撃", "desc": "APT攻撃を受けた -3マス", "effect": -3},
    {"type": "event", "title": "情シス相談", "desc": "専門家に相談！追加で1〜3マス進む", "effect": "reroll"},
    {"type": "normal", "title": "権限棚卸", "desc": "不要な権限を見直し", "effect": 0},
    {"type": "good", "title": "ゼロトラスト導入", "desc": "ネットワーク再設計！+1マス", "effect": 1},
    {"type": "bad", "title": "シャドウIT発覚", "desc": "未許可SaaS利用 -2マス", "effect": -2},
    {"type": "good", "title": "SOC運用開始", "desc": "24時間監視体制！+1マス", "effect": 1},
    {"type": "normal", "title": "監査対応", "desc": "証跡を整理して説明", "effect": 0},
    {"type": "bad", "title": "内部不正", "desc": "情報持ち出し発生 -3マス", "effect": -3},
    {"type": "event", "title": "経営層へ報告", "desc": "1回休み", "effect": "skip"},
    {"type": "good", "title": "BCP訓練", "desc": "事業継続計画を実施！+1マス", "effect": 1},
    {"type": "normal", "title": "復旧演習", "desc": "最後の確認を実施", "effect": 0},
    {"type": "good", "title": "ISMS認証取得", "desc": "セキュリティ体制完成！+1マス", "effect": 1},
    {"type": "normal", "title": "最終レビュー", "desc": "運用と改善点を振り返る", "effect": 0},
    {"type": "goal", "title": "ゴール！", "desc": "サイバーレジリエンス達成！", "effect": 0},
]

BUDGET_EFFECTS = {
    "パッチ適用": 10,
    "セキュリティ研修": 5,
    "MFA設定": 5,
    "バックアップ": 15,
    "CSIRT訓練": 10,
    "EDR導入": 20,
    "脆弱性診断": 10,
    "情シス相談": 5,
    "ゼロトラスト導入": 20,
    "SOC運用開始": 15,
    "BCP訓練": 15,
    "ISMS認証取得": 20,
    "フィッシングメール": -20,
    "USB拾い食い": -10,
    "ランサムウェア感染": -50,
    "弱いパスワード": -15,
    "設定ミス": -10,
    "標的型攻撃": -25,
    "シャドウIT発覚": -15,
    "内部不正": -30,
    "経営層へ報告": -5,
}


def apply_budget(player: dict, delta: int) -> int:
    player["budget"] = max(0, player.get("budget", INITIAL_BUDGET) + delta)
    return player["budget"]


def apply_move(position: int, steps: int) -> int:
    target = position + steps
    goal = BOARD_SIZE - 1
    if target <= goal:
        return max(0, target)
    return max(0, goal - (target - goal))


def goal_rank_bonus(rank: int) -> int:
    return GOAL_RANK_BONUSES.get(rank, GOAL_DEFAULT_BONUS)


def ransomware_outbreak_chance(outbreaks_so_far: int) -> float:
    if outbreaks_so_far < len(RANSOMWARE_OUTBREAK_CHANCES):
        return RANSOMWARE_OUTBREAK_CHANCES[outbreaks_so_far]
    return RANSOMWARE_FALLBACK_CHANCE


def ransomware_defense(player: dict) -> dict:
    items = [
        label
        for key, label in RANSOMWARE_DEFENSE_FIELDS
        if player.get(key)
    ]
    return {
        "level": len(items),
        "items": items,
        "label": f"防御Lv{len(items)}" if items else "",
    }


def ransomware_blast_impact(defense_level: int, has_backup: bool) -> tuple[int, int, str]:
    if defense_level >= 4:
        return 0, 0, "多層防御で被害なし"
    if defense_level >= 3:
        return 0, -3, "多層防御で移動被害なし"
    if defense_level == 2:
        return -1, -5, "複数防御で被害軽減"
    if defense_level == 1:
        return -1, -5 if has_backup else -10, "防御態勢で被害軽減"
    return -2, -20, "ランサム被害"


# ============================================================
# ゲーム状態管理
# ============================================================

class GameState:
    def __init__(self):
        self.players: Dict[str, dict] = {}  # client_id -> {name, position, color, last_roll, skip_next, status}
        self.player_order: List[str] = []
        self.connections: Dict[str, WebSocket] = {}  # client_id -> ws
        self.host_connections: Set[WebSocket] = set()
        self.lock = asyncio.Lock()
        self.game_started = False
        self.game_ended = False
        self.winner: Optional[str] = None
        self.max_rounds = MAX_ROUNDS
        # 同時にサイコロを振るモード: 全員のロールを集めて一斉に解決
        self.pending_rolls: Dict[str, int] = {}  # client_id -> rolled value
        self.resolved_rolls: Set[str] = set()
        self.round_number = 0
        self.ransomware_outbreaks = 0
        self.colors = [
            "#00ff9c", "#ff3860", "#ffdd00", "#00d4ff",
            "#ff6b9d", "#a78bfa", "#ff9500", "#7dd3fc",
        ]

    def add_player(self, client_id: str, name: str, ws: WebSocket) -> dict:
        if client_id in self.players:
            # 再接続
            self.connections[client_id] = ws
            return self.players[client_id]
        color = self.colors[len(self.players) % len(self.colors)]
        player = {
            "id": client_id,
            "name": name,
            "position": 0,
            "color": color,
            "last_roll": None,
            "skip_next": False,
            "status": "待機中",
            "budget": INITIAL_BUDGET,
            "backup": False,
            "mfa": False,
            "edr": False,
            "csirt": False,
            "bcp": False,
            "ransomware_triggers": 0,
            "finished": False,
            "rank": None,
        }
        self.players[client_id] = player
        self.player_order.append(client_id)
        self.connections[client_id] = ws
        return player

    def remove_connection(self, client_id: str):
        self.connections.pop(client_id, None)

    def reset(self):
        for p in self.players.values():
            p["position"] = 0
            p["last_roll"] = None
            p["skip_next"] = False
            p["status"] = "待機中"
            p["budget"] = INITIAL_BUDGET
            p["backup"] = False
            p["mfa"] = False
            p["edr"] = False
            p["csirt"] = False
            p["bcp"] = False
            p["ransomware_triggers"] = 0
            p["finished"] = False
            p["rank"] = None
        self.pending_rolls.clear()
        self.resolved_rolls.clear()
        self.game_started = False
        self.game_ended = False
        self.winner = None
        self.round_number = 0
        self.ransomware_outbreaks = 0

    def clear_players(self):
        self.players.clear()
        self.player_order.clear()
        self.connections.clear()
        self.reset()

    def to_dict(self) -> dict:
        for p in self.players.values():
            p.setdefault("budget", INITIAL_BUDGET)
            p.setdefault("backup", False)
            p.setdefault("mfa", False)
            p.setdefault("edr", False)
            p.setdefault("csirt", False)
            p.setdefault("bcp", False)
            p.setdefault("ransomware_triggers", p.get("ransomware_hits", 0))
        return {
            "players": [self.players[pid] for pid in self.player_order],
            "game_started": self.game_started,
            "game_ended": self.game_ended,
            "winner": self.winner,
            "round_number": self.round_number,
            "max_rounds": self.max_rounds,
            "ransomware_outbreaks": self.ransomware_outbreaks,
            "pending_count": len(self.pending_rolls),
            "total_active": sum(
                1 for p in self.players.values() if not p["finished"]
            ),
            "board_size": BOARD_SIZE,
        }


game = GameState()


# ============================================================
# ブロードキャスト
# ============================================================

async def broadcast_state():
    state = game.to_dict()
    state_msg = json.dumps({"type": "state", "data": state})
    # ホスト（サーバ画面）にも、参加者にも送信
    targets = list(game.host_connections) + list(game.connections.values())
    await asyncio.gather(*(safe_send(ws, state_msg) for ws in targets), return_exceptions=True)


async def send_state(ws: WebSocket):
    await safe_send(ws, json.dumps({"type": "state", "data": game.to_dict()}))


async def broadcast_host_state():
    state_msg = json.dumps({"type": "state", "data": game.to_dict()})
    await asyncio.gather(
        *(safe_send(ws, state_msg) for ws in list(game.host_connections)),
        return_exceptions=True,
    )


async def safe_send(ws: WebSocket, msg: str):
    try:
        await ws.send_text(msg)
    except Exception:
        pass


async def safe_close(ws: WebSocket):
    try:
        await ws.close()
    except Exception:
        pass


async def broadcast_event(event: dict):
    """ロール結果やイベント発生をブロードキャスト"""
    msg = json.dumps({"type": "event", "data": event})
    targets = list(game.host_connections) + list(game.connections.values())
    await asyncio.gather(*(safe_send(ws, msg) for ws in targets), return_exceptions=True)


async def broadcast_player_event(client_id: str, event: dict):
    msg = json.dumps({"type": "event", "data": event})
    ws = game.connections.get(client_id)
    if ws:
        try:
            await ws.send_text(msg)
        except Exception:
            pass
    for host_ws in list(game.host_connections):
        try:
            await host_ws.send_text(msg)
        except Exception:
            pass


async def broadcast_host_event(event: dict):
    msg = json.dumps({"type": "event", "data": event})
    await asyncio.gather(
        *(safe_send(ws, msg) for ws in list(game.host_connections)),
        return_exceptions=True,
    )


# ============================================================
# ゲームロジック
# ============================================================

async def close_round_if_ready() -> bool:
    active_after = [
        pid for pid in game.player_order if not game.players[pid]["finished"]
    ]

    if not active_after:
        game.pending_rolls.clear()
        game.resolved_rolls.clear()
        game.game_ended = True
        game.game_started = False
        await broadcast_event({
            "kind": "game_end",
            "round": game.round_number,
            "message": "全員がゴールしました。最終結果を表示します。",
        })
        await broadcast_state()
        return True

    if not all(pid in game.pending_rolls for pid in active_after):
        return False
    if not all(pid in game.resolved_rolls for pid in active_after):
        return False

    for pid in active_after:
        apply_budget(game.players[pid], ROUND_BONUS)
    game.pending_rolls.clear()
    game.resolved_rolls.clear()
    if game.round_number >= game.max_rounds:
        game.game_ended = True
        game.game_started = False
        await broadcast_event({
            "kind": "game_end",
            "round": game.round_number,
            "message": f"ラウンド上限 {game.max_rounds} に到達しました。最終結果を表示します。",
        })
        await broadcast_state()
        return True
    await broadcast_event({
        "kind": "round_end",
        "round": game.round_number,
        "message": f"ラウンド {game.round_number} 終了 - 継続ボーナス +{ROUND_BONUS}pt",
        "budget_delta": ROUND_BONUS,
    })
    await broadcast_state()
    return True


async def finish_player(pid: str) -> dict:
    player = game.players[pid]
    if player["finished"]:
        return {
            "rank": player["rank"],
            "rank_bonus": 0,
            "gift_total": 0,
            "gifts": [],
            "budget": player["budget"],
        }

    ranks = [p["rank"] for p in game.players.values() if p["rank"]]
    player["rank"] = (max(ranks) if ranks else 0) + 1
    player["finished"] = True
    if game.winner is None:
        game.winner = pid

    rank_bonus = goal_rank_bonus(player["rank"])
    contributors = [
        game.players[other_pid]
        for other_pid in game.player_order
        if other_pid != pid and not game.players[other_pid]["finished"]
    ]
    contributors.sort(key=lambda p: p.get("budget", 0), reverse=True)

    gifts = []
    gift_total = 0
    if contributors:
        top_cut = math.ceil(len(contributors) / 3)
        mid_cut = math.ceil(len(contributors) * 2 / 3)
        for idx, giver in enumerate(contributors):
            if idx < top_cut:
                gift = GOAL_GIFT_TIERS[0]
            elif idx < mid_cut:
                gift = GOAL_GIFT_TIERS[1]
            else:
                gift = GOAL_GIFT_TIERS[2]
            before = giver["budget"]
            after = apply_budget(giver, -gift)
            paid = before - after
            gift_total += paid
            gifts.append({
                "player_id": giver["id"],
                "name": giver["name"],
                "gift": paid,
                "budget": after,
            })

    new_budget = apply_budget(player, rank_bonus + gift_total)
    player["status"] = (
        f"🏆 {player['rank']}位でゴール！ "
        f"+{rank_bonus + gift_total}pt"
    )
    return {
        "rank": player["rank"],
        "rank_bonus": rank_bonus,
        "gift_total": gift_total,
        "gifts": gifts,
        "budget": new_budget,
    }


async def resolve_round():
    """振った参加者をすぐに解決し、全員が振ったらラウンドを閉じる"""
    if game.game_ended:
        return
    active = [pid for pid in game.player_order if not game.players[pid]["finished"]]
    if not active:
        return
    newly_rolled = [
        pid for pid in active
        if pid in game.pending_rolls and pid not in game.resolved_rolls
    ]
    if not newly_rolled:
        await close_round_if_ready()
        return

    if not game.resolved_rolls:
        game.round_number += 1
        await broadcast_event({
            "kind": "round_resolving",
            "round": game.round_number,
            "message": f"ラウンド {game.round_number} 進行中...",
        })

    move_delay = 0.03 if len(active) >= 12 else 0.4
    event_delay = 0.03 if len(active) >= 12 else 0.5
    effect_move_delay = 0.08 if len(active) >= 12 else 3.2

    for pid in newly_rolled:
        player = game.players[pid]
        roll = game.pending_rolls[pid]
        game.resolved_rolls.add(pid)

        if player["skip_next"]:
            player["skip_next"] = False
            player["status"] = "1回休み"
            await broadcast_player_event(pid, {
                "kind": "skip",
                "player_id": pid,
                "name": player["name"],
                "message": f"{player['name']} は休み中（前ターンのイベント効果）",
            })
            continue

        player["last_roll"] = roll
        old_pos = player["position"]
        new_pos = apply_move(old_pos, roll)
        player["position"] = new_pos
        player["status"] = f"🎲 {roll} → {new_pos}マス目"

        await broadcast_player_event(pid, {
            "kind": "move",
            "player_id": pid,
            "name": player["name"],
            "color": player["color"],
            "roll": roll,
            "from": old_pos,
            "to": new_pos,
        })
        await broadcast_state()
        await asyncio.sleep(move_delay)

        # マスのイベント発動
        square = SQUARES[new_pos]
        budget_delta = BUDGET_EFFECTS.get(square["title"], 0)
        if square["title"] == "バックアップ":
            player["backup"] = True
        elif square["title"] == "MFA設定":
            player["mfa"] = True
        elif square["title"] == "EDR導入":
            player["edr"] = True
        elif square["title"] == "CSIRT訓練":
            player["csirt"] = True
        elif square["title"] == "BCP訓練":
            player["bcp"] = True
        if square["type"] == "goal":
            goal_award = await finish_player(pid)
            await broadcast_player_event(pid, {
                "kind": "goal",
                "player_id": pid,
                "name": player["name"],
                "rank": player["rank"],
                "rank_bonus": goal_award["rank_bonus"],
                "gift_total": goal_award["gift_total"],
                "gifts": goal_award["gifts"],
                "budget": goal_award["budget"],
            })
        elif square["effect"] == "reroll":
            new_budget = apply_budget(player, budget_delta) if budget_delta else player["budget"]
            await broadcast_player_event(pid, {
                "kind": "square",
                "player_id": pid,
                "name": player["name"],
                "square_type": square["type"],
                "square_title": square["title"],
                "square_desc": square["desc"],
                "budget_delta": budget_delta,
                "budget": new_budget,
            })
            await broadcast_state()
            await asyncio.sleep(effect_move_delay)
            extra = random.randint(1, 3)
            old2 = player["position"]
            new2 = apply_move(old2, extra)
            player["position"] = new2
            player["status"] = f"再ロール 🎲 {extra} → {new2}マス目"
            await broadcast_player_event(pid, {
                "kind": "move",
                "player_id": pid,
                "name": player["name"],
                "color": player["color"],
                "roll": extra,
                "from": old2,
                "to": new2,
                "reroll": True,
            })
            # 再ロール後のマス効果は適用しない（連鎖を防ぐ）
        elif square["effect"] == "skip":
            new_budget = apply_budget(player, budget_delta) if budget_delta else player["budget"]
            player["skip_next"] = True
            await broadcast_player_event(pid, {
                "kind": "square",
                "player_id": pid,
                "name": player["name"],
                "square_type": square["type"],
                "square_title": square["title"],
                "square_desc": square["desc"],
                "budget_delta": budget_delta,
                "budget": new_budget,
            })
        elif square["effect"] == "back_to_start":
            chance = ransomware_outbreak_chance(game.ransomware_outbreaks)
            if random.random() > chance:
                before = player["position"]
                after = max(0, before + RANSOMWARE_DORMANT_STEPS)
                player["position"] = after
                player["status"] = "🕵️ ランサム潜伏 -1マス"
                new_budget = apply_budget(player, RANSOMWARE_DORMANT_BUDGET_DELTA)
                await broadcast_player_event(pid, {
                    "kind": "ransomware_dormant",
                    "player_id": pid,
                    "name": player["name"],
                    "square_type": square["type"],
                    "square_title": "ランサムウェア潜伏",
                    "square_desc": "兆候はあったが、今回は大規模感染には至らなかった。発動者のみ軽微な影響。",
                    "from": before,
                    "to": after,
                    "budget_delta": RANSOMWARE_DORMANT_BUDGET_DELTA,
                    "budget": new_budget,
                    "chance": chance,
                    "outbreak_count": game.ransomware_outbreaks,
                })
                await broadcast_state()
                await asyncio.sleep(event_delay)
                continue

            affected = []
            game.ransomware_outbreaks += 1
            player["ransomware_triggers"] = player.get("ransomware_triggers", 0) + 1
            for target_pid in active:
                target = game.players[target_pid]
                if target["finished"]:
                    continue
                before = target["position"]
                defense = ransomware_defense(target)
                if target_pid == pid:
                    after = 0
                    target_delta = min(-10, budget_delta + defense["level"] * 10)
                    target["status"] = (
                        f"💀 ランサム感染 - スタートへ / {defense['label']}軽減"
                        if defense["level"]
                        else "💀 ランサム感染 - スタートに戻る"
                    )
                else:
                    step_delta, target_delta, impact_label = ransomware_blast_impact(
                        defense["level"],
                        target.get("backup", False),
                    )
                    after = max(0, before + step_delta)
                    move_text = f" {step_delta}マス" if step_delta else " 移動なし"
                    target["status"] = f"🚨 {impact_label}{move_text}"
                target["position"] = after
                new_budget = apply_budget(target, target_delta)
                affected.append({
                    "player_id": target_pid,
                    "name": target["name"],
                    "from": before,
                    "to": after,
                    "budget_delta": target_delta,
                    "budget": new_budget,
                    "mitigated": defense["level"] > 0,
                    "defense_level": defense["level"],
                    "defense_items": defense["items"],
                    "defense_label": defense["label"],
                    "trigger": target_pid == pid,
                })
            await broadcast_event({
                "kind": "ransomware",
                "player_id": pid,
                "name": player["name"],
                "square_type": square["type"],
                "square_title": square["title"],
                "square_desc": "全社インシデント発生！発動者はスタートへ。バックアップ、EDR、CSIRT、BCPを複数備えた参加者ほど被害が軽減されます。",
                "affected": affected,
                "chance": chance,
                "outbreak_count": game.ransomware_outbreaks,
            })
        elif isinstance(square["effect"], int) and square["effect"] != 0:
            effect = square["effect"]
            mitigated = False
            mitigation_label = ""
            if square["title"] == "フィッシングメール" and player.get("mfa"):
                effect = -1
                budget_delta = -5
                mitigated = True
                mitigation_label = "MFAで被害軽減"
            elif square["title"] == "標的型攻撃" and player.get("edr"):
                effect = -2
                budget_delta = -10
                mitigated = True
                mitigation_label = "EDRで被害軽減"
            new_budget = apply_budget(player, budget_delta) if budget_delta else player["budget"]
            await broadcast_player_event(pid, {
                "kind": "square",
                "player_id": pid,
                "name": player["name"],
                "square_type": square["type"],
                "square_title": square["title"],
                "square_desc": f"{square['desc']} / {mitigation_label}" if mitigated else square["desc"],
                "budget_delta": budget_delta,
                "budget": new_budget,
                "mitigated": mitigated,
            })
            await broadcast_state()
            await asyncio.sleep(effect_move_delay)
            before_effect = player["position"]
            shifted = apply_move(before_effect, effect)
            player["position"] = shifted
            sign = "+" if effect > 0 else ""
            player["status"] = f"{square['title']} ({sign}{effect})"
            await broadcast_player_event(pid, {
                "kind": "move",
                "player_id": pid,
                "name": player["name"],
                "color": player["color"],
                "roll": abs(effect),
                "from": before_effect,
                "to": shifted,
                "effect_move": True,
                "effect": effect,
                "effect_title": square["title"],
            })
            if shifted >= BOARD_SIZE - 1:
                goal_award = await finish_player(pid)
                await broadcast_player_event(pid, {
                    "kind": "goal",
                    "player_id": pid,
                    "name": player["name"],
                    "rank": player["rank"],
                    "rank_bonus": goal_award["rank_bonus"],
                    "gift_total": goal_award["gift_total"],
                    "gifts": goal_award["gifts"],
                    "budget": goal_award["budget"],
                })

        await broadcast_state()
        await asyncio.sleep(event_delay)

    await close_round_if_ready()


# ============================================================
# WebSocketエンドポイント
# ============================================================

app = FastAPI()


@app.websocket("/ws/host")
async def ws_host(ws: WebSocket):
    """サーバ画面（大画面表示用）"""
    await ws.accept()
    game.host_connections.add(ws)
    # 初回状態送信
    await ws.send_text(json.dumps({
        "type": "init",
        "data": {"squares": SQUARES, "board_size": BOARD_SIZE},
    }))
    await ws.send_text(json.dumps({"type": "state", "data": game.to_dict()}))
    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            action = msg.get("action")
            if action == "start":
                max_rounds = msg.get("max_rounds")
                if isinstance(max_rounds, int):
                    game.max_rounds = max(MIN_ROUNDS, min(MAX_ROUND_LIMIT, max_rounds))
                game.game_started = True
                game.game_ended = False
                game.round_number = 0
                game.ransomware_outbreaks = 0
                await broadcast_event({
                    "kind": "game_start",
                    "message": "ゲーム開始！全員サイコロを振ってください",
                })
                await broadcast_state()
            elif action == "reset":
                game.reset()
                await broadcast_event({
                    "kind": "reset",
                    "message": "ゲームをリセットしました",
                })
                await broadcast_state()
            elif action == "clear_players":
                old_connections = list(game.connections.values())
                game.clear_players()
                await asyncio.gather(
                    *(safe_close(player_ws) for player_ws in old_connections if player_ws),
                    return_exceptions=True,
                )
                await broadcast_event({
                    "kind": "reset",
                    "message": "参加者を全消去して新しい卓を開始できます",
                })
                await broadcast_state()
    except WebSocketDisconnect:
        game.host_connections.discard(ws)
    except Exception:
        game.host_connections.discard(ws)


@app.websocket("/ws/player/{client_id}")
async def ws_player(ws: WebSocket, client_id: str):
    """参加者の接続"""
    await ws.accept()
    try:
        # 最初に名前を受け取る
        raw = await ws.receive_text()
        msg = json.loads(raw)
        if msg.get("action") != "join":
            await ws.close()
            return
        name = msg.get("name", "名無し").strip()[:20] or "名無し"
        player = game.add_player(client_id, name, ws)
        await ws.send_text(json.dumps({
            "type": "joined",
            "data": {"player": player, "squares": SQUARES, "board_size": BOARD_SIZE},
        }))
        await send_state(ws)
        await broadcast_host_event({
            "kind": "join",
            "name": name,
            "message": f"{name} が参加しました",
        })
        await broadcast_host_state()

        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            action = msg.get("action")
            if action == "roll":
                async with game.lock:
                    if not game.game_started:
                        await ws.send_text(json.dumps({
                            "type": "error",
                            "data": {"message": "ゲームがまだ開始されていません"},
                        }))
                        continue
                    if game.game_ended:
                        continue
                    if game.players[client_id]["finished"]:
                        continue
                    if client_id in game.pending_rolls:
                        await resolve_round()
                        continue  # すでにロール済み
                    roll = random.randint(1, 6)
                    game.pending_rolls[client_id] = roll
                    game.players[client_id]["status"] = f"🎲 {roll} を出した（待機中）"
                    await ws.send_text(json.dumps({
                        "type": "rolled",
                        "data": {"value": roll},
                    }))
                    await broadcast_state()
                    # 振った参加者を即時解決し、全員済みならラウンドを閉じる
                    await resolve_round()
    except WebSocketDisconnect:
        game.remove_connection(client_id)
        await broadcast_state()
    except Exception as e:
        print(f"Error: {e}")
        game.remove_connection(client_id)


# ============================================================
# HTMLエンドポイント
# ============================================================

HOST_HTML_PATH = Path(__file__).parent / "host.html"
CLIENT_HTML_PATH = Path(__file__).parent / "client.html"


@app.get("/", response_class=HTMLResponse)
async def host_page():
    return HOST_HTML_PATH.read_text(encoding="utf-8")


@app.get("/play", response_class=HTMLResponse)
async def client_page():
    return CLIENT_HTML_PATH.read_text(encoding="utf-8")


# ============================================================
# 起動
# ============================================================

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


if __name__ == "__main__":
    ip = get_local_ip()
    port = 8000
    print("=" * 60)
    print("  サイバーすごろく サーバ起動")
    print("=" * 60)
    print(f"  サーバ画面（大画面表示用）:  http://{ip}:{port}/")
    print(f"  参加者画面:                  http://{ip}:{port}/play")
    print(f"  ローカル確認用:              http://localhost:{port}/")
    print("=" * 60)
    print("  Ctrl+C で停止")
    print()
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
