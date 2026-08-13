import time
import numpy as np
import pandas as pd
import requests
import streamlit as st
import yfinance as yf

# 設定 Streamlit 頁面標題與佈局
st.set_page_config(
    page_title="台股低估值技術面篩選器",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.title("📈 台股低估值 + 技術面反轉篩選器")
st.caption(
    "結合證交所 OpenAPI（基本面）、證交所 MIS 盤中 API（即時價）與 Yahoo Finance（歷史 K 線）"
)


# 1. 抓取證交所 OpenAPI：取得每日個股本益比與股價淨值比
@st.cache_data(ttl=3600)  # 快取 1 小時，避免頻繁請求證交所靜態資料
def fetch_twse_valuation(pe_limit, pb_limit):
    url = "https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_d"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()
        df = pd.DataFrame(data)

        df = df[["Code", "Name", "PEratio", "PBratio"]].copy()
        df["PEratio"] = pd.to_numeric(df["PEratio"], errors="coerce")
        df["PBratio"] = pd.to_numeric(df["PBratio"], errors="coerce")

        filtered_df = df[
            (df["PEratio"] < pe_limit) | (df["PBratio"] < pb_limit)
        ].dropna()
        return filtered_df
    except Exception as e:
        st.error(f"取得證交所估值資料失敗: {e}")
        return pd.DataFrame()


# 2. 抓取證交所 MIS 盤中即時 API
def fetch_twse_realtime_prices(stock_codes):
    if not stock_codes:
        return {}

    batch_size = 50
    realtime_data = {}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    for i in range(0, len(stock_codes), batch_size):
        batch = stock_codes[i : i + batch_size]
        ex_ch = "|".join([f"tse_{code}.tw" for code in batch])
        url = f"https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch={ex_ch}"

        try:
            res = requests.get(url, headers=headers, timeout=5)
            data = res.json()
            if "msgArray" in data:
                for item in data["msgArray"]:
                    code = item.get("c")
                    price_str = item.get("z")
                    if price_str == "-" or not price_str:
                        price_str = item.get("a", "").split("_")[0]

                    if price_str and price_str != "-":
                        realtime_data[code] = float(price_str)
        except Exception:
            pass
        time.sleep(0.1)

    return realtime_data


# 3. 計算技術指標與判斷訊號
def check_technical_signals(df):
    if len(df) < 35:
        return False, False, False

    close = df["Close"].copy()

    # MACD 計算
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    dif = ema12 - ema26
    macd_signal = dif.ewm(span=9, adjust=False).mean()
    macd_hist = dif - macd_signal

    macd_red = (macd_hist.iloc[-2] <= 0) and (macd_hist.iloc[-1] > 0)

    # SKDJ 計算
    low_9 = df["Low"].rolling(9).min()
    high_9 = df["High"].rolling(9).max()
    rsv = (close - low_9) / (high_9 - low_9 + 1e-8) * 100
    k = rsv.ewm(alpha=1 / 3, adjust=False).mean()
    d = k.ewm(alpha=1 / 3, adjust=False).mean()

    skdj_cross = (k.iloc[-2] <= d.iloc[-2]) and (k.iloc[-1] > d.iloc[-1])

    # RSI 底背離計算 (14日)
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / (loss + 1e-8)
    rsi = 100 - (100 / (1 + rs))

    rsi_divergence = False
    if len(df) >= 20:
        recent_close = close.iloc[-20:]
        recent_rsi = rsi.iloc[-20:]

        min_price_idx = recent_close.idxmin()
        curr_price = close.iloc[-1]
        curr_rsi = rsi.iloc[-1]

        if (
            curr_price <= recent_close.min() * 1.02
            and curr_rsi > recent_rsi.loc[min_price_idx]
        ):
            rsi_divergence = True

    return macd_red, skdj_cross, rsi_divergence


# 側邊欄：參數設定
st.sidebar.header("篩選條件設定")
pe_limit = st.sidebar.slider("本益比 (PE) 上限", 5.0, 30.0, 15.0, 0.5)
pb_limit = st.sidebar.slider("股價淨值比 (PB) 上限", 0.5, 3.0, 1.2, 0.1)
max_scan_count = st.sidebar.number_input(
    "最大掃描檔數 (避免耗時過久)",
    min_value=10,
    max_value=1000,
    value=100,
    step=10,
)

start_scan = st.sidebar.button("🚀 開始執行掃描", type="primary")

# 主頁面邏輯
if start_scan:
    st.info("正在連線至證交所獲取估值清單...")
    valuation_df = fetch_twse_valuation(pe_limit, pb_limit)

    if valuation_df.empty:
        st.warning("未抓取到符合估值條件的股票，請放寬門檻後重試。")
    else:
        stock_codes = valuation_df["Code"].tolist()[:max_scan_count]
        st.write(
            f"已鎖定前 **{len(stock_codes)}** 檔低估值標的，開始擷取盤中即時價與歷史數據..."
        )

        # 抓取盤中即時價
        realtime_prices = fetch_twse_realtime_prices(stock_codes)

        results = []
        progress_bar = st.progress(0)
        status_text = st.empty()

        total = len(stock_codes)
        for idx, code in enumerate(stock_codes):
            status_text.text(f"掃描中 ({idx+1}/{total}): {code}")
            progress_bar.progress((idx + 1) / total)

            symbol = f"{code}.TW"
            try:
                hist = yf.download(symbol, period="60d", progress=False)
                if hist.empty or len(hist) < 35:
                    continue

                if isinstance(hist.columns, pd.MultiIndex):
                    hist.columns = hist.columns.get_level_values(0)

                if code in realtime_prices:
                    hist.iloc[-1, hist.columns.get_loc("Close")] = (
                        realtime_prices[code]
                    )

                macd_red, skdj_cross, rsi_div = check_technical_signals(hist)

                if macd_red and skdj_cross and rsi_div:
                    stock_info = valuation_df[
                        valuation_df["Code"] == code
                    ].iloc[0]
                    results.append(
                        {
                            "股票代號": code,
                            "股票名稱": stock_info["Name"],
                            "盤中即時價": realtime_prices.get(code, "N/A"),
                            "本益比(PE)": stock_info["PEratio"],
                            "股價淨值比(PB)": stock_info["PBratio"],
                            "MACD柱狀圖": "翻紅",
                            "SKDJ": "金叉",
                            "RSI背離": "發生",
                        }
                    )
            except Exception:
                continue

        status_text.empty()
        progress_bar.empty()

        # 顯示結果表格
        st.subheader("📋 篩選結果")
        if results:
            result_df = pd.DataFrame(results)
            st.dataframe(result_df, use_container_width=True)
            st.success(f"掃描完成！共找到 {len(results)} 檔符合條件的標的。")
        else:
            st.warning("目前盤中暫無同時符合全部技術面與低估值條件的股票。")
else:
    st.info("請於左側設定篩選參數，並點擊「開始執行掃描」按鈕。")