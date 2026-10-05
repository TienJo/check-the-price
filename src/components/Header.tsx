import React from 'react';
import { TrendingUp, RefreshCw, ShieldCheck, Flame } from 'lucide-react';
import { NavTabType, MasterTradingMode } from '../types';

interface HeaderProps {
  activeTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  masterMode: MasterTradingMode;
  onToggleMasterMode: (mode: MasterTradingMode) => void;
  onRefreshValuation?: () => void;
  isLoadingValuation?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  masterMode,
  onToggleMasterMode,
  onRefreshValuation,
  isLoadingValuation = false,
}) => {
  const isRightSide = masterMode === 'right_side';

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-4 sm:px-6 h-14 flex items-center justify-between shadow-xs">
      {/* Zone 1: Brand Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isRightSide
              ? 'bg-rose-50 border border-rose-200 text-rose-600'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
          }`}
        >
          {isRightSide ? <Flame className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
        </div>
        <span className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
          台股量價策略與估值診斷終端
        </span>
      </div>

      {/* Zone 2: Navigation Links (Single Line, 1-2 words) */}
      <nav className="hidden md:flex items-center gap-1.5 text-xs">
        <button
          onClick={() => onSelectTab('scanner')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'scanner'
              ? isRightSide
                ? 'text-rose-700 bg-rose-50 border border-rose-200 font-bold'
                : 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          策略選股
        </button>
        <button
          onClick={() => onSelectTab('ppo')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'ppo'
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          PPO震盪
        </button>
        <button
          onClick={() => onSelectTab('bias')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'bias'
              ? 'text-amber-800 bg-amber-50 border border-amber-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          均線乖離
        </button>
        <button
          onClick={() => onSelectTab('bollinger')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'bollinger'
              ? 'text-sky-700 bg-sky-50 border border-sky-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          布林通道
        </button>
        <button
          onClick={() => onSelectTab('guide')}
          className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === 'guide'
              ? 'text-purple-700 bg-purple-50 border border-purple-200 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          交易戰法
        </button>
      </nav>

      {/* Zone 3: Primary Actions (Master Mode Switcher: Left vs Right) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Left / Right Master Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => onToggleMasterMode('left_side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer font-semibold ${
              !isRightSide
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">左側抄底 (7天嚴選)</span>
            <span className="sm:hidden">左側</span>
          </button>
          <button
            onClick={() => onToggleMasterMode('right_side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer font-semibold ${
              isRightSide
                ? 'bg-white text-rose-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">右側順勢 (主升/追高判定)</span>
            <span className="sm:hidden">右側</span>
          </button>
        </div>

        {onRefreshValuation && (
          <button
            onClick={onRefreshValuation}
            disabled={isLoadingValuation}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer disabled:opacity-50"
            title="重新整理證交所即時數據"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingValuation ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
