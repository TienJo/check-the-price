import React from 'react';
import { StockScanResult } from '../types';
import { ShieldCheck } from 'lucide-react';

interface BiasDashboardProps {
  stocks: StockScanResult[];
  onSelectStock: (stock: StockScanResult) => void;
  onFilterBias: (threshold: number) => void;
}

export const BiasDashboard: React.FC<BiasDashboardProps> = ({
  stocks,
  onSelectStock,
  onFilterBias,
}) => {
  // Sorted by deep negative bias (mean reversion candidates)
  const sortedByNegativeBias = [...stocks].sort((a, b) => a.bias20 - b.bias20);
  // Sorted by bullish MA alignment
  const bullishAlignmentStocks = stocks.filter((s) => s.isBullishMaAlignment || s.bias20 > 0);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">均線系統與乖離率 (BIAS) 診斷中心</h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              均線乖離率反映價格與均線（MA5、MA10、MA20、MA60）的偏離幅度。
              當月線負乖離達 <strong className="text-amber-800 font-mono">&lt; -5%</strong> 且在7天內確認有守時，葛蘭碧均值回歸拉力極強（左側抄底安全邊際）；
              當均線呈現 <strong className="text-rose-700 font-mono">MA5 &gt; MA10 &gt; MA20 &gt; MA60</strong> 多頭排列時，為右側主升趨勢。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => onFilterBias(-5)}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              篩選負乖離 &lt; -5%
            </button>
            <button
              onClick={() => onFilterBias(-8)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              極限負乖離 &lt; -8%
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Deep Negative Bias (Mean Reversion) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">左側：深水負乖離排行 (均值回歸標的)</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">BIAS 20MA</span>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {sortedByNegativeBias.slice(0, 8).map((stock) => (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 transition cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{stock.code}</span>
                    <span className="text-xs text-slate-800 font-semibold">{stock.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">{stock.industry}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    現價: NT$ {stock.close.toFixed(2)} | MA20: {stock.ma20?.toFixed(2) || '-'}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono text-xs font-bold ${
                      stock.bias20 <= -5 ? 'text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    {stock.bias20.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {stock.bias20 <= -5 ? '超跌均值回歸' : '正常波動'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bullish MA Alignment (Trend Following) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <h3 className="text-xs font-bold text-slate-900">右側：均線多頭排列矩陣 (MA5 &gt; 10 &gt; 20 &gt; 60)</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">強勢主升股</span>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {bullishAlignmentStocks.slice(0, 8).map((stock) => (
              <div
                key={stock.code}
                onClick={() => onSelectStock(stock)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-rose-50/60 border border-slate-200 transition cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{stock.code}</span>
                    <span className="text-xs text-slate-800 font-semibold">{stock.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                      多頭發散
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    MA5: {stock.ma5?.toFixed(1)} &gt; MA10: {stock.ma10?.toFixed(1)} &gt; MA20: {stock.ma20?.toFixed(1)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-rose-600">
                    +{stock.bias20.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    順勢主升
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
