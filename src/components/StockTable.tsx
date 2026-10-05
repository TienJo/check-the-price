import React, { useState, useEffect, useRef } from 'react';
import { StockScanResult } from '../types';
import {
  Download,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  ExternalLink,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Activity,
  Layers,
  ShieldAlert,
  Clock,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
} from 'lucide-react';

interface StockTableProps {
  stocks?: StockScanResult[];
  results?: StockScanResult[];
  onSelectStock: (stock: StockScanResult) => void;
  selectedStockCode?: string;
  isScanning?: boolean;
  isLoading?: boolean;
  selectedSectorTag?: string;
  onSelectSectorTag?: (tag: string) => void;
}

type SortField =
  | 'code'
  | 'name'
  | 'close'
  | 'pe'
  | 'pb'
  | 'priceChangePercent'
  | 'dividendYield'
  | 'ppo'
  | 'bias20'
  | 'percentB'
  | 'distToResistance'
  | 'distToSupport'
  | 'volumeRatio';

type SortOrder = 'asc' | 'desc';

export const StockTable: React.FC<StockTableProps> = ({
  stocks,
  results,
  onSelectStock,
  selectedStockCode,
  isScanning,
  isLoading,
  selectedSectorTag = 'ALL',
  onSelectSectorTag,
}) => {
  const stockList = stocks || results || [];
  const loading = Boolean(isScanning || isLoading);

  const [sortField, setSortField] = useState<SortField>('distToResistance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [localIndustry, setLocalIndustry] = useState<string>(selectedSectorTag);
  const [valuationFilter, setValuationFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'SAFE_ONLY'>('ALL');
  const [deductionFilter, setDeductionFilter] = useState<'ALL' | 'LOW_ONLY'>('ALL');
  const [chipFilter, setChipFilter] = useState<'ALL' | 'LOW_DEDUCTION' | 'SAFE_RISK' | 'INSTITUTIONAL' | 'NO_SHAKEOUT'>('ALL');

  // Pagination & Quick Navigation State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const tableTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalIndustry(selectedSectorTag);
  }, [selectedSectorTag]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, localIndustry, valuationFilter, riskFilter, deductionFilter, chipFilter, sortField, sortOrder]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    tableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const industries = Array.from(
    new Set(stockList.map((r) => r.industry).filter((i): i is string => Boolean(i)))
  );

  const handleIndustryChange = (val: string) => {
    setLocalIndustry(val);
    onSelectSectorTag?.(val);
  };

  const filtered = stockList.filter((item) => {
    const matchText =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.industry && item.industry.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchIndustry =
      localIndustry === 'ALL' || !localIndustry || item.industry === localIndustry;

    const matchValuation =
      valuationFilter === 'ALL' || item.valuation?.tag === valuationFilter;

    const currentRisk = item.riskGrade || item.timeframeRiskAssessment?.riskGrade;
    const matchRisk = riskFilter === 'ALL' || currentRisk === 'A' || currentRisk === 'B';

    const currentDeduction = item.ma5DeductionStatus || item.timeframeRiskAssessment?.fiveDayRisks?.ma5Deduction?.deductionStatus;
    const matchDeduction = deductionFilter === 'ALL' || currentDeduction === 'DEDUCTING_LOW';

    // 5大缺失改善快速標籤濾網
    if (chipFilter === 'LOW_DEDUCTION' && currentDeduction !== 'DEDUCTING_LOW') return false;
    if (chipFilter === 'SAFE_RISK' && currentRisk !== 'A' && currentRisk !== 'B') return false;
    if (chipFilter === 'INSTITUTIONAL') {
      const chip = item.institutionalChip;
      const isNetBuy = (chip?.totalNetBuy ?? 0) > 0 || (chip?.trustNetBuy ?? 0) > 0;
      if (!isNetBuy) return false;
    }
    if (chipFilter === 'NO_SHAKEOUT' && item.isDayTradeShakeoutRisk) return false;

    return matchText && matchIndustry && matchValuation && matchRisk && matchDeduction;
  });

  const sorted = [...filtered].sort((a, b) => {
    let factor = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'code') return a.code.localeCompare(b.code) * factor;
    if (sortField === 'name') return a.name.localeCompare(b.name) * factor;
    if (sortField === 'close') return (a.close - b.close) * factor;
    if (sortField === 'pe') return (a.pe - b.pe) * factor;
    if (sortField === 'pb') return (a.pb - b.pb) * factor;
    if (sortField === 'priceChangePercent')
      return ((a.priceChangePercent ?? 0) - (b.priceChangePercent ?? 0)) * factor;
    if (sortField === 'dividendYield')
      return ((a.dividendYield ?? 0) - (b.dividendYield ?? 0)) * factor;
    if (sortField === 'ppo') return (a.ppo - b.ppo) * factor;
    if (sortField === 'bias20') return (a.bias20 - b.bias20) * factor;
    if (sortField === 'percentB') return (a.percentB - b.percentB) * factor;
    if (sortField === 'distToResistance')
      return ((a.levels?.distToShortResistancePct ?? 0) - (b.levels?.distToShortResistancePct ?? 0)) * factor;
    if (sortField === 'distToSupport')
      return ((a.levels?.distToShortSupportPct ?? 0) - (b.levels?.distToShortSupportPct ?? 0)) * factor;
    if (sortField === 'volumeRatio')
      return (
        ((a.volumeRatio5d ?? 1) -
          (b.volumeRatio5d ?? 1)) *
        factor
      );
    return 0;
  });

  // Pagination Slice
  const totalItems = sorted.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const pagedStocks =
    pageSize === -1
      ? sorted
      : sorted.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize);

  // Export CSV
  const exportCsv = () => {
    if (sorted.length === 0) return;
    const headers = [
      '股票代號',
      '股票名稱',
      '行業板塊',
      '收盤價',
      '漲跌幅(%)',
      '本益比(PE)',
      '股價淨值比(PB)',
      '估值狀態',
      '短線支撐位',
      '短線壓力位',
      '中期關鍵壓力(1M)',
      '中期核心支撐(月線/1M)',
      '距短線壓力(%)',
      '5日量比',
      '1個月量比',
      '60日量比',
      'PPO快線(%)',
      'PPO訊號慢線(%)',
      'PPO狀態',
      '死叉警示',
      '右側交易判定',
      '觸發訊號',
    ];

    const rows = sorted.map((s) => [
      s.code,
      s.name,
      s.industry || '',
      s.close,
      s.priceChangePercent ?? 0,
      s.pe,
      s.pb,
      s.valuation?.label || '合理區間',
      s.levels?.shortSupport || 0,
      s.levels?.shortResistance || 0,
      s.levels?.midTermResistance || s.levels?.midLongResistance || 0,
      s.levels?.midTermSupport || s.levels?.midLongSupport || 0,
      s.levels?.distToShortResistancePct || 0,
      s.volumeRatio5d || 1,
      s.volumeRatio20d || s.volumeRatio5d || 1,
      s.volumeRatio60d || 1,
      s.ppo,
      s.ppoSignal,
      s.ppoCrossStatus === 'GOLDEN_CROSS' ? '金叉中' : '死叉中',
      s.hasSubsequentDeathCross ? '二次死叉' : '正常',
      s.rightSideEvaluation?.badgeText || '區間整理',
      s.signals.join(' | '),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `taiwan_stock_strategy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={tableTopRef} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Table Header Controls */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              策略個股分析清單
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono font-semibold">
              {totalItems} 檔
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              TWSE MIS 毫秒即時連線
            </span>
          </div>

          {/* Sector Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={localIndustry}
              onChange={(e) => handleIndustryChange(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">全部板塊</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Valuation Filter */}
          <select
            value={valuationFilter}
            onChange={(e) => setValuationFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-500 cursor-pointer shadow-2xs"
          >
            <option value="ALL">全部估值標籤</option>
            <option value="DEEP_VALUE">深度低估</option>
            <option value="UNDERVALUED">估值偏低</option>
            <option value="FAIR_VALUE">合理區間</option>
            <option value="OVERVALUED">估值偏高</option>
            <option value="OVERHEATED">過熱溢價</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Top Page Size & Quick Pagination */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs shadow-2xs">
            <span className="text-slate-500 text-[11px] hidden sm:inline">每頁:</span>
            {[15, 30, 50, -1].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold transition cursor-pointer ${
                  pageSize === size
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={size === -1 ? '顯示全部標的' : `每頁顯示 ${size} 檔`}
              >
                {size === -1 ? '全' : size}
              </button>
            ))}

            {totalPages > 1 && (
              <>
                <span className="text-slate-300 mx-0.5">|</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage <= 1}
                  className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-700 cursor-pointer"
                  title="上一頁"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-[11px] text-slate-800 px-0.5">
                  {validCurrentPage}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage >= totalPages}
                  className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-700 cursor-pointer"
                  title="下一頁"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Quick Search */}
          <input
            type="text"
            placeholder="搜尋代號、名稱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 w-32 sm:w-40 font-mono shadow-2xs"
          />

          {/* Export CSV Button */}
          <button
            onClick={exportCsv}
            disabled={sorted.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs rounded-lg transition font-medium cursor-pointer border border-slate-300 shadow-2xs"
            title="匯出 CSV 報表"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">匯出報表</span>
          </button>
        </div>
      </div>

      {/* 5大缺失改善快捷篩選條 (Quick Risk & Chip Filter Bar) */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50/90 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[11px] text-slate-500 font-bold shrink-0 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          風控快捷過濾：
        </span>
        <button
          onClick={() => setChipFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
            chipFilter === 'ALL'
              ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
          }`}
        >
          全部標的 ({stockList.length})
        </button>
        <button
          onClick={() => setChipFilter('LOW_DEDUCTION')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1 ${
            chipFilter === 'LOW_DEDUCTION'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
              : 'bg-white text-indigo-700 hover:bg-indigo-50 border-indigo-200'
          }`}
        >
          <span>🚀 僅看 5MA 扣低助漲</span>
        </button>
        <button
          onClick={() => setChipFilter('SAFE_RISK')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1 ${
            chipFilter === 'SAFE_RISK'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-200'
          }`}
        >
          <span>🛡️ 僅看 A/B 級安全防守</span>
        </button>
        <button
          onClick={() => setChipFilter('INSTITUTIONAL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1 ${
            chipFilter === 'INSTITUTIONAL'
              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
              : 'bg-white text-rose-700 hover:bg-rose-50 border-rose-200'
          }`}
        >
          <span>🏛️ 三大法人買超 / 投信認養</span>
        </button>
        <button
          onClick={() => setChipFilter('NO_SHAKEOUT')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center gap-1 ${
            chipFilter === 'NO_SHAKEOUT'
              ? 'bg-slate-700 text-white border-slate-800 shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
          }`}
        >
          <span>🛑 排除隔日沖假突破高危</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 border-b border-slate-200 text-[11px] select-none font-semibold shadow-2xs">
            <tr>
              <th
                onClick={() => handleSort('code')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  代號 / 名稱
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('close')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  股價 (漲跌幅)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* PE & PB Valuation */}
              <th
                onClick={() => handleSort('pe')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  PE / PB 估值評價
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Short & Mid-Term (1-Month) Support and Resistance */}
              <th
                onClick={() => handleSort('distToResistance')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                  短線 &amp; 1M中期 支撐/壓力
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              {/* Volume and Volume Ratio */}
              <th
                onClick={() => handleSort('volumeRatio')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1 text-blue-700 font-bold">
                  成交量 / 5日&amp;60日量比
                  <ArrowUpDown className="w-3 h-3 text-blue-500" />
                </div>
              </th>

              {/* PPO with Signal Line and Cross Status */}
              <th
                onClick={() => handleSort('ppo')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1 text-slate-800 font-bold">
                  PPO (快/慢線/金死叉)
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              {/* Right-Side Volume & Chase Evaluation */}
              <th className="py-3 px-3 text-center whitespace-nowrap text-rose-700 font-bold">
                量價診斷 (主升vs追高)
              </th>

              <th className="py-3 px-3 whitespace-nowrap">
                觸發訊號 (7天嚴選)
              </th>

              <th className="py-3 px-2.5 text-center whitespace-nowrap">
                Yahoo 股市
              </th>

              <th className="py-3 px-2.5 text-center whitespace-nowrap">
                技術圖表
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-sans">
            {totalItems === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-600 text-xs">正在分析台股即時量價與支撐壓力...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <span className="font-semibold text-slate-700">無符合當前條件的個股</span>
                      <span className="text-[11px] text-slate-500">
                        可嘗試放寬門檻，系統已嚴格過濾死叉與無量標的
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              pagedStocks.map((item) => {
                const isSelected = selectedStockCode === item.code;
                const isUp = (item.priceChange ?? 0) >= 0;
                const yahooUrl = `https://tw.stock.yahoo.com/quote/${item.code}.TW`;
                const evalInfo = item.rightSideEvaluation;
                const valInfo = item.valuation;
                const levels = item.levels;
                const struct = levels?.structuralAnalysis;

                return (
                  <tr
                    key={item.code}
                    onClick={() => onSelectStock(item)}
                    className={`hover:bg-slate-50 transition cursor-pointer ${
                      isSelected ? 'bg-emerald-50/70 ring-1 ring-emerald-500/30' : ''
                    }`}
                  >
                    {/* Code & Name with Industry and 5 Structural Optimization Badges */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 text-xs">{item.code}</span>
                        <span className="text-slate-800 font-semibold">{item.name}</span>
                        {item.industry && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIndustryChange(item.industry || 'ALL');
                            }}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 whitespace-nowrap cursor-pointer transition font-medium"
                          >
                            {item.industry}
                          </span>
                        )}
                      </div>

                      {/* 5大缺失改善直覺標籤列 */}
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {/* 1. 均線扣抵 */}
                        {item.ma5DeductionStatus === 'DEDUCTING_LOW' ? (
                          <span
                            className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold"
                            title="5MA扣低助漲：扣抵低價區，均線趨於上翹提供下檔支撐"
                          >
                            🚀 扣低助漲
                          </span>
                        ) : item.ma5DeductionStatus === 'DEDUCTING_HIGH' ? (
                          <span
                            className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold"
                            title="5MA扣高蓋頭壓力：扣抵高價區，若未放量暴漲，均線將下彎形成短壓"
                          >
                            ⚠️ 扣高下彎
                          </span>
                        ) : null}

                        {/* 2. 風險等級與短線防守 */}
                        {item.riskGrade && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded border font-mono font-bold ${
                              item.riskGrade === 'A'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.riskGrade === 'B'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : item.riskGrade === 'C'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                            title={`風險等級 ${item.riskGrade} | 5日短線停損: NT$${item.shortTermStopLoss?.toFixed(1) ?? '-'} | 10日波段防守: NT$${item.swingDefensiveLine?.toFixed(1) ?? '-'}`}
                          >
                            風控{item.riskGrade}級
                            {item.shortTermStopLoss && ` (損$${item.shortTermStopLoss.toFixed(0)})`}
                          </span>
                        )}

                        {/* 3. 三大法人與融資籌碼 */}
                        {item.institutionalChip && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold border ${
                              item.institutionalChip.trustNetBuy >= 200
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : item.institutionalChip.totalNetBuy > 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : item.institutionalChip.foreignNetBuy <= -1000
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                            title={item.institutionalChip.summary}
                          >
                            {item.institutionalChip.trustNetBuy >= 200
                              ? `投信+${item.institutionalChip.trustNetBuy}張`
                              : `法人${item.institutionalChip.totalNetBuy >= 0 ? '+' : ''}${item.institutionalChip.totalNetBuy}張`}
                          </span>
                        )}

                        {/* 4. 隔日沖與假突破高危 */}
                        {item.isDayTradeShakeoutRisk && (
                          <span
                            className="text-[9px] px-1 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold"
                            title="偵測到長上影線或爆巨量滯漲，防範主力隔日沖摜壓洗盤"
                          >
                            🛑 隔日沖高危
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price & Change % */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          NT$ {item.close.toFixed(2)}
                        </span>
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                          title={`證交所 MIS 毫秒即時報價${item.syncedAt ? ` (同步時間: ${item.syncedAt})` : ''}`}
                        ></span>
                      </div>
                      <div
                        className={`font-mono text-[11px] flex items-center justify-end gap-0.5 font-bold ${
                          isUp ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {isUp ? '+' : ''}
                        {(item.priceChangePercent ?? 0).toFixed(2)}%
                      </div>
                      {item.syncedAt && (
                        <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                          {item.syncedAt}
                        </div>
                      )}
                    </td>

                    {/* Valuation (PE, PB, and Valuation Tag) */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            valInfo?.colorClass || 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                          title={`${valInfo?.summary || ''}\n${valInfo?.peAssessment || ''}\n${valInfo?.pbAssessment || ''}`}
                        >
                          {valInfo?.label || '合理區間'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          PE: <strong className="text-slate-800">{item.pe > 0 ? item.pe.toFixed(1) : '-'}</strong> | PB: <strong className="text-slate-800">{item.pb > 0 ? item.pb.toFixed(2) : '-'}</strong>
                        </div>
                      </div>
                    </td>

                    {/* Short & Mid-Term (1-Month) Support and Resistance Levels */}
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <div className="flex flex-col gap-0.5">
                        <div
                          className="flex items-center justify-between text-[10px]"
                          title={`【短壓】NT$${levels?.shortResistance?.toFixed(1)} (${levels?.shortResistanceReason || ''})\n【月壓】NT$${(levels?.midTermResistance || levels?.midLongResistance)?.toFixed(1)} (${levels?.midTermResistanceReason || ''})`}
                        >
                          <span className="text-rose-700 font-medium flex items-center gap-0.5">
                            短壓/月壓
                            <span className="text-[9px] text-amber-500 font-bold">
                              {'★'.repeat(levels?.shortResistanceStars || 1)}
                            </span>
                            :
                          </span>
                          <span className="text-rose-600 font-bold">
                            NT${levels?.shortResistance ? levels.shortResistance.toFixed(1) : '-'}
                            <span className="text-[9px] text-slate-500 ml-1 font-normal">
                              (月 NT${(levels?.midTermResistance || levels?.midLongResistance) ? (levels?.midTermResistance || levels?.midLongResistance)!.toFixed(1) : '-'})
                            </span>
                          </span>
                        </div>
                        <div
                          className="flex items-center justify-between text-[10px]"
                          title={`【短支】NT$${levels?.shortSupport?.toFixed(1)} (${levels?.shortSupportReason || ''})\n【月支】NT$${(levels?.midTermSupport || levels?.midLongSupport)?.toFixed(1)} (${levels?.midTermSupportReason || ''})`}
                        >
                          <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                            短支/月支
                            <span className="text-[9px] text-amber-500 font-bold">
                              {'★'.repeat(levels?.shortSupportStars || 1)}
                            </span>
                            :
                          </span>
                          <span className="text-emerald-700 font-bold">
                            NT${levels?.shortSupport ? levels.shortSupport.toFixed(1) : '-'}
                            <span className="text-[9px] text-slate-500 ml-1 font-normal">
                              (月 NT${(levels?.midTermSupport || levels?.midLongSupport) ? (levels?.midTermSupport || levels?.midLongSupport)!.toFixed(1) : '-'})
                            </span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Volume and 5D / 60D Volume Ratios */}
                    <td className="py-2.5 px-3 text-center font-mono">
                      <div className="flex flex-col items-center">
                        <div className="text-xs font-bold text-slate-900">
                          {item.volume ? `${(item.volume / 1000).toFixed(0)}k` : '-'}
                        </div>
                        <div className="text-[10px] text-blue-700 font-bold">
                          5日量比: {item.volumeRatio5d ? `${item.volumeRatio5d.toFixed(2)}x` : '-'}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          60日比: {item.volumeRatio60d ? `${item.volumeRatio60d.toFixed(2)}x` : '-'}
                        </div>
                      </div>
                    </td>

                    {/* PPO with Signal Line and Golden/Death Cross Status */}
                    <td className="py-2.5 px-3 text-center font-mono">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className={`font-bold ${item.ppo >= 0 ? 'text-blue-700' : 'text-slate-600'}`}>
                            {item.ppo > 0 ? `+${item.ppo.toFixed(2)}` : item.ppo.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-500">
                            / 慢 {item.ppoSignal.toFixed(2)}%
                          </span>
                        </div>
                        {item.hasSubsequentDeathCross ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                            ⚠️ 二次死叉排除
                          </span>
                        ) : item.ppoCrossStatus === 'GOLDEN_CROSS' ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                            PPO金叉中
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            PPO死叉中
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Right-Side Trade Evaluation & Strategy Plan (走主升 vs 追高 & 上看/止損) */}
                    <td className="py-2.5 px-3 text-center">
                      {(() => {
                        const cons = evalInfo?.conservativePlan;
                        const agg = evalInfo?.aggressivePlan;
                        const recPlan = agg?.isRecommended ? agg : cons;
                        const tooltipText = `【量價評估】${evalInfo?.badgeText || '區間震盪'}\n${evalInfo?.analysis || ''}\n\n` +
                          `🛡️【穩健型方案】\n· 上看短壓: NT$${cons?.targetPrice1.toFixed(1)} (+${cons?.targetGain1Pct}%)\n· 上看月壓: NT$${cons?.targetPrice2.toFixed(1)} (+${cons?.targetGain2Pct}%)\n· 嚴格止損: NT$${cons?.stopLossPrice.toFixed(1)} (-${cons?.stopLossPct}%)\n· 期望盈虧比: ${cons?.riskRewardDisplay}\n\n` +
                          `⚡【超額收益進攻型】\n· 上看主升: NT$${agg?.targetPrice1.toFixed(1)} (+${agg?.targetGain1Pct}%)\n· 終極爆發: NT$${agg?.targetPrice2.toFixed(1)} (+${agg?.targetGain2Pct}%)\n· 移動防守: NT$${agg?.stopLossPrice.toFixed(1)} (-${agg?.stopLossPct}%)\n· 期望盈虧比: ${agg?.riskRewardDisplay}`;

                        return (
                          <div className="flex flex-col items-center gap-1" title={tooltipText}>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                                evalInfo?.status === 'HIGH_CHASE_RISK'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : evalInfo?.status === 'MAIN_WAVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : evalInfo?.status === 'PULLBACK_BUY'
                                  ? 'bg-teal-50 text-teal-700 border-teal-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {evalInfo?.badgeText || '區間震盪'}
                            </span>
                            {recPlan && (
                              <div className="text-[9px] font-mono text-slate-600 leading-tight">
                                <span className="text-rose-700 font-semibold">看NT${recPlan.targetPrice1.toFixed(0)}</span>
                                <span className="text-slate-400 mx-0.5">/</span>
                                <span className="text-emerald-700 font-semibold">損NT${recPlan.stopLossPrice.toFixed(0)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Triggered Signals */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.matchedStrategies && item.matchedStrategies.length > 0 ? (
                          item.matchedStrategies.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold"
                            >
                              ★ {s}
                            </span>
                          ))
                        ) : null}
                        {item.signals.slice(0, 2).map((sig, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]"
                          >
                            {sig}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Yahoo Finance Link */}
                    <td className="py-2.5 px-2.5 text-center">
                      <a
                        href={yahooUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-medium"
                        title={`前往 Yahoo 奇摩股市查看 ${item.name} (${item.code})`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Yahoo ↗</span>
                      </a>
                    </td>

                    {/* Chart Detail Action */}
                    <td className="py-2.5 px-2.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock(item);
                        }}
                        className="p-1 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 transition cursor-pointer inline-flex items-center gap-1 text-[10px] font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        <span>圖表</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination & Quick Page Size Switcher */}
      <div className="p-3 sm:p-4 bg-slate-50/90 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 flex-wrap">
          <span>
            顯示第{' '}
            <strong className="font-mono text-slate-900">
              {totalItems === 0
                ? 0
                : (validCurrentPage - 1) * (pageSize === -1 ? totalItems : pageSize) + 1}
            </strong>{' '}
            ~{' '}
            <strong className="font-mono text-slate-900">
              {Math.min(
                validCurrentPage * (pageSize === -1 ? totalItems : pageSize),
                totalItems
              )}
            </strong>{' '}
            檔 (共 <strong className="font-mono text-slate-900">{totalItems}</strong> 檔)
          </span>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">每頁顯示:</span>
            {[15, 30, 50, -1].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold transition cursor-pointer border ${
                  pageSize === size
                    ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-300'
                }`}
              >
                {size === -1 ? '全部' : size}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Pagination Buttons */}
        <div className="flex items-center gap-1.5">
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-300 transition font-medium cursor-pointer shadow-2xs"
              >
                ◀ 上一頁
              </button>

              <span className="px-2 font-mono font-bold text-slate-800 text-xs">
                {validCurrentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 border border-slate-300 transition font-medium cursor-pointer shadow-2xs"
              >
                下一頁 ▶
              </button>
            </div>
          )}

          <button
            onClick={scrollToTop}
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold cursor-pointer flex items-center gap-1 transition shadow-2xs"
            title="回到列表頂部"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>頂部</span>
          </button>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          title="快速回到列表頂部"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>回到頂部</span>
        </button>
      )}
    </div>
  );
};
