import re
import socket
import subprocess
import threading
import tkinter as tk
from tkinter import ttk
import urllib.request


# -- Network check helpers -------------------------------------------------

def check_internet():
    try:
        urllib.request.urlopen("http://www.google.com", timeout=3)
        return True
    except Exception:
        return False


def check_ping(host="8.8.8.8"):
    if not host:
        return None
    try:
        result = subprocess.run(
            ["ping", "-n", "1", "-w", "1000", host],
            capture_output=True,
            text=True,
            encoding="cp932",
            errors="ignore",
        )
        for line in result.stdout.splitlines():
            if "time" in line.lower() or "時間" in line:
                match = re.search(r"(?:time|時間)[=<]?\s*(\d+)\s*ms", line, re.IGNORECASE)
                if match:
                    return int(match.group(1))
                fallback = re.search(r"(\d+)\s*ms", line, re.IGNORECASE)
                if fallback:
                    return int(fallback.group(1))
        return None
    except Exception:
        return None


def check_dns():
    try:
        socket.gethostbyname("www.google.com")
        return True
    except Exception:
        return False


def get_default_gateway():
    try:
        result = subprocess.run(
            ["ipconfig"],
            capture_output=True,
            text=True,
            encoding="cp932",
            errors="ignore",
        )
        for line in result.stdout.splitlines():
            if "デフォルト ゲートウェイ" in line or "Default Gateway" in line:
                parts = line.split(":", 1)
                if len(parts) > 1:
                    gateway = parts[1].strip()
                    if gateway:
                        return gateway
        return None
    except Exception:
        return None


def check_adapter():
    try:
        result = subprocess.run(
            ["ipconfig"],
            capture_output=True,
            text=True,
            encoding="cp932",
            errors="ignore",
        )
        for line in result.stdout.splitlines():
            if "IPv4" in line or "IPv6" in line:
                parts = line.split(":", 1)
                if len(parts) > 1 and parts[1].strip():
                    return True
        return False
    except Exception:
        return False


STEPS = [
    {
        "id": "adapter",
        "title": "1. ネットワークアダプター確認",
        "desc": "PCのネットワークアダプターが有効か確認しています...",
        "auto": True,
    },
    {
        "id": "cable",
        "title": "2. ケーブル / Wi-Fi接続確認",
        "desc": "有線の場合はLANケーブルが刺さっているか、\nWi-Fiの場合は接続されているか確認してください。",
        "auto": False,
    },
    {
        "id": "gateway",
        "title": "3. ルーター（ゲートウェイ）への接続確認",
        "desc": "ルーターへのpingを確認しています...",
        "auto": True,
    },
    {
        "id": "router_lamp",
        "title": "4. ルーターのランプ確認",
        "desc": "ルーターのインターネットランプが正常（緑など）に\n点灯しているか確認してください。",
        "auto": False,
    },
    {
        "id": "external",
        "title": "5. 外部IPへの接続確認",
        "desc": "インターネット上のサーバー（8.8.8.8）への\nping を確認しています...",
        "auto": True,
    },
    {
        "id": "dns",
        "title": "6. DNS解決確認",
        "desc": "ドメイン名の解決（DNS）を確認しています...",
        "auto": True,
    },
]

ADVICE = {
    "adapter": "ネットワークアダプターが無効です。\nデバイスマネージャーでアダプターを有効にしてください。",
    "cable": "ケーブルまたはWi-Fi接続に問題があります。\nケーブルを挿し直すか、Wi-Fiに再接続してください。",
    "gateway": "ルーターに届いていません。\nルーターの電源を確認し、再起動してみてください。",
    "router_lamp": "ルーターがインターネットに繋がっていない可能性があります。\nプロバイダー側の障害情報を確認してください。",
    "external": "インターネットへの経路に問題があります。\nプロバイダーへ問い合わせてください。",
    "dns": "DNS設定に問題があります。\nDNSサーバーを 8.8.8.8（Google）に変更してみてください。",
    "ok": "すべての項目が正常です。\n特定のサービスやサイトが停止している可能性があります。",
}

SIM_OPTIONS = ["実測", "正常", "警告", "異常"]

BG = "#1e1e1e"
PANEL = "#2a2a2a"
TEXT = "#ffffff"
MUTED = "#bdbdbd"
OK = "#4caf50"
WARN = "#ff9800"
ERR = "#f44336"
BLUE = "#1565c0"


def run_in_thread(task, on_done):
    def worker():
        result = task()
        root = tk._default_root
        if root is not None:
            root.after(0, lambda: on_done(result))

    threading.Thread(target=worker, daemon=True).start()


class StatusRow(tk.Frame):
    def __init__(self, master, label):
        super().__init__(master, bg=PANEL, padx=12, pady=8)
        self.columnconfigure(0, weight=1)

        tk.Label(self, text=label, bg=PANEL, fg=MUTED, font=("Segoe UI", 10)).grid(
            row=0, column=0, sticky="w"
        )
        self.value = tk.Label(
            self,
            text="確認中...",
            bg=PANEL,
            fg=MUTED,
            font=("Segoe UI", 14, "bold"),
        )
        self.value.grid(row=1, column=0, sticky="w", pady=(4, 0))

        self.sim_var = tk.StringVar(value="実測")
        self.sim_box = ttk.Combobox(
            self,
            values=SIM_OPTIONS,
            textvariable=self.sim_var,
            state="readonly",
            width=7,
        )
        self.sim_box.grid(row=0, column=1, rowspan=2, padx=(12, 0), sticky="e")

    def get_sim(self):
        return self.sim_var.get()

    def set_ok(self, text):
        self.value.configure(text=text, fg=OK)

    def set_warn(self, text):
        self.value.configure(text=text, fg=WARN)

    def set_error(self, text):
        self.value.configure(text=text, fg=ERR)

    def set_pending(self, text="確認中..."):
        self.value.configure(text=text, fg=MUTED)


class DiagnosticWizard(tk.Toplevel):
    def __init__(self, master):
        super().__init__(master)
        self.title("接続診断")
        self.configure(bg=BG)
        self.resizable(False, False)
        self.geometry("380x280")
        self.current = 0

        self.transient(master)
        self.grab_set()

        self.title_label = tk.Label(
            self, bg=BG, fg=TEXT, font=("Segoe UI", 12, "bold"), anchor="w"
        )
        self.title_label.pack(fill="x", padx=20, pady=(20, 8))

        self.desc_label = tk.Label(
            self,
            bg=BG,
            fg="#cccccc",
            font=("Segoe UI", 10),
            justify="left",
            anchor="nw",
            wraplength=330,
        )
        self.desc_label.pack(fill="x", padx=20)

        self.result_label = tk.Label(
            self, bg=BG, fg=MUTED, font=("Segoe UI", 11, "bold"), anchor="center"
        )
        self.result_label.pack(fill="x", padx=20, pady=16)

        spacer = tk.Frame(self, bg=BG)
        spacer.pack(expand=True, fill="both")

        self.button_frame = tk.Frame(self, bg=BG)
        self.button_frame.pack(fill="x", padx=20, pady=(0, 12))
        self.button_frame.columnconfigure((0, 1), weight=1)

        self.ng_btn = tk.Button(
            self.button_frame,
            text="異常 X",
            bg=ERR,
            fg=TEXT,
            activebackground="#e53935",
            activeforeground=TEXT,
            relief="flat",
            command=lambda: self.next_step(False),
        )
        self.ng_btn.grid(row=0, column=0, sticky="ew", padx=(0, 6), ipady=8)

        self.ok_btn = tk.Button(
            self.button_frame,
            text="正常 >",
            bg=OK,
            fg=TEXT,
            activebackground="#45a049",
            activeforeground=TEXT,
            relief="flat",
            command=lambda: self.next_step(True),
        )
        self.ok_btn.grid(row=0, column=1, sticky="ew", padx=(6, 0), ipady=8)

        self.close_btn = tk.Button(
            self,
            text="閉じる",
            bg="#555555",
            fg=TEXT,
            activebackground="#666666",
            activeforeground=TEXT,
            relief="flat",
            command=self.destroy,
        )

        self.show_step(0)

    def show_step(self, index):
        step = STEPS[index]
        self.title_label.configure(text=step["title"])
        self.desc_label.configure(text=step["desc"], fg="#cccccc")
        self.result_label.configure(text="", fg=MUTED)

        self.button_frame.pack(fill="x", padx=20, pady=(0, 12))
        self.close_btn.pack_forget()

        if step["auto"]:
            self.ok_btn.configure(state="disabled")
            self.ng_btn.configure(state="disabled")
            self.result_label.configure(text="確認中...", fg=MUTED)
            run_in_thread(lambda: self.auto_check(step["id"]), self.on_auto_done)
        else:
            self.ok_btn.configure(state="normal")
            self.ng_btn.configure(state="normal")

    def auto_check(self, step_id):
        if step_id == "adapter":
            return check_adapter()
        if step_id == "gateway":
            gateway = get_default_gateway()
            return check_ping(gateway) is not None if gateway else False
        if step_id == "external":
            return check_ping("8.8.8.8") is not None
        if step_id == "dns":
            return check_dns()
        return False

    def on_auto_done(self, ok):
        if not self.winfo_exists():
            return
        if ok:
            self.result_label.configure(text="OK 正常", fg=OK)
            self.after(800, lambda: self.next_step(True))
        else:
            self.result_label.configure(text="NG 異常を検出", fg=ERR)
            self.after(800, lambda: self.next_step(False))

    def next_step(self, ok):
        if not self.winfo_exists():
            return
        step = STEPS[self.current]
        if not ok:
            self.show_advice(step["id"])
            return

        self.current += 1
        if self.current >= len(STEPS):
            self.show_advice("ok")
        else:
            self.show_step(self.current)

    def show_advice(self, step_id):
        self.title_label.configure(text="診断結果")
        self.desc_label.configure(text=ADVICE[step_id], fg=OK if step_id == "ok" else WARN)
        self.result_label.configure(text="")
        self.button_frame.pack_forget()
        self.close_btn.pack(fill="x", padx=20, pady=(0, 18), ipady=8)


class NetMonitor(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("通信状況モニター")
        self.configure(bg=BG)
        self.resizable(False, False)
        self.geometry("340x340")

        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure(
            "TCombobox",
            fieldbackground="#3a3a3a",
            background="#3a3a3a",
            foreground=TEXT,
            arrowcolor=TEXT,
        )

        tk.Label(
            self,
            text="通信状況モニター",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 13, "bold"),
        ).pack(fill="x", padx=16, pady=(16, 14))

        self.row_internet = StatusRow(self, "インターネット接続")
        self.row_ping = StatusRow(self, "Ping (Google DNS)")
        self.row_dns = StatusRow(self, "DNS 解決")

        for row in (self.row_internet, self.row_ping, self.row_dns):
            row.pack(fill="x", padx=16, pady=(0, 12))

        self.diag_btn = tk.Button(
            self,
            text="接続診断を開始",
            bg=BLUE,
            fg=TEXT,
            activebackground="#1976d2",
            activeforeground=TEXT,
            relief="flat",
            command=self.open_diagnostic,
        )
        self.diag_btn.pack(fill="x", padx=16, ipady=9)

        self.update_status()

    def update_status(self):
        self.apply_simulation_states()
        run_in_thread(self.read_real_status, self.apply_real_status)
        self.after(5000, self.update_status)

    def apply_simulation_states(self):
        if self.row_internet.get_sim() == "実測":
            self.row_internet.set_pending()
        if self.row_ping.get_sim() == "実測":
            self.row_ping.set_pending()
        if self.row_dns.get_sim() == "実測":
            self.row_dns.set_pending()

    def read_real_status(self):
        return {
            "internet": check_internet(),
            "ping": check_ping(),
            "dns": check_dns(),
        }

    def apply_real_status(self, status):
        sim = self.row_internet.get_sim()
        if sim == "正常":
            self.row_internet.set_ok("正常 [SIM]")
        elif sim == "警告":
            self.row_internet.set_warn("不安定 [SIM]")
        elif sim == "異常":
            self.row_internet.set_error("接続なし [SIM]")
        elif status["internet"]:
            self.row_internet.set_ok("正常")
        else:
            self.row_internet.set_error("接続なし")

        sim = self.row_ping.get_sim()
        if sim == "正常":
            self.row_ping.set_ok("8 ms [SIM]")
        elif sim == "警告":
            self.row_ping.set_warn("120 ms [SIM]")
        elif sim == "異常":
            self.row_ping.set_error("タイムアウト [SIM]")
        else:
            ping = status["ping"]
            if ping is None:
                self.row_ping.set_error("タイムアウト")
            elif ping < 50:
                self.row_ping.set_ok(f"{ping} ms")
            elif ping < 150:
                self.row_ping.set_warn(f"{ping} ms")
            else:
                self.row_ping.set_error(f"{ping} ms")

        sim = self.row_dns.get_sim()
        if sim == "正常":
            self.row_dns.set_ok("正常 [SIM]")
        elif sim == "警告":
            self.row_dns.set_warn("遅延あり [SIM]")
        elif sim == "異常":
            self.row_dns.set_error("失敗 [SIM]")
        elif status["dns"]:
            self.row_dns.set_ok("正常")
        else:
            self.row_dns.set_error("失敗")

    def open_diagnostic(self):
        DiagnosticWizard(self)


if __name__ == "__main__":
    NetMonitor().mainloop()
