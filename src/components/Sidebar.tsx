import React from 'react';
import { ScanFilterParams, StrategyType, MasterTradingMode } from '../types';
import { Play, Square, Search, ShieldCheck, Sparkles, Flame, SlidersHorizontal } from 'lucide-react';

interface SidebarProps {
  filters: ScanFilterParams;
  onFilterChange: (filters: ScanFilterParams) => void;
  onStartScan: () => void;
  onStopScan: () => void;
  isScanning: boolean;
  totalFilteredStocks: number;
  onTestSingleStock: (code: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  filters,
  onFilterChange,
  onStartScan,
  onStopScan,
  isScanning,
  totalFilteredStocks,
  onTestSingleStock,
}) => {
  const [singleCodeInput, setSingleCodeInput] = React.useState('');
  const isRightSide = filters.masterMode === 'right_side';

  const updateFilter = <K extends keyof ScanFilterParams>(key: K, value: ScanFilterParams[K]) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const switchMasterMode = (mode: MasterTradingMode) => {
    if (mode === 'right_side') {
      onFilterChange({
        ...filters,
        masterMode: 'right_side',
        strategy: 'right_super_trend',
        peLimit: 45.0,
        pbLimit: 8.0,
        minDividendYield: 0,
        lookbackDays: 20,
        useMacd: true,
        usePpo: true,
        useSkdj: true,
        useRsi: true,
        useBias: false,
        useBollinger: false,
      });
    } else {
      onFilterChange({
        ...filters,
        masterMode: 'left_side',
        strategy: 'deep_value',
        peLimit: 20.0,
        pbLimit: 1.5,
        minDividendYield: 0,
        lookbackDays: 7, // Fixed to 7-day strictly for left side
        ppoOversoldThreshold: -2.0,
        biasOversoldThreshold: -5.0,
        useMacd: true,
        usePpo: true,
        useSkdj: true,
        useRsi: true,
        useBias: false,
        useBollinger: false,
      });
    }
  };

  const selectStrategy = (strat: StrategyType) => {
    if (strat === 'deep_value') {
      onFilterChange({
        ...filters,
        strategy: 'deep_value',
        peLimit: 18.0,
        pbLimit: 1.2,
        minDividendYield: 0,
        lookbackDays: 7,
      });
    } else if (strat === 'ppo_oversold') {
      onFilterChange({
        ...filters,
        strategy: 'ppo_oversold',
        peLimit: 25.0,
        pbLimit: 2.0,
        minDividendYield: 0,
        lookbackDays: 7,
        ppoOversoldThreshold: -2.0,
      });
    } else if (strat === 'bias_reversal') {
      onFilterChange({
        ...filters,
        strategy: 'bias_reversal',
        peLimit: 30.0,
        pbLimit: 2.5,
        minDividendYield: 0,
        lookbackDays: 7,
        biasOversoldThreshold: -5.0,
      });
    } else if (strat === 'bollinger_breakout') {
      onFilterChange({
        ...filters,
        strategy: 'bollinger_breakout',
        peLimit: 25.0,
        pbLimit: 2.0,
        minDividendYield: 0,
        lookbackDays: 7,
      });
    } else if (strat === 'high_dividend') {
      onFilterChange({
        ...filters,
        strategy: 'high_dividend',
        peLimit: 18.0,
        pbLimit: 1.5,
        minDividendYield: 4.5,
        lookbackDays: 7,
      });
    }
    // Right-Side Strategies
    else if (strat === 'right_super_trend') {
      onFilterChange({
        ...filters,
        strategy: 'right_super_trend',
        peLimit: 40.0,
        pbLimit: 8.0,
        minDividendYield: 0,
        lookbackDays: 20,
      });
    } else if (strat === 'right_bollinger_squeeze') {
      onFilterChange({
        ...filters,
        strategy: 'right_bollinger_squeeze',
        peLimit: 45.0,
        pbLimit: 8.0,
        minDividendYield: 0,
        lookbackDays: 20,
      });
    } else if (strat === 'right_ma_pullback') {
      onFilterChange({
        ...filters,
        strategy: 'right_ma_pullback',
        peLimit: 35.0,
        pbLimit: 6.0,
        minDividendYield: 0,
        lookbackDays: 20,
      });
    } else if (strat === 'right_ppo_zero_cross') {
      onFilterChange({
        ...filters,
        strategy: 'right_ppo_zero_cross',
        peLimit: 40.0,
        pbLimit: 7.0,
        minDividendYield: 0,
        lookbackDays: 20,
      });
    } else if (strat === 'right_volume_breakout') {
      onFilterChange({
        ...filters,
        strategy: 'right_volume_breakout',
        peLimit: 40.0,
        pbLimit: 7.0,
        minDividendYield: 0,
        lookbackDays: 20,
      });
    }
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (singleCodeInput.trim()) {
      onTestSingleStock(singleCodeInput.trim());
      setSingleCodeInput('');
    }
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white border-r border-slate-200 p-4 space-y-4 flex flex-col overflow-y-auto">
      <div className="space-y-4">
        {/* Master Mode Switch Box */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[11px] font-bold text-slate-600 block px-0.5">交易主模式：</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => switchMasterMode('left_side')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                !isRightSide
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              左側抄底 (7天內)
            </button>
            <button
              onClick={() => switchMasterMode('right_side')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                isRightSide
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              右側順勢 (量價)
            </button>
          </div>
        </div>

        {/* Core Execution Panel: Start / Stop Scan Actions (已置頂於上方，清單再多也一目了然) */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs py-2 px-1 -mx-1 border-y border-slate-200 shadow-2xs space-y-2">
          <div className="text-xs flex items-center justify-between">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              待篩選母體標的：
            </span>
            <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 text-xs">
              {totalFilteredStocks} 檔
            </span>
          </div>

          {!isScanning ? (
            <button
              onClick={onStartScan}
              disabled={totalFilteredStocks === 0}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                isRightSide
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRightSide ? <Flame className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>開始執行 {isRightSide ? '右側主升' : '左側抄底(7天)'} 策略掃描</span>
            </button>
          ) : (
            <button
              onClick={onStopScan}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>停止掃描</span>
            </button>
          )}
        </div>

        {/* Quick Stock Code Diagnostic Search */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            個股即時診斷 (支撐/壓力/量價)
          </span>
          <form onSubmit={handleSingleSubmit} className="flex gap-1.5">
            <input
              type="text"
              placeholder="例: 2330, 2454, 2603"
              value={singleCodeInput}
              onChange={(e) => setSingleCodeInput(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono shadow-2xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition shrink-0 cursor-pointer"
            >
              診斷
            </button>
          </form>
        </div>

        {/* Strategy Presets Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              {isRightSide ? (
                <>
                  <Flame className="w-4 h-4 text-rose-600" />
                  右側主升順勢策略庫
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  左側超跌抄底策略 (7天內嚴格判定)
                </>
              )}
            </span>
          </div>

          <div className="space-y-1.5">
            {isRightSide
              ? [
                  {
                    id: 'right_super_trend',
                    name: '均線多頭排列主升 (勝率最高)',
                    desc: 'MA5>10>20>60 站上均線且量價配合',
                    tag: '高勝率',
                  },
                  {
                    id: 'right_volume_breakout',
                    name: '帶量突破 20 日高點 (量增 1.3倍+)',
                    desc: '非窒息量！嚴格要求量增突破短線壓力',
                    tag: '爆量啟動',
                  },
                  {
                    id: 'right_bollinger_squeeze',
                    name: '布林暴風開口主升 (%B>0.90)',
                    desc: '通道擴張 + 沿上軌強勢推升',
                    tag: '暴衝波',
                  },
                  {
                    id: 'right_ma_pullback',
                    name: '強勢縮量回測 MA10/MA20 有守',
                    desc: '量縮回檔洗浮額，守穩均線支撐買點',
                    tag: '低風險低接',
                  },
                  {
                    id: 'right_ppo_zero_cross',
                    name: 'PPO 零軸上二度金叉加速',
                    desc: '多頭領空內動能二次爆發',
                    tag: '動能加速',
                  },
                ].map((s) => {
                  const active = filters.strategy === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectStrategy(s.id as StrategyType)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition cursor-pointer border ${
                        active
                          ? 'bg-rose-50 border-rose-300 text-slate-900 shadow-2xs font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${active ? 'text-rose-700' : 'text-slate-800'}`}>
                          {s.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                          {s.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{s.desc}</p>
                    </button>
                  );
                })
              : [
                  {
                    id: 'deep_value',
                    name: '低估值 + 7天指標底部翻紅',
                    desc: 'PE < 18, 近7天內 PPO/KD/MACD 翻揚',
                    tag: '安全邊際',
                  },
                  {
                    id: 'ppo_oversold',
                    name: 'PPO 7天內深水超賣金叉 (< -2%)',
                    desc: '百分比動能指標超賣翻紅，標準化反轉',
                    tag: '核心動能',
                  },
                  {
                    id: 'bias_reversal',
                    name: '7天內月線負乖離超賣 (< -5%)',
                    desc: '均值回歸強拉力 + 底部轉折訊號',
                    tag: '均值回歸',
                  },
                  {
                    id: 'bollinger_breakout',
                    name: '布林下軌破底翻 (%B 7天內探底站回)',
                    desc: '摜破下軌後抽腳站回 0.15~0.65，誘空洗盤結束',
                    tag: '假跌破翻揚',
                  },
                  {
                    id: 'high_dividend',
                    name: '高現金殖利率防線 (殖利率 > 4.5%)',
                    desc: '高配息低估值 + 短線指標轉強',
                    tag: '下檔防護',
                  },
                ].map((s) => {
                  const active = filters.strategy === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectStrategy(s.id as StrategyType)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition cursor-pointer border ${
                        active
                          ? 'bg-emerald-50 border-emerald-300 text-slate-900 shadow-2xs font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${active ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {s.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                          {s.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{s.desc}</p>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Valuation Threshold Sliders */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600">本益比上限 (PE)</span>
            <span className="font-mono text-emerald-700 font-bold">{filters.peLimit} 倍</span>
          </div>
          <input
            type="range"
            min="8"
            max="60"
            step="1"
            value={filters.peLimit}
            onChange={(e) => updateFilter('peLimit', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />

          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600">股價淨值比 (PB)</span>
            <span className="font-mono text-emerald-700 font-bold">{filters.pbLimit} 倍</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="8.0"
            step="0.1"
            value={filters.pbLimit}
            onChange={(e) => updateFilter('pbLimit', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* 5大結構性缺失量化過濾器 (Quant Risk & Deduction Filters) */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              量化風控與均線扣抵濾網
            </span>
            <span className="text-[10px] text-indigo-600 font-mono font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
              新版優化
            </span>
          </div>

          {/* One-Click 5-Deficiencies Defense Preset Button */}
          {(() => {
            const isAllEnabled =
              Boolean(filters.filterLowDeductionOnly) &&
              Boolean(filters.filterSafeRiskOnly) &&
              Boolean(filters.excludeDayTradeShakeout);

            return (
              <button
                type="button"
                onClick={() => {
                  const targetState = !isAllEnabled;
                  onFilterChange({
                    ...filters,
                    filterLowDeductionOnly: targetState,
                    filterSafeRiskOnly: targetState,
                    excludeDayTradeShakeout: targetState,
                  });
                }}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                  isAllEnabled
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {isAllEnabled ? '🛡️ 已開啟 5大缺失全防禦模式 (點擊關閉)' : '⚡ 一鍵啟動 5大缺失全防禦優化'}
                </span>
              </button>
            );
          })()}

          <div className="space-y-1.5">
            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer p-1.5 rounded hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={Boolean(filters.filterLowDeductionOnly)}
                onChange={(e) => updateFilter('filterLowDeductionOnly', e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 block text-[11px]">
                  🚀 僅選 5MA 扣低助漲股
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  排除明日均線即將扣高下彎形成蓋頭反壓的標的
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer p-1.5 rounded hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={Boolean(filters.filterSafeRiskOnly)}
                onChange={(e) => updateFilter('filterSafeRiskOnly', e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 block text-[11px]">
                  🛡️ 僅選 A/B 級安全低風險股
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  自動過濾掉正乖離過大超買過熱或破位的 C/D 級高危股
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer p-1.5 rounded hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
              <input
                type="checkbox"
                checked={Boolean(filters.excludeDayTradeShakeout)}
                onChange={(e) => updateFilter('excludeDayTradeShakeout', e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 block text-[11px]">
                  🛑 排除隔日沖與假突破高危
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  過濾長上影線及放量高檔派發易受隔日摜壓出貨之個股
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
};
