import time
import numpy as np
import pandas as pd
import requests
import streamlit as st
import yfinance as yf

st.set_page_config(
    page_title="台股低估值技術面篩選器",
    layout="wide",
)

st.title("📈 台股低估值 + 技術面反轉篩選器")
st.caption("結合證交所 OpenAPI（基本面）與 Yahoo Finance（技術面）")


@st.cache_data(ttl=3600)
def fetch_twse_valuation(pe_limit, pb_limit):
    url = "https://openapi.twse.com.tw/v1/exchangeReport/BWIBBU_d"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        df = pd.DataFrame(response.json())
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


def check_technical_signals(
    df, lookback_days=20, check_macd=True, check_skdj=True, check_rsi=True
):
    if len(df) < 50:
        return False, False, False

    close = df["Close"].copy()

    # 1. MACD 柱狀圖翻紅（近 N 天內只要出現過一次即符合）
    macd_red = True
    if check_macd:
        ema12 = close.ewm(span=12, adjust=False).mean()
        ema26 = close.ewm(span=26, adjust=False).mean()
        dif = ema12 - ema26
        macd_signal = dif.ewm(span=9, adjust=False).mean()
        macd_hist = dif - macd_signal

        # 計算歷史每一天是否出現「負轉正」
        turn_red = (macd_hist.shift(1) <= 0) & (macd_hist > 0)
        # 檢查最近 lookback_days 天內是否有發生過
        macd_red = turn_red.iloc[-lookback_days:].any()

    # 2. SKDJ 金叉（近 N 天內只要出現過一次即符合）
    skdj_cross = True
    if check_skdj:
        low_9 = df["Low"].rolling(9).min()
        high_9 = df["High"].rolling(9).max()
        rsv = (close - low_9) / (high_9 - low_9 + 1e-8) * 100
        k = rsv.ewm(alpha=1 / 3, adjust=False).mean()
        d = k.ewm(alpha=1 / 3, adjust=False).mean()

        # 計算歷史每一天是否出現「K 向上穿越 D」
        cross_up = (k.shift(1) <= d.shift(1)) & (k > d)
        skdj_cross = cross_up.iloc[-lookback_days:].any()

    # 3. RSI 底背離（近 N 天內出現過最低價，且該低點 RSI 高於更早前的低點）
    rsi_div = True
    if check_rsi:
        delta = close.diff()
        gain = delta.clip(lower=0).rolling(14).mean()
        loss = (-delta.clip(upper=0)).rolling(14).mean()
        rs = gain / (loss + 1e-8)
        rsi = 100 - (100 / (1 + rs))

        # 前期歷史窗口（前 20~40 天）
        past_close = close.iloc[-(lookback_days * 2) : -lookback_days]
        past_rsi = rsi.iloc[-(lookback_days * 2) : -lookback_days]

        # 近期觀察窗口（近 20 天）
        recent_close = close.iloc[-lookback_days:]
        recent_rsi = rsi.iloc[-lookback_days:]

        if not past_close.empty and not recent_close.empty:
            past_min_idx = past_close.idxmin()
            past_min_price = past_close.loc[past_min_idx]
            past_min_rsi = past_rsi.loc[past_min_idx]

            recent_min_idx = recent_close.idxmin()
            recent_min_price = recent_close.loc[recent_min_idx]
            recent_min_rsi = recent_rsi.loc[recent_min_idx]

            # 近 20 天的低點價格小於或接近前期低點，但近 20 天對應的 RSI 高於前期 RSI
            rsi_div = (recent_min_price <= past_min_price * 1.02) and (
                recent_min_rsi > past_min_rsi
            )
        else:
            rsi_div = False

    return bool(macd_red), bool(skdj_cross), bool(rsi_div)


# 側邊欄控制
st.sidebar.header("1. 估值門檻設定")
pe_limit = st.sidebar.slider("本益比 (PE) 上限", 5.0, 40.0, 20.0, 0.5)
pb_limit = st.sidebar.slider("股價淨值比 (PB) 上限", 0.5, 3.0, 1.2, 0.1)

st.sidebar.header("2. 技術面觀察窗口")
lookback_days = st.sidebar.slider(
    "訊號發生天數範圍 (天內)", 5, 30, 20, 1
)

st.sidebar.header("3. 技術面條件")
use_macd = st.sidebar.checkbox("MACD 柱狀圖翻紅", value=True)
use_skdj = st.sidebar.checkbox("SKDJ 金叉", value=True)
use_rsi = st.sidebar.checkbox("RSI 底背離", value=True)

st.sidebar.header("4. 掃描範圍")
max_scan_count = st.sidebar.number_input(
    "掃描檔數", min_value=20, max_value=1000, value=200, step=20
)

start_scan = st.sidebar.button("🚀 開始執行掃描", type="primary")

if start_scan:
    st.info("正在存取證交所估值資料...")
    valuation_df = fetch_twse_valuation(pe_limit, pb_limit)

    if valuation_df.empty:
        st.warning("未抓取到符合估值條件的股票，請放寬 PE/PB 門檻。")
    else:
        stock_codes = valuation_df["Code"].tolist()[:max_scan_count]
        st.write(
            f"正在分析前 **{len(stock_codes)}** 檔標的近 {lookback_days} 天的技術面數據..."
        )

        results = []
        progress_bar = st.progress(0)
        status_text = st.empty()

        total = len(stock_codes)
        for idx, code in enumerate(stock_codes):
            status_text.text(f"掃描進度 ({idx+1}/{total}): {code}")
            progress_bar.progress((idx + 1) / total)

            symbol = f"{code}.TW"
            try:
                hist = yf.download(symbol, period="90d", progress=False)
                if hist.empty or len(hist) < 50:
                    continue

                if isinstance(hist.columns, pd.MultiIndex):
                    hist.columns = hist.columns.get_level_values(0)

                m_red, s_cross, r_div = check_technical_signals(
                    hist,
                    lookback_days=lookback_days,
                    check_macd=use_macd,
                    check_skdj=use_skdj,
                    check_rsi=use_rsi,
                )

                if m_red and s_cross and r_div:
                    stock_info = valuation_df[
                        valuation_df["Code"] == code
                    ].iloc[0]
                    results.append(
                        {
                            "股票代號": code,
                            "股票名稱": stock_info["Name"],
                            "最新收盤價": round(
                                float(hist["Close"].iloc[-1]), 2
                            ),
                            "本益比(PE)": stock_info["PEratio"],
                            "股價淨值比(PB)": stock_info["PBratio"],
                        }
                    )
            except Exception:
                continue

        status_text.empty()
        progress_bar.empty()

        st.subheader("📋 篩選結果")
        if results:
            result_df = pd.DataFrame(results)
            st.dataframe(result_df, use_container_width=True)
            st.success(f"掃描完成，共找到 {len(results)} 檔符合條件的股票。")
        else:
            st.warning("近 20 天內未找到同時滿足上述條件的個股。")
