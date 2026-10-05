import React from 'react';
import {
  BookOpen,
  ShieldCheck,
  Flame,
  CheckCircle,
  AlertTriangle,
  Zap,
  DollarSign,
  Target,
  Activity,
  Layers,
  BarChart2,
} from 'lucide-react';

interface StrategyGuideProps {
  onSwitchMode: (mode: 'left_side' | 'right_side') => void;
}

export const StrategyGuide: React.FC<StrategyGuideProps> = ({ onSwitchMode }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-emerald-700">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">實戰操盤手操作手冊</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          左側抄底 (7天防死叉) · 右側主升量價分析 · PE/PB 估值與形態結構手冊
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          整合台灣股市高勝率戰法：左側 7 天抄底嚴格過濾「金叉後二次死叉」誘多陷阱；右側以 5 日/60 日均量線與前方大陰大陽線結構精準判定「主升衝刺」或「追高受阻」。
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => onSwitchMode('left_side')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            啟動「左側抄底模式 (7天嚴選)」
          </button>
          <button
            onClick={() => onSwitchMode('right_side')}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Flame className="w-4 h-4" />
            啟動「右側順勢抓主升模式」
          </button>
        </div>
      </div>

      {/* 2 Big Playbook Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Playbook 1: Left-Side Strategy */}
        <div className="bg-white border border-emerald-300 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="text-base text-slate-900">模式一：左側超跌抄底 (7天防死叉)</h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              高賠率 · 安全邊際
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                1. 排除「金叉後二次死叉」等死陷阱
              </div>
              <p className="text-slate-600 text-[11px]">
                很多個股反彈一日後迅速再破底。系統會在 7 天回溯窗口中連續比對 PPO、KD、MACD，凡金叉後再度形成死亡交叉者，<strong>一律排除拒絕進場</strong>。
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                2. PPO 訊號慢線 (9 EMA) 與柱狀差值
              </div>
              <p className="text-slate-600 text-[11px]">
                以百分比平滑價格震盪指標，PPO 快線向上穿越 9 日 EMA 訊號慢線且紅柱擴大，方能確認跌勢煞車。
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                3. 估值底線 (PE &lt; 15, PB &lt; 1.2)
              </div>
              <p className="text-slate-600 text-[11px]">
                深度低估標的具備實質每股獲利與淨值折價防護，即使短線震盪亦有長期價值修復支撐。
              </p>
            </div>
          </div>
        </div>

        {/* Playbook 2: Right-Side Strategy */}
        <div className="bg-white border border-rose-300 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <Flame className="w-5 h-5" />
              <h2 className="text-base text-slate-900">模式二：右側順勢主升 vs 追高判定</h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
              量價配合 · 避開假突破
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-rose-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                1. 走主升波 (🚀 均線多頭 + 爆量突破)
              </div>
              <p className="text-slate-600 text-[11px]">
                均線標準多頭排列 (MA5&gt;10&gt;20&gt;60)，當日量達 5 日均量 1.3 倍以上且突破 60 日季均量線，放量過前高，主力強烈表態。
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                2. 追高風險 (🚨 逼近前方大陰線/量縮背離)
              </div>
              <p className="text-slate-600 text-[11px]">
                股價逼近前方關鍵大陰線頂部（套牢密集區）或重大壓力位（距離 &lt; 2%），但成交量萎縮小於 5 日均量 80%，切忌追價。
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-teal-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                3. 拉回支撐點 (🛡️ 縮量守大陽線底/MA20)
              </div>
              <p className="text-slate-600 text-[11px]">
                多頭架構下縮量回測 MA10/MA20 或前方大陽線起漲低點，為右側交易性價比最高、風險最小的買點。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dual-Track Quant Trading Strategy & Volume-Price Engine Guide */}
      <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>雙軌量化操盤建議體系：穩健防守型 vs 超額收益進攻型</span>
          </div>
          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
            量化參數：上看目標價位 (Target Prices) · 嚴格止損價位 (Stop Losses) · 盈虧比模型 (Risk/Reward)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Conservative Strategy */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                1. 穩健防守型策略方案 (勝率優先 / 逢低佈局)
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                勝率 &gt; 72% · 低回撤
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>策略核心：</strong>拒絕在高位盲目追價，專注於多頭架構下「縮量回測短線共振支撐 (短支) 或月線生命線 (MA20)」時逢低分批建倉。
            </p>
            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-blue-100 text-[11px] text-slate-700 font-sans">
              <div>🎯 <strong>進場條件：</strong>股價回踩短支或月線 MA20 守穩，且 5日量比縮至 0.8x 以下 (浮額洗淨)。</div>
              <div>📈 <strong>上看第一目標：</strong>短線即時壓力位 (3~7日碎形高點 / VPOC)，預期獲利 +4%~+8%。</div>
              <div>🚀 <strong>上看第二目標：</strong>1個月波段月壓大關 (前高 / 月線阻力)，預期獲利 +10%~+18%。</div>
              <div>🛑 <strong>嚴格止損點：</strong>實體跌破短線支撐或月線 MA20 之下 1.2% (對齊台股跳檔)，單筆風險限制在 -2.5%~-4.0% 內。</div>
              <div>⚖️ <strong>期望盈虧比：</strong>通常達 <strong>1 : 2.5 ~ 1 : 4.0</strong>，享有極高確定性與低回撤。</div>
            </div>
          </div>

          {/* Aggressive Strategy */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                2. 超額收益進攻型策略方案 (賠率優先 / 主升動能)
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                超額賠率 Alpha · 主升浪
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>策略核心：</strong>專注捕捉主升浪加速段與爆量實體大陽突破，追求大波段超額收益 (Alpha)，利用 5日均線 (MA5) 動態移動停利鎖定利潤。
            </p>
            <div className="space-y-1.5 bg-white p-3 rounded-lg border border-amber-100 text-[11px] text-slate-700 font-sans">
              <div>🎯 <strong>進場條件：</strong>盤中 5日量比 &gt; 1.3x 且實體長紅突破短線壓力或創歷史新高時順勢追擊。</div>
              <div>📈 <strong>上看第一主升目標：</strong>Fibonacci 1.272 擴展位 或 突破月壓目標，預期獲利 +8%~+15%。</div>
              <div>🚀 <strong>上看極限爆發目標：</strong>Fibonacci 1.618 終極擴展位 或 2.5 ATR 宏觀通道頂，預期獲利 +18%~+35%+。</div>
              <div>🛑 <strong>動態移動停利/停損：</strong>以 <strong>MA5 (5日均線)</strong> 為嚴格防守線，收盤未跌破 MA5 持股續抱，跌破即刻鎖定獲利離場。</div>
              <div>⚖️ <strong>期望盈虧比：</strong>高達 <strong>1 : 3.5 ~ 1 : 6.0</strong>，以小止損博弈大級別主升浪！</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantitative Multi-Factor Confluence Support & Resistance Pricing Engine */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Target className="w-4 h-4 text-rose-600" />
            <span>專業量化多維共振定價模型 (Quant Multi-Factor Confluence Engine)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            演算法：ATR(14) 波動率 + Fibonacci 黃金分割 + VPOC 籌碼密集區 + 均線共振 + 台股跳檔心理網格
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* Short-term Resistance */}
          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2">
            <div className="font-bold text-rose-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                短線壓力 (短壓)
              </span>
              <span className="text-[10px] text-amber-500 font-bold">★★★ 共振</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>定價邏輯：</strong>聚類 3~7 日波段局部碎形高點、近週巨量套牢陰線高點、MA5/MA10 下彎反壓及短布林上軌。若遇<strong>創高無套牢盤</strong>，模型自動切換為 <strong>Fibonacci 1.272 擴展位 + ATR(14) 波動率短頂</strong> 與台股跳檔整數心理關卡。
            </p>
          </div>

          {/* Mid-term Resistance */}
          <div className="p-3.5 bg-rose-100/40 rounded-xl border border-rose-300 space-y-2">
            <div className="font-bold text-rose-900 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-700"></span>
                中期月壓 (月壓)
              </span>
              <span className="text-[10px] text-amber-500 font-bold">★★★ 共振</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>定價邏輯：</strong>聚類 20~22 日（1個月）波段最高峰、20日內巨量大陰線套牢頂 (VPOC)、月布林 2.0σ 上軌與 MA60 季線。創高時則採用 <strong>Fibonacci 1.618 主升浪擴展目標 + 2.5 ATR 宏觀通道</strong> 與百/千/萬元大關。
            </p>
          </div>

          {/* Short-term Support */}
          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
            <div className="font-bold text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                短線支撐 (短支)
              </span>
              <span className="text-[10px] text-amber-500 font-bold">★★★ 共振</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>定價邏輯：</strong>以 <strong>MA5 (5日均線/短線生命線)</strong> 為第一核心權重，聚合 3~7 日波段前低、近週主力放量大陽棒防守底、突破前高頸線（頂底互換）及極短線 0.382 黃金回撤位。
            </p>
          </div>

          {/* Mid-term Support */}
          <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 space-y-2">
            <div className="font-bold text-teal-900 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                中期月支 (月支)
              </span>
              <span className="text-[10px] text-amber-500 font-bold">★★★ 共振</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>定價邏輯：</strong>以 <strong>MA20 (月生命線)</strong> 為核心中樞，加權 20 日內主力建倉巨量長紅低點、波段 0.500/0.618 黃金回撤防守線、1個月波段大底及 MA60 季線主力護盤防線。
            </p>
          </div>
        </div>
      </div>

      {/* PE & PB Valuation Guide Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-200 pb-3">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>本益比 (PE) 與 股價淨值比 (PB) 估值評估體系</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              本益比 (Price-to-Earnings Ratio, PE)
            </h3>
            <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
              <li><strong className="text-emerald-700">PE &lt; 15 倍 (低估)：</strong>獲利回本期短，具高安全邊際，適合價值投資與左側抄底。</li>
              <li><strong className="text-blue-700">PE 15~25 倍 (合理)：</strong>反映公司營運獲利常態，股價緊隨營收成長。</li>
              <li><strong className="text-rose-700">PE &gt; 35 倍 (高估/過熱)：</strong>市場給予極高成長預期，若營收未達標易發生劇烈評價修正。</li>
            </ul>
          </div>

          <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              股價淨值比 (Price-to-Book Ratio, PB)
            </h3>
            <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
              <li><strong className="text-emerald-700">PB &lt; 1.2 倍 (折價保護)：</strong>股價低於或接近清算資產價值，下檔有實質資產支撐。</li>
              <li><strong className="text-blue-700">PB 1.2~3.5 倍 (資產合理)：</strong>兼顧股東權益報酬率 (ROE) 與資產規模。</li>
              <li><strong className="text-rose-700">PB &gt; 6.0 倍 (輕資產/高溢價)：</strong>多見於高毛利 IC 設計或高 ROE 軟體股。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
