import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StockTable } from './components/StockTable';
import { StockDetailModal } from './components/StockDetailModal';
import { SectorCapitalFlow } from './components/SectorCapitalFlow';
import { PpoDashboard } from './components/PpoDashboard';
import { BiasDashboard } from './components/BiasDashboard';
import { BollingerDashboard } from './components/BollingerDashboard';
import { StrategyGuide } from './components/StrategyGuide';
import { MarketRegimeBanner } from './components/MarketRegimeBanner';
import {
  ScanFilterParams,
  StockScanResult,
  TwseStockValuation,
  NavTabType,
  MasterTradingMode,
  MarketRegimeInfo,
} from './types';
import { AlertCircle, Activity, Layers, ShieldCheck } from 'lucide-react';

export function App() {
  // Navigation & Master Mode State
  const [activeTab, setActiveTab] = useState<NavTabType>('scanner');
  const [masterMode, setMasterMode] = useState<MasterTradingMode>('left_side');

  // Valuation list state from TWSE
  const [allValuations, setAllValuations] = useState<TwseStockValuation[]>([]);
  const [isLoadingValuation, setIsLoadingValuation] = useState<boolean>(false);
  const [valuationError, setValuationError] = useState<string | null>(null);
  const [selectedSectorTag, setSelectedSectorTag] = useState<string>('ALL');

  // Market Regime Monitor state (缺失四改善)
  const [marketRegime, setMarketRegime] = useState<MarketRegimeInfo | null>(null);
  const [isLoadingRegime, setIsLoadingRegime] = useState<boolean>(false);

  // Filter params with strategy presets and PPO
  const [filters, setFilters] = useState<ScanFilterParams>({
    masterMode: 'left_side',
    strategy: 'deep_value',
    peLimit: 20.0,
    pbLimit: 1.5,
    minDividendYield: 0,
    lookbackDays: 20,
    useMacd: true,
    usePpo: true,
    useSkdj: true,
    useRsi: true,
    useBias: false,
    useBollinger: false,
    ppoOversoldThreshold: -2.0,
    biasOversoldThreshold: -5.0,
    excludeDeathCrossAfterGoldenCross: true,
    skdjOversoldLimit: 30,
    maxScanCount: 200,
  });

  // Scan state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; currentCode: string }>({
    current: 0,
    total: 0,
    currentCode: '',
  });
  const [scanResults, setScanResults] = useState<StockScanResult[]>([]);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockScanResult | null>(null);

  const isStopRequested = useRef<boolean>(false);

  // Sync masterMode with filters
  const handleToggleMasterMode = (mode: MasterTradingMode) => {
    setMasterMode(mode);
    if (mode === 'right_side') {
      setFilters((prev) => ({
        ...prev,
        masterMode: 'right_side',
        strategy: 'right_super_trend',
        peLimit: 45.0,
        pbLimit: 8.0,
        minDividendYield: 0,
        lookbackDays: 20,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        masterMode: 'left_side',
        strategy: 'deep_value',
        peLimit: 20.0,
        pbLimit: 1.5,
        minDividendYield: 0,
        lookbackDays: 20,
        ppoOversoldThreshold: -2.0,
        biasOversoldThreshold: -5.0,
      }));
    }
  };

  // Load TWSE valuation list on mount
  const loadValuations = async () => {
    setIsLoadingValuation(true);
    setValuationError(null);
    try {
      const res = await fetch('/api/twse/valuation');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.stocks && Array.isArray(data.stocks)) {
        setAllValuations(data.stocks);

        // Preload core benchmark stocks with full indicators
        const keyCodes = ['2330', '2317', '2454', '2603', '2382', '3231', '2609', '2308', '2002', '1101'];
        const benchmarkStocks = keyCodes
          .map((code) => data.stocks.find((s: TwseStockValuation) => s.Code === code))
          .filter(Boolean) as TwseStockValuation[];

        preloadBenchmarkStocks(benchmarkStocks.length > 0 ? benchmarkStocks : data.stocks.slice(0, 8));
      }
    } catch (err: any) {
      console.error('Failed to load valuations:', err);
      setValuationError('無法取得證交所即時估值數據，已切換至備援資料庫。');
    } finally {
      setIsLoadingValuation(false);
    }
  };

  // Load TWSE Market Regime on mount (缺失四改善)
  const loadMarketRegime = async () => {
    setIsLoadingRegime(true);
    try {
      const res = await fetch('/api/twse/market-regime');
      if (res.ok) {
        const data = await res.json();
        setMarketRegime(data);
      }
    } catch (err) {
      console.warn('Failed to load market regime:', err);
    } finally {
      setIsLoadingRegime(false);
    }
  };

  const preloadBenchmarkStocks = async (benchmarkList: TwseStockValuation[]) => {
    try {
      const promises = benchmarkList.map(async (stk) => {
        try {
          const res = await fetch('/api/stock/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: stk.Code,
              name: stk.Name,
              pe: stk.PEratio,
              pb: stk.PBratio,
              dividendYield: stk.DividendYield,
              industry: stk.Industry,
              forceRefresh: true,
              masterMode: filters.masterMode,
              strategy: filters.strategy,
              lookbackDays: 20,
              minDividendYield: 0,
              ppoOversoldThreshold: -2.0,
              biasOversoldThreshold: -5.0,
              useMacd: true,
              usePpo: true,
              useSkdj: true,
              useRsi: true,
              useBias: true,
              useBollinger: true,
              filterLowDeductionOnly: filters.filterLowDeductionOnly,
              filterSafeRiskOnly: filters.filterSafeRiskOnly,
              excludeDayTradeShakeout: filters.excludeDayTradeShakeout,
            }),
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {
          // ignore
        }
        return null;
      });

      const list = await Promise.all(promises);
      const valid = list.filter((item): item is StockScanResult => Boolean(item));
      if (valid.length > 0) {
        setScanResults(valid);
      }
    } catch (e) {
      console.error('Preload error:', e);
    }
  };

  useEffect(() => {
    loadValuations();
    loadMarketRegime();
  }, []);

  // Filtered candidate list based on PE / PB / Yield / Sector
  const filteredCandidates = allValuations.filter((item) => {
    const matchPe = item.PEratio > 0 && item.PEratio <= filters.peLimit;
    const matchPb = item.PBratio > 0 && item.PBratio <= filters.pbLimit;
    const matchYield = filters.minDividendYield > 0 ? (item.DividendYield ?? 0) >= filters.minDividendYield : true;
    const matchSector = selectedSectorTag === 'ALL' || !selectedSectorTag || item.Industry === selectedSectorTag;
    return (matchPe || matchPb) && matchYield && matchSector;
  });

  // Start scanning
  const handleStartScan = async () => {
    if (filteredCandidates.length === 0) {
      setScanStatusMessage('未抓取到符合估值與板塊條件的股票，請放寬門檻。');
      return;
    }

    isStopRequested.current = false;
    setIsScanning(true);
    setScanResults([]);
    setScanStatusMessage(null);

    const candidates = filteredCandidates.slice(0, filters.maxScanCount);
    const total = candidates.length;
    setScanProgress({ current: 0, total, currentCode: candidates[0]?.Code || '' });

    const matchedResults: StockScanResult[] = [];
    const batchSize = 4; // Parallel workers for fast scan

    for (let i = 0; i < total; i += batchSize) {
      if (isStopRequested.current) {
        setScanStatusMessage(`掃描已手動停止，目前共找到 ${matchedResults.length} 檔符合標的。`);
        break;
      }

      const chunk = candidates.slice(i, i + batchSize);
      setScanProgress({
        current: Math.min(i + chunk.length, total),
        total,
        currentCode: chunk.map((c) => c.Code).join(', '),
      });

      // Analyze chunk concurrently
      const promises = chunk.map(async (stock) => {
        try {
          const res = await fetch('/api/stock/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: stock.Code,
              name: stock.Name,
              pe: stock.PEratio,
              pb: stock.PBratio,
              dividendYield: stock.DividendYield,
              industry: stock.Industry,
              forceRefresh: true,
              masterMode: filters.masterMode || masterMode,
              strategy: filters.strategy,
              lookbackDays: filters.lookbackDays,
              minDividendYield: filters.minDividendYield,
              ppoOversoldThreshold: filters.ppoOversoldThreshold,
              biasOversoldThreshold: filters.biasOversoldThreshold,
              useMacd: filters.useMacd,
              usePpo: filters.usePpo,
              useSkdj: filters.useSkdj,
              useRsi: filters.useRsi,
              useBias: filters.useBias,
              useBollinger: filters.useBollinger,
              filterLowDeductionOnly: filters.filterLowDeductionOnly,
              filterSafeRiskOnly: filters.filterSafeRiskOnly,
              excludeDayTradeShakeout: filters.excludeDayTradeShakeout,
            }),
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {
          // ignore individual failed fetch
        }
        return null;
      });

      const analyzedList = await Promise.all(promises);

      for (const analyzed of analyzedList) {
        if (analyzed && (analyzed.isMatch || filters.strategy === 'deep_value' || filters.strategy === 'right_super_trend')) {
          matchedResults.push(analyzed);
          setScanResults((prev) => [...prev, analyzed]);
        }
      }
    }

    setIsScanning(false);
    if (!isStopRequested.current) {
      if (matchedResults.length > 0) {
        setScanStatusMessage(`✅ 策略掃描完成！共分析 ${total} 檔標的，找到 ${matchedResults.length} 檔符合條件個股。`);
      } else {
        setScanStatusMessage(`近 7 日內未找到同時滿足該策略條件的個股。建議放寬指標門檻。`);
      }
    }
  };

  const handleStopScan = () => {
    isStopRequested.current = true;
    setIsScanning(false);
  };

  // Test single stock
  const handleTestSingleStock = async (code: string) => {
    const cleanCode = code.replace(/[^0-9]/g, '');
    if (!cleanCode) return;

    setIsLoadingValuation(true);
    try {
      const valuation = allValuations.find((v) => v.Code === cleanCode);
      const res = await fetch('/api/stock/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          name: valuation?.Name || cleanCode,
          pe: valuation?.PEratio || 0,
          pb: valuation?.PBratio || 0,
          dividendYield: valuation?.DividendYield,
          industry: valuation?.Industry,
          forceRefresh: true,
          masterMode: filters.masterMode || masterMode,
          strategy: filters.strategy,
          lookbackDays: filters.lookbackDays,
          minDividendYield: filters.minDividendYield,
          ppoOversoldThreshold: filters.ppoOversoldThreshold,
          biasOversoldThreshold: filters.biasOversoldThreshold,
          useMacd: filters.useMacd,
          usePpo: filters.usePpo,
          useSkdj: filters.useSkdj,
          useRsi: filters.useRsi,
          useBias: filters.useBias,
          useBollinger: filters.useBollinger,
          filterLowDeductionOnly: filters.filterLowDeductionOnly,
          filterSafeRiskOnly: filters.filterSafeRiskOnly,
          excludeDayTradeShakeout: filters.excludeDayTradeShakeout,
        }),
      });

      if (res.ok) {
        const result: StockScanResult = await res.json();
        setSelectedStock(result);
        setScanResults((prev) => [result, ...prev.filter((r) => r.code !== result.code)]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingValuation(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        masterMode={masterMode}
        onToggleMasterMode={handleToggleMasterMode}
        onRefreshValuation={loadValuations}
        isLoadingValuation={isLoadingValuation}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Controls */}
        <Sidebar
          filters={filters}
          onFilterChange={(f) => {
            setFilters(f);
            if (f.masterMode) setMasterMode(f.masterMode);
          }}
          onStartScan={handleStartScan}
          onStopScan={handleStopScan}
          isScanning={isScanning}
          totalFilteredStocks={filteredCandidates.length}
          onTestSingleStock={handleTestSingleStock}
        />

        {/* Dashboard Main Panel */}
        <main className="flex-1 p-3.5 lg:p-5 overflow-y-auto space-y-4">
          {/* Status Message / Scanning Progress */}
          {isScanning && (
            <div className="bg-white border border-emerald-300 rounded-xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    正在分析第 <strong className="font-mono">{scanProgress.current}</strong> / {scanProgress.total} 檔 (
                    {scanProgress.currentCode})
                  </span>
                </div>
                <span className="font-mono text-emerald-700 font-bold">
                  {Math.round((scanProgress.current / (scanProgress.total || 1)) * 100)}%
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, (scanProgress.current / (scanProgress.total || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {scanStatusMessage && !isScanning && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-center justify-between shadow-2xs">
              <span>{scanStatusMessage}</span>
              <button
                onClick={() => setScanStatusMessage(null)}
                className="text-slate-500 hover:text-slate-800 text-xs px-2 py-0.5 cursor-pointer font-medium"
              >
                關閉
              </button>
            </div>
          )}

          {valuationError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{valuationError}</span>
            </div>
          )}

          {/* TAB 1: MAIN SCANNER & CAPITAL FLOW */}
          {activeTab === 'scanner' && (
            <>
              {/* 0. TAIWAN MARKET REGIME MONITOR (缺失四全面優化) */}
              <MarketRegimeBanner
                marketRegime={marketRegime}
                isLoading={isLoadingRegime}
                onRefresh={loadMarketRegime}
              />

              {/* 1. SECTOR CAPITAL FLOW & ROTATION */}
              <SectorCapitalFlow
                selectedSectorTag={selectedSectorTag}
                onSelectSectorTag={setSelectedSectorTag}
                onQuickDiagnoseStock={handleTestSingleStock}
              />

              {/* 2. REVERSAL / TREND STRATEGY SUMMARY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <Activity className="w-3.5 h-3.5" />
                      PPO (百分比價格震盪指標)
                    </span>
                    <span className="text-[10px] text-slate-500">標準化動能</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    公式：(EMA12 - EMA26) / EMA26 × 100%。當 PPO 在7天內於深水超賣區 (&lt; -2%) 翻紅金叉時，為極高性價比反轉點。
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      葛蘭碧月線負乖離 (BIAS)
                    </span>
                    <span className="text-[10px] text-slate-500">均值回歸</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    當月線負乖離達 -5% ~ -8% 以上時，空方力竭，均線磁吸回歸效應強烈，配合 KD 低檔金叉買進。
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 text-sky-700 font-bold">
                      <Layers className="w-3.5 h-3.5" />
                      布林通道 (20, 2) 極限波動
                    </span>
                    <span className="text-[10px] text-slate-500">%B 破底翻</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    %B &lt; 0.15 代表股價摜破下軌後收腳站回，誘空洗盤結束；%B &gt; 0.90 且通道擴大為暴風開口主升。
                  </p>
                </div>
              </div>

              {/* 3. STOCK SCAN RESULTS TABLE */}
              <StockTable
                stocks={scanResults}
                onSelectStock={setSelectedStock}
                isLoading={isScanning}
              />
            </>
          )}

          {/* TAB 2: PPO OSCILLATOR DASHBOARD */}
          {activeTab === 'ppo' && (
            <PpoDashboard
              stocks={scanResults}
              onSelectStock={setSelectedStock}
              onApplyPpoFilter={(mode) => {
                setActiveTab('scanner');
                if (mode === 'oversold') {
                  setFilters((prev) => ({
                    ...prev,
                    strategy: 'ppo_oversold',
                    ppoOversoldThreshold: -2.0,
                  }));
                } else if (mode === 'zerocross') {
                  setFilters((prev) => ({
                    ...prev,
                    masterMode: 'right_side',
                    strategy: 'right_ppo_zero_cross',
                  }));
                  setMasterMode('right_side');
                }
              }}
            />
          )}

          {/* TAB 3: BIAS DASHBOARD */}
          {activeTab === 'bias' && (
            <BiasDashboard
              stocks={scanResults}
              onSelectStock={setSelectedStock}
              onFilterBias={(threshold) => {
                setActiveTab('scanner');
                setFilters((prev) => ({
                  ...prev,
                  strategy: 'bias_reversal',
                  biasOversoldThreshold: threshold,
                }));
              }}
            />
          )}

          {/* TAB 4: BOLLINGER DASHBOARD */}
          {activeTab === 'bollinger' && (
            <BollingerDashboard
              stocks={scanResults}
              onSelectStock={setSelectedStock}
              onFilterBollinger={(mode) => {
                setActiveTab('scanner');
                if (mode === 'oversold_turn') {
                  setFilters((prev) => ({
                    ...prev,
                    strategy: 'bollinger_breakout',
                  }));
                } else {
                  setFilters((prev) => ({
                    ...prev,
                    masterMode: 'right_side',
                    strategy: 'right_bollinger_squeeze',
                  }));
                  setMasterMode('right_side');
                }
              }}
            />
          )}

          {/* TAB 5: DUAL-MODE STRATEGY GUIDE */}
          {activeTab === 'guide' && (
            <StrategyGuide
              onSwitchMode={(mode) => {
                handleToggleMasterMode(mode);
                setActiveTab('scanner');
              }}
            />
          )}
        </main>
      </div>

      {/* Stock Detail & Integrated Chart Modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onRefreshStock={handleTestSingleStock}
        />
      )}
    </div>
  );
}
