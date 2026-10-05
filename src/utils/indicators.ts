import {
  CandleData,
  TechnicalIndicators,
  SignalCheckResult,
  ScanFilterParams,
  SupportResistanceLevels,
  RightSideTradeEvaluation,
  RightSideTradeStatus,
  QuantStrategyActionPlan,
  VolumePriceDeepAnalysis,
  ValuationAssessment,
  ValuationTag,
  StructuralPriceAnalysis,
  StructuralKeyBar,
  IndicatorCrossStatus,
  TimeframeRiskAssessment,
  TimeframeRiskItem,
  MovingAverageDeduction,
  SystemDeficiencyItem,
} from '../types';

/**
 * Calculates exponential moving average (EMA)
 */
export function calculateEma(values: number[], span: number): number[] {
  if (values.length === 0) return [];
  const alpha = 2 / (span + 1);
  const result: number[] = new Array(values.length);
  result[0] = values[0];
  for (let i = 1; i < values.length; i++) {
    result[i] = alpha * values[i] + (1 - alpha) * result[i - 1];
  }
  return result;
}

/**
 * Computes Simple Moving Average (SMA)
 */
export function calculateSma(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      const window = values.slice(0, i + 1);
      result[i] = window.reduce((a, b) => a + b, 0) / window.length;
    } else {
      const window = values.slice(i - period + 1, i + 1);
      result[i] = window.reduce((a, b) => a + b, 0) / period;
    }
  }
  return result;
}

/**
 * Computes all technical indicators: MACD, PPO (%), SKDJ, RSI, Price MAs (5, 10, 20, 60),
 * Volume MAs (5, 20, 60), BIAS (%), Bollinger Bands (20, 2)
 */
export function computeTechnicalIndicators(candles: CandleData[]): TechnicalIndicators {
  const n = candles.length;
  if (n === 0) {
    return {
      ma5: [],
      ma10: [],
      ma20: [],
      ma60: [],
      volMa5: [],
      volMa20: [],
      volMa60: [],
      bias20: [],
      bias60: [],
      ema12: [],
      ema26: [],
      dif: [],
      macdSignal: [],
      macdHist: [],
      ppoLine: [],
      ppoSignal: [],
      ppoHist: [],
      k: [],
      d: [],
      rsv: [],
      rsi: [],
      bollingerUpper: [],
      bollingerMiddle: [],
      bollingerLower: [],
      bollingerPercentB: [],
    };
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  // 1. Moving Averages for Price (MA5, MA10, MA20, MA60)
  const ma5 = calculateSma(closes, 5);
  const ma10 = calculateSma(closes, 10);
  const ma20 = calculateSma(closes, 20);
  const ma60 = calculateSma(closes, 60);

  // 2. Moving Averages for Volume (Vol MA5, Vol MA20, Vol MA60)
  const volMa5 = calculateSma(volumes, 5);
  const volMa20 = calculateSma(volumes, 20);
  const volMa60 = calculateSma(volumes, 60);

  // 3. BIAS (乖離率 %)
  const bias20: (number | null)[] = closes.map((c, i) => {
    const ma = ma20[i];
    if (ma === null || ma === 0) return null;
    return ((c - ma) / ma) * 100;
  });

  const bias60: (number | null)[] = closes.map((c, i) => {
    const ma = ma60[i];
    if (ma === null || ma === 0) return null;
    return ((c - ma) / ma) * 100;
  });

  // 4. MACD
  const ema12 = calculateEma(closes, 12);
  const ema26 = calculateEma(closes, 26);
  const dif = ema12.map((val, i) => val - ema26[i]);
  const macdSignal = calculateEma(dif, 9);
  const macdHist = dif.map((val, i) => val - macdSignal[i]);

  // 5. PPO (Percentage Price Oscillator)
  // PPO Line = ((EMA12 - EMA26) / EMA26) * 100%
  // PPO Signal = 9-day EMA of PPO Line
  // PPO Hist = PPO Line - PPO Signal
  const ppoLine = ema12.map((val, i) => {
    const e26 = ema26[i];
    if (!e26 || e26 === 0) return 0;
    return ((val - e26) / e26) * 100;
  });
  const ppoSignal = calculateEma(ppoLine, 9);
  const ppoHist = ppoLine.map((val, i) => val - ppoSignal[i]);

  // 6. SKDJ / Slow KD (9-day window)
  const rsv: (number | null)[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - 8);
    const windowHighs = highs.slice(start, i + 1);
    const windowLows = lows.slice(start, i + 1);
    const highest = Math.max(...windowHighs);
    const lowest = Math.min(...windowLows);

    if (highest === lowest) {
      rsv[i] = 50;
    } else {
      rsv[i] = ((closes[i] - lowest) / (highest - lowest)) * 100;
    }
  }

  const k: (number | null)[] = new Array(n).fill(null);
  const d: (number | null)[] = new Array(n).fill(null);
  let prevK = 50;
  let prevD = 50;

  for (let i = 0; i < n; i++) {
    const curRsv = rsv[i] !== null ? rsv[i]! : 50;
    prevK = (2 / 3) * prevK + (1 / 3) * curRsv;
    prevD = (2 / 3) * prevD + (1 / 3) * prevK;
    k[i] = prevK;
    d[i] = prevD;
  }

  // 7. RSI (14-day)
  const rsi: (number | null)[] = new Array(n).fill(null);
  const rsiPeriod = 14;
  let gains: number[] = [];
  let losses: number[] = [];

  for (let i = 1; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);

    if (i >= rsiPeriod) {
      const avgGain = gains.slice(i - rsiPeriod, i).reduce((a, b) => a + b, 0) / rsiPeriod;
      const avgLoss = losses.slice(i - rsiPeriod, i).reduce((a, b) => a + b, 0) / rsiPeriod;

      if (avgLoss === 0) {
        rsi[i] = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi[i] = 100 - 100 / (1 + rs);
      }
    } else {
      rsi[i] = 50;
    }
  }
  if (n > 0 && rsi[0] === null) rsi[0] = 50;

  // 8. Bollinger Bands (20-day, 2 standard deviations)
  const bollingerUpper: (number | null)[] = new Array(n).fill(null);
  const bollingerMiddle: (number | null)[] = ma20;
  const bollingerLower: (number | null)[] = new Array(n).fill(null);
  const bollingerPercentB: (number | null)[] = new Array(n).fill(null);

  const bbPeriod = 20;
  for (let i = 0; i < n; i++) {
    const mid = ma20[i];
    if (mid === null) continue;

    const start = Math.max(0, i - bbPeriod + 1);
    const windowCloses = closes.slice(start, i + 1);
    const variance =
      windowCloses.reduce((acc, val) => acc + Math.pow(val - mid, 2), 0) / windowCloses.length;
    const stdDev = Math.sqrt(variance);

    const upper = mid + 2 * stdDev;
    const lower = mid - 2 * stdDev;

    bollingerUpper[i] = upper;
    bollingerLower[i] = lower;

    if (upper === lower) {
      bollingerPercentB[i] = 0.5;
    } else {
      bollingerPercentB[i] = (closes[i] - lower) / (upper - lower);
    }
  }

  return {
    ma5,
    ma10,
    ma20,
    ma60,
    volMa5,
    volMa20,
    volMa60,
    bias20,
    bias60,
    ema12,
    ema26,
    dif,
    macdSignal,
    macdHist,
    ppoLine,
    ppoSignal,
    ppoHist,
    k,
    d,
    rsv,
    rsi,
    bollingerUpper,
    bollingerMiddle,
    bollingerLower,
    bollingerPercentB,
  };
}

/**
 * Align and slice indicators to exactly match the target candle count
 */
export function sliceIndicators(ind: TechnicalIndicators, count: number): TechnicalIndicators {
  const sliceArr = <T>(arr: T[] | undefined): T[] => (arr ? arr.slice(-count) : []);
  return {
    ma5: sliceArr(ind.ma5),
    ma10: sliceArr(ind.ma10),
    ma20: sliceArr(ind.ma20),
    ma60: sliceArr(ind.ma60),
    volMa5: sliceArr(ind.volMa5),
    volMa20: sliceArr(ind.volMa20),
    volMa60: sliceArr(ind.volMa60),
    bias20: sliceArr(ind.bias20),
    bias60: sliceArr(ind.bias60),
    ema12: sliceArr(ind.ema12),
    ema26: sliceArr(ind.ema26),
    dif: sliceArr(ind.dif),
    macdSignal: sliceArr(ind.macdSignal),
    macdHist: sliceArr(ind.macdHist),
    ppoLine: sliceArr(ind.ppoLine),
    ppoSignal: sliceArr(ind.ppoSignal),
    ppoHist: sliceArr(ind.ppoHist),
    k: sliceArr(ind.k),
    d: sliceArr(ind.d),
    rsv: sliceArr(ind.rsv),
    rsi: sliceArr(ind.rsi),
    bollingerUpper: sliceArr(ind.bollingerUpper),
    bollingerMiddle: sliceArr(ind.bollingerMiddle),
    bollingerLower: sliceArr(ind.bollingerLower),
    bollingerPercentB: sliceArr(ind.bollingerPercentB),
  };
}

/**
 * PE & PB Valuation Assessment Engine
 */
export function evaluateValuation(pe: number, pb: number, industry?: string): ValuationAssessment {
  const isFinance = industry?.includes('金融') || false;
  const isTech = industry?.includes('半導體') || industry?.includes('電腦') || industry?.includes('電子') || false;

  let tag: ValuationTag = 'FAIR_VALUE';
  let label = '合理區間';
  let colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
  let peAssessment = '';
  let pbAssessment = '';
  let summary = '';

  // PE evaluation
  if (pe <= 0) {
    peAssessment = '當前無獲利 (PE為負或虧損)';
  } else if (pe < (isTech ? 15 : 12)) {
    peAssessment = `PE ${pe.toFixed(1)} 倍低於產業平均，具高本益比安全邊際`;
  } else if (pe <= (isTech ? 25 : 18)) {
    peAssessment = `PE ${pe.toFixed(1)} 倍處於合理價值中樞`;
  } else if (pe <= (isTech ? 35 : 25)) {
    peAssessment = `PE ${pe.toFixed(1)} 倍估值偏高，需持續高成長支撐`;
  } else {
    peAssessment = `PE ${pe.toFixed(1)} 倍處於歷史高位溢價，評價過熱`;
  }

  // PB evaluation
  if (pb <= 0) {
    pbAssessment = '淨值資料不詳';
  } else if (pb < (isFinance ? 1.0 : isTech ? 2.0 : 1.2)) {
    pbAssessment = `PB ${pb.toFixed(2)} 倍低於淨值或具清算保護`;
  } else if (pb <= (isFinance ? 1.4 : isTech ? 4.5 : 2.5)) {
    pbAssessment = `PB ${pb.toFixed(2)} 倍處於資產價值合理區間`;
  } else if (pb <= (isTech ? 7.0 : 4.0)) {
    pbAssessment = `PB ${pb.toFixed(2)} 倍反映市場高股東權益報酬率(ROE)`;
  } else {
    pbAssessment = `PB ${pb.toFixed(2)} 倍處於極高溢價區間`;
  }

  // Composite Tag Decision
  if (pe > 0 && pe < (isTech ? 14 : 11) && pb < (isTech ? 2.5 : 1.2)) {
    tag = 'DEEP_VALUE';
    label = '深度低估';
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    summary = '獲利與資產價值雙重折價，具備極高下檔防護與長線安全邊際。';
  } else if ((pe > 0 && pe < (isTech ? 18 : 14)) || pb < (isFinance ? 1.15 : 1.4)) {
    tag = 'UNDERVALUED';
    label = '估值偏低';
    colorClass = 'bg-teal-50 text-teal-700 border-teal-300';
    summary = '評價位居歷史中低階，性價比較高，適合價值型或抄底布局。';
  } else if (pe > (isTech ? 35 : 26) || pb > (isTech ? 8.0 : 5.0)) {
    tag = 'OVERHEATED';
    label = '過熱溢價';
    colorClass = 'bg-rose-50 text-rose-700 border-rose-300';
    summary = '市場給予高度成長樂觀定價，本益比與淨值比皆高，需嚴防財報不如預期修正。';
  } else if (pe > (isTech ? 25 : 19) || pb > (isTech ? 5.0 : 3.0)) {
    tag = 'OVERVALUED';
    label = '估值偏高';
    colorClass = 'bg-amber-50 text-amber-800 border-amber-300';
    summary = '估值高於歷史平均，股價易受大盤回檔波動影響，宜搭配技術面順勢操作。';
  } else {
    tag = 'FAIR_VALUE';
    label = '合理區間';
    colorClass = 'bg-slate-100 text-slate-700 border-slate-300';
    summary = '評價貼近基本面與產業平均水準，股價主要隨營收獲利與大盤趨勢波動。';
  }

  return {
    tag,
    label,
    colorClass,
    peAssessment,
    pbAssessment,
    summary,
  };
}

/**
 * Calculates 14-period Average True Range (ATR) for volatility envelope projection.
 */
export function calculateATR14(candles: CandleData[]): number {
  const n = candles.length;
  if (n < 2) return Math.max(1, (candles[0]?.high ?? 100) - (candles[0]?.low ?? 100));
  const trs: number[] = [];
  for (let i = 1; i < n; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);
  }
  const lookback = Math.min(14, trs.length);
  const recent = trs.slice(-lookback);
  return recent.reduce((sum, v) => sum + v, 0) / recent.length;
}

/**
 * Standard Taiwan Stock Exchange tick size schedule
 */
export function getTickSize(price: number): number {
  if (price < 10) return 0.01;
  if (price < 50) return 0.05;
  if (price < 100) return 0.1;
  if (price < 500) return 0.5;
  if (price < 1000) return 1.0;
  return 5.0;
}

export function roundToTick(price: number): number {
  const step = getTickSize(price);
  return Math.round(price / step) * step;
}

export function getMajorPsychologicalStep(price: number): number {
  if (price >= 10000) return 500;
  if (price >= 5000) return 250;
  if (price >= 1000) return 50;
  if (price >= 500) return 25;
  if (price >= 100) return 10;
  if (price >= 50) return 5;
  return 1;
}

interface PriceFactorCandidate {
  price: number;
  name: string;
  weight: number; // 1 ~ 5
  type: 'MA' | 'VPOC' | 'FIBONACCI' | 'VOLATILITY' | 'FRACTAL' | 'PSYCHOLOGICAL';
}

interface ClusteredLevelResult {
  price: number;
  primaryReason: string;
  stars: number; // 1 ~ 3
  evidence: string[];
}

/**
 * Quant Multi-Factor Clustering Algorithm
 * Clusters candidate price factors within dynamic bandwidth, weights them,
 * and derives the highest-confidence price node with star rating and evidence.
 */
function clusterFactorNodes(
  candidates: PriceFactorCandidate[],
  currentPrice: number,
  targetType: 'RESISTANCE' | 'SUPPORT',
  fallbackPrice: number,
  fallbackReason: string
): ClusteredLevelResult {
  const valid = candidates.filter((c) =>
    targetType === 'RESISTANCE' ? c.price > currentPrice * 1.001 : c.price < currentPrice * 0.999
  );

  if (valid.length === 0) {
    const finalPrice = roundToTick(fallbackPrice);
    return {
      price: finalPrice,
      primaryReason: fallbackReason,
      stars: 1,
      evidence: [`基準參考位: NT$ ${finalPrice.toFixed(2)} (${fallbackReason})`],
    };
  }

  // Sort candidates by proximity to currentPrice
  valid.sort((a, b) =>
    targetType === 'RESISTANCE' ? a.price - b.price : b.price - a.price
  );

  // Group into spatial clusters within ±1.2% bandwidth
  const clusters: PriceFactorCandidate[][] = [];
  for (const factor of valid) {
    let matchedCluster = clusters.find((cluster) => {
      const avgPrice = cluster.reduce((s, f) => s + f.price, 0) / cluster.length;
      return Math.abs(factor.price - avgPrice) / avgPrice <= 0.015;
    });

    if (matchedCluster) {
      matchedCluster.push(factor);
    } else {
      clusters.push([factor]);
    }
  }

  // Score each cluster by total weighted importance & nearest proximity
  let bestCluster = clusters[0];
  let bestScore = -1;

  for (const cluster of clusters) {
    const totalWeight = cluster.reduce((sum, f) => sum + f.weight, 0);
    const avgPrice = cluster.reduce((sum, f) => sum + f.price * f.weight, 0) / totalWeight;
    const distancePct = Math.abs(avgPrice - currentPrice) / currentPrice;
    // Prefer higher weight and closer distance for primary support/resistance
    const score = totalWeight * 2.0 - distancePct * 10;
    if (score > bestScore) {
      bestScore = score;
      bestCluster = cluster;
    }
  }

  const clusterWeightSum = bestCluster.reduce((sum, f) => sum + f.weight, 0);
  const weightedPrice = bestCluster.reduce((sum, f) => sum + f.price * f.weight, 0) / clusterWeightSum;
  const roundedPrice = roundToTick(weightedPrice);

  const distinctTypes = new Set(bestCluster.map((f) => f.type));
  let stars = 1;
  if (distinctTypes.size >= 3 || clusterWeightSum >= 7.0) {
    stars = 3;
  } else if (distinctTypes.size >= 2 || clusterWeightSum >= 4.0) {
    stars = 2;
  }

  const factorNames = bestCluster.map((f) => f.name);
  const primaryReason = factorNames.length > 1
    ? `${factorNames.slice(0, 2).join(' + ')} 共振`
    : factorNames[0];

  const evidence = bestCluster.map(
    (f) => `${f.name} (NT$ ${roundToTick(f.price).toFixed(2)}) [權重 ${f.weight.toFixed(1)}]`
  );

  return {
    price: roundedPrice,
    primaryReason,
    stars,
    evidence,
  };
}

/**
 * Calculates concrete Short-term (3~7 days) and Mid-term (1-Month / 20~22 days) Support and Resistance Levels
 * using the Multi-Factor Quantitative Confluence Engine (ATR, Fibonacci, VPOC, MAs, and Order-flow Grids).
 */
export function calculateSupportResistance(
  candles: CandleData[],
  indicators: TechnicalIndicators
): SupportResistanceLevels {
  const n = candles.length;
  if (n === 0) {
    const emptyStructural: StructuralPriceAnalysis = {
      keyBearishBar: null,
      keyBullishBar: null,
      swingHigh: { price: 0, date: '', daysAgo: 0 },
      swingLow: { price: 0, date: '', daysAgo: 0 },
      isNewHigh: false,
      volumeRatioEvaluation: '無資料',
      summary: '無資料',
    };
    return {
      shortSupport: 0,
      shortResistance: 0,
      midTermSupport: 0,
      midTermResistance: 0,
      isNewHigh: false,
      shortResistanceReason: '無資料',
      shortResistanceStars: 1,
      shortResistanceEvidence: [],
      shortSupportReason: '無資料',
      shortSupportStars: 1,
      shortSupportEvidence: [],
      midTermResistanceReason: '無資料',
      midTermResistanceStars: 1,
      midTermResistanceEvidence: [],
      midTermSupportReason: '無資料',
      midTermSupportStars: 1,
      midTermSupportEvidence: [],
      quantPricingModel: '多維量化共振定價引擎 (ATR / Fibonacci / VPOC / 均線 / 心理關卡)',
      midLongSupport: 0,
      midLongResistance: 0,
      distToShortResistancePct: 0,
      distToShortSupportPct: 0,
      distToMidTermResistancePct: 0,
      distToMidTermSupportPct: 0,
      distToMidLongResistancePct: 0,
      distToMidLongSupportPct: 0,
      distToResistancePct: 0,
      distToSupportPct: 0,
      monthMa20: 0,
      monthMa20BiasPct: 0,
      monthMa20Status: 'ABOVE_MA20',
      monthMa20StatusText: '無資料',
      structuralAnalysis: emptyStructural,
    };
  }

  const lastIdx = n - 1;
  const latestPrice = candles[lastIdx].close;
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  const ma5 = indicators.ma5[lastIdx] ?? latestPrice;
  const ma10 = indicators.ma10[lastIdx] ?? latestPrice;
  const ma20 = indicators.ma20[lastIdx] ?? latestPrice;
  const ma60 = indicators.ma60[lastIdx] ?? latestPrice;
  const bbUpper = indicators.bollingerUpper[lastIdx] ?? latestPrice;
  const bbLower = indicators.bollingerLower[lastIdx] ?? latestPrice;

  const atr14 = calculateATR14(candles);

  const currentVol = volumes[lastIdx];
  const curVolMa5 = indicators.volMa5[lastIdx] ?? currentVol;
  const curVolMa20 = indicators.volMa20[lastIdx] ?? currentVol;
  const curVolRatio5d = curVolMa5 > 0 ? currentVol / curVolMa5 : 1.0;
  const curVolRatio20d = curVolMa20 > 0 ? currentVol / curVolMa20 : 1.0;

  // -------------------------------------------------------------
  // 1. SHORT-TERM (極短線 3~7 日) SWING HIGH / LOW
  // -------------------------------------------------------------
  const shortLookbackStart = Math.max(0, n - 6);
  let swingHighShort = { price: highs[lastIdx], date: candles[lastIdx].time, daysAgo: 0 };
  let swingLowShort = { price: lows[lastIdx], date: candles[lastIdx].time, daysAgo: 0 };

  for (let i = shortLookbackStart; i < n; i++) {
    if (highs[i] > swingHighShort.price) {
      swingHighShort = { price: highs[i], date: candles[i].time, daysAgo: n - 1 - i };
    }
    if (lows[i] < swingLowShort.price) {
      swingLowShort = { price: lows[i], date: candles[i].time, daysAgo: n - 1 - i };
    }
  }

  // -------------------------------------------------------------
  // 2. MID-TERM (中期 1 個月 / 20~22 交易日) SWING HIGH / LOW
  // -------------------------------------------------------------
  const monthLookbackStart = Math.max(0, n - 22);
  let swingHighMonth = { price: highs[lastIdx], date: candles[lastIdx].time, daysAgo: 0 };
  let swingLowMonth = { price: lows[lastIdx], date: candles[lastIdx].time, daysAgo: 0 };

  for (let i = monthLookbackStart; i < n; i++) {
    if (highs[i] > swingHighMonth.price) {
      swingHighMonth = { price: highs[i], date: candles[i].time, daysAgo: n - 1 - i };
    }
    if (lows[i] < swingLowMonth.price) {
      swingLowMonth = { price: lows[i], date: candles[i].time, daysAgo: n - 1 - i };
    }
  }

  // Check if current stock price is at 1-Month New High or All-Time High
  const priorMonthHigh = Math.max(...highs.slice(monthLookbackStart, Math.max(monthLookbackStart + 1, n - 1)));
  const isNewHigh = latestPrice >= priorMonthHigh * 0.995 || (swingHighMonth.daysAgo === 0 && latestPrice >= swingHighMonth.price * 0.99);

  // -------------------------------------------------------------
  // 3. 1-MONTH KEY BEARISH BAR (過去1個月內關鍵巨量大陰線 - 套牢賣壓頂)
  // Drop >= 2.0% AND Volume >= 1.15x 5-day moving average volume
  // CRITICAL RULE: An old bearish bar is ONLY an overhead trapped supply if its high is ABOVE latestPrice (c.high > latestPrice).
  // If latestPrice >= c.high, the overhead supply was COMPLETELY broken out and absorbed (已完全消化解套，不再構成上方套牢賣壓)!
  // -------------------------------------------------------------
  let keyBearishBar: StructuralKeyBar | null = null;
  for (let i = n - 2; i >= Math.max(0, n - 22); i--) {
    const c = candles[i];
    const prevC = candles[i - 1]?.close ?? c.open;
    const changePct = prevC > 0 ? ((c.close - prevC) / prevC) * 100 : 0;
    const v5 = indicators.volMa5[i] ?? c.volume;
    const volRatio = v5 > 0 ? c.volume / v5 : 1.0;

    if (changePct <= -2.0 && volRatio >= 1.15 && c.close < c.open && c.high > latestPrice) {
      keyBearishBar = {
        date: c.time,
        daysAgo: n - 1 - i,
        open: c.open,
        close: c.close,
        high: c.high,
        low: c.low,
        changePct: Math.round(changePct * 10) / 10,
        volume: c.volume,
        volumeRatio5d: Math.round(volRatio * 100) / 100,
        levelPrice: c.high, // 大陰線最高點為主要套牢解套賣壓
        desc: `${c.time} 重挫 ${Math.abs(changePct).toFixed(1)}% (放量 ${volRatio.toFixed(1)}x)，高點 NT$ ${c.high.toFixed(1)} 為1個月關鍵套牢反壓`,
      };
      break;
    }
  }

  // -------------------------------------------------------------
  // 4. 1-MONTH KEY BULLISH BAR (過去1個月內關鍵放量大陽線 - 主力防守底)
  // Gain >= 2.2% AND Volume >= 1.15x 5-day moving average volume
  // -------------------------------------------------------------
  let keyBullishBar: StructuralKeyBar | null = null;
  for (let i = n - 2; i >= Math.max(0, n - 22); i--) {
    const c = candles[i];
    const prevC = candles[i - 1]?.close ?? c.open;
    const changePct = prevC > 0 ? ((c.close - prevC) / prevC) * 100 : 0;
    const v5 = indicators.volMa5[i] ?? c.volume;
    const volRatio = v5 > 0 ? c.volume / v5 : 1.0;

    if (changePct >= 2.2 && volRatio >= 1.15 && c.close > c.open && latestPrice >= c.low) {
      keyBullishBar = {
        date: c.time,
        daysAgo: n - 1 - i,
        open: c.open,
        close: c.close,
        high: c.high,
        low: c.low,
        changePct: Math.round(changePct * 10) / 10,
        volume: c.volume,
        volumeRatio5d: Math.round(volRatio * 100) / 100,
        levelPrice: c.low, // 大陽線最低點為主力起漲成本防線
        desc: `${c.time} 強彈 +${changePct.toFixed(1)}% (放量 ${volRatio.toFixed(1)}x)，低點 NT$ ${c.low.toFixed(1)} 為1個月主力防守支撐`,
      };
      break;
    }
  }

  // -------------------------------------------------------------
  // 5. MONTH LINE MA20 (月線) EVALUATION
  // -------------------------------------------------------------
  const monthMa20BiasPct = ma20 > 0 ? Math.round(((latestPrice - ma20) / ma20) * 1000) / 10 : 0;
  let monthMa20Status: SupportResistanceLevels['monthMa20Status'] = 'ABOVE_MA20';
  let monthMa20StatusText = '站穩月線 (多頭架構)';

  if (latestPrice >= ma20 * 1.01) {
    monthMa20Status = 'ABOVE_MA20';
    monthMa20StatusText = `站穩月線 (正乖離 +${monthMa20BiasPct.toFixed(1)}%)`;
  } else if (latestPrice >= ma20 * 0.985 && latestPrice < ma20 * 1.01) {
    monthMa20Status = 'PULLBACK_TESTING_MA20';
    monthMa20StatusText = `回測月線 (中期生命線支撐測試)`;
  } else {
    monthMa20Status = 'BELOW_MA20';
    monthMa20StatusText = `跌破月線 (負乖離 ${monthMa20BiasPct.toFixed(1)}%，轉弱整理)`;
  }

  // =============================================================
  // 6. QUANT MULTI-FACTOR ENGINE FOR SHORT RESISTANCE (短壓)
  // =============================================================
  const shortResCandidates: PriceFactorCandidate[] = [];
  const monthSwingAmplitude = Math.max(1, swingHighMonth.price - swingLowMonth.price);

  if (isNewHigh) {
    // 1. Fibonacci 1.272 Extension
    const fib1272 = swingLowMonth.price + monthSwingAmplitude * 1.272;
    if (fib1272 > latestPrice) {
      shortResCandidates.push({ price: fib1272, name: 'Fibonacci 1.272 擴展目標', weight: 4.0, type: 'FIBONACCI' });
    }
    // 2. Dynamic ATR Volatility Ceiling
    const atrCeil = latestPrice + 1.25 * atr14;
    shortResCandidates.push({ price: atrCeil, name: `ATR 波動率短頂 (+1.25 ATR)`, weight: 3.5, type: 'VOLATILITY' });
    // 3. Short Bollinger Upper (if above current price)
    if (bbUpper > latestPrice) {
      shortResCandidates.push({ price: bbUpper, name: '布林上軌 (2.0σ 波動邊界)', weight: 3.0, type: 'VOLATILITY' });
    }
    // 4. Psychological Order-Flow Level
    const psychStep = getMajorPsychologicalStep(latestPrice);
    const psychPrice = Math.ceil((latestPrice + 0.01) / psychStep) * psychStep;
    if (psychPrice > latestPrice) {
      shortResCandidates.push({ price: psychPrice, name: `整數心理關卡 (NT$ ${psychPrice})`, weight: 2.5, type: 'PSYCHOLOGICAL' });
    }
  } else {
    // 1. 3~7-Day Swing High
    if (swingHighShort.price > latestPrice) {
      shortResCandidates.push({ price: swingHighShort.price, name: `3~7日波段前高 (${swingHighShort.daysAgo}天前)`, weight: 4.0, type: 'FRACTAL' });
    }
    // 2. Key Bearish Bar within 7 days
    if (keyBearishBar && keyBearishBar.daysAgo <= 7 && keyBearishBar.levelPrice > latestPrice) {
      shortResCandidates.push({ price: keyBearishBar.levelPrice, name: `近週巨量大陰線套牢頂 (${keyBearishBar.date})`, weight: 4.0, type: 'VPOC' });
    }
    // 3. Dynamic MA5 / MA10 Resistance if price is below
    if (ma5 > latestPrice) {
      shortResCandidates.push({ price: ma5, name: '5日均線 (MA5 反壓)', weight: 3.5, type: 'MA' });
    }
    if (ma10 > latestPrice) {
      shortResCandidates.push({ price: ma10, name: '10日均線 (MA10 反壓)', weight: 3.0, type: 'MA' });
    }
    // 4. Bollinger Upper Band
    if (bbUpper > latestPrice) {
      shortResCandidates.push({ price: bbUpper, name: '短線布林上軌 (2.0σ)', weight: 2.5, type: 'VOLATILITY' });
    }
  }

  const shortResCluster = clusterFactorNodes(
    shortResCandidates,
    latestPrice,
    'RESISTANCE',
    isNewHigh ? latestPrice + 1.25 * atr14 : Math.max(swingHighShort.price, latestPrice * 1.02),
    isNewHigh ? '創高動態目標價' : '3~7日短線前高'
  );

  const shortResistance = shortResCluster.price;
  const shortResistanceReason = shortResCluster.primaryReason;
  const shortResistanceStars = shortResCluster.stars;
  const shortResistanceEvidence = shortResCluster.evidence;

  // =============================================================
  // 7. QUANT MULTI-FACTOR ENGINE FOR SHORT SUPPORT (短支)
  // =============================================================
  const shortSupCandidates: PriceFactorCandidate[] = [];

  // 1. MA5 Dynamic Moving Average
  if (ma5 > 0 && ma5 < latestPrice) {
    shortSupCandidates.push({ price: ma5, name: '5日均線 (MA5 短多生命線)', weight: 4.5, type: 'MA' });
  }
  // 2. MA10 Dynamic Moving Average
  if (ma10 > 0 && ma10 < latestPrice) {
    shortSupCandidates.push({ price: ma10, name: '10日均線 (MA10 護盤線)', weight: 3.5, type: 'MA' });
  }
  // 3. 3~7-Day Swing Low
  if (swingLowShort.price < latestPrice && swingLowShort.price > 0) {
    shortSupCandidates.push({ price: swingLowShort.price, name: `3~7日波段前低 (${swingLowShort.daysAgo}天前)`, weight: 3.5, type: 'FRACTAL' });
  }
  // 4. Key Bullish Bar within 7 days
  if (keyBullishBar && keyBullishBar.daysAgo <= 7 && keyBullishBar.levelPrice < latestPrice) {
    shortSupCandidates.push({ price: keyBullishBar.levelPrice, name: `近週主力放量大陽防守底 (${keyBullishBar.date})`, weight: 4.0, type: 'VPOC' });
  }
  // 5. Short-term Fibonacci 0.382 Retracement
  const shortSwingAmp = Math.max(1, swingHighShort.price - swingLowShort.price);
  const shortFib382 = swingHighShort.price - shortSwingAmp * 0.382;
  if (shortFib382 < latestPrice && shortFib382 > swingLowShort.price) {
    shortSupCandidates.push({ price: shortFib382, name: '極短線 0.382 黃金回撤防守位', weight: 2.5, type: 'FIBONACCI' });
  }

  const shortSupCluster = clusterFactorNodes(
    shortSupCandidates,
    latestPrice,
    'SUPPORT',
    ma5 < latestPrice && ma5 > 0 ? ma5 : Math.min(swingLowShort.price, latestPrice * 0.98),
    ma5 < latestPrice ? 'MA5 均線支撐' : '3~7日波段低點'
  );

  const shortSupport = shortSupCluster.price;
  const shortSupportReason = shortSupCluster.primaryReason;
  const shortSupportStars = shortSupCluster.stars;
  const shortSupportEvidence = shortSupCluster.evidence;

  // =============================================================
  // 8. QUANT MULTI-FACTOR ENGINE FOR MID-TERM RESISTANCE (月壓)
  // =============================================================
  const midTermResCandidates: PriceFactorCandidate[] = [];

  if (isNewHigh) {
    // 1. Fibonacci 1.618 Major Expansion
    const fib1618 = swingLowMonth.price + monthSwingAmplitude * 1.618;
    if (fib1618 > shortResistance) {
      midTermResCandidates.push({ price: fib1618, name: 'Fibonacci 1.618 主升浪擴展目標', weight: 4.5, type: 'FIBONACCI' });
    }
    // 2. Macro ATR Volatility Target (2.5 ATR)
    const macroAtrCeil = latestPrice + 2.5 * atr14;
    midTermResCandidates.push({ price: macroAtrCeil, name: '中期極限波動率通道 (+2.5 ATR)', weight: 3.5, type: 'VOLATILITY' });
    // 3. Major Macro Round Milestone
    const majorPsychStep = getMajorPsychologicalStep(latestPrice) * 2;
    const majorPsychPrice = Math.ceil((shortResistance + 0.01) / majorPsychStep) * majorPsychStep;
    midTermResCandidates.push({ price: majorPsychPrice, name: `重大整數心理關卡 (NT$ ${majorPsychPrice})`, weight: 3.5, type: 'PSYCHOLOGICAL' });
  } else {
    // 1. 20-Day Major Swing High
    if (swingHighMonth.price > latestPrice) {
      midTermResCandidates.push({ price: swingHighMonth.price, name: `1個月波段最高峰 (${swingHighMonth.daysAgo}天前)`, weight: 4.5, type: 'FRACTAL' });
    }
    // 2. 20-Day Key Bearish Bar VPOC
    if (keyBearishBar && keyBearishBar.levelPrice > latestPrice) {
      midTermResCandidates.push({ price: keyBearishBar.levelPrice, name: `1個月巨量大陰線套牢頂 (${keyBearishBar.date})`, weight: 4.5, type: 'VPOC' });
    }
    // 3. Monthly Bollinger Upper Band (20, 2.0σ)
    if (bbUpper > latestPrice) {
      midTermResCandidates.push({ price: bbUpper, name: '月線布林上軌 (20日 2.0σ)', weight: 3.5, type: 'VOLATILITY' });
    }
    // 4. Quarterly Line MA60 Resistance
    if (ma60 > latestPrice) {
      midTermResCandidates.push({ price: ma60, name: '季線 (MA60 中期多空反壓)', weight: 3.5, type: 'MA' });
    }
    // 5. 1-Month Range 0.618 Major Fibonacci Retracement
    const monthFib618 = swingLowMonth.price + monthSwingAmplitude * 0.618;
    if (monthFib618 > latestPrice && monthFib618 < swingHighMonth.price) {
      midTermResCandidates.push({ price: monthFib618, name: '1個月區間 0.618 黃金反彈強壓', weight: 3.0, type: 'FIBONACCI' });
    }
  }

  const midTermResCluster = clusterFactorNodes(
    midTermResCandidates,
    latestPrice,
    'RESISTANCE',
    isNewHigh ? shortResistance * 1.04 : Math.max(swingHighMonth.price, shortResistance * 1.02),
    isNewHigh ? '主升浪目標關卡' : '1個月波段前高'
  );

  let midTermResistance = midTermResCluster.price;
  if (midTermResistance <= shortResistance) {
    midTermResistance = roundToTick(Math.max(shortResistance * 1.025, swingHighMonth.price));
  }
  const midTermResistanceReason = midTermResCluster.primaryReason;
  const midTermResistanceStars = midTermResCluster.stars;
  const midTermResistanceEvidence = midTermResCluster.evidence;

  // =============================================================
  // 9. QUANT MULTI-FACTOR ENGINE FOR MID-TERM SUPPORT (月支)
  // =============================================================
  const midTermSupCandidates: PriceFactorCandidate[] = [];

  // 1. Month Line MA20 (月生命線, 20MA) - Core institutional baseline
  if (ma20 > 0 && ma20 < latestPrice) {
    midTermSupCandidates.push({ price: ma20, name: '月線生命線 (20MA 中期多空分水嶺)', weight: 5.0, type: 'MA' });
  }
  // 2. 20-Day Key Bullish Bar Base (主力起漲成本防線)
  if (keyBullishBar && keyBullishBar.levelPrice < latestPrice) {
    midTermSupCandidates.push({ price: keyBullishBar.levelPrice, name: `1個月主力放量大陽成本線 (${keyBullishBar.date})`, weight: 4.5, type: 'VPOC' });
  }
  // 3. Fibonacci 0.500 & 0.618 Retracement of 20-Day Wave
  const monthFib500 = swingHighMonth.price - monthSwingAmplitude * 0.5;
  if (monthFib500 < latestPrice && monthFib500 > swingLowMonth.price) {
    midTermSupCandidates.push({ price: monthFib500, name: '1個月波段 0.500 多空中軸回撤位', weight: 3.5, type: 'FIBONACCI' });
  }
  const monthFib618Retrace = swingHighMonth.price - monthSwingAmplitude * 0.618;
  if (monthFib618Retrace < latestPrice && monthFib618Retrace > swingLowMonth.price) {
    midTermSupCandidates.push({ price: monthFib618Retrace, name: '1個月波段 0.618 強力防守黃金線', weight: 3.5, type: 'FIBONACCI' });
  }
  // 4. 20-Day Major Swing Low
  if (swingLowMonth.price < latestPrice && swingLowMonth.price > 0) {
    midTermSupCandidates.push({ price: swingLowMonth.price, name: `1個月波段大底 (${swingLowMonth.daysAgo}天前)`, weight: 3.5, type: 'FRACTAL' });
  }
  // 5. Quarterly Line MA60 Support
  if (ma60 > 0 && ma60 < latestPrice) {
    midTermSupCandidates.push({ price: ma60, name: '季線 (MA60 中長線主力護盤底)', weight: 3.5, type: 'MA' });
  }
  // 6. Monthly Bollinger Lower Band
  if (bbLower > 0 && bbLower < latestPrice) {
    midTermSupCandidates.push({ price: bbLower, name: '月線布林下軌 (20日 2.0σ)', weight: 3.0, type: 'VOLATILITY' });
  }

  const midTermSupCluster = clusterFactorNodes(
    midTermSupCandidates,
    latestPrice,
    'SUPPORT',
    ma20 > 0 && ma20 < latestPrice ? ma20 : Math.min(swingLowMonth.price, latestPrice * 0.94),
    ma20 < latestPrice ? 'MA20 月線生命線' : '1個月波段大底'
  );

  let midTermSupport = midTermSupCluster.price;
  if (midTermSupport >= latestPrice || midTermSupport <= 0) {
    midTermSupport = roundToTick(Math.min(swingLowMonth.price, latestPrice * 0.95));
  }
  const midTermSupportReason = midTermSupCluster.primaryReason;
  const midTermSupportStars = midTermSupCluster.stars;
  const midTermSupportEvidence = midTermSupCluster.evidence;

  // -------------------------------------------------------------
  // 10. DISTANCE PERCENTAGES
  // -------------------------------------------------------------
  const distToShortResistancePct =
    latestPrice > 0 ? Math.round(((shortResistance - latestPrice) / latestPrice) * 1000) / 10 : 0;
  const distToShortSupportPct =
    latestPrice > 0 ? Math.round(((latestPrice - shortSupport) / latestPrice) * 1000) / 10 : 0;
  const distToMidTermResistancePct =
    latestPrice > 0 ? Math.round(((midTermResistance - latestPrice) / latestPrice) * 1000) / 10 : 0;
  const distToMidTermSupportPct =
    latestPrice > 0 ? Math.round(((latestPrice - midTermSupport) / latestPrice) * 1000) / 10 : 0;

  // -------------------------------------------------------------
  // 11. VOLUME RATIO EVALUATION & 1-MONTH STRUCTURAL SUMMARY
  // -------------------------------------------------------------
  let volumeRatioEvaluation = '';
  if (isNewHigh) {
    if (curVolRatio5d >= 1.25) {
      volumeRatioEvaluation = `🚀 今日5日量比 ${curVolRatio5d.toFixed(2)}x、1個月量比 ${curVolRatio20d.toFixed(2)}x (放量突破)！股價強勢創下1個月新高，上方無實質套牢賣壓，籌碼全數處於獲利狀態。`;
    } else {
      volumeRatioEvaluation = `⚠️ 股價強勢創下新高，但今日5日量比僅 ${curVolRatio5d.toFixed(2)}x (高檔量縮)，上方雖無套牢盤，但需提防短線獲利了結調節賣壓！`;
    }
  } else if (distToMidTermResistancePct <= 2.2) {
    if (curVolRatio5d >= 1.3 && curVolRatio20d >= 1.2) {
      volumeRatioEvaluation = `🔥 今日5日量比 ${curVolRatio5d.toFixed(2)}x、1個月量比 ${curVolRatio20d.toFixed(2)}x (放量攻擊)，具備強烈突破中期1個月壓力 (NT$ ${midTermResistance.toFixed(1)}) 之多頭動能！`;
    } else {
      volumeRatioEvaluation = `⚠️ 今日5日量比僅 ${curVolRatio5d.toFixed(2)}x (量能不足)，逼近1個月中期壓力 (NT$ ${midTermResistance.toFixed(1)}) 時量縮背離，需嚴防解套賣壓與假突破！`;
    }
  } else if (distToMidTermSupportPct <= 2.0) {
    if (curVolRatio5d <= 0.85) {
      volumeRatioEvaluation = `🛡️ 回測中期月線支撐 (NT$ ${midTermSupport.toFixed(1)}) 呈現量縮 ${curVolRatio5d.toFixed(2)}x，籌碼沉澱徹底，中期買點浮現。`;
    } else {
      volumeRatioEvaluation = `⚡ 接近中期月線支撐 (NT$ ${midTermSupport.toFixed(1)}) 且成交量放大 (${curVolRatio5d.toFixed(2)}x)，需觀察是否為跌破殺盤或主力換手。`;
    }
  } else {
    volumeRatioEvaluation = `📊 目前5日量比 ${curVolRatio5d.toFixed(2)}x、1個月量比 ${curVolRatio20d.toFixed(2)}x，股價於月線支撐 (NT$ ${midTermSupport.toFixed(1)}) 與1個月壓力 (NT$ ${midTermResistance.toFixed(1)}) 區間震盪。`;
  }

  let summary = '';
  if (isNewHigh) {
    summary = `股價已強勢創下1個月波段新高 (NT$ ${latestPrice.toFixed(1)})，上方無套牢籌碼反壓。`;
  } else if (keyBearishBar && latestPrice < keyBearishBar.levelPrice && (keyBearishBar.levelPrice - latestPrice) / latestPrice <= 0.04) {
    summary = `股價正逼近1個月內大陰線套牢區 (${keyBearishBar.date} 高點 NT$ ${keyBearishBar.levelPrice.toFixed(1)})，需放量消化賣壓。`;
  } else if (keyBullishBar && latestPrice >= keyBullishBar.levelPrice && (latestPrice - keyBullishBar.levelPrice) / latestPrice <= 0.035) {
    summary = `股價穩守於1個月內大陽線主力成本線 (${keyBullishBar.date} 低點 NT$ ${keyBullishBar.levelPrice.toFixed(1)}) 上方，多方防線穩固。`;
  } else if (latestPrice >= ma20) {
    summary = `股價位於月線 MA20 (NT$ ${ma20.toFixed(1)}) 之上，中期格局偏多，以1個月前高 NT$ ${midTermResistance.toFixed(1)} 為主要目標。`;
  } else {
    summary = `股價目前在月線 MA20 (NT$ ${ma20.toFixed(1)}) 之下，月線反轉為中期反壓，需放量站回月線以重啟波段攻勢。`;
  }

  const structuralAnalysis: StructuralPriceAnalysis = {
    keyBearishBar,
    keyBullishBar,
    swingHigh: { price: swingHighMonth.price, date: swingHighMonth.date, daysAgo: swingHighMonth.daysAgo },
    swingLow: { price: swingLowMonth.price, date: swingLowMonth.date, daysAgo: swingLowMonth.daysAgo },
    isNewHigh,
    allTimeOrPeriodHighDesc: isNewHigh ? '突破1個月新高，上方無歷史套牢盤，籌碼100%處於獲利狀態' : undefined,
    volumeRatioEvaluation,
    summary,
  };

  const resistanceLabel = isNewHigh ? '整數心理關卡 (創高無套牢盤)' : '1個月波段套牢壓力';

  return {
    shortSupport,
    shortResistance,
    midTermSupport,
    midTermResistance,
    isNewHigh,
    resistanceLabel,
    shortResistanceReason,
    shortResistanceStars,
    shortResistanceEvidence,
    shortSupportReason,
    shortSupportStars,
    shortSupportEvidence,
    midTermResistanceReason,
    midTermResistanceStars,
    midTermResistanceEvidence,
    midTermSupportReason,
    midTermSupportStars,
    midTermSupportEvidence,
    quantPricingModel: '多維量化共振定價引擎 (ATR / Fibonacci / VPOC / 均線 / 心理關卡)',
    midLongSupport: midTermSupport, // alias for backwards compatibility
    midLongResistance: midTermResistance, // alias for backwards compatibility
    distToShortResistancePct,
    distToShortSupportPct,
    distToMidTermResistancePct,
    distToMidTermSupportPct,
    distToMidLongResistancePct: distToMidTermResistancePct,
    distToMidLongSupportPct: distToMidTermSupportPct,
    distToResistancePct: distToShortResistancePct,
    distToSupportPct: distToShortSupportPct,
    strongSupport: midTermSupport,
    strongResistance: midTermResistance,
    monthMa20: ma20,
    monthMa20BiasPct,
    monthMa20Status,
    monthMa20StatusText,
    structuralAnalysis,
  };
}

/**
 * 深度量價結構與主力資金意圖量化分析
 */
export function analyzeVolumePriceDeep(
  candles: CandleData[],
  volumeRatio5d: number,
  volumeRatio20d: number,
  volumeRatio60d: number,
  priceChangePercent: number,
  levels: SupportResistanceLevels,
  latestMa5: number,
  latestMa20: number,
  latestBias20: number,
  latestRsi: number,
  latestPercentB: number
): VolumePriceDeepAnalysis {
  const latestCandle = candles[candles.length - 1];
  const isUp = priceChangePercent > 0;
  const isBigBar = Math.abs(priceChangePercent) >= 2.0;
  const isUpperShadow =
    latestCandle &&
    latestCandle.high - Math.max(latestCandle.open, latestCandle.close) >
      Math.abs(latestCandle.close - latestCandle.open) * 1.3 &&
    latestCandle.high > latestCandle.low;

  let patternType: VolumePriceDeepAnalysis['patternType'] = 'CONSOLIDATION_ACCUMULATION';
  let patternName = '⚖️ 區間常態換手 (量能平穩)';
  let institutionalIntent = '區間吸籌 / 籌碼動態平衡';
  let volumeHealthScore = 68;
  let volumeGrade: VolumePriceDeepAnalysis['volumeGrade'] = 'B';
  let analysisSummary = '';
  let flowState = '資金平穩流動';

  // 1. 放量爆發突破
  if (volumeRatio5d >= 1.35 && isUp && (levels.isNewHigh || levels.distToShortResistancePct <= 0.5 || isBigBar)) {
    patternType = 'VOLUME_EXPANSION_BREAKOUT';
    patternName = '🔥 放量突破攻擊 (主力重金表態)';
    institutionalIntent = '主力主動買盤強勢吃貨，發動波段突破行情';
    volumeHealthScore = 95;
    volumeGrade = 'A+';
    flowState = '主動性大單大舉湧入';
    analysisSummary = `今日5日量比達 ${volumeRatio5d.toFixed(2)}x、1個月量比達 ${volumeRatio20d.toFixed(2)}x，呈現典型「放量長紅突破」形態。主力資金以市價買單主動掃清上方賣壓，籌碼由散戶快速轉移至法人主力手中，多方攻擊意圖極為明確。`;
  }
  // 2. 主升浪量價齊揚
  else if (isUp && volumeRatio5d >= 1.05 && volumeRatio5d <= 2.2 && latestBias20 < 12 && (levels.isNewHigh || (latestCandle && latestCandle.close > latestMa5))) {
    patternType = 'MAIN_WAVE_SURGE';
    patternName = '🚀 量價俱揚主升 (健康波段擴張)';
    institutionalIntent = '波段多頭鎖碼推進，良性換手推升';
    volumeHealthScore = 90;
    volumeGrade = 'A';
    flowState = '波段主力持續鎖碼增持';
    analysisSummary = `股價伴隨溫和放量穩步推升，5日量比 ${volumeRatio5d.toFixed(2)}x 配合均線多頭發散，量能結構極為健康。無異常爆量倒貨跡象，波段多頭主升趨勢正在良性延續。`;
  }
  // 3. 高檔爆量滯漲 / 出貨背離
  else if (volumeRatio5d >= 1.8 && (isUpperShadow || priceChangePercent < 0.4 || latestBias20 >= 9.5 || latestRsi >= 75)) {
    patternType = 'CLIMAX_CHURN_RISK';
    patternName = '🚨 高檔爆量滯漲 (主力分批派發風險)';
    institutionalIntent = '高檔巨量換手，主力逢高倒貨派發浮額';
    volumeHealthScore = 38;
    volumeGrade = 'D';
    flowState = '主力高檔出貨，散戶追高接刀';
    analysisSummary = `今日5日量比飆升至 ${volumeRatio5d.toFixed(2)}x (顯著爆量)，但股價漲幅僅 ${priceChangePercent.toFixed(2)}% 或留有明顯長上影線，且20日乖離率高達 +${latestBias20.toFixed(1)}%。此為典型「爆量滯漲/出貨」危險信號，主力極可能利用市場追價情緒逢高出脫籌碼！`;
  }
  // 4. 量縮價跌良性洗盤
  else if (!isUp && volumeRatio5d <= 0.85 && latestCandle && latestCandle.close >= levels.shortSupport * 0.985 && latestCandle.close >= latestMa20 * 0.98) {
    patternType = 'HEALTHY_DRY_PULLBACK';
    patternName = '🛡️ 量縮回測良性洗盤 (籌碼沉澱徹底)';
    institutionalIntent = '主力無意殺跌，縮量洗出不堅定浮額';
    volumeHealthScore = 86;
    volumeGrade = 'A';
    flowState = '賣壓枯竭，主力底部分批承接';
    analysisSummary = `股價回測支撐位時成交量顯著萎縮 (5日量比僅 ${volumeRatio5d.toFixed(2)}x)，顯示市場浮額清洗乾淨、持股信心堅定，無實質主力拋壓。量縮守均線為極佳之低吸佈局窗口。`;
  }
  // 5. 無量陰跌 / 跌破弱勢
  else if (!isUp && latestCandle && (latestCandle.close < latestMa20 || levels.distToMidTermSupportPct >= 3.0) && volumeRatio5d < 0.9) {
    patternType = 'LOW_VOLUME_BLEED';
    patternName = '⚠️ 無量陰跌破線 (缺乏買盤承接)';
    institutionalIntent = '多頭棄守，市場觀望情緒濃厚';
    volumeHealthScore = 45;
    volumeGrade = 'C';
    flowState = '買盤低迷，資金持續流出';
    analysisSummary = `股價失守月線 MA20 或跌破短期支撐，且反彈成交量嚴重匱乏 (5日量比 ${volumeRatio5d.toFixed(2)}x)。缺乏主力買盤護盤，需提防無量陰跌破底風險。`;
  }
  // 6. 底部放量反轉
  else if (isUp && isBigBar && latestBias20 <= -3.0 && volumeRatio5d >= 1.25) {
    patternType = 'BOTTOM_REVERSAL';
    patternName = '💎 底部放量長紅反轉 (超跌主力抄底)';
    institutionalIntent = '左側大資金進場抄底，發動估值修復反彈';
    volumeHealthScore = 88;
    volumeGrade = 'A';
    flowState = '抄底買盤強勢介入';
    analysisSummary = `股價在負乖離超賣區間迎來放量長紅反彈，5日量比 ${volumeRatio5d.toFixed(2)}x，顯示左側主力買盤積極進場托底，底部形態確認，有望展開強勁波段反彈。`;
  } else {
    patternType = 'CONSOLIDATION_ACCUMULATION';
    patternName = '⚖️ 區間震盪蓄勢 (籌碼動態平衡)';
    institutionalIntent = '主力在箱體區間高拋低吸，蓄勢待發';
    volumeHealthScore = 70;
    volumeGrade = 'B';
    flowState = '買賣力道均衡';
    analysisSummary = `當前 5日量比 ${volumeRatio5d.toFixed(2)}x、1個月量比 ${volumeRatio20d.toFixed(2)}x，量能維持在常態水位。股價於短支 NT$ ${levels.shortSupport.toFixed(1)} 與短壓 NT$ ${levels.shortResistance.toFixed(1)} 之間整理，等待突破方向。`;
  }

  return {
    patternType,
    patternName,
    institutionalIntent,
    volumeHealthScore,
    volumeGrade,
    analysisSummary,
    volumeRatio5d,
    volumeRatio20d,
    volumeRatio60d,
    flowState,
  };
}

/**
 * 產生雙軌量化操作策略方案 (穩健型 vs 超額收益進攻型)
 */
export function generateQuantDualStrategyPlans(
  latestPrice: number,
  levels: SupportResistanceLevels,
  atr14: number,
  ma5: number,
  ma10: number,
  ma20: number,
  ma60: number,
  volumeRatio5d: number,
  volumeRatio20d: number,
  volumeRatio60d: number,
  latestRsi: number,
  latestBias20: number,
  priceChangePercent: number,
  candles: CandleData[],
  rightSideStatus: RightSideTradeStatus
): { conservativePlan: QuantStrategyActionPlan; aggressivePlan: QuantStrategyActionPlan } {
  const safeAtr = atr14 > 0 ? atr14 : latestPrice * 0.025;

  // -------------------------------------------------------------
  // 1. CONSERVATIVE PLAN (穩健型操作策略 - 勝率與回撤優先)
  // -------------------------------------------------------------
  const consEntryRef =
    levels.shortSupport > 0 && levels.shortSupport < latestPrice
      ? roundToTick(Math.min(latestPrice, (latestPrice + levels.shortSupport) / 2))
      : roundToTick(latestPrice * 0.99);

  const consEntryTrigger =
    levels.distToShortSupportPct <= 1.5 || levels.distToMidTermSupportPct <= 1.8
      ? `現價區間 (NT$ ${latestPrice.toFixed(1)}) 或回測短支 NT$ ${levels.shortSupport.toFixed(1)} (MA5/支撐位) 守穩分批佈局`
      : `耐心等待量縮回測【短線支撐 NT$ ${levels.shortSupport.toFixed(1)}】或【月線 NT$ ${levels.monthMa20.toFixed(1)}】附近掛單低接`;

  const consTarget1 = roundToTick(levels.shortResistance);
  const consTargetGain1 = ((consTarget1 - latestPrice) / latestPrice) * 100;

  const consTarget2 = roundToTick(levels.midTermResistance);
  const consTargetGain2 = ((consTarget2 - latestPrice) / latestPrice) * 100;

  let consStopLoss =
    levels.shortSupport > 0 && levels.shortSupport < latestPrice * 0.99
      ? roundToTick(levels.shortSupport * 0.988)
      : ma20 > 0 && ma20 < latestPrice
      ? roundToTick(ma20 * 0.988)
      : roundToTick(latestPrice * 0.965);

  if (consStopLoss >= latestPrice) {
    consStopLoss = roundToTick(latestPrice * 0.97);
  }

  const consStopLossRiskPct = Math.max(1.0, Math.round(((latestPrice - consStopLoss) / latestPrice) * 1000) / 10);
  const consRewardAmp = Math.max(0.5, consTarget2 - latestPrice);
  const consRiskAmp = Math.max(0.2, latestPrice - consStopLoss);
  const consRiskReward = Math.max(1.2, Math.round((consRewardAmp / consRiskAmp) * 10) / 10);

  const lastC = candles.length > 0 ? candles[candles.length - 1] : null;
  const upperShadow = lastC ? lastC.high - Math.max(lastC.open, lastC.close) : 0;
  const candleBody = lastC ? Math.abs(lastC.close - lastC.open) : 0;
  const isDayTradeRisk = Boolean(
    lastC &&
      ((upperShadow > candleBody * 0.75 && volumeRatio5d >= 1.2) ||
        (lastC.high - lastC.low > 0 &&
          ((lastC.high - lastC.low) / lastC.low) * 100 >= 5.5 &&
          volumeRatio5d >= 1.3 &&
          lastC.close < lastC.high * 0.98))
  );
  const shakeoutWarning = isDayTradeRisk && lastC
    ? `⚠️ 偵測到高檔長上影線/爆量劇烈震盪，隔日沖大戶鎖單出貨機率高！次日開盤若跌破上影線中軸 (NT$ ${((lastC.high + lastC.close) / 2).toFixed(1)})，嚴格執行短線防禦！`
    : null;

  const conservativePlan: QuantStrategyActionPlan = {
    strategyType: 'CONSERVATIVE',
    title: '🛡️ 穩健防守型操作方案 (勝率優先 / 逢低佈局)',
    badgeLabel: '勝率優先 · 低回撤 · 逢低吸納',
    philosophy: '以高勝率與嚴格資本保護為核心，拒絕高位盲目追價，專注於回測多維共振支撐與月線生命線時的左/右側安全佈局，享有高性價比盈虧比。',
    entryTrigger: consEntryTrigger,
    entryPriceSuggestion: consEntryRef,
    targetPrice1: consTarget1,
    targetPrice1Label: `短壓共振位 (${levels.shortResistanceReason || '3~7日前高'})`,
    targetGain1Pct: Math.round(consTargetGain1 * 10) / 10,
    targetPrice2: consTarget2,
    targetPrice2Label: `1個月中期壓力 (${levels.midTermResistanceReason || '月線大關'})`,
    targetGain2Pct: Math.round(consTargetGain2 * 10) / 10,
    stopLossPrice: consStopLoss,
    stopLossLabel: `跌破關鍵支撐 (NT$ ${levels.shortSupport.toFixed(1)}) / 月線 MA20 下方 1.2% 嚴格止損`,
    stopLossPct: consStopLossRiskPct,
    timeStopLossRule: '【波段時間停損】佈局後 5 個交易日內若未能站穩 MA5 且 5日均量縮至 0.7x 以下，啟動主動時間停損減倉 1/2，嚴防沉沒成本與均線下彎拖累！',
    dayTradeShakeoutWarning: shakeoutWarning,
    riskRewardRatio: consRiskReward,
    riskRewardDisplay: `1 : ${consRiskReward.toFixed(1)}`,
    positionSizeSuggestion: '15% ~ 25% 總資金 (金字塔分批：回踩支撐建倉 1/2，突破站穩加碼 1/2)',
    actionSteps: [
      `【分批進場】避免追高，逢回測短支 NT$ ${levels.shortSupport.toFixed(1)} 或月線 NT$ ${levels.monthMa20.toFixed(1)} 分批低接。`,
      `【嚴格防守】收盤若實體跌破止損價 NT$ ${consStopLoss.toFixed(1)} (最大承擔風險 -${consStopLossRiskPct.toFixed(1)}%)，果斷停損出場。`,
      `【分批停利】股價反彈至短壓 NT$ ${consTarget1.toFixed(1)} (+${consTargetGain1.toFixed(1)}%) 先鎖定 50% 獲利，剩餘籌碼上看月壓 NT$ ${consTarget2.toFixed(1)} (+${consTargetGain2.toFixed(1)}%)。`,
    ],
    isRecommended: rightSideStatus === 'PULLBACK_BUY' || rightSideStatus === 'CONSOLIDATION' || latestBias20 < 4.0,
  };

  // -------------------------------------------------------------
  // 2. AGGRESSIVE PLAN (超額收益進攻型策略 - 賠率與主升浪動能)
  // -------------------------------------------------------------
  const isBreakoutActive = levels.isNewHigh || volumeRatio5d >= 1.25 || priceChangePercent >= 1.5;
  const aggEntryRef = latestPrice;

  const aggEntryTrigger = isBreakoutActive
    ? `現價 (NT$ ${latestPrice.toFixed(1)}) 帶量順勢進攻，或盤中突破 NT$ ${levels.shortResistance.toFixed(1)} 即刻追擊加碼`
    : `盤中 5日量比 > 1.3x 且實體長紅突破【短壓 NT$ ${levels.shortResistance.toFixed(1)}】時果斷進場追擊`;

  const aggTarget1 = levels.isNewHigh
    ? roundToTick(latestPrice + 1.25 * safeAtr)
    : roundToTick(Math.max(levels.midTermResistance, levels.shortResistance * 1.035));
  const aggTargetGain1 = ((aggTarget1 - latestPrice) / latestPrice) * 100;

  const aggTarget2 = levels.isNewHigh
    ? roundToTick(Math.max(aggTarget1 * 1.045, latestPrice + 2.5 * safeAtr))
    : roundToTick(Math.max(levels.midTermResistance * 1.05, levels.midTermResistance + 1.8 * safeAtr));
  const aggTargetGain2 = ((aggTarget2 - latestPrice) / latestPrice) * 100;

  let aggStopLoss =
    ma5 > 0 && ma5 < latestPrice
      ? roundToTick(Math.max(ma5 * 0.992, latestPrice - 1.2 * safeAtr))
      : roundToTick(latestPrice * 0.97);

  if (aggStopLoss >= latestPrice) {
    aggStopLoss = roundToTick(latestPrice * 0.975);
  }

  const aggStopLossRiskPct = Math.max(1.0, Math.round(((latestPrice - aggStopLoss) / latestPrice) * 1000) / 10);
  const aggRewardAmp = Math.max(1.0, aggTarget2 - latestPrice);
  const aggRiskAmp = Math.max(0.3, latestPrice - aggStopLoss);
  const aggRiskReward = Math.max(1.8, Math.round((aggRewardAmp / aggRiskAmp) * 10) / 10);

  const aggressivePlan: QuantStrategyActionPlan = {
    strategyType: 'AGGRESSIVE',
    title: '⚡ 超額收益進攻型方案 (賠率優先 / 主升動能)',
    badgeLabel: '高賠率 Alpha · 主升浪突破 · 動態追蹤',
    philosophy: '專注捕捉右側主升浪加速行情與量價齊揚突破，追求大波段超額收益 (Alpha)，利用 5日均線動態追蹤停利，讓利潤充分奔跑。',
    entryTrigger: aggEntryTrigger,
    entryPriceSuggestion: aggEntryRef,
    targetPrice1: aggTarget1,
    targetPrice1Label: levels.isNewHigh ? '主升浪 Fibonacci 1.272 擴展目標' : `突破1個月前高目標 (${levels.midTermResistance.toFixed(1)})`,
    targetGain1Pct: Math.round(aggTargetGain1 * 10) / 10,
    targetPrice2: aggTarget2,
    targetPrice2Label: levels.isNewHigh ? '極限主升 Fibonacci 1.618 / 宏觀通道頂' : '突破月壓後主升浪波段延伸目標',
    targetGain2Pct: Math.round(aggTargetGain2 * 10) / 10,
    stopLossPrice: aggStopLoss,
    stopLossLabel: `動態移動停利/停損：跌破 5日線 MA5 (NT$ ${ma5.toFixed(1)}) 或虧損達 -${aggStopLossRiskPct.toFixed(1)}% 離場`,
    stopLossPct: aggStopLossRiskPct,
    timeStopLossRule: '【極短線時間停損】突破進場後 3 個交易日若收盤價未能拉開進場價 +1.5%，且 5日均量縮至 0.8x 以下，啟動無條件時間停損平倉離場，防止假突破誘多套牢！',
    dayTradeShakeoutWarning: shakeoutWarning,
    riskRewardRatio: aggRiskReward,
    riskRewardDisplay: `1 : ${aggRiskReward.toFixed(1)}`,
    positionSizeSuggestion: '25% ~ 35% 攻擊部位 (帶量突破確認進場，嚴格紀律執行出局)',
    actionSteps: [
      `【強勢進攻】盤中確認量比 > 1.3x 且站穩 NT$ ${levels.shortResistance.toFixed(1)} 立即進場，鎖定主升波段。`,
      `【動態移動防守】將停損點緊貼 5日線 MA5 (NT$ ${ma5.toFixed(1)}) 或前日低點，只要 5日線未破持股續抱享受主升浪。`,
      `【極限超額收益】第一目標 NT$ ${aggTarget1.toFixed(1)} (+${aggTargetGain1.toFixed(1)}%) 調節 1/3，剩餘 2/3 籌碼博弈極限目標 NT$ ${aggTarget2.toFixed(1)} (+${aggTargetGain2.toFixed(1)}%)！`,
    ],
    isRecommended: rightSideStatus === 'MAIN_WAVE' || isBreakoutActive,
  };

  return {
    conservativePlan,
    aggressivePlan,
  };
}

/**
 * 5日與10日量化風險監控模型與均線扣抵推算引擎
 */
export function calculateTimeframeRiskAssessment(
  candles: CandleData[],
  indicators: TechnicalIndicators,
  levels: SupportResistanceLevels,
  latestPrice: number,
  priceChangePercent: number,
  volumeRatio5d: number,
  volumeRatio20d: number,
  volumeRatio60d: number,
  atr14: number,
  latestMa5: number,
  latestMa10: number,
  latestMa20: number,
  latestMa60: number,
  latestBias20: number,
  latestRsi: number,
  latestK: number,
  latestD: number,
  latestPpo: number,
  latestPpoSignal: number,
  rightSideStatus: RightSideTradeStatus
): TimeframeRiskAssessment {
  const n = candles.length;
  const safeAtr = atr14 > 0 ? atr14 : latestPrice * 0.025;

  // -------------------------------------------------------------
  // 1. 均線扣抵值 (Moving Average Deductions for 5MA, 10MA, 20MA)
  // -------------------------------------------------------------
  // MA5 Deduction (5天前之收盤價)
  const idx5 = Math.max(0, n - 5);
  const deduction5Price = candles[idx5]?.close ?? latestPrice;
  const deduction5Date = candles[idx5]?.time ?? '';
  const diff5 = latestPrice - deduction5Price;
  const diffPct5 = deduction5Price > 0 ? Math.round((diff5 / deduction5Price) * 1000) / 10 : 0;

  let ma5DeductionStatus: MovingAverageDeduction['deductionStatus'] = 'DEDUCTING_FLAT';
  let ma5Slope: MovingAverageDeduction['slopeTendency'] = 'NEUTRAL_FLAT';
  let ma5Impact = '';

  if (latestPrice < deduction5Price - 0.05) {
    ma5DeductionStatus = 'DEDUCTING_HIGH';
    ma5Slope = 'BEARISH_DOWN';
    ma5Impact = `5日線即將扣抵 NT$ ${deduction5Price.toFixed(1)} 相對高價區 (高於現價 ${Math.abs(diffPct5).toFixed(1)}%)。若明日未出現放量大漲過扣抵價，MA5 短期均線將強制下彎蓋頭，短多將面臨均線反壓！`;
  } else if (latestPrice > deduction5Price + 0.05) {
    ma5DeductionStatus = 'DEDUCTING_LOW';
    ma5Slope = 'BULLISH_UP';
    ma5Impact = `5日線正扣抵 NT$ ${deduction5Price.toFixed(1)} 相對低檔區 (低於現價 ${diffPct5.toFixed(1)}%)，扣低有利於 5日均線持續昂頭向上，提供極短線下檔助漲推升支撐。`;
  } else {
    ma5DeductionStatus = 'DEDUCTING_FLAT';
    ma5Slope = 'NEUTRAL_FLAT';
    ma5Impact = `5日線扣抵與現價相當 (NT$ ${deduction5Price.toFixed(1)})，短期均線趨於走平蓄勢。`;
  }

  const ma5Deduction: MovingAverageDeduction = {
    period: 5,
    currentMa: latestMa5,
    deductionPrice: deduction5Price,
    deductionDate: deduction5Date,
    priceDiff: Math.round(diff5 * 100) / 100,
    priceDiffPct: diffPct5,
    deductionStatus: ma5DeductionStatus,
    slopeTendency: ma5Slope,
    impactDescription: ma5Impact,
  };

  // MA10 Deduction (10天前之收盤價)
  const idx10 = Math.max(0, n - 10);
  const deduction10Price = candles[idx10]?.close ?? latestPrice;
  const deduction10Date = candles[idx10]?.time ?? '';
  const diff10 = latestPrice - deduction10Price;
  const diffPct10 = deduction10Price > 0 ? Math.round((diff10 / deduction10Price) * 1000) / 10 : 0;

  let ma10DeductionStatus: MovingAverageDeduction['deductionStatus'] = 'DEDUCTING_FLAT';
  let ma10Slope: MovingAverageDeduction['slopeTendency'] = 'NEUTRAL_FLAT';
  let ma10Impact = '';

  if (latestPrice < deduction10Price - 0.05) {
    ma10DeductionStatus = 'DEDUCTING_HIGH';
    ma10Slope = 'BEARISH_DOWN';
    ma10Impact = `10日雙週線即將扣抵 NT$ ${deduction10Price.toFixed(1)} 高價，雙週線下彎壓抑波段反彈空間，需留意與 5日線死叉共振助跌風險。`;
  } else if (latestPrice > deduction10Price + 0.05) {
    ma10DeductionStatus = 'DEDUCTING_LOW';
    ma10Slope = 'BULLISH_UP';
    ma10Impact = `10日雙週線扣抵 NT$ ${deduction10Price.toFixed(1)} 低位，雙週均線上揚提供波段低吸安全邊際。`;
  } else {
    ma10DeductionStatus = 'DEDUCTING_FLAT';
    ma10Slope = 'NEUTRAL_FLAT';
    ma10Impact = `10日雙週線扣抵與現價相當，走勢平穩。`;
  }

  const ma10Deduction: MovingAverageDeduction = {
    period: 10,
    currentMa: latestMa10,
    deductionPrice: deduction10Price,
    deductionDate: deduction10Date,
    priceDiff: Math.round(diff10 * 100) / 100,
    priceDiffPct: diffPct10,
    deductionStatus: ma10DeductionStatus,
    slopeTendency: ma10Slope,
    impactDescription: ma10Impact,
  };

  // MA20 Deduction (20天前之收盤價 - 月線生命線)
  const idx20 = Math.max(0, n - 20);
  const deduction20Price = candles[idx20]?.close ?? latestPrice;
  const deduction20Date = candles[idx20]?.time ?? '';
  const diff20 = latestPrice - deduction20Price;
  const diffPct20 = deduction20Price > 0 ? Math.round((diff20 / deduction20Price) * 1000) / 10 : 0;

  let ma20DeductionStatus: MovingAverageDeduction['deductionStatus'] = 'DEDUCTING_FLAT';
  let ma20Slope: MovingAverageDeduction['slopeTendency'] = 'NEUTRAL_FLAT';
  let ma20Impact = '';

  if (latestPrice < deduction20Price - 0.05) {
    ma20DeductionStatus = 'DEDUCTING_HIGH';
    ma20Slope = 'BEARISH_DOWN';
    ma20Impact = `20日月生命線即將扣抵 NT$ ${deduction20Price.toFixed(1)}，月線面臨扣高走平甚至轉折下彎壓力，波段多單宜提高警覺。`;
  } else if (latestPrice > deduction20Price + 0.05) {
    ma20DeductionStatus = 'DEDUCTING_LOW';
    ma20Slope = 'BULLISH_UP';
    ma20Impact = `月線扣抵低檔，中期生命線上揚角度健康，多頭大架構未遭破壞。`;
  } else {
    ma20DeductionStatus = 'DEDUCTING_FLAT';
    ma20Slope = 'NEUTRAL_FLAT';
    ma20Impact = `月線扣抵平穩。`;
  }

  const ma20Deduction: MovingAverageDeduction = {
    period: 20,
    currentMa: latestMa20,
    deductionPrice: deduction20Price,
    deductionDate: deduction20Date,
    priceDiff: Math.round(diff20 * 100) / 100,
    priceDiffPct: diffPct20,
    deductionStatus: ma20DeductionStatus,
    slopeTendency: ma20Slope,
    impactDescription: ma20Impact,
  };

  // -------------------------------------------------------------
  // 2. 5日超短線風險清單 (5-Day Ultra-Short Risks)
  // -------------------------------------------------------------
  const fiveDayItems: TimeframeRiskItem[] = [];
  const ma5Bias = latestMa5 > 0 ? Math.round(((latestPrice - latestMa5) / latestMa5) * 1000) / 10 : 0;
  const shortTermStopLoss = roundToTick(latestMa5 > 0 ? Math.min(latestPrice * 0.98, latestMa5 * 0.995) : latestPrice * 0.97);

  // (1) 5日均線扣高蓋頭壓力
  if (ma5DeductionStatus === 'DEDUCTING_HIGH') {
    fiveDayItems.push({
      id: 'ma5_deduction_high',
      category: 'DEDUCTION',
      severity: latestPrice < latestMa5 ? 'CRITICAL' : 'WARNING',
      title: `5日均線扣高蓋頭壓力 (扣抵 NT$ ${deduction5Price.toFixed(1)})`,
      description: `5日均線即將扣抵 ${deduction5Date} 的歷史高價 NT$ ${deduction5Price.toFixed(1)} (高於現價 ${Math.abs(diffPct5).toFixed(1)}%)。若明日未出現放量大紅棒，MA5 將下彎形成短壓，容易引來短線拋售。`,
      triggerValue: `現價 NT$ ${latestPrice.toFixed(1)} < 扣抵價 NT$ ${deduction5Price.toFixed(1)}`,
      mitigation: `短線切忌追高，逢回測短支 NT$ ${levels.shortSupport.toFixed(1)} 守穩再行介入，跌破 5日線應暫時收手觀望。`,
    });
  } else {
    fiveDayItems.push({
      id: 'ma5_deduction_low',
      category: 'DEDUCTION',
      severity: 'SAFE',
      title: `5日均線扣低助漲支撐 (扣抵 NT$ ${deduction5Price.toFixed(1)})`,
      description: `5日均線正扣抵低價區，MA5 向上推升提供極短線保護。`,
      triggerValue: `現價 NT$ ${latestPrice.toFixed(1)} > 扣抵價 NT$ ${deduction5Price.toFixed(1)}`,
      mitigation: `沿 5日均線偏多操作，持股續抱。`,
    });
  }

  // (2) 5日超買過熱 / 乖離率修正風險
  if (ma5Bias >= 4.0 || latestBias20 >= 7.5 || latestRsi >= 75) {
    const isExtreme = ma5Bias >= 6.0 || latestBias20 >= 10.0 || latestRsi >= 82;
    fiveDayItems.push({
      id: 'ma5_bias_climax',
      category: 'BIAS_OVERBOUGHT',
      severity: isExtreme ? 'CRITICAL' : 'WARNING',
      title: `超買過熱與正乖離率修正風險 (距MA5 +${ma5Bias.toFixed(1)}%)`,
      description: `現價距 5日均線正乖離達 +${ma5Bias.toFixed(1)}% (月乖離 +${latestBias20.toFixed(1)}%，RSI ${latestRsi.toFixed(1)})，已進入超買過熱敏感區，短線隨時會出現快速回踩均線的劇烈震盪洗盤。`,
      triggerValue: `MA5乖離 +${ma5Bias.toFixed(1)}% / 月乖離 +${latestBias20.toFixed(1)}%`,
      mitigation: `持股者應將移動停利防守線上移至前日低點，空手者切忌市價追高，等待縮量回踩。`,
    });
  } else {
    fiveDayItems.push({
      id: 'ma5_bias_safe',
      category: 'BIAS_OVERBOUGHT',
      severity: 'SAFE',
      title: `乖離率處於健康常態區間 (距MA5 ${ma5Bias >= 0 ? `+${ma5Bias.toFixed(1)}%` : `${ma5Bias.toFixed(1)}%`})`,
      description: `距 5日均線與月線乖離率健康，未見嚴重過熱超買現象，短線推升空間仍具彈性。`,
      triggerValue: `乖離率常態`,
      mitigation: `維持既有量化風控計畫。`,
    });
  }

  // (3) 5日量價背離 / 追高動能耗竭
  if ((priceChangePercent > 0.4 && volumeRatio5d < 0.78) || (levels.isNewHigh && volumeRatio5d < 0.85)) {
    fiveDayItems.push({
      id: 'vol_divergence',
      category: 'VOLUME_DIVERGENCE',
      severity: 'WARNING',
      title: `5日量價背離 / 追高買盤動能衰竭`,
      description: `今日價格向上推升，但 5日量比僅 ${(volumeRatio5d * 100).toFixed(0)}% (量縮價漲)。高檔買盤資金動能不足，若無連續補量容易演變為多頭陷阱。`,
      triggerValue: `5日量比僅 ${(volumeRatio5d * 100).toFixed(0)}% (嚴重縮量)`,
      mitigation: `密切緊盯盤中量能，若未見量比放大至 1.2x 以上且跌破前一日低點，應果斷停利避險。`,
    });
  } else if (volumeRatio5d >= 1.5 && priceChangePercent < -0.5) {
    fiveDayItems.push({
      id: 'vol_heavy_dump',
      category: 'VOLUME_DIVERGENCE',
      severity: 'CRITICAL',
      title: `爆量長黑放量出貨訊號`,
      description: `放量收黑 (5日量比 ${(volumeRatio5d * 100).toFixed(0)}%)，主力資金明顯拋售出逃，短期承壓重。`,
      triggerValue: `爆量收黑 -${Math.abs(priceChangePercent).toFixed(1)}%`,
      mitigation: `嚴格停損，不可逢低攤平。`,
    });
  } else {
    fiveDayItems.push({
      id: 'vol_healthy',
      category: 'VOLUME_DIVERGENCE',
      severity: 'SAFE',
      title: `量價配合常態運行 (5日量比 ${(volumeRatio5d * 100).toFixed(0)}%)`,
      description: `量能與價格走勢無嚴重背離，5日均量維持平穩換手。`,
      triggerValue: `量比常態`,
      mitigation: `依照量能放大時順勢操作。`,
    });
  }

  // (4) 爆量長上影線 / 隔日沖大戶出貨洗盤
  const lastC = candles[n - 1];
  const upperShadow = lastC ? lastC.high - Math.max(lastC.open, lastC.close) : 0;
  const candleBody = lastC ? Math.abs(lastC.close - lastC.open) : 0;
  const candleAmplitude = lastC && lastC.low > 0 ? Math.round(((lastC.high - lastC.low) / lastC.low) * 1000) / 10 : 0;

  if (lastC && ((upperShadow > candleBody * 0.75 && volumeRatio5d >= 1.2) || (candleAmplitude >= 5.5 && volumeRatio5d >= 1.3 && lastC.close < lastC.high * 0.98))) {
    fiveDayItems.push({
      id: 'pinbar_shakeout',
      category: 'DAY_TRADE_CHURN',
      severity: 'WARNING',
      title: `爆量長上影線 / 隔日沖大戶出貨洗盤`,
      description: `高檔留下顯著上影線或爆量劇烈震盪 (單日振幅 ${candleAmplitude.toFixed(1)}%，量比 ${(volumeRatio5d * 100).toFixed(0)}%)，典型隔日沖主力或解套盤大量拋出籌碼痕跡，隔日早盤開高走低摜壓機率高。`,
      triggerValue: `上影線長度顯著 / 振幅 ${candleAmplitude.toFixed(1)}%`,
      mitigation: `次日開盤若開平或開低且跌破上影線中軸 (NT$ ${((lastC.high + lastC.close) / 2).toFixed(1)})，嚴格執行短線停損/停利。`,
    });
  } else {
    fiveDayItems.push({
      id: 'pinbar_safe',
      category: 'DAY_TRADE_CHURN',
      severity: 'SAFE',
      title: `K棒實體結實，未見劇烈隔日沖長影線`,
      description: `收盤結構穩固，短線多方籌碼鎖定度良好。`,
      triggerValue: `K棒實體結構正常`,
      mitigation: `持續觀察次日開盤表現。`,
    });
  }

  // (5) 5日均線極短線防守臨界點
  fiveDayItems.push({
    id: 'ma5_defense_line',
    category: 'KEY_LEVEL_BREAK',
    severity: latestPrice < latestMa5 ? 'CRITICAL' : 'NOTICE',
    title: `5日均線極短線停損防守位 (NT$ ${shortTermStopLoss.toFixed(1)})`,
    description: `5日均線 (NT$ ${latestMa5.toFixed(1)}) 為短線極速交易者的核心生命線。一旦收盤確認跌破防守價 NT$ ${shortTermStopLoss.toFixed(1)}，短多停損賣壓容易形成連鎖多殺多。`,
    triggerValue: `防守止損位 NT$ ${shortTermStopLoss.toFixed(1)}`,
    mitigation: `跌破 5日線當日先減倉至少 1/2，若隔日無法迅速站回則全數出清。`,
  });

  const fiveDayAlertItem = fiveDayItems.find((it) => it.severity === 'CRITICAL' || it.severity === 'WARNING');
  const fiveDaySummary = fiveDayAlertItem
    ? `⚠️ 5日短線主要風險：${fiveDayAlertItem.title}。${fiveDayAlertItem.description.slice(0, 50)}...`
    : `✅ 5日短線結構相對健康，均線扣抵低且乖離常態，主要緊盯 5日線 (NT$ ${latestMa5.toFixed(1)}) 支撐防守。`;

  // -------------------------------------------------------------
  // 3. 10日波段風險清單 (10-Day Swing Risks)
  // -------------------------------------------------------------
  const tenDayItems: TimeframeRiskItem[] = [];
  const swingDefensiveLine = roundToTick(levels.monthMa20 > 0 ? levels.monthMa20 * 0.99 : latestPrice * 0.95);
  const maxEstimatedDrawdownPct = Math.round(((2.0 * safeAtr) / latestPrice) * 1000) / 10;
  const recent10Candles = candles.slice(Math.max(0, n - 10));
  const recent10High = recent10Candles.length > 0 ? Math.max(...recent10Candles.map((c) => c.high)) : latestPrice;
  const distTo10HighPct = latestPrice > 0 ? Math.round(((recent10High - latestPrice) / latestPrice) * 1000) / 10 : 0;

  // (1) 10日雙週均線走平/扣高反壓
  if (ma10DeductionStatus === 'DEDUCTING_HIGH' || latestPrice < latestMa10) {
    tenDayItems.push({
      id: 'ma10_deduction_risk',
      category: 'DEDUCTION',
      severity: latestPrice < latestMa10 ? 'CRITICAL' : 'WARNING',
      title: `10日雙週均線走平/扣高反壓 (扣抵 NT$ ${deduction10Price.toFixed(1)})`,
      description: `10日雙週均線扣抵相對高位 (NT$ ${deduction10Price.toFixed(1)})。若股價跌破 10日線，雙週均線將加速下墜，波段支撐全面瓦解轉為強大下壓蓋頭反壓。`,
      triggerValue: `現價 NT$ ${latestPrice.toFixed(1)} < 10日扣抵價 NT$ ${deduction10Price.toFixed(1)}`,
      mitigation: `波段單應觀察 10日線能否在 2 個交易日內收復，否則轉為防守模式。`,
    });
  } else {
    tenDayItems.push({
      id: 'ma10_deduction_safe',
      category: 'DEDUCTION',
      severity: 'SAFE',
      title: `10日雙週線扣低助漲 (扣抵 NT$ ${deduction10Price.toFixed(1)})`,
      description: `雙週線持續上揚，提供中期強勢回測買點。`,
      triggerValue: `10日線向上助漲`,
      mitigation: `逢回測 10日線守穩可分批加碼。`,
    });
  }

  // (2) 逼近10日內密集套牢反壓區
  if (!levels.isNewHigh && distTo10HighPct <= 3.0 && distTo10HighPct > -0.1) {
    tenDayItems.push({
      id: 'ten_day_overhead_supply',
      category: 'KEY_LEVEL_BREAK',
      severity: 'WARNING',
      title: `逼近10日內密集套牢反壓區 (NT$ ${recent10High.toFixed(1)})`,
      description: `距近 10 日波段最高反壓 NT$ ${recent10High.toFixed(1)} 僅 ${distTo10HighPct.toFixed(1)}%，該區間存在 10 日內追高套牢浮額，若無 20日均量 1.3 倍以上大推力難以一舉穿透。`,
      triggerValue: `距10日前高套牢僅 ${distTo10HighPct.toFixed(1)}%`,
      mitigation: `在壓力區前不主動追價加碼，等待實體紅 K 帶量站穩前高後再順勢追擊。`,
    });
  } else {
    tenDayItems.push({
      id: 'ten_day_overhead_safe',
      category: 'KEY_LEVEL_BREAK',
      severity: 'SAFE',
      title: `10日上方無沉重套牢密集區`,
      description: `上檔套牢賣壓已消化或已創高，籌碼阻力較輕。`,
      triggerValue: `壓力通暢`,
      mitigation: `依照目標價規劃分批停利。`,
    });
  }

  // (3) 月線生命線 (MA20) 核心防守臨界點
  tenDayItems.push({
    id: 'month_ma20_defense',
    category: 'KEY_LEVEL_BREAK',
    severity: latestPrice < levels.monthMa20 ? 'CRITICAL' : 'WARNING',
    title: `月線生命線 (MA20) 核心防守臨界點 (NT$ ${swingDefensiveLine.toFixed(1)})`,
    description: `20日均線 (NT$ ${levels.monthMa20.toFixed(1)}) 為波段多空分水嶺。跌破此線代表波段多頭走勢告終，轉入至少 2~4 週的中期整理或空頭回檔。`,
    triggerValue: `收盤實體跌破 NT$ ${swingDefensiveLine.toFixed(1)}`,
    mitigation: `收盤若實體跌破月線防守線 NT$ ${swingDefensiveLine.toFixed(1)}，波段多單無論盈虧皆應無條件離場。`,
  });

  // (4) 10日最大波動潛在回撤 (ATR Volatility Drawdown)
  tenDayItems.push({
    id: 'atr_volatility_drawdown',
    category: 'VOLATILITY_DRAWDOWN',
    severity: maxEstimatedDrawdownPct >= 7.0 ? 'WARNING' : 'NOTICE',
    title: `10日潛在最大波動回撤 (約 -${maxEstimatedDrawdownPct.toFixed(1)}%)`,
    description: `依據近期市場真實波動度 (ATR14 = NT$ ${safeAtr.toFixed(1)})，未來 10 日常態震盪容忍最大回撤預估約 -${maxEstimatedDrawdownPct.toFixed(1)}% (回檔至 NT$ ${(latestPrice - 2.0 * safeAtr).toFixed(1)})。`,
    triggerValue: `ATR 波動回撤 -${maxEstimatedDrawdownPct.toFixed(1)}%`,
    mitigation: `評估自身心理回撤承受力與部位規模，切勿重倉槓桿持有以防波動掃出。`,
  });

  // (5) 假突破誘多與時間衰減洗盤風險
  tenDayItems.push({
    id: 'whipsaw_trap_risk',
    category: 'KEY_LEVEL_BREAK',
    severity: levels.distToShortResistancePct <= 1.8 ? 'WARNING' : 'SAFE',
    title: `假突破誘多與時間衰減洗盤風險`,
    description: `若盤中強勢衝過前高但未能在 3 個交易日內持續守在突破價位之上，將被確立為「假突破陷阱 (Bull Trap)」，通常會引發深幅且快速的跌破均線洗盤。`,
    triggerValue: `突破後 3 日未拉出價差`,
    mitigation: `突破後以突破 K 棒低點或 5日線作為「時間與價格雙重停損」，3日內不漲反跌即刻止損。`,
  });

  const tenDayAlertItem = tenDayItems.find((it) => it.severity === 'CRITICAL' || it.severity === 'WARNING');
  const tenDaySummary = tenDayAlertItem
    ? `⚠️ 10日波段主要風險：${tenDayAlertItem.title}。${tenDayAlertItem.description.slice(0, 50)}...`
    : `✅ 10日波段架構良好，月線生命線 (NT$ ${levels.monthMa20.toFixed(1)}) 具備實質支撐，以月線防守續抱。`;

  // -------------------------------------------------------------
  // 4. 系統現有缺陷與改進建議 (5 大缺失剖析)
  // -------------------------------------------------------------
  const systemDeficiencies: SystemDeficiencyItem[] = [
    {
      title: '1. 缺少均線「扣抵值動態預測」',
      category: '均線趨勢',
      shortDescription: '靜態 MA 均線無法預測未來 1~3 天扣高或扣低所導致的均線下彎蓋頭。',
      impact: '若 5天/10天前為歷史高價，股價就算橫盤不跌，均線也會被迫下彎形成「蓋頭重壓」，容易誤判強勢而追在均線轉折拐點。',
      recommendation: '計算 5日/10日/20日扣抵值與現價溢折率，扣高時嚴格禁止追價，扣低時方可順勢做多（本系統已全新實裝！）。',
    },
    {
      title: '2. 缺乏「時間維度分層風險矩陣 (5日超短線 vs 10日波段)」',
      category: '風險時效',
      shortDescription: '先前僅有單一綜合 riskLevel，未區分短線當沖客與波段持股者的風險週期。',
      impact: '超短線最忌諱「5日均線扣高、隔日沖出貨、超買正乖離回吐」，波段最忌諱「10日雙週線下彎、月線失守多殺多、ATR波段回撤過深」。',
      recommendation: '分層列出 5日超短線風險清單與 10日波段防守清單，並分別給予明確停損錨定點（本系統已全新實裝！）。',
    },
    {
      title: '3. 缺少台股關鍵的「籌碼面（三大法人與融資浮額）」',
      category: '籌碼結構',
      shortDescription: '純技術面與估值無法掌握外資期現貨避險空單、投信季底結帳賣壓與散戶融資浮額。',
      impact: '台股為淺碟型市場，若投信連賣或融資使用率過高（散戶大增），純技術支撐極易瞬間被灌破。',
      recommendation: '未來可擴充串接 TWSE 三大法人買賣超與融資融券變化，作為二次量化過濾器。',
    },
    {
      title: '4. 缺少台股大盤環境（Beta 系統性連動風險）',
      category: '宏觀大盤',
      shortDescription: '個別股票判斷未與加權指數/櫃買 OTC 大盤位階連動。',
      impact: '當大盤跳水破月線時，高達 75% 的強勢股會遭遇系統性補跌，造成假突破頻發。',
      recommendation: '引入大盤趨勢溫度計，當大盤處於月線下方時，全面調降持倉上限與策略推薦門檻。',
    },
    {
      title: '5. 缺少「時間停損 (Time-Decay Stop-loss)」與隔日沖過濾',
      category: '交易紀律',
      shortDescription: '買入後若連續 3~5 日橫盤且量能枯竭，未設置時間退出機制。',
      impact: '資金被卡在死水盤中，承擔隨時可能發生的補跌風險與極高機會成本。',
      recommendation: '突破進場後 3~5 天若未能拉開 2.5% 以上安全距離且量能萎縮，執行時間停損出場。',
    },
  ];

  // -------------------------------------------------------------
  // 5. 綜合量化風險評分與評級 (Overall Risk Score: 0 ~ 100)
  // -------------------------------------------------------------
  let riskScore = 20;
  if (ma5DeductionStatus === 'DEDUCTING_HIGH') riskScore += 15;
  if (ma10DeductionStatus === 'DEDUCTING_HIGH') riskScore += 12;
  if (ma5Bias >= 4.0) riskScore += 12;
  if (ma5Bias >= 6.0) riskScore += 10;
  if (latestBias20 >= 8.0) riskScore += 12;
  if (latestRsi >= 75) riskScore += 10;
  if (priceChangePercent > 0.4 && volumeRatio5d < 0.78) riskScore += 12;
  if (latestPrice < latestMa5) riskScore += 14;
  if (latestPrice < latestMa10) riskScore += 14;
  if (latestPrice < levels.monthMa20) riskScore += 16;
  if (rightSideStatus === 'HIGH_CHASE_RISK') riskScore += 18;

  riskScore = Math.min(95, Math.max(5, riskScore));

  let riskGrade: TimeframeRiskAssessment['riskGrade'] = 'B';
  let riskGradeLabel = '中度常態波動';

  if (riskScore <= 30) {
    riskGrade = 'A';
    riskGradeLabel = '安全低風險 (逢低吸納區)';
  } else if (riskScore <= 55) {
    riskGrade = 'B';
    riskGradeLabel = '中度常態波動 (嚴守紀律)';
  } else if (riskScore <= 75) {
    riskGrade = 'C';
    riskGradeLabel = '偏高警戒風險 (防守優先)';
  } else {
    riskGrade = 'D';
    riskGradeLabel = '極高警戒 (追高/破位高危)';
  }

  return {
    overallRiskScore: riskScore,
    riskGrade,
    riskGradeLabel,
    fiveDayRisks: {
      summary: fiveDaySummary,
      keyAlert: fiveDayAlertItem ? fiveDayAlertItem.title : null,
      ma5Deduction,
      shortTermStopLoss,
      items: fiveDayItems,
    },
    tenDayRisks: {
      summary: tenDaySummary,
      keyAlert: tenDayAlertItem ? tenDayAlertItem.title : null,
      ma10Deduction,
      ma20Deduction,
      swingDefensiveLine,
      maxEstimatedDrawdownPct,
      items: tenDayItems,
    },
    systemDeficiencies,
  };
}

/**
 * Checks all technical signals and evaluates Left-Side and Right-Side trade profiles.
 * 
 * CRITICAL REQUIREMENTS:
 * 1. Strict 7-day lookback for left-side initial golden cross.
 * 2. STRICT DEATH-CROSS EXCLUSION: If an indicator crossed up within the 7-day window, but subsequently
 *    death-crossed before/at current bar (or is CURRENTLY in a death cross state, e.g. ppoLine < ppoSignal or K < D),
 *    IT MUST BE STRICTLY EXCLUDED to prevent buying into a death trap!
 */
export function checkTechnicalSignals(
  candles: CandleData[],
  params?: Partial<ScanFilterParams> & { pe?: number; pb?: number; industry?: string }
): SignalCheckResult {
  const masterMode = params?.masterMode ?? 'left_side';
  const strategy = params?.strategy ?? (masterMode === 'right_side' ? 'right_super_trend' : 'deep_value');
  const ppoOversoldThreshold = params?.ppoOversoldThreshold ?? -2.0;
  const biasOversoldThreshold = params?.biasOversoldThreshold ?? -5.0;
  const excludeDeathCross = params?.excludeDeathCrossAfterGoldenCross ?? true;

  const defaultValuation = evaluateValuation(params?.pe ?? 0, params?.pb ?? 0, params?.industry);
  const defaultLevels: SupportResistanceLevels = {
    shortSupport: 0,
    shortResistance: 0,
    midTermSupport: 0,
    midTermResistance: 0,
    isNewHigh: false,
    shortResistanceReason: '無資料',
    shortResistanceStars: 1,
    shortResistanceEvidence: [],
    shortSupportReason: '無資料',
    shortSupportStars: 1,
    shortSupportEvidence: [],
    midTermResistanceReason: '無資料',
    midTermResistanceStars: 1,
    midTermResistanceEvidence: [],
    midTermSupportReason: '無資料',
    midTermSupportStars: 1,
    midTermSupportEvidence: [],
    midLongSupport: 0,
    midLongResistance: 0,
    distToShortResistancePct: 0,
    distToShortSupportPct: 0,
    distToMidTermResistancePct: 0,
    distToMidTermSupportPct: 0,
    distToMidLongResistancePct: 0,
    distToMidLongSupportPct: 0,
    distToResistancePct: 0,
    distToSupportPct: 0,
    monthMa20: 0,
    monthMa20BiasPct: 0,
    monthMa20Status: 'ABOVE_MA20',
    monthMa20StatusText: '無資料',
    structuralAnalysis: {
      keyBearishBar: null,
      keyBullishBar: null,
      swingHigh: { price: 0, date: '', daysAgo: 0 },
      swingLow: { price: 0, date: '', daysAgo: 0 },
      isNewHigh: false,
      volumeRatioEvaluation: '無資料',
      summary: '無資料',
    },
  };
  const defaultRightSide: RightSideTradeEvaluation = {
    status: 'CONSOLIDATION',
    badgeText: '震盪整理',
    riskLevel: 'LOW',
    volumeStatus: 'DRY_SHRINKING',
    volumeStatusText: '量能平淡',
    volumeRatioTo5d: 1.0,
    volumeRatioTo20d: 1.0,
    volumeRatioTo60d: 1.0,
    analysis: '數據不足以評估量價結構。',
    suggestion: '維持觀望，等待突破訊號。',
  };

  if (candles.length < 20) {
    return {
      macdRed: false,
      skdjCross: false,
      rsiDivergence: false,
      ppoCrossUp: false,
      ppoOversold: false,
      biasOversold: false,
      bollingerOversoldTurn: false,
      highDividendSafe: false,
      ppoCrossStatus: 'NEUTRAL',
      skdjCrossStatus: 'NEUTRAL',
      macdCrossStatus: 'NEUTRAL',
      hasSubsequentDeathCross: false,
      isCurrentlyDeathCross: false,
      isBullishMaAlignment: false,
      isRightSideBreakout: false,
      isBollingerWalking: false,
      isMaPullbackSupport: false,
      isPpoBullishAccelerate: false,
      isMatch: false,
      matchedStrategies: [],
      levels: defaultLevels,
      rightSideEvaluation: defaultRightSide,
      valuation: defaultValuation,
      recentPrices: candles,
      indicators: computeTechnicalIndicators(candles),
      latestPrice: candles.length > 0 ? candles[candles.length - 1].close : 0,
      priceChange: 0,
      priceChangePercent: 0,
      latestMa5: 0,
      latestMa10: 0,
      latestMa20: 0,
      latestMa60: 0,
      latestPpo: 0,
      latestPpoSignal: 0,
      latestPpoHist: 0,
      latestRsi: 50,
      latestK: 50,
      latestD: 50,
      latestBias20: 0,
      latestPercentB: 0.5,
      high52w: 0,
      low52w: 0,
      volume: candles.length > 0 ? candles[candles.length - 1].volume : 0,
      avgVolume5d: 0,
      avgVolume20d: 0,
      avgVolume60d: 0,
      volumeRatio5d: 1.0,
      volumeRatio20d: 1.0,
      volumeRatio60d: 1.0,
    };
  }

  const indicators = computeTechnicalIndicators(candles);
  const n = candles.length;
  const lastIdx = n - 1;

  const latestPrice = candles[lastIdx].close;
  const prevPrice = candles[lastIdx - 1]?.close ?? latestPrice;
  const priceChange = latestPrice - prevPrice;
  const priceChangePercent = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;

  const latestMa5 = indicators.ma5[lastIdx] ?? latestPrice;
  const latestMa10 = indicators.ma10[lastIdx] ?? latestPrice;
  const latestMa20 = indicators.ma20[lastIdx] ?? latestPrice;
  const latestMa60 = indicators.ma60[lastIdx] ?? latestPrice;

  const latestPpo = indicators.ppoLine[lastIdx] ?? 0;
  const latestPpoSignal = indicators.ppoSignal[lastIdx] ?? 0;
  const latestPpoHist = indicators.ppoHist[lastIdx] ?? 0;
  const latestRsi = indicators.rsi[lastIdx] ?? 50;
  const latestK = indicators.k[lastIdx] ?? 50;
  const latestD = indicators.d[lastIdx] ?? 50;
  const latestBias20 = indicators.bias20[lastIdx] ?? 0;
  const latestPercentB = indicators.bollingerPercentB[lastIdx] ?? 0.5;

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const high52w = Math.max(...closes.slice(-120));
  const low52w = Math.min(...closes.slice(-120));

  // ----------------------------------------------------
  // VOLUME ANALYSIS (5-day, 20-day, and 60-day Average Volumes & Volume Ratio)
  // ----------------------------------------------------
  const currentVol = volumes[lastIdx];
  const avgVolume5d = indicators.volMa5[lastIdx] ?? currentVol;
  const avgVolume20d = indicators.volMa20[lastIdx] ?? currentVol;
  const avgVolume60d = indicators.volMa60[lastIdx] ?? currentVol;

  const volumeRatio5d = avgVolume5d > 0 ? Math.round((currentVol / avgVolume5d) * 100) / 100 : 1.0;
  const volumeRatio20d = avgVolume20d > 0 ? Math.round((currentVol / avgVolume20d) * 100) / 100 : 1.0;
  const volumeRatio60d = avgVolume60d > 0 ? Math.round((currentVol / avgVolume60d) * 100) / 100 : 1.0;

  let volumeStatus: RightSideTradeEvaluation['volumeStatus'] = 'HEALTHY_VOLUME';
  let volumeStatusText = '常態溫和量能';

  if (volumeRatio5d >= 1.45 && volumeRatio60d >= 1.25 && currentVol > 0) {
    volumeStatus = 'EXPLOSIVE_EXPANSION';
    volumeStatusText = '爆量突破攻擊';
  } else if (volumeRatio60d >= 1.2 && volumeRatio5d >= 1.05) {
    volumeStatus = 'QUARTER_MA_BREAKOUT';
    volumeStatusText = '突破季均量線';
  } else if (priceChangePercent > 1.2 && volumeRatio5d < 0.75) {
    volumeStatus = 'VOLUME_PRICE_DIVERGENCE';
    volumeStatusText = '量縮價漲 (量價背離)';
  } else if (volumeRatio5d < 0.70) {
    volumeStatus = 'DRY_SHRINKING';
    volumeStatusText = '極度量縮/窒息量';
  } else {
    volumeStatus = 'HEALTHY_VOLUME';
    volumeStatusText = '常態量能';
  }

  // ----------------------------------------------------
  // SHORT & MID-LONG SUPPORT AND RESISTANCE
  // ----------------------------------------------------
  const levels = calculateSupportResistance(candles, indicators);

  // ----------------------------------------------------
  // DETERMINE CURRENT CROSS STATUS FOR INDICATORS
  // ----------------------------------------------------
  const ppoCrossStatus: IndicatorCrossStatus =
    latestPpo > latestPpoSignal
      ? 'GOLDEN_CROSS'
      : latestPpo < latestPpoSignal
      ? 'DEATH_CROSS'
      : 'NEUTRAL';

  const skdjCrossStatus: IndicatorCrossStatus =
    latestK > latestD
      ? 'GOLDEN_CROSS'
      : latestK < latestD
      ? 'DEATH_CROSS'
      : 'NEUTRAL';

  const macdCrossStatus: IndicatorCrossStatus =
    (indicators.dif[lastIdx] ?? 0) > (indicators.macdSignal[lastIdx] ?? 0)
      ? 'GOLDEN_CROSS'
      : (indicators.dif[lastIdx] ?? 0) < (indicators.macdSignal[lastIdx] ?? 0)
      ? 'DEATH_CROSS'
      : 'NEUTRAL';

  const isCurrentlyDeathCross =
    ppoCrossStatus === 'DEATH_CROSS' || skdjCrossStatus === 'DEATH_CROSS';

  // ----------------------------------------------------
  // STRICT 7-DAY LOOKBACK & DEATH-CROSS REJECTION ENGINE
  // ----------------------------------------------------
  const leftStartIdx = Math.max(1, n - 7);
  let hasSubsequentDeathCross = false;

  // 1. MACD Check with subsequent Death-Cross Filter
  let macdRed = false;
  let macdGoldenCrossIdx = -1;
  for (let i = leftStartIdx; i < n; i++) {
    const curHist = indicators.macdHist[i] ?? 0;
    const prevHist = indicators.macdHist[i - 1] ?? 0;
    if (prevHist <= 0 && curHist > 0) {
      macdGoldenCrossIdx = i;
    }
  }
  if (macdGoldenCrossIdx !== -1) {
    // Check if there was a subsequent death cross after golden cross
    let hasDeathAfter = false;
    for (let j = macdGoldenCrossIdx + 1; j < n; j++) {
      const curHist = indicators.macdHist[j] ?? 0;
      const prevHist = indicators.macdHist[j - 1] ?? 0;
      if (prevHist >= 0 && curHist < 0) {
        hasDeathAfter = true;
        break;
      }
    }
    // Must NOT have subsequent death cross, and CURRENTLY must be positive
    if (!hasDeathAfter && (indicators.macdHist[lastIdx] ?? 0) >= 0) {
      macdRed = true;
    } else if (hasDeathAfter) {
      hasSubsequentDeathCross = true;
    }
  } else if ((indicators.macdHist[lastIdx] ?? 0) > 0 && (indicators.macdHist[lastIdx] ?? 0) > (indicators.macdHist[lastIdx - 1] ?? 0)) {
    macdRed = true;
  }

  // 2. SKDJ Check with strict subsequent Death-Cross Filter
  let skdjCross = false;
  let skdjGoldenCrossIdx = -1;
  for (let i = leftStartIdx; i < n; i++) {
    const curK = indicators.k[i] ?? 50;
    const curD = indicators.d[i] ?? 50;
    const prevK = indicators.k[i - 1] ?? 50;
    const prevD = indicators.d[i - 1] ?? 50;
    if (prevK <= prevD && curK > curD && (curK < 50 || curD < 50)) {
      skdjGoldenCrossIdx = i;
    }
  }
  if (skdjGoldenCrossIdx !== -1) {
    let hasDeathAfter = false;
    for (let j = skdjGoldenCrossIdx + 1; j < n; j++) {
      const curK = indicators.k[j] ?? 50;
      const curD = indicators.d[j] ?? 50;
      const prevK = indicators.k[j - 1] ?? 50;
      const prevD = indicators.d[j - 1] ?? 50;
      if (prevK >= prevD && curK < curD) {
        hasDeathAfter = true;
        break;
      }
    }
    // CURRENT STATE MUST BE K >= D, and NO death cross after
    if (!hasDeathAfter && latestK >= latestD) {
      skdjCross = true;
    } else if (hasDeathAfter) {
      hasSubsequentDeathCross = true;
    }
  }

  // 3. RSI Bottom Rebound
  let rsiDivergence = false;
  for (let i = leftStartIdx; i < n; i++) {
    const curRsi = indicators.rsi[i] ?? 50;
    const prevRsi = indicators.rsi[i - 1] ?? 50;
    if (curRsi < 36 && curRsi > prevRsi && i >= n - 4 && latestRsi >= 30) {
      rsiDivergence = true;
      break;
    }
  }

  // 4. PPO Deep Oversold and Golden Cross with strict Death-Cross Filter
  let ppoCrossUp = false;
  let ppoOversold = false;
  let ppoGoldenCrossIdx = -1;

  for (let i = leftStartIdx; i < n; i++) {
    const curPpo = indicators.ppoLine[i] ?? 0;
    const curSig = indicators.ppoSignal[i] ?? 0;
    const prevPpo = indicators.ppoLine[i - 1] ?? 0;
    const prevSig = indicators.ppoSignal[i - 1] ?? 0;

    if (curPpo <= ppoOversoldThreshold || prevPpo <= ppoOversoldThreshold) {
      ppoOversold = true;
    }

    if (prevPpo <= prevSig && curPpo > curSig) {
      ppoGoldenCrossIdx = i;
    }
  }

  if (ppoGoldenCrossIdx !== -1) {
    // Check if subsequent death cross happened after golden cross
    let hasDeathAfter = false;
    for (let j = ppoGoldenCrossIdx + 1; j < n; j++) {
      const curPpo = indicators.ppoLine[j] ?? 0;
      const curSig = indicators.ppoSignal[j] ?? 0;
      const prevPpo = indicators.ppoLine[j - 1] ?? 0;
      const prevSig = indicators.ppoSignal[j - 1] ?? 0;
      if (prevPpo >= prevSig && curPpo < curSig) {
        hasDeathAfter = true;
        break;
      }
    }

    // CRITICAL: Must NOT have subsequent death cross, and CURRENTLY must maintain PPO >= Signal!
    if (!hasDeathAfter && latestPpo >= latestPpoSignal && latestPpoHist >= -0.01) {
      ppoCrossUp = true;
    } else if (hasDeathAfter) {
      hasSubsequentDeathCross = true;
    }
  }

  // 5. BIAS 20 Oversold within last 7 days
  let biasOversold = false;
  for (let i = leftStartIdx; i < n; i++) {
    const curBias = indicators.bias20[i] ?? 0;
    if (curBias <= biasOversoldThreshold) {
      if (latestBias20 <= 2.0 && !isCurrentlyDeathCross) {
        biasOversold = true;
      }
      break;
    }
  }

  // 6. Bollinger Squeeze Reversal within last 7 days
  let bollingerOversoldTurn = false;
  for (let i = leftStartIdx; i < n; i++) {
    const pastB = indicators.bollingerPercentB[i] ?? 0.5;
    if (pastB < 0.15) {
      if (latestPercentB >= 0.15 && latestPercentB <= 0.65 && !isCurrentlyDeathCross) {
        bollingerOversoldTurn = true;
        break;
      }
    }
  }

  // ----------------------------------------------------
  // RIGHT-SIDE TREND & MAIN-UPWAVE DETECTIONS
  // ----------------------------------------------------
  const isBullishMaAlignment =
    latestPrice >= latestMa5 * 0.995 &&
    latestMa5 >= latestMa10 &&
    latestMa10 >= latestMa20 &&
    (latestMa60 === 0 || latestMa20 >= latestMa60 * 0.98);

  const recent20Closes = closes.slice(Math.max(0, n - 21), n - 1);
  const highest20Close = recent20Closes.length > 0 ? Math.max(...recent20Closes) : latestPrice;
  const isRightSideBreakout =
    latestPrice >= highest20Close * 0.995 &&
    volumeRatio5d >= 1.3 &&
    currentVol > 0 &&
    priceChangePercent > 0.3;

  const isBollingerWalking = latestPercentB >= 0.90 && latestPpo > 0 && latestPrice > latestMa5;

  const prevLow = candles[lastIdx].low;
  const isMaPullbackSupport =
    latestPrice >= latestMa20 &&
    prevLow <= latestMa10 * 1.02 &&
    latestMa10 >= latestMa20 &&
    volumeRatio5d <= 1.05 &&
    latestK >= 35 &&
    latestK >= latestD;

  const isPpoBullishAccelerate =
    latestPpo > 0 &&
    latestPpoHist > 0 &&
    latestPpo >= latestPpoSignal &&
    (indicators.ppoHist[lastIdx - 1] ?? 0) <= latestPpoHist;

  // ----------------------------------------------------
  // RIGHT-SIDE TRADE EVALUATION: 走主升波 vs 追高風險
  // ----------------------------------------------------
  let rightSideStatus: RightSideTradeEvaluation['status'] = 'CONSOLIDATION';
  let rightSideBadgeText = '區間震盪蓄勢';
  let riskLevel: RightSideTradeEvaluation['riskLevel'] = 'MEDIUM';
  let rightSideAnalysis = '';
  let rightSideSuggestion = '';

  const isExtremeOverbought = latestBias20 >= 14 || (latestRsi >= 80 && latestBias20 >= 7) || latestPercentB >= 1.15;
  const isModerateOverbought = latestRsi >= 75 || latestPercentB >= 1.05 || latestBias20 >= 8.5;
  const nearResistance = !levels.isNewHigh && (levels.distToShortResistancePct <= 1.8 || levels.distToMidTermResistancePct <= 2.0);
  const isVolumeDivergent = (volumeRatio5d < 0.82 && priceChangePercent > 0.4) || volumeRatio5d < 0.65 || volumeRatio20d < 0.75;

  if (levels.isNewHigh && isExtremeOverbought) {
    rightSideStatus = 'HIGH_CHASE_RISK';
    rightSideBadgeText = '🚨 追高風險 (創高極度過熱/正乖離過大)';
    riskLevel = 'HIGH';
    rightSideAnalysis = `股價已創波段/歷史新高 (NT$ ${latestPrice.toFixed(2)})，上方無實質套牢賣壓 (籌碼 100% 處於獲利狀態)。但當前 20日乖離率高達 +${latestBias20.toFixed(1)}%、RSI 達 ${latestRsi.toFixed(1)} (進入極度超買過熱區)，短線隨時面臨獲利了結調節賣壓與均線乖離修正回檔！`;
    rightSideSuggestion = `切勿在正乖離極高時盲目追價！持股者應將移動停利防守線設在 5日均線 (MA5 NT$ ${latestMa5.toFixed(1)}) 或前一日低點鎖定大段獲利；空手者切忌追高，應耐心等待量縮回測月線 MA20 (NT$ ${levels.monthMa20.toFixed(1)}) 或 MA10 支撐再伺機佈局。`;
  } else if (nearResistance && (isVolumeDivergent || isModerateOverbought)) {
    rightSideStatus = 'HIGH_CHASE_RISK';
    rightSideBadgeText = '🚨 追高風險 (逼近1個月壓力/量縮背離)';
    riskLevel = 'HIGH';
    rightSideAnalysis = `目前股價 (NT$ ${latestPrice.toFixed(2)}) 距1個月中期壓力 NT$ ${levels.midTermResistance.toFixed(2)} 僅 ${levels.distToMidTermResistancePct.toFixed(1)}% (短壓 NT$ ${levels.shortResistance.toFixed(2)})，但當前 5 日量比僅 ${(volumeRatio5d * 100).toFixed(0)}%、1個月量比 ${(volumeRatio20d * 100).toFixed(0)}% (量能嚴重匱乏)，RSI 為 ${latestRsi.toFixed(1)}。${levels.structuralAnalysis.keyBearishBar ? `上方有 ${levels.structuralAnalysis.keyBearishBar.date} 大陰線套牢賣壓。` : ''}`;
    rightSideSuggestion = `切勿在此盲目追高！建議等待帶量突破1個月壓力位 (NT$ ${levels.midTermResistance.toFixed(2)})，或等待縮量回測月線 MA20 支撐 (NT$ ${levels.monthMa20.toFixed(2)}) 再行布局。`;
  } else if ((levels.isNewHigh || isRightSideBreakout || (isBullishMaAlignment && volumeRatio5d >= 1.25)) && !isExtremeOverbought) {
    rightSideStatus = 'MAIN_WAVE';
    rightSideBadgeText = levels.isNewHigh ? '🚀 走主升波 (量價俱揚創1個月新高)' : '🚀 走主升波 (量價俱揚突破前高)';
    riskLevel = 'LOW';
    rightSideAnalysis = `均線多頭排列且穩站月線 MA20 (NT$ ${levels.monthMa20.toFixed(2)}) 之上，今日 5 日量比達 ${(volumeRatio5d * 100).toFixed(0)}%、1個月量比 ${(volumeRatio20d * 100).toFixed(0)}% 爆量突破，上方無套牢賣壓，PPO 快線 (+${latestPpo.toFixed(2)}%) 高於訊號線放量上攻，主力強烈表態！`;
    rightSideSuggestion = `符合右側順勢主升戰法，持股者續抱讓利潤奔跑；新進者可逢分時回測分批進場，防守點設在跌破 MA10 (NT$ ${latestMa10.toFixed(2)}) 或月線 MA20。`;
  } else if (isMaPullbackSupport) {
    rightSideStatus = 'PULLBACK_BUY';
    rightSideBadgeText = '🛡️ 拉回支撐點 (縮量守月線MA20)';
    riskLevel = 'LOW';
    rightSideAnalysis = `多頭架構下股價精準回測月線 MA20 (NT$ ${levels.monthMa20.toFixed(2)})，量比縮至 ${(volumeRatio5d * 100).toFixed(0)}% 浮額沉澱乾淨，KD 維持金叉向上，中期支撐穩固。`;
    rightSideSuggestion = `右側交易最佳性價比低吸點，下檔風險極低，建議分批承接，停損設在實體收黑跌破月線 MA20。`;
  } else {
    rightSideStatus = 'CONSOLIDATION';
    rightSideBadgeText = '⚖️ 區間整理 (月線之上多空蓄勢)';
    riskLevel = 'MEDIUM';
    rightSideAnalysis = `股價於中期月線支撐 (NT$ ${levels.midTermSupport.toFixed(2)}) 與1個月壓力 (NT$ ${levels.midTermResistance.toFixed(2)}) 之間整理，5日量比 ${(volumeRatio5d * 100).toFixed(0)}%，等待方向表態。`;
    rightSideSuggestion = `建議區間操作或等待帶量突破1個月箱頂壓力後順勢介入。`;
  }

  const atr14 = calculateATR14(candles);
  const volumePriceAnalysis = analyzeVolumePriceDeep(
    candles,
    volumeRatio5d,
    volumeRatio20d,
    volumeRatio60d,
    priceChangePercent,
    levels,
    latestMa5,
    latestMa20,
    latestBias20,
    latestRsi,
    latestPercentB
  );

  const { conservativePlan, aggressivePlan } = generateQuantDualStrategyPlans(
    latestPrice,
    levels,
    atr14,
    latestMa5,
    latestMa10,
    latestMa20,
    latestMa60,
    volumeRatio5d,
    volumeRatio20d,
    volumeRatio60d,
    latestRsi,
    latestBias20,
    priceChangePercent,
    candles,
    rightSideStatus
  );

  const timeframeRiskAssessment = calculateTimeframeRiskAssessment(
    candles,
    indicators,
    levels,
    latestPrice,
    priceChangePercent,
    volumeRatio5d,
    volumeRatio20d,
    volumeRatio60d,
    atr14,
    latestMa5,
    latestMa10,
    latestMa20,
    latestMa60,
    latestBias20,
    latestRsi,
    latestK,
    latestD,
    latestPpo,
    latestPpoSignal,
    rightSideStatus
  );

  const rightSideEvaluation: RightSideTradeEvaluation = {
    status: rightSideStatus,
    badgeText: rightSideBadgeText,
    riskLevel,
    volumeStatus,
    volumeStatusText,
    volumeRatioTo5d: volumeRatio5d,
    volumeRatioTo20d: volumeRatio20d,
    volumeRatioTo60d: volumeRatio60d,
    analysis: rightSideAnalysis,
    suggestion: rightSideSuggestion,
    volumePriceAnalysis,
    conservativePlan,
    aggressivePlan,
    timeframeRiskAssessment,
  };

  // ----------------------------------------------------
  // VALUATION ASSESSMENT
  // ----------------------------------------------------
  const valuation = evaluateValuation(params?.pe ?? 0, params?.pb ?? 0, params?.industry);

  // ----------------------------------------------------
  // STRATEGY CLASSIFICATION & MATCH DECISION
  // ----------------------------------------------------
  const matchedStrategies: string[] = [];

  // Left-Side Strategies (Strict 7-day lookback + EXCLUDE death crossed traps)
  if (ppoCrossUp && (ppoOversold || latestPpo < 0) && !hasSubsequentDeathCross && !isCurrentlyDeathCross) {
    matchedStrategies.push('ppo_oversold');
  }
  if (biasOversold && !isCurrentlyDeathCross) {
    matchedStrategies.push('bias_reversal');
  }
  if (bollingerOversoldTurn && !isCurrentlyDeathCross) {
    matchedStrategies.push('bollinger_breakout');
  }
  if (params?.minDividendYield && params.minDividendYield > 0) {
    matchedStrategies.push('high_dividend');
  }
  if ((ppoCrossUp || skdjCross || macdRed) && (latestBias20 < 0 || latestPercentB < 0.45) && !hasSubsequentDeathCross && !isCurrentlyDeathCross) {
    matchedStrategies.push('deep_value');
  }

  // Right-Side Strategies
  if (isBullishMaAlignment && isRightSideBreakout) {
    matchedStrategies.push('right_super_trend');
  }
  if (isBollingerWalking) {
    matchedStrategies.push('right_bollinger_squeeze');
  }
  if (isMaPullbackSupport) {
    matchedStrategies.push('right_ma_pullback');
  }
  if (isPpoBullishAccelerate) {
    matchedStrategies.push('right_ppo_zero_cross');
  }
  if (isRightSideBreakout) {
    matchedStrategies.push('right_volume_breakout');
  }

  // Determine isMatch based on selected strategy
  let isMatch = false;

  // Strict death cross rejection rule:
  // If master mode is left_side or strategy is left side, and stock has subsequent death cross or is currently in death cross, REJECT match!
  const isLeftMode = masterMode === 'left_side' || ['deep_value', 'ppo_oversold', 'bias_reversal', 'bollinger_breakout', 'high_dividend'].includes(strategy);
  const rejectDueToDeathCross = excludeDeathCross && isLeftMode && (hasSubsequentDeathCross || isCurrentlyDeathCross);

  if (!rejectDueToDeathCross) {
    switch (strategy) {
      case 'ppo_oversold':
        isMatch = ppoCrossUp && ppoOversold && !hasSubsequentDeathCross && ppoCrossStatus === 'GOLDEN_CROSS';
        break;
      case 'bias_reversal':
        isMatch = biasOversold && (macdRed || skdjCross || priceChangePercent > 0) && !isCurrentlyDeathCross;
        break;
      case 'bollinger_breakout':
        isMatch = bollingerOversoldTurn && !isCurrentlyDeathCross;
        break;
      case 'deep_value':
        isMatch = (ppoCrossUp || skdjCross || macdRed) && (latestBias20 < 1.0 || latestPercentB < 0.5) && !hasSubsequentDeathCross && !isCurrentlyDeathCross;
        break;
      case 'right_super_trend':
        isMatch = isBullishMaAlignment && (isRightSideBreakout || latestPrice > latestMa5);
        break;
      case 'right_bollinger_squeeze':
        isMatch = isBollingerWalking;
        break;
      case 'right_ma_pullback':
        isMatch = isMaPullbackSupport;
        break;
      case 'right_ppo_zero_cross':
        isMatch = isPpoBullishAccelerate;
        break;
      case 'right_volume_breakout':
        isMatch = isRightSideBreakout;
        break;
      default:
        if (masterMode === 'right_side') {
          isMatch = isBullishMaAlignment || isRightSideBreakout || isBollingerWalking;
        } else {
          isMatch = (ppoCrossUp || biasOversold || bollingerOversoldTurn || macdRed) && !hasSubsequentDeathCross && !isCurrentlyDeathCross;
        }
    }
  }

  // -------------------------------------------------------------
  // 5大結構性缺失改善：高級過濾引擎 (Advanced Deficiencies Filter Rules)
  // -------------------------------------------------------------
  const lastBar = candles.length > 0 ? candles[lastIdx] : null;
  const lastUpperShadow = lastBar ? lastBar.high - Math.max(lastBar.open, lastBar.close) : 0;
  const lastBody = lastBar ? Math.abs(lastBar.close - lastBar.open) : 0;
  const isDayTradeShakeout = Boolean(
    lastBar &&
      ((lastUpperShadow > lastBody * 0.75 && volumeRatio5d >= 1.2) ||
        (lastBar.high - lastBar.low > 0 &&
          ((lastBar.high - lastBar.low) / lastBar.low) * 100 >= 5.5 &&
          volumeRatio5d >= 1.3 &&
          lastBar.close < lastBar.high * 0.98))
  );

  if (isMatch) {
    // 缺失一：若啟用「僅選扣低助漲股」，扣高下彎者直接排除
    if (params?.filterLowDeductionOnly && timeframeRiskAssessment.fiveDayRisks.ma5Deduction.deductionStatus === 'DEDUCTING_HIGH') {
      isMatch = false;
    }
    // 缺失二：若啟用「僅選 A/B 級安全低風險股」，排除 C/D 級高危股
    if (params?.filterSafeRiskOnly && (timeframeRiskAssessment.riskGrade === 'C' || timeframeRiskAssessment.riskGrade === 'D')) {
      isMatch = false;
    }
    // 缺失五：若啟用「排除隔日沖與假突破高危股」
    if (params?.excludeDayTradeShakeout && isDayTradeShakeout) {
      isMatch = false;
    }
  }

  return {
    macdRed,
    skdjCross,
    rsiDivergence,
    ppoCrossUp,
    ppoOversold,
    biasOversold,
    bollingerOversoldTurn,
    highDividendSafe: Boolean(params?.minDividendYield && params.minDividendYield > 0),
    ppoCrossStatus,
    skdjCrossStatus,
    macdCrossStatus,
    hasSubsequentDeathCross,
    isCurrentlyDeathCross,
    isBullishMaAlignment,
    isRightSideBreakout,
    isBollingerWalking,
    isMaPullbackSupport,
    isPpoBullishAccelerate,
    isMatch,
    matchedStrategies,
    levels,
    rightSideEvaluation,
    valuation,
    timeframeRiskAssessment,
    ma5DeductionStatus: timeframeRiskAssessment.fiveDayRisks.ma5Deduction.deductionStatus,
    riskGrade: timeframeRiskAssessment.riskGrade,
    shortTermStopLoss: timeframeRiskAssessment.fiveDayRisks.shortTermStopLoss,
    swingDefensiveLine: timeframeRiskAssessment.tenDayRisks.swingDefensiveLine,
    isDayTradeShakeoutRisk: isDayTradeShakeout,
    recentPrices: candles,
    indicators,
    latestPrice,
    priceChange,
    priceChangePercent,
    latestMa5,
    latestMa10,
    latestMa20,
    latestMa60,
    latestPpo,
    latestPpoSignal,
    latestPpoHist,
    latestRsi,
    latestK,
    latestD,
    latestBias20,
    latestPercentB,
    high52w,
    low52w,
    volume: currentVol,
    avgVolume5d,
    avgVolume20d,
    avgVolume60d,
    volumeRatio5d,
    volumeRatio20d,
    volumeRatio60d,
  };
}
