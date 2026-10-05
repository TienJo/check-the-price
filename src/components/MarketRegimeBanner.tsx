import React from 'react';
import { MarketRegimeInfo } from '../types';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Flame,
  AlertTriangle,
  RefreshCw,
  Gauge,
  Layers,
} from 'lucide-react';

interface MarketRegimeBannerProps {
  marketRegime: MarketRegimeInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const MarketRegimeBanner: React.FC<MarketRegimeBannerProps> = ({
  marketRegime,
  isLoading,
  onRefresh,
}) => {
  if (!marketRegime) return null;

  const isTaiexUp = marketRegime.taiexChange >= 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-3.5 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                  台股大盤環境總體溫度計 (Market Regime Monitor)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  證交所官方連線
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700/60">
                  缺失四全面優化
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                整合加權指數、四大權重類股動態與宏觀多空定性，避免覆巢之下無完卵的盲目追高
              </p>
            </div>
          </div>

          {/* Right Refresh & Timing */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <span className="text-[10px] font-mono text-slate-400">
              更新時間: {marketRegime.updatedAt}
            </span>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
              title="重新同步大盤即時行情"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-medium hidden sm:inline">重新同步</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Indicators Grid */}
      <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50">
        {/* Card 1: 加權指數 (TAIEX) */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">發行量加權股價指數</span>
            <span className="text-[10px] font-mono text-slate-400">TAIEX</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-lg font-black text-slate-900">
              {marketRegime.taiexIndex.toLocaleString()}
            </span>
            <div
              className={`font-mono text-xs font-bold flex items-center gap-0.5 ${
                isTaiexUp ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {isTaiexUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isTaiexUp ? '+' : ''}{marketRegime.taiexChange.toFixed(1)}</span>
              <span>({isTaiexUp ? '+' : ''}{marketRegime.taiexChangePercent.toFixed(2)}%)</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
            <span>趨勢結構:</span>
            <strong className={isTaiexUp ? 'text-rose-700' : 'text-emerald-700'}>
              {isTaiexUp ? '偏多挺進' : '空方壓制'}
            </strong>
          </div>
        </div>

        {/* Card 2: 宏觀戰略格局定性 */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">大盤多空氛圍定性</span>
            {marketRegime.regime === 'BULL_MARKET' ? (
              <Flame className="w-4 h-4 text-rose-500" />
            ) : marketRegime.regime === 'BEAR_DEFENSE' ? (
              <AlertTriangle className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <div className="pt-0.5">
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-bold border block text-center ${
                marketRegime.regime === 'BULL_MARKET'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : marketRegime.regime === 'BEAR_DEFENSE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {marketRegime.regimeLabel}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 text-center">
            {marketRegime.regime === 'BULL_MARKET'
              ? '主升股成功率最高，積極擴大戰果'
              : marketRegime.regime === 'BEAR_DEFENSE'
              ? '突破容易轉為假突破，注意系統性風險'
              : '個股分化，嚴格逢低支撐低吸'}
          </div>
        </div>

        {/* Card 3: 建議全市場持倉水位 */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">建議總持倉水位</span>
            <span className="text-[10px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
              風控紀律
            </span>
          </div>
          <div className="pt-0.5">
            <span className="font-mono text-base font-bold text-indigo-900 block text-center bg-indigo-50/60 py-0.5 rounded border border-indigo-100">
              {marketRegime.suggestedExposure}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 line-clamp-1" title={marketRegime.strategyGuidance}>
            {marketRegime.strategyGuidance}
          </div>
        </div>

        {/* Card 4: 核心四大板塊指數表現 */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              權重主軸板塊
            </span>
            <span className="text-[10px] text-slate-400">漲跌幅</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {marketRegime.subIndices && marketRegime.subIndices.length > 0 ? (
              marketRegime.subIndices.slice(0, 4).map((sub, idx) => {
                const isSubUp = sub.changePercent >= 0;
                return (
                  <div
                    key={idx}
                    className="p-1 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                  >
                    <span className="text-slate-700 font-medium">{sub.name}</span>
                    <span
                      className={`font-mono font-bold text-[10px] ${
                        isSubUp ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isSubUp ? '+' : ''}{sub.changePercent.toFixed(2)}%
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-[11px] text-slate-400 col-span-2 text-center py-1">
                板塊連線同步中...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
