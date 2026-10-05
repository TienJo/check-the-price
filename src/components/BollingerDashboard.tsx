import React from 'react';
import { StockScanResult } from '../types';
import { Layers, Sparkles, Flame } from 'lucide-react';

interface BollingerDashboardProps {
  stocks: StockScanResult[];
  onSelectStock: (stock: StockScanResult) => void;
  onFilterBollinger: (mode: 'oversold_turn' | 'band_walking') => void;
}

export const BollingerDashboard: React.FC<BollingerDashboardProps> = ({
  stocks,
  onSelectStock,
  onFilterBollinger,
}) => {
  const oversoldTurn = stocks.filter((s) => s.percentB <= 0.25 || s.bollingerOversoldTurn);
  const bandWalking = stocks.filter((s) => s.percentB >= 0.85 || s.isBollingerWalking);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">布林通道 (20, 2) 極限波動與 %B 戰法專題</h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              布林通道由 20MA（中軌）與上下各 2 個標準差構成。<code className="text-sky-700 font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">%B = (收盤 - 下軌) / (上軌 - 下軌)</code>。
              當在7天內 <strong className="text-emerald-700 font-mono">%B &lt; 0.15</strong> 摜破下軌後快速抽腳站回通道內時，為極佳之「破底翻洗盤買點」；
              當 <strong className="text-rose-700 font-mono">%B &gt; 0.90</strong> 且通道開口擴大時，為「暴風開口主升段（沿上軌噴出）」。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => onFilterBollinger('oversold_turn')}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              左側破底翻 (%B &lt; 0.25)
            </button>
            <button
              onClick={() => onFilterBollinger('band_walking')}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Flame className="w-3.5 h-3.5" />
              右側沿上軌主升 (%B &gt; 0.85)
            </button>
          </div>
        </div>
      </div>

      {/* 2 Main Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side: Bollinger Squeeze & Reversal */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">左側：布林極限下軌破底翻 (%B &lt; 0.25)</h3>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {oversoldTurn.length} 檔
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            7天內股價摜破下軌後迅速抽腳收長下影或紅 K，主力洗盤誘空結束。
          </p>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {oversoldTurn.map((stock) => (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{stock.code}</span>
                  <span className="text-xs text-slate-800 font-semibold">{stock.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">{stock.industry}</span>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-emerald-700">
                    %B: {stock.percentB.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">超賣下軌支撐</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Band Walking */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <h3 className="text-xs font-bold text-slate-900">右側：布林開口暴風主升 (%B &gt; 0.85)</h3>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
              {bandWalking.length} 檔
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            通道帶寬劇烈擴張，K 棒貼著上軌強勢推升，量價齊揚。
          </p>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {bandWalking.map((stock) => (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-rose-50/60 border border-slate-200 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{stock.code}</span>
                  <span className="text-xs text-slate-800 font-semibold">{stock.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                    主升噴出
                  </span>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-rose-600">
                    %B: {stock.percentB.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">強勢貼上軌走</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
