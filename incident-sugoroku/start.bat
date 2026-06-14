@echo off
chcp 65001 > nul
echo ==========================================
echo   サイバーすごろく サーバ起動準備
echo ==========================================
echo.

REM 仮想環境がなければ作成
if not exist venv (
    echo [1/3] 仮想環境を作成中...
    python -m venv venv
    if errorlevel 1 (
        echo Pythonが見つかりません。Python 3.10以上をインストールしてください。
        pause
        exit /b 1
    )
)

echo [2/3] 仮想環境をアクティベート...
call venv\Scripts\activate.bat

echo [3/3] 依存パッケージを確認...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo 依存パッケージのインストールに失敗しました。
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   サーバを起動します
echo ==========================================
echo.
python server.py

pause
