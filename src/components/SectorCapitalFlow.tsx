import React, { useState, useEffect } from 'react';
import { SectorFlowResponse, SectorFlowItem, SectorFlowRange } from '../types';
import {
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Filter,
} from 'lucide-react';

interface SectorCapitalFlowProps {
  onSelectSectorTag: (tag: string) => void;
  selectedSectorTag?: string;
  onQuickDiagnoseStock?: (code: string) => void;
}

export const SectorCapitalFlow: React.FC<SectorCapitalFlowProps> = ({
  onSelectSectorTag,
  selectedSectorTag,
  onQuickDiagnoseStock,
}) => {
  const [range, setRange] = useState<SectorFlowRange>('1d');
  const [flowData, setFlowData] = useState<SectorFlowResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedSectorId, setExpandedSectorId] = useState<string | null>('semiconductor');

  const fetchSectorFlow = async (selectedRange: SectorFlowRange) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/twse/sector-flow?range=${selectedRange}`);
      if (res.ok) {
        const data: SectorFlowResponse = await res.json();
        setFlowData(data);
      }
    } catch (e) {
      console.error('Failed to fetch sector capital flow:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSectorFlow(range);
  }, [range]);

  const sectors = flowData?.sectors || [];
  const maxInflowAbs = Math.max(
    ...(sectors.map((s) => Math.abs(s.netInflow))),
    50
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">主力資金流向與板塊輪動監控</h2>
              {isLoading && (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              即時統計三大法人與主力大戶資金進出板塊，掌握強勢吸金與超跌潛力族群
            </p>
          </div>
        </div>

        {/* 1D, 5D, 10D Timeframe Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <span className="text-[11px] text-slate-500 px-2 font-medium">統計區間:</span>
          {(['1d', '5d', '10d'] as SectorFlowRange[]).map((r) => {
            const labels: Record<SectorFlowRange, string> = {
              '1d': '當日 (1D)',
              '5d': '5 日 (5D)',
              '10d': '10 日 (10D)',
            };
            const active = range === r;
            return (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Sector Filter Notice */}
      {selectedSectorTag && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>已依板塊篩選：<strong>{selectedSectorTag}</strong></span>
          </div>
          <button
            onClick={() => onSelectSectorTag('ALL')}
            className="text-slate-500 hover:text-slate-900 text-xs underline cursor-pointer"
          >
            重設為全部產業
          </button>
        </div>
      )}

      {/* Main Sector Capital Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Sector Inflow/Outflow Waterfall Bar List (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
            <span>產業板塊名稱 (點擊直接過濾標的)</span>
            <div className="flex items-center gap-4">
              <span>資金佔比</span>
              <span className="font-mono">主力淨流入 (億元)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {sectors.map((sector) => {
              const isInflow = sector.netInflow >= 0;
              const barWidth = Math.min(100, (Math.abs(sector.netInflow) / maxInflowAbs) * 100);
              const isSelected = selectedSectorTag === sector.tag;
              const isExpanded = expandedSectorId === sector.id;

              return (
                <div
                  key={sector.id}
                  className={`border rounded-xl p-2.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    onSelectSectorTag(sector.tag);
                    setExpandedSectorId(isExpanded ? null : sector.id);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Sector Name & Avg Return */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-slate-900 tracking-tight truncate">
                        {sector.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium border ${
                          sector.avgChangePercent >= 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {sector.avgChangePercent >= 0 ? '+' : ''}
                        {sector.avgChangePercent.toFixed(2)}%
                      </span>
                    </div>

                    {/* Stats & Bar */}
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {sector.turnoverRatio}%
                      </span>

                      <div className="w-24 text-right">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isInflow ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isInflow ? '+' : ''}
                          {sector.netInflow.toFixed(1)} 億
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Flow Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isInflow ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(4, barWidth)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Sector Spotlight & Top Leader Stocks (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900">板塊代表性指標股</h3>
              </div>
              <span className="text-[10px] text-slate-500">含 Yahoo 股市即時行情</span>
            </div>

            {/* List leader stocks of the highlighted sector */}
            {(() => {
              const currentSector =
                sectors.find((s) => s.tag === selectedSectorTag) ||
                sectors.find((s) => s.id === expandedSectorId) ||
                sectors[0];

              if (!currentSector) return null;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 pb-1">
                    <span className="font-bold text-emerald-800">{currentSector.name}</span>
                    <span className="text-[11px] text-slate-500">
                      佔大盤資金比重: <strong className="text-slate-900 font-mono">{currentSector.turnoverRatio}%</strong>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {currentSector.leaderStocks.map((stock) => {
                      const isUp = stock.priceChangePercent >= 0;
                      const yahooUrl = `https://tw.stock.yahoo.com/quote/${stock.code}.TW`;

                      return (
                        <div
                          key={stock.code}
                          className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs hover:border-slate-300 transition shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => onQuickDiagnoseStock?.(stock.code)}
                              className="font-mono font-bold text-emerald-700 hover:underline cursor-pointer"
                              title="點擊進行技術診斷"
                            >
                              {stock.code}
                            </button>
                            <span className="font-semibold text-slate-800 truncate">{stock.name}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-slate-700 font-semibold">
                              NT$ {stock.close.toFixed(1)}
                            </span>
                            <span
                              className={`font-mono font-bold text-[11px] ${
                                isUp ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {isUp ? '+' : ''}
                              {stock.priceChangePercent.toFixed(2)}%
                            </span>

                            {/* Direct Yahoo Finance Link */}
                            <a
                              href={yahooUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-indigo-600 transition p-1 hover:bg-slate-100 rounded cursor-pointer"
                              title={`前往 Yahoo 股市查看 ${stock.name} (${stock.code})`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="bg-white rounded-lg p-2.5 border border-slate-200 text-[11px] text-slate-600 space-y-1 shadow-2xs">
            <div className="text-slate-800 font-bold flex items-center gap-1">
              <span>💡 主力資金流向操作心法：</span>
            </div>
            <p>
              當大盤或個股進入深水超賣區時，若對應板塊出現<strong>主力資金逆勢擴大淨流入</strong>，常為下一波主流反彈領頭羊。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
