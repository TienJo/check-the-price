import React from 'react';
import { StockScanResult } from '../types';
import { Activity, Sparkles, Flame, ShieldAlert, ShieldCheck, TrendingUp, BarChart2 } from 'lucide-react';

interface PpoDashboardProps {
  stocks: StockScanResult[];
  onSelectStock: (stock: StockScanResult) => void;
  onApplyPpoFilter: (mode: 'oversold' | 'zerocross' | 'divergence') => void;
}

export const PpoDashboard: React.FC<PpoDashboardProps> = ({
  stocks,
  onSelectStock,
  onApplyPpoFilter,
}) => {
  // PPO categories
  const deepOversoldPpo = stocks.filter((s) => s.ppo <= -2.0);
  const bullishZeroCross = stocks.filter((s) => s.ppo > 0 && s.ppoHist > 0);
  const goldenCrossPpo = stocks.filter((s) => s.ppoCrossStatus === 'GOLDEN_CROSS' && !s.hasSubsequentDeathCross);
  const deathCrossPpo = stocks.filter((s) => s.ppoCrossStatus === 'DEATH_CROSS' || s.hasSubsequentDeathCross);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">PPO (Percentage Price Oscillator) 百分比價格震盪與量價矩陣</h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              PPO 快線公式為 <code className="text-blue-700 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">(EMA12 - EMA26) / EMA26 × 100%</code>，搭配 <code className="text-amber-700 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">9日 EMA 訊號慢線</code>。
              系統已內建<strong>「7日死叉過濾保護」</strong>，嚴格剃除金叉後隨即跌破死叉的誘多套牢盤。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => onApplyPpoFilter('oversold')}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              左側深水超賣 (&lt; -2%)
            </button>
            <button
              onClick={() => onApplyPpoFilter('zerocross')}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Flame className="w-3.5 h-3.5" />
              右側零軸上主升 (&gt; 0%)
            </button>
          </div>
        </div>
      </div>

      {/* Strict Death-Cross Filter Guarantee Card */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 space-y-0.5">
          <span className="font-bold block">🛡️ 雙重防套牢機制已啟用：嚴格排除「金叉後二次死叉」標的</span>
          <p className="text-emerald-800 leading-relaxed">
            任何在 7 天回溯期內雖然出現過金叉但<strong>隨後再次死叉</strong>的個股，系統已全面自動封鎖排除，確保您挑選的左側抄底標的處於真實黃金交叉保護期內。
          </p>
        </div>
      </div>

      {/* PPO Status 3-Pillar Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Pillar 1: Deep Oversold */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">左側深水超賣 (PPO &lt; -2%)</h3>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {deepOversoldPpo.length} 檔
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            股價大幅偏離均線、空頭動能衰竭。一旦 PPO 柱狀體翻紅即為左側高期望值抄底時機。
          </p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {deepOversoldPpo.map((stock) => (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">{stock.code}</span>
                    <span className="text-xs text-slate-800 font-medium">{stock.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    量比: {stock.volumeRatio5d ? `${stock.volumeRatio5d.toFixed(2)}x` : '-'} | 支撐: NT${stock.levels?.shortSupport?.toFixed(1)}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-emerald-700 font-bold block">{stock.ppo.toFixed(2)}%</span>
                  <span className="text-[10px] text-slate-500">慢: {stock.ppoSignal.toFixed(2)}%</span>
                </div>
              </div>
            ))}
            {deepOversoldPpo.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">目前暫無深水超賣標的</div>
            )}
          </div>
        </div>

        {/* Pillar 2: Golden Cross */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-xs font-bold text-slate-900">7天內有效金叉 (無二次死叉)</h3>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
              {goldenCrossPpo.length} 檔
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            PPO 快線突破 9 日慢線、紅柱擴大，且維持金叉狀態未跌破，動能反轉確立。
          </p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {goldenCrossPpo.map((stock) => (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">{stock.code}</span>
                    <span className="text-xs text-slate-800 font-medium">{stock.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    5日量比: {stock.volumeRatio5d ? `${stock.volumeRatio5d.toFixed(2)}x` : '-'} | 壓力: NT${stock.levels?.shortResistance?.toFixed(1)}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-blue-700 font-bold block">PPO {stock.ppo.toFixed(2)}%</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">差值: +{stock.ppoHist.toFixed(2)}%</span>
                </div>
              </div>
            ))}
            {goldenCrossPpo.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">目前無剛金叉標的</div>
            )}
          </div>
        </div>

        {/* Pillar 3: Right-Side Zero-Line Acceleration */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <h3 className="text-xs font-bold text-slate-900">右側零軸上主升加速</h3>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
              {bullishZeroCross.length} 檔
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            PPO &gt; 0% 且快線高於慢線，多頭掌控主控權，配合量能放大走出強勢主升浪。
          </p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {bullishZeroCross.map((stock) => (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-rose-50/60 border border-slate-200 transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">{stock.code}</span>
                    <span className="text-xs text-slate-800 font-medium">{stock.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {stock.rightSideEvaluation?.badgeText} | 5日量比: {stock.volumeRatio5d ? `${stock.volumeRatio5d.toFixed(2)}x` : '-'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-rose-600 font-bold block">+{stock.ppo.toFixed(2)}%</span>
                  <span className="text-[10px] text-slate-500">慢: +{stock.ppoSignal.toFixed(2)}%</span>
                </div>
              </div>
            ))}
            {bullishZeroCross.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">目前暫無主升加速標的</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
