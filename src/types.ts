export interface TwseStockValuation {
  Code: string;
  Name: string;
  PEratio: number;
  PBratio: number;
  DividendYield?: number;
  Industry?: string;
  MarketCap?: string;
  price?: number;
  priceChange?: number;
  priceChangePercent?: number;
  volume?: number;
  updatedAt?: string;
}

export interface RealtimeQuoteInfo {
  code: string;
  name: string;
  price: number;
  yesterdayClose?: number;
  priceChange: number;
  priceChangePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  time?: string;
  source: 'TWSE_MIS' | 'TWSE_OPENAPI' | 'YAHOO_REALTIME' | 'TPEX_OPENAPI';
  updatedAt: string;
}

export interface CandleData {
  time: string; // YYYY-MM-DD
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  // Moving Averages (MA5, MA10, MA20, MA60)
  ma5: (number | null)[];
  ma10: (number | null)[];
  ma20: (number | null)[];
  ma60: (number | null)[];

  // Volume Moving Averages (Vol MA5, Vol MA20, Vol MA60)
  volMa5: (number | null)[];
  volMa20: (number | null)[];
  volMa60: (number | null)[];

  // Bias (% distance from MA)
  bias20: (number | null)[];
  bias60: (number | null)[];

  // MACD
  ema12: (number | null)[];
  ema26: (number | null)[];
  dif: (number | null)[];
  macdSignal: (number | null)[];
  macdHist: (number | null)[];

  // PPO (Percentage Price Oscillator - Normalized %)
  ppoLine: (number | null)[];
  ppoSignal: (number | null)[];
  ppoHist: (number | null)[];

  // SKDJ (Slow KD)
  k: (number | null)[];
  d: (number | null)[];
  rsv: (number | null)[];

  // RSI
  rsi: (number | null)[];

  // Bollinger Bands (20, 2)
  bollingerUpper: (number | null)[];
  bollingerMiddle: (number | null)[];
  bollingerLower: (number | null)[];
  bollingerPercentB: (number | null)[];
}

export type MasterTradingMode = 'left_side' | 'right_side';

export type LeftSideStrategyType =
  | 'deep_value'
  | 'ppo_oversold'
  | 'bias_reversal'
  | 'bollinger_breakout'
  | 'high_dividend'
  | 'custom';

export type RightSideStrategyType =
  | 'right_super_trend' // 均線多頭排列主升突破 (勝率最高)
  | 'right_bollinger_squeeze' // 布林暴風開口主升暴衝
  | 'right_ma_pullback' // 強勢回測 MA10/MA20 支撐起漲
  | 'right_ppo_zero_cross' // PPO 零軸上二度金叉加速
  | 'right_volume_breakout'; // 突破 20 日新高爆量起飛

export type StrategyType = LeftSideStrategyType | RightSideStrategyType;

// Valuation Assessment Types
export type ValuationTag = 'DEEP_VALUE' | 'UNDERVALUED' | 'FAIR_VALUE' | 'OVERVALUED' | 'OVERHEATED';

export interface ValuationAssessment {
  tag: ValuationTag;
  label: string; // e.g. "深度低估", "估值偏低", "合理區間", "估值偏高", "過熱溢價"
  colorClass: string;
  peAssessment: string;
  pbAssessment: string;
  summary: string;
}

// Structural Key Bar information (大陰線 / 大陽線 / 前高 / 前低)
export interface StructuralKeyBar {
  date: string;
  daysAgo: number;
  open: number;
  close: number;
  high: number;
  low: number;
  changePct: number;
  volume: number;
  volumeRatio5d: number;
  levelPrice: number; // 關鍵反壓價 (大陰線高/開) 或 關鍵防守價 (大陽線低/開)
  desc: string;
}

export interface StructuralPriceAnalysis {
  keyBearishBar: StructuralKeyBar | null; // 前方關鍵巨量大陰線 (僅當價格在大陰線下方承壓時才成立)
  keyBullishBar: StructuralKeyBar | null; // 前方關鍵放量大陽線
  swingHigh: { price: number; date: string; daysAgo: number }; // 近期波段前高
  swingLow: { price: number; date: string; daysAgo: number }; // 近期波段前低
  isNewHigh: boolean; // 是否處於1個月新高或歷史新高 (上方無套牢賣壓)
  allTimeOrPeriodHighDesc?: string; // 創高格局說明 (如: "突破1個月新高，上方無歷史套牢盤，籌碼100%獲利")
  volumeRatioEvaluation: string; // 當日量比對突破前方壓力的動能評估
  summary: string; // 綜合形態判定說明
}

// Support & Resistance Levels (Short-term & Mid-term 1-Month with Quant Confluence Engine)
export interface SupportResistanceLevels {
  shortSupport: number; // 短期支撐 (極短線 3~7日 / MA5均線 / 近週波段低點 / 近週大陽線防守)
  shortResistance: number; // 短期壓力 (極短線 3~7日 / 近週波段高點 / 短線次級反壓 / 短線大陰線頂)
  midTermSupport: number; // 中期支撐 (1個月 / ~20-22交易日 / 月線 MA20 / 1個月波段前低 / 1個月大陽線防守底)
  midTermResistance: number; // 中期壓力 (1個月 / ~20-22交易日 / 1個月波段前高 / 1個月巨量大陰線套牢頂 / 月布林上軌)
  
  isNewHigh: boolean; // 是否為創高/無套牢盤狀態
  resistanceLabel?: string; // 壓力位屬性標籤 (如: "整數心理關卡" vs "1個月套牢反壓")

  // Quant Confluence Engine Metadata (量化共振定價依據與星級)
  shortResistanceReason: string; // 短壓定價邏輯
  shortResistanceStars: number; // 共振星級 1~3
  shortResistanceEvidence: string[]; // 構成短壓的技術與籌碼因子明細
  
  shortSupportReason: string; // 短支定價邏輯
  shortSupportStars: number; // 共振星級 1~3
  shortSupportEvidence: string[]; // 構成短支的技術與籌碼因子明細

  midTermResistanceReason: string; // 月壓定價邏輯
  midTermResistanceStars: number; // 共振星級 1~3
  midTermResistanceEvidence: string[]; // 構成月壓的技術與籌碼因子明細

  midTermSupportReason: string; // 月支定價邏輯
  midTermSupportStars: number; // 共振星級 1~3
  midTermSupportEvidence: string[]; // 構成月支的技術與籌碼因子明細

  quantPricingModel?: string; // 定價模型說明

  // Backwards compatibility aliases
  midLongSupport?: number;
  midLongResistance?: number;
  
  distToShortResistancePct: number; // 距離短期壓力位 %
  distToShortSupportPct: number; // 距離短期支撐位 %
  distToMidTermResistancePct: number; // 距離中期(1個月)壓力位 %
  distToMidTermSupportPct: number; // 距離中期(1個月)支撐位 %
  
  distToMidLongResistancePct?: number; // legacy alias
  distToMidLongSupportPct?: number; // legacy alias

  // Month Line (MA20) Details
  monthMa20: number; // 月線價格 (20MA)
  monthMa20BiasPct: number; // 距月線乖離率 (Bias20 %)
  monthMa20Status: 'ABOVE_MA20' | 'PULLBACK_TESTING_MA20' | 'BELOW_MA20'; // 月線相對位置
  monthMa20StatusText: string;

  // Legacy field aliases for backwards compatibility
  distToResistancePct: number;
  distToSupportPct: number;
  strongSupport?: number;
  strongResistance?: number;

  // Deep structural breakdown (1個月內形態分析)
  structuralAnalysis: StructuralPriceAnalysis;
}

// Cross status enum for strict death-cross filter
export type IndicatorCrossStatus = 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'NEUTRAL';

// Moving Average Deduction (均線扣抵值)
export interface MovingAverageDeduction {
  period: 5 | 10 | 20; // 5日、10日、20日月線
  currentMa: number;
  deductionPrice: number; // N日前對應扣抵之收盤價
  deductionDate?: string; // 扣抵歷史K棒日期
  priceDiff: number; // 現價 - 扣抵價
  priceDiffPct: number; // 扣抵溢折價百分比
  deductionStatus: 'DEDUCTING_HIGH' | 'DEDUCTING_LOW' | 'DEDUCTING_FLAT'; // 扣高(下彎壓迫) vs 扣低(助漲支撐)
  slopeTendency: 'BULLISH_UP' | 'BEARISH_DOWN' | 'NEUTRAL_FLAT';
  impactDescription: string;
}

// 5日 & 10日關鍵風險條目
export interface TimeframeRiskItem {
  id: string;
  category: 'DEDUCTION' | 'BIAS_OVERBOUGHT' | 'VOLUME_DIVERGENCE' | 'VOLATILITY_DRAWDOWN' | 'KEY_LEVEL_BREAK' | 'DAY_TRADE_CHURN';
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE' | 'SAFE';
  title: string;
  description: string;
  triggerValue: string;
  mitigation: string; // 應對處置方案
}

// 系統現有缺陷與改進建議條目
export interface SystemDeficiencyItem {
  title: string;
  category: string;
  shortDescription: string;
  impact: string;
  recommendation: string;
}

// 5日與10日量化風險監控模型評估結果
export interface TimeframeRiskAssessment {
  overallRiskScore: number; // 0 ~ 100 風險指數 (越高代表短線與波段累積風險越高)
  riskGrade: 'A' | 'B' | 'C' | 'D'; // A: 低風險/安全佈局區, B: 中等, C: 偏高, D: 極高警戒
  riskGradeLabel: string;
  fiveDayRisks: {
    summary: string;
    keyAlert: string | null;
    ma5Deduction: MovingAverageDeduction;
    shortTermStopLoss: number;
    items: TimeframeRiskItem[];
  };
  tenDayRisks: {
    summary: string;
    keyAlert: string | null;
    ma10Deduction: MovingAverageDeduction;
    ma20Deduction: MovingAverageDeduction;
    swingDefensiveLine: number;
    maxEstimatedDrawdownPct: number;
    items: TimeframeRiskItem[];
  };
  systemDeficiencies: SystemDeficiencyItem[];
}

// Right-Side Trade Status (走主升 vs 追高風險)
export type RightSideTradeStatus = 'MAIN_WAVE' | 'HIGH_CHASE_RISK' | 'CONSOLIDATION' | 'PULLBACK_BUY';
export type VolumeStatusType = 'EXPLOSIVE_EXPANSION' | 'HEALTHY_VOLUME' | 'DRY_SHRINKING' | 'VOLUME_PRICE_DIVERGENCE' | 'QUARTER_MA_BREAKOUT';

/**
 * 具體量化操作方案 (穩健型 vs 超額收益進攻型)
 */
export interface QuantStrategyActionPlan {
  strategyType: 'CONSERVATIVE' | 'AGGRESSIVE';
  title: string; // 策略名稱
  badgeLabel: string; // 標籤 (例如 "穩健防守型 / 勝率優先" or "超額收益型 / 主升爆發")
  philosophy: string; // 核心理念
  
  // 進場條件
  entryTrigger: string; // 具體觸發進場價位與訊號 (例如 "回測 NT$xxx 守穩" or "帶量突破 NT$xxx")
  entryPriceSuggestion: number; // 建議參考進場錨定價

  // 上看目標價 (Take Profit Targets)
  targetPrice1: number; // 上看第一目標價
  targetPrice1Label: string; // 目標1名稱 (例如 "短壓共振點" or "主升浪 1.272 擴展")
  targetGain1Pct: number; // 預期獲利率 %
  
  targetPrice2: number; // 上看第二目標價 (極限/波段)
  targetPrice2Label: string; // 目標2名稱 (例如 "月壓大關" or "Fib 1.618 終極擴展 / 宏觀通道頂")
  targetGain2Pct: number; // 預期獲利率 %

  // 嚴格止損價 (Stop Loss / Invalidation)
  stopLossPrice: number; // 嚴格止損價格
  stopLossLabel: string; // 止損條件名稱 (例如 "跌破月線 MA20 (NT$xxx)" or "跌破 5日線 / 突破K低點")
  stopLossPct: number; // 最大承擔風險 % (正值，例如 3.5 代表 -3.5%)

  // 缺失五改善：時間停損 (Time-Decay Stop Loss) & 隔日沖出貨警告
  timeStopLossRule: string; // 時間停損執行紀律 (例如 "買進後3日內未拉開+1.5%且量縮，無條件出清")
  dayTradeShakeoutWarning?: string | null; // 隔日沖長上影警告

  // 盈虧比與倉位
  riskRewardRatio: number; // 期望盈虧比 (例如 3.4 代表 1 : 3.4)
  riskRewardDisplay: string; // "1 : 3.4"
  positionSizeSuggestion: string; // 建議持倉權重 (例如 "15% ~ 25% 分批建倉")
  
  // 步驟化執行指引
  actionSteps: string[]; // 步驟 1, 2, 3
  isRecommended: boolean; // 是否為當前量價結構最推薦策略
}

/**
 * 深度量價結構與主力資金意圖分析
 */
export interface VolumePriceDeepAnalysis {
  patternType: 'VOLUME_EXPANSION_BREAKOUT' | 'MAIN_WAVE_SURGE' | 'CLIMAX_CHURN_RISK' | 'HEALTHY_DRY_PULLBACK' | 'LOW_VOLUME_BLEED' | 'BOTTOM_REVERSAL' | 'CONSOLIDATION_ACCUMULATION';
  patternName: string; // 量價形態名稱
  institutionalIntent: string; // 主力資金意圖 (例如 "主動吸籌突破"、"洗盤換手"、"高檔出貨派發")
  volumeHealthScore: number; // 0 ~ 100 量能健康評分
  volumeGrade: 'A+' | 'A' | 'B' | 'C' | 'D'; // 量能評級
  analysisSummary: string; // 深度量價診斷論述
  volumeRatio5d: number; // 當日量 / 5日均量
  volumeRatio20d: number; // 當日量 / 20日均量
  volumeRatio60d: number; // 當日量 / 60日季均量
  flowState: string; // 資金流向狀態
}

export interface RightSideTradeEvaluation {
  status: RightSideTradeStatus;
  badgeText: string; // "走主升波 (量價俱揚)", "追高風險 (逼近壓力/量縮背離)", "拉回支撐點 (縮量守均線)", "震盪整理"
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  volumeStatus: VolumeStatusType;
  volumeStatusText: string;
  volumeRatioTo5d: number; // 當日量 / 5日均量
  volumeRatioTo20d: number; // 當日量 / 20日均量
  volumeRatioTo60d: number; // 當日量 / 60日季均量
  analysis: string; // 完整量價與壓力位剖析論述
  suggestion: string; // 具體操作策略建議

  // 專業量化量價深度剖析與雙軌操作方案
  volumePriceAnalysis?: VolumePriceDeepAnalysis;
  conservativePlan?: QuantStrategyActionPlan; // 穩健型操作策略
  aggressivePlan?: QuantStrategyActionPlan; // 超額收益進攻型操作策略
  timeframeRiskAssessment?: TimeframeRiskAssessment; // 5日與10日量化風險監控模型
}

export interface SignalCheckResult {
  // Classic signals
  macdRed: boolean;
  skdjCross: boolean;
  rsiDivergence: boolean;

  // Advanced Left-Side Bottom-Fishing signals (Strict 7-day lookback window)
  ppoCrossUp: boolean;
  ppoOversold: boolean;
  biasOversold: boolean;
  bollingerOversoldTurn: boolean;
  highDividendSafe: boolean;

  // Cross states and death cross rejection flags
  ppoCrossStatus: IndicatorCrossStatus;
  skdjCrossStatus: IndicatorCrossStatus;
  macdCrossStatus: IndicatorCrossStatus;
  hasSubsequentDeathCross: boolean; // 若在7天內金叉後又死叉，此旗標為 true (必排除)
  isCurrentlyDeathCross: boolean; // 當前處於死叉中

  // Advanced Right-Side Trend signals
  isBullishMaAlignment: boolean; // MA5 > MA10 > MA20 > MA60
  isRightSideBreakout: boolean; // 突破近 20 日高點 + 爆量 (必須量增)
  isBollingerWalking: boolean; // %B > 0.92 且開口擴張
  isMaPullbackSupport: boolean; // 回測 MA10/MA20 有守反彈
  isPpoBullishAccelerate: boolean; // PPO > 0 金叉加速

  // Composite match
  isMatch: boolean;
  matchedStrategies: string[];

  // Support & Resistance (Short & Mid-Long)
  levels: SupportResistanceLevels;

  // Right-Side Evaluation (走主升 vs 追高)
  rightSideEvaluation: RightSideTradeEvaluation;

  // Valuation Assessment (PE / PB)
  valuation: ValuationAssessment;

  // 5日與10日量化風險評估模型
  timeframeRiskAssessment?: TimeframeRiskAssessment;
  ma5DeductionStatus?: 'DEDUCTING_HIGH' | 'DEDUCTING_LOW' | 'DEDUCTING_FLAT';
  riskGrade?: 'A' | 'B' | 'C' | 'D';
  shortTermStopLoss?: number;
  swingDefensiveLine?: number;
  isDayTradeShakeoutRisk?: boolean;

  // Extracted values
  recentPrices: CandleData[];
  indicators: TechnicalIndicators;
  latestPrice: number;
  priceChange: number;
  priceChangePercent: number;
  latestMa5: number;
  latestMa10: number;
  latestMa20: number;
  latestMa60: number;
  latestPpo: number;
  latestPpoSignal: number;
  latestPpoHist: number;
  latestRsi: number;
  latestK: number;
  latestD: number;
  latestBias20: number;
  latestPercentB: number;
  high52w: number;
  low52w: number;
  volume: number;
  avgVolume5d: number;
  avgVolume20d: number;
  avgVolume60d: number;
  volumeRatio5d: number;
  volumeRatio20d: number;
  volumeRatio60d: number;
}

export interface StockScanResult {
  code: string;
  name: string;
  industry?: string;
  close: number;
  priceChange?: number;
  priceChangePercent?: number;
  pe: number;
  pb: number;
  dividendYield?: number;
  volume?: number;
  avgVolume5d?: number;
  avgVolume20d?: number;
  avgVolume60d?: number;
  volumeRatio5d?: number;
  volumeRatio20d?: number;
  volumeRatio60d?: number;
  high52w?: number;
  low52w?: number;

  // Indicators summary
  ma5: number;
  ma10: number;
  ma20: number;
  ma60: number;
  ppo: number;
  ppoSignal: number;
  ppoHist: number;
  rsi: number;
  k: number;
  d: number;
  bias20: number;
  percentB: number;

  // Cross Status
  ppoCrossStatus: IndicatorCrossStatus;
  skdjCrossStatus: IndicatorCrossStatus;
  macdCrossStatus: IndicatorCrossStatus;
  hasSubsequentDeathCross?: boolean;
  isCurrentlyDeathCross?: boolean;

  // Key levels (Short-term & Mid-Long-term + Structural Analysis)
  levels: SupportResistanceLevels;

  // Right Side Trade Evaluation (走主升 vs 追高風險)
  rightSideEvaluation: RightSideTradeEvaluation;

  // PE & PB Valuation Assessment (低估 vs 高估)
  valuation: ValuationAssessment;

  // 5日與10日量化風險監控模型
  timeframeRiskAssessment?: TimeframeRiskAssessment;

  // 缺失三改善：三大法人與融資籌碼面指標
  institutionalChip?: InstitutionalChipData;

  // 缺失四改善：台股大盤環境總體溫度計
  marketRegime?: MarketRegimeInfo;

  // 缺失一/二/五改善之直覺快捷標籤與停損防守位
  ma5DeductionStatus?: 'DEDUCTING_HIGH' | 'DEDUCTING_LOW' | 'DEDUCTING_FLAT';
  riskGrade?: 'A' | 'B' | 'C' | 'D';
  shortTermStopLoss?: number;
  swingDefensiveLine?: number;
  isDayTradeShakeoutRisk?: boolean;

  // Signals & status
  isBullishMaAlignment?: boolean;
  isRightSideBreakout?: boolean;
  isBollingerWalking?: boolean;
  isMaPullbackSupport?: boolean;
  macdRed: boolean;
  skdjCross: boolean;
  rsiDivergence: boolean;
  ppoCrossUp: boolean;
  ppoOversold: boolean;
  biasOversold: boolean;
  bollingerOversoldTurn: boolean;

  signals: string[];
  matchedStrategies: string[];
  candles: CandleData[];
  indicators?: TechnicalIndicators;
  syncedAt?: string;
}

export interface SectorStockSummary {
  code: string;
  name: string;
  priceChangePercent: number;
  close: number;
  pe?: number;
  pb?: number;
  dividendYield?: number;
}

export interface SectorFlowItem {
  id: string;
  name: string;
  tag: string;
  netInflow: number; // in 100M NTD (億元)
  turnoverRatio: number; // % share of total market volume
  avgChangePercent: number; // %
  leaderStocks: SectorStockSummary[];
  inflowTrend: number[]; // 5/10 period trend points for sparkline
  momentum: 'strong_inflow' | 'moderate_inflow' | 'neutral' | 'moderate_outflow' | 'heavy_outflow';
}

export type SectorFlowRange = '1d' | '5d' | '10d';

export interface SectorFlowResponse {
  range: SectorFlowRange;
  updatedAt: string;
  totalMarketTurnover: string;
  sectors: SectorFlowItem[];
}

// 缺失三改善：三大法人與融資籌碼面型別
export type ChipGradeType =
  | 'INSTITUTIONAL_STRONG_BUY' // 三大法人強力買超
  | 'TRUST_ACCUMULATION' // 投信作帳認養
  | 'FOREIGN_DUMP_RISK' // 外資高檔調節出貨
  | 'MARGIN_CHURN_HIGH' // 散戶融資浮額過高
  | 'NEUTRAL_CHIP'; // 籌碼中性平衡

export interface InstitutionalChipData {
  foreignNetBuy: number; // 外資買賣超張數
  trustNetBuy: number; // 投信買賣超張數
  dealerNetBuy: number; // 自營商買賣超張數
  totalNetBuy: number; // 三大法人合計買賣超張數
  marginBalance: number; // 融資今日餘額 (張)
  marginChange: number; // 融資今日增減 (張)
  shortBalance: number; // 融券今日餘額 (張)
  chipGrade: ChipGradeType;
  chipGradeLabel: string;
  chipScore: number; // 0 ~ 100 籌碼健康分數
  summary: string; // 籌碼面診斷說明
}

// 缺失四改善：台股大盤環境總體溫度計 (Market Regime Monitor)
export type MarketRegimeType = 'BULL_MARKET' | 'RANGE_BOUND' | 'BEAR_DEFENSE';

export interface MarketIndexItem {
  name: string;
  index: number;
  change: number;
  changePercent: number;
}

export interface MarketRegimeInfo {
  regime: MarketRegimeType;
  regimeLabel: string; // e.g. "多頭主升 (順勢積極進攻)" | "區間震盪 (嚴控部位低吸)" | "空方警戒 (防守優先避險)"
  colorClass: string;
  taiexIndex: number; // 加權指數
  taiexChange: number;
  taiexChangePercent: number;
  suggestedExposure: string; // 建議全市場總持倉水位 (e.g. "70% ~ 100%" or "30% ~ 50%")
  strategyGuidance: string; // 宏觀操盤應對指引
  subIndices: MarketIndexItem[]; // 半導體、電子、金融、航運
  updatedAt: string;
}

export interface ScanFilterParams {
  masterMode: MasterTradingMode; // 'left_side' | 'right_side'
  strategy: StrategyType;
  peLimit: number;
  pbLimit: number;
  minDividendYield: number;
  lookbackDays: number;

  // Custom indicator toggles
  useMacd: boolean;
  usePpo: boolean;
  useSkdj: boolean;
  useRsi: boolean;
  useBias: boolean;
  useBollinger: boolean;

  // Strict death cross filter (排除金叉後又死叉標的)
  excludeDeathCrossAfterGoldenCross?: boolean;

  // Advanced threshold overrides
  ppoOversoldThreshold: number; // e.g. -2.0%
  biasOversoldThreshold: number; // e.g. -5.0%
  skdjOversoldLimit: number; // e.g. 30

  // Right-side parameters
  minVolumeMultiple?: number; // e.g. 1.5x of 5-day avg vol
  requireMaBullish?: boolean; // require MA5 > MA10 > MA20

  // 缺失改善濾網開關
  filterLowDeductionOnly?: boolean; // 缺失一：僅選扣低助漲股
  filterSafeRiskOnly?: boolean; // 缺失二：僅選 A/B 級安全低風險股
  excludeDayTradeShakeout?: boolean; // 缺失五：排除隔日沖與假突破高危股

  maxScanCount: number;
}

export type NavTabType = 'scanner' | 'ppo' | 'bias' | 'bollinger' | 'guide';
