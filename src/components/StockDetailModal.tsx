import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StockScanResult } from '../types';
import {
  X,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  Flame,
  AlertCircle,
  AlertTriangle,
  Layers,
  Activity,
  BarChart2,
  Calendar,
  Zap,
  Crosshair,
  Target,
  ArrowUpRight,
  Shield,
  CheckCircle2,
  Compass,
  Award,
  RefreshCw,
  Clock,
  HelpCircle,
  Info,
  Sliders,
  ShieldAlert,
  ArrowDownRight,
  Landmark,
  Users,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { calculateTimeframeRiskAssessment } from '../utils/indicators';

interface StockDetailModalProps {
  stock: StockScanResult | null;
  onClose: () => void;
  onRefreshStock?: (code: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ stock, onClose, onRefreshStock }) => {
  const [modalTab, setModalTab] = useState<'chart' | 'strategy' | 'risk' | 'chip' | 'all'>('chart');
  const [activeSubTab, setActiveSubTab] = useState<'ppo' | 'skdj' | 'rsi' | 'bollinger'>('ppo');
  const [activeRiskTab, setActiveRiskTab] = useState<'5day' | '10day' | 'deduction' | 'chip' | 'deficiencies'>('5day');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mouseY, setMouseY] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const volCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const subCanvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!stock) return null;

  const candles = stock.candles || [];
  const indicators = stock.indicators;
  const isUp = (stock.priceChange ?? 0) >= 0;
  const yahooUrl = `https://tw.stock.yahoo.com/quote/${stock.code}.TW`;
  const evalInfo = stock.rightSideEvaluation;
  const valInfo = stock.valuation;
  const levels = stock.levels;
  const structural = levels?.structuralAnalysis;

  const riskAssessment =
    stock.timeframeRiskAssessment ||
    stock.rightSideEvaluation?.timeframeRiskAssessment ||
    (candles.length >= 5
      ? calculateTimeframeRiskAssessment(
          candles,
          stock.indicators || {
            ma5: [], ma10: [], ma20: [], ma60: [], volMa5: [], volMa20: [], volMa60: [],
            bias20: [], bias60: [], ema12: [], ema26: [], dif: [], macdSignal: [], macdHist: [],
            ppoLine: [], ppoSignal: [], ppoHist: [], k: [], d: [], rsv: [], rsi: [],
            bollingerUpper: [], bollingerMiddle: [], bollingerLower: [], bollingerPercentB: []
          },
          levels,
          stock.close,
          stock.priceChangePercent ?? 0,
          stock.volumeRatio5d ?? 1.0,
          stock.volumeRatio20d ?? 1.0,
          stock.volumeRatio60d ?? 1.0,
          0,
          stock.ma5,
          stock.ma10,
          stock.ma20,
          stock.ma60,
          stock.bias20,
          stock.rsi,
          stock.k,
          stock.d,
          stock.ppo,
          stock.ppoSignal,
          evalInfo?.status || 'CONSOLIDATION'
        )
      : undefined);

  // Selected bar data (defaults to the latest candle if not hovering)
  const currentIdx = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candles.length
    ? hoverIndex
    : candles.length - 1;

  const currentCandle = candles[currentIdx] || null;
  const prevCandle = currentIdx > 0 ? candles[currentIdx - 1] : null;

  const curPrice = currentCandle?.close ?? stock.close;
  const curOpen = currentCandle?.open ?? stock.close;
  const curHigh = currentCandle?.high ?? stock.close;
  const curLow = currentCandle?.low ?? stock.close;
  const curVol = currentCandle?.volume ?? stock.volume;
  const curDate = currentCandle?.time ?? '';

  const curChange = prevCandle ? curPrice - prevCandle.close : (currentCandle ? curPrice - curOpen : (stock.priceChange ?? 0));
  const curChangePct = prevCandle && prevCandle.close > 0
    ? (curChange / prevCandle.close) * 100
    : (stock.priceChangePercent ?? 0);
  const isCurUp = curChange >= 0;

  const curMa5 = indicators?.ma5?.[currentIdx];
  const curMa10 = indicators?.ma10?.[currentIdx];
  const curMa20 = indicators?.ma20?.[currentIdx];
  const curMa60 = indicators?.ma60?.[currentIdx];

  const curVolMa5 = indicators?.volMa5?.[currentIdx];
  const curVolMa20 = indicators?.volMa20?.[currentIdx];
  const curVolMa60 = indicators?.volMa60?.[currentIdx];

  const curVolRatio5 = curVolMa5 && curVolMa5 > 0 ? curVol / curVolMa5 : (stock.volumeRatio5d ?? 1);
  const curVolRatio20 = curVolMa20 && curVolMa20 > 0 ? curVol / curVolMa20 : (stock.volumeRatio20d ?? 1);

  const curPpo = indicators?.ppoLine?.[currentIdx] ?? stock.ppo;
  const curPpoSig = indicators?.ppoSignal?.[currentIdx] ?? stock.ppoSignal;
  const curPpoHist = indicators?.ppoHist?.[currentIdx] ?? stock.ppoHist;
  const curK = indicators?.k?.[currentIdx] ?? stock.k;
  const curD = indicators?.d?.[currentIdx] ?? stock.d;
  const curRsi = indicators?.rsi?.[currentIdx] ?? stock.rsi;
  const curBias20 = curMa20 ? ((curPrice - curMa20) / curMa20) * 100 : stock.bias20;

  const rightPad = 96;

  // Handler for mouse movement over any of the chart canvases
  const handleChartMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const chartWidth = rect.width - rightPad;

      if (clientX < 0) {
        setHoverIndex(0);
      } else if (clientX > chartWidth) {
        setHoverIndex(candles.length - 1);
      } else {
        const step = chartWidth / candles.length;
        const idx = Math.floor(clientX / step);
        setHoverIndex(Math.max(0, Math.min(candles.length - 1, idx)));
      }
      setMouseY(clientY);
    },
    [candles.length, rightPad]
  );

  const handleChartMouseLeave = useCallback(() => {
    setHoverIndex(null);
    setMouseY(null);
  }, []);

  // Touch handlers for mobile / tablet gestures
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 0) return;
      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches[0].clientX - rect.left;
      const clientY = e.touches[0].clientY - rect.top;
      const chartWidth = rect.width - rightPad;

      if (clientX < 0) {
        setHoverIndex(0);
      } else if (clientX > chartWidth) {
        setHoverIndex(candles.length - 1);
      } else {
        const step = chartWidth / candles.length;
        const idx = Math.floor(clientX / step);
        setHoverIndex(Math.max(0, Math.min(candles.length - 1, idx)));
      }
      setMouseY(clientY);
    },
    [candles.length, rightPad]
  );

  // -------------------------------------------------------------
  // 1. RENDER MAIN K-LINE + MOVING AVERAGES + SHORT/MID-LONG S&R + CROSSHAIR
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 800;
    const height = 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const topPad = 25;
    const bottomPad = 25;
    const chartHeight = height - topPad - bottomPad;
    const chartWidth = width - rightPad;

    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);

    let minPrice = Math.min(...lows);
    let maxPrice = Math.max(...highs);

    if (levels?.shortSupport && levels.shortSupport > 0) minPrice = Math.min(minPrice, levels.shortSupport * 0.985);
    if (levels?.shortResistance && levels.shortResistance > 0) maxPrice = Math.max(maxPrice, levels.shortResistance * 1.015);
    if (levels?.midTermSupport && levels.midTermSupport > 0) minPrice = Math.min(minPrice, levels.midTermSupport * 0.98);
    if (levels?.midTermResistance && levels.midTermResistance > 0) maxPrice = Math.max(maxPrice, levels.midTermResistance * 1.02);

    const priceRange = maxPrice - minPrice || 1;
    const getY = (p: number) => topPad + chartHeight - ((p - minPrice) / priceRange) * chartHeight;
    const getPriceFromY = (y: number) => minPrice + ((topPad + chartHeight - y) / chartHeight) * priceRange;

    const count = candles.length;
    const candleWidth = Math.max(3.5, (chartWidth / count) * 0.65);
    const step = chartWidth / count;

    // Grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    for (let i = 0; i <= 4; i++) {
      const p = minPrice + (priceRange / 4) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`NT$ ${p.toFixed(1)}`, chartWidth + 6, y + 3);
    }

    // -------------------------------------------------------------
    // DRAW SHORT-TERM & MID-TERM (1-MONTH) SUPPORT & RESISTANCE LINES
    // -------------------------------------------------------------
    // Short Resistance (Rose dashed)
    if (levels?.shortResistance) {
      const resY = getY(levels.shortResistance);
      ctx.strokeStyle = '#E11D48';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, resY);
      ctx.lineTo(chartWidth, resY);
      ctx.stroke();

      ctx.fillStyle = '#E11D48';
      ctx.font = 'bold 9.5px sans-serif';
      const starStr = '★'.repeat(levels.shortResistanceStars || 1);
      const labelText = `短壓 ${levels.shortResistance.toFixed(1)} ${starStr}`;
      ctx.fillText(labelText, chartWidth + 6, resY - 2);
    }

    // Mid-Term (1-Month) Resistance (Dark Crimson)
    const midRes = levels?.midTermResistance || levels?.midLongResistance;
    if (midRes && midRes !== levels?.shortResistance) {
      const mlResY = getY(midRes);
      ctx.strokeStyle = '#BE123C';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(0, mlResY);
      ctx.lineTo(chartWidth, mlResY);
      ctx.stroke();

      ctx.fillStyle = '#BE123C';
      ctx.font = 'bold 9.5px sans-serif';
      const starStr = '★'.repeat(levels?.midTermResistanceStars || 1);
      const labelText = `月壓 ${midRes.toFixed(1)} ${starStr}`;
      ctx.fillText(labelText, chartWidth + 6, mlResY - 2);
    }

    // Short Support (Emerald dashed)
    if (levels?.shortSupport) {
      const supY = getY(levels.shortSupport);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, supY);
      ctx.lineTo(chartWidth, supY);
      ctx.stroke();

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 9.5px sans-serif';
      const starStr = '★'.repeat(levels.shortSupportStars || 1);
      ctx.fillText(`短支 ${levels.shortSupport.toFixed(1)} ${starStr}`, chartWidth + 6, supY + 10);
    }

    // Mid-Term (1-Month) Support (Teal line - Month Line MA20 / 1M low)
    const midSup = levels?.midTermSupport || levels?.midLongSupport;
    if (midSup && midSup !== levels?.shortSupport) {
      const mlSupY = getY(midSup);
      ctx.strokeStyle = '#0F766E';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(0, mlSupY);
      ctx.lineTo(chartWidth, mlSupY);
      ctx.stroke();

      ctx.fillStyle = '#0F766E';
      ctx.font = 'bold 9.5px sans-serif';
      const starStr = '★'.repeat(levels?.midTermSupportStars || 1);
      ctx.fillText(`月支 ${midSup.toFixed(1)} ${starStr}`, chartWidth + 6, mlSupY + 10);
    }

    ctx.setLineDash([]); // Reset line dash

    // Draw Candlesticks
    for (let i = 0; i < count; i++) {
      const c = candles[i];
      const x = i * step + step / 2;
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      const isCandleUp = c.close >= c.open;
      const color = isCandleUp ? '#DC2626' : '#16A34A';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    }

    // Draw Moving Averages
    const drawLine = (data: (number | null)[], color: string, width = 1.5) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < count; i++) {
        const val = data[i];
        if (val !== null && val !== undefined) {
          const x = i * step + step / 2;
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    };

    if (indicators) {
      if (indicators.ma5) drawLine(indicators.ma5, '#D97706', 1.5); // Amber MA5
      if (indicators.ma10) drawLine(indicators.ma10, '#2563EB', 1.5); // Blue MA10
      if (indicators.ma20) drawLine(indicators.ma20, '#7C3AED', 1.5); // Purple MA20
      if (indicators.ma60) drawLine(indicators.ma60, '#059669', 1.5); // Emerald MA60
    }

    // Draw Bollinger Bands if selected
    if (activeSubTab === 'bollinger' && indicators) {
      if (indicators.bollingerUpper) drawLine(indicators.bollingerUpper, 'rgba(2, 132, 199, 0.7)', 1.2);
      if (indicators.bollingerLower) drawLine(indicators.bollingerLower, 'rgba(2, 132, 199, 0.7)', 1.2);
    }

    // -------------------------------------------------------------
    // DRAW INTERACTIVE HOVER CROSSHAIR
    // -------------------------------------------------------------
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < count) {
      const hCandle = candles[hoverIndex];
      const hX = hoverIndex * step + step / 2;

      // Vertical crosshair
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.65)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hX, 0);
      ctx.lineTo(hX, height);
      ctx.stroke();

      // Highlight active candle dot on close price
      const closeY = getY(hCandle.close);
      ctx.fillStyle = hCandle.close >= hCandle.open ? '#DC2626' : '#16A34A';
      ctx.beginPath();
      ctx.arc(hX, closeY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Horizontal crosshair at mouse Y or candle close
      const activeY = mouseY !== null && mouseY >= topPad && mouseY <= topPad + chartHeight ? mouseY : closeY;
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.65)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, activeY);
      ctx.lineTo(chartWidth, activeY);
      ctx.stroke();

      ctx.setLineDash([]);

      // Price badge on right axis
      const hoveredPrice = getPriceFromY(activeY);
      const badgeY = Math.max(10, Math.min(height - 10, activeY));
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(chartWidth + 2, badgeY - 10, 92, 20, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`NT$ ${hoveredPrice.toFixed(1)}`, chartWidth + 6, badgeY + 3.5);

      // Date badge on X-axis
      const dateText = hCandle.time;
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      const dateBadgeX = Math.max(35, Math.min(chartWidth - 35, hX));
      ctx.roundRect(dateBadgeX - 35, height - 20, 70, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dateText, dateBadgeX, height - 7);
    }
  }, [candles, indicators, activeSubTab, levels, hoverIndex, mouseY, rightPad, modalTab]);

  // -------------------------------------------------------------
  // 2. RENDER VOLUME & VOL MA5 & VOL MA20 & VOL MA60 CANVAS + CROSSHAIR
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = volCanvasRef.current;
    if (!canvas || candles.length === 0 || !indicators) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 800;
    const height = 90;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const topPad = 10;
    const bottomPad = 10;
    const chartHeight = height - topPad - bottomPad;
    const chartWidth = width - rightPad;
    const count = candles.length;
    const step = chartWidth / count;

    const volumes = candles.map((c) => c.volume);
    const maxVol = Math.max(...volumes, ...(indicators.volMa60.filter((v): v is number => v !== null) || [1])) || 1;

    const getY = (v: number) => topPad + chartHeight - (v / maxVol) * chartHeight;
    const barWidth = Math.max(2.5, (chartWidth / count) * 0.65);

    // Draw Volume Bars (Red if Close >= Open, Green if Close < Open)
    for (let i = 0; i < count; i++) {
      const c = candles[i];
      const isUp = c.close >= c.open;
      const x = i * step + step / 2;
      const barTop = getY(c.volume);
      const barH = Math.max(1, height - bottomPad - barTop);

      ctx.fillStyle = isUp ? 'rgba(220, 38, 38, 0.75)' : 'rgba(22, 163, 74, 0.75)';
      ctx.fillRect(x - barWidth / 2, barTop, barWidth, barH);
    }

    // Draw Vol MA5 (Amber line)
    const drawVolLine = (data: (number | null)[], color: string, width = 1.3) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < count; i++) {
        const val = data[i];
        if (val !== null && val !== undefined) {
          const x = i * step + step / 2;
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    };

    if (indicators.volMa5) drawVolLine(indicators.volMa5, '#F59E0B', 1.5); // 5-day Vol MA
    if (indicators.volMa20) drawVolLine(indicators.volMa20, '#8B5CF6', 1.5); // 20-day Vol MA (1-Month MA)
    if (indicators.volMa60) drawVolLine(indicators.volMa60, '#38BDF8', 1.2); // 60-day Vol MA

    // Vol label
    ctx.fillStyle = '#64748B';
    ctx.font = '9.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${(maxVol / 1000).toFixed(0)}k`, chartWidth + 6, topPad + 10);

    // Crosshair on Volume Chart
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < count) {
      const hX = hoverIndex * step + step / 2;
      const hVol = candles[hoverIndex].volume;

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.65)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hX, 0);
      ctx.lineTo(hX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Volume badge
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(chartWidth + 2, Math.max(5, Math.min(height - 22, getY(hVol) - 9)), 92, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${(hVol / 1000).toFixed(1)}k`, chartWidth + 6, Math.max(5, Math.min(height - 22, getY(hVol) - 9)) + 12.5);
    }
  }, [candles, indicators, hoverIndex, rightPad, modalTab]);

  // -------------------------------------------------------------
  // 3. RENDER SUB-INDICATOR CANVAS (PPO with Signal & Hist, SKDJ, RSI, Bollinger) + CROSSHAIR
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = subCanvasRef.current;
    if (!canvas || candles.length === 0 || !indicators) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 800;
    const height = 115;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const topPad = 12;
    const bottomPad = 12;
    const chartHeight = height - topPad - bottomPad;
    const chartWidth = width - rightPad;
    const count = candles.length;
    const step = chartWidth / count;

    if (activeSubTab === 'ppo') {
      const ppoVals = indicators.ppoLine.filter((v): v is number => v !== null);
      const sigVals = indicators.ppoSignal.filter((v): v is number => v !== null);
      const histVals = indicators.ppoHist.filter((v): v is number => v !== null);
      const allVals = [...ppoVals, ...sigVals, ...histVals, 0];
      const minV = Math.min(...allVals);
      const maxV = Math.max(...allVals);
      const range = maxV - minV || 1;
      const getY = (v: number) => topPad + chartHeight - ((v - minV) / range) * chartHeight;

      // Zero line
      const zeroY = getY(0);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(chartWidth, zeroY);
      ctx.stroke();

      // PPO Histogram bars
      const barWidth = Math.max(2.5, step * 0.6);
      for (let i = 0; i < count; i++) {
        const hist = indicators.ppoHist[i];
        if (hist !== null && hist !== undefined) {
          const x = i * step + step / 2;
          const y = getY(hist);
          ctx.fillStyle = hist >= 0 ? '#DC2626' : '#16A34A';
          ctx.fillRect(x - barWidth / 2, Math.min(zeroY, y), barWidth, Math.max(1, Math.abs(y - zeroY)));
        }
      }

      // PPO Signal Line (9 EMA - Amber dashed)
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.3;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      let startedSig = false;
      for (let i = 0; i < count; i++) {
        const val = indicators.ppoSignal[i];
        if (val !== null && val !== undefined) {
          const x = i * step + step / 2;
          const y = getY(val);
          if (!startedSig) {
            ctx.moveTo(x, y);
            startedSig = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // PPO Fast Line (Blue solid)
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([]);
      ctx.beginPath();
      let startedPpo = false;
      for (let i = 0; i < count; i++) {
        const val = indicators.ppoLine[i];
        if (val !== null && val !== undefined) {
          const x = i * step + step / 2;
          const y = getY(val);
          if (!startedPpo) {
            ctx.moveTo(x, y);
            startedPpo = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Value label
      ctx.fillStyle = '#2563EB';
      ctx.font = '9.5px monospace';
      ctx.fillText(`快 ${curPpo.toFixed(2)}%`, chartWidth + 4, topPad + 12);
      ctx.fillStyle = '#D97706';
      ctx.fillText(`慢 ${curPpoSig.toFixed(2)}%`, chartWidth + 4, topPad + 25);
    } else if (activeSubTab === 'skdj') {
      const getY = (v: number) => topPad + chartHeight - (v / 100) * chartHeight;

      [20, 50, 80].forEach((lvl) => {
        const y = getY(lvl);
        ctx.strokeStyle = lvl === 50 ? '#CBD5E1' : '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
      });

      // K line (Amber)
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const val = indicators.k[i] ?? 50;
        const x = i * step + step / 2;
        const y = getY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // D line (Blue)
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const val = indicators.d[i] ?? 50;
        const x = i * step + step / 2;
        const y = getY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#D97706';
      ctx.font = '9.5px monospace';
      ctx.fillText(`K ${curK.toFixed(1)}`, chartWidth + 4, topPad + 12);
      ctx.fillStyle = '#2563EB';
      ctx.fillText(`D ${curD.toFixed(1)}`, chartWidth + 4, topPad + 25);
    } else if (activeSubTab === 'rsi') {
      const getY = (v: number) => topPad + chartHeight - (v / 100) * chartHeight;

      [30, 50, 70].forEach((lvl) => {
        const y = getY(lvl);
        ctx.strokeStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
      });

      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const val = indicators.rsi[i] ?? 50;
        const x = i * step + step / 2;
        const y = getY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#7C3AED';
      ctx.font = '9.5px monospace';
      ctx.fillText(`RSI ${curRsi.toFixed(1)}`, chartWidth + 4, topPad + 12);
    }

    // Sub-indicator Crosshair
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < count) {
      const hX = hoverIndex * step + step / 2;
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.65)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hX, 0);
      ctx.lineTo(hX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [candles, indicators, activeSubTab, stock, hoverIndex, curPpo, curPpoSig, curK, curD, curRsi, rightPad, modalTab]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-lg font-black text-slate-900">{stock.code}</span>
                <h3 className="text-base font-bold text-slate-900">{stock.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
                  {stock.industry || '上市個股'}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-bold border ${
                    valInfo?.colorClass || 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {valInfo?.label || '合理區間'}
                </span>
                {stock.ppoCrossStatus === 'GOLDEN_CROSS' ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1">
                    <Activity className="w-3 h-3" /> PPO多頭金叉 (快&gt;慢)
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> PPO空頭死叉 (快&lt;慢)
                  </span>
                )}

                {/* 5大結構性優化徽章 */}
                {stock.ma5DeductionStatus === 'DEDUCTING_LOW' ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold flex items-center gap-1">
                    🚀 5MA扣低助漲
                  </span>
                ) : stock.ma5DeductionStatus === 'DEDUCTING_HIGH' ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1">
                    ⚠️ 5MA扣高蓋頭
                  </span>
                ) : null}

                {stock.riskGrade && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold border flex items-center gap-1 ${
                      stock.riskGrade === 'A'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : stock.riskGrade === 'B'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : stock.riskGrade === 'C'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}
                  >
                    🛡️ 風控{stock.riskGrade}級
                  </span>
                )}

                {stock.institutionalChip && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${
                      stock.institutionalChip.trustNetBuy >= 200
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : stock.institutionalChip.totalNetBuy > 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Landmark className="w-3 h-3" />
                    {stock.institutionalChip.chipGradeLabel}
                  </span>
                )}

                {stock.isDayTradeShakeoutRisk && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold">
                    🛑 隔日沖洗盤高危
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs mt-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-base font-black text-slate-900">
                    NT$ {stock.close.toFixed(2)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    證交所即時連線
                  </span>
                </div>
                <span
                  className={`font-mono font-bold flex items-center gap-0.5 ${
                    isUp ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {isUp ? '+' : ''}
                  {(stock.priceChangePercent ?? 0).toFixed(2)}%
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">
                  PE: <strong className="text-slate-900">{stock.pe > 0 ? stock.pe.toFixed(1) : '-'}</strong>
                </span>
                <span className="text-slate-600">
                  PB: <strong className="text-slate-900">{stock.pb > 0 ? stock.pb.toFixed(2) : '-'}</strong>
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">
                  5日量比: <strong className="font-mono text-slate-900">{stock.volumeRatio5d ? `${stock.volumeRatio5d.toFixed(2)}x` : '-'}</strong>
                </span>
                <span className="text-slate-600">
                  1個月量比: <strong className="font-mono text-slate-900">{stock.volumeRatio20d ? `${stock.volumeRatio20d.toFixed(2)}x` : (stock.volumeRatio5d ? `${stock.volumeRatio5d.toFixed(2)}x` : '-')}</strong>
                </span>
                {stock.syncedAt && (
                  <>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      同步: {stock.syncedAt}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshStock && (
              <button
                onClick={() => onRefreshStock(stock.code)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="重新整理此檔即時行情"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">即時更新</span>
              </button>
            )}
            <a
              href={yahooUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Yahoo 奇摩即時盤</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Top Section Navigation Bar */}
        <div className="px-4 sm:px-6 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <button
              onClick={() => setModalTab('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                modalTab === 'chart'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>📈 即時K線圖表 (游標查價)</span>
            </button>

            <button
              onClick={() => setModalTab('strategy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                modalTab === 'strategy'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-300" />
              <span>🎯 雙軌策略行動方案 (上看/止損)</span>
            </button>

            <button
              onClick={() => setModalTab('risk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                modalTab === 'risk'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>⚠️ 5日/10日風控與均線扣抵</span>
              {riskAssessment?.fiveDayRisks?.keyAlert && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setModalTab('chip')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                modalTab === 'chip'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-rose-300" />
              <span>🏛️ 三大法人籌碼與融資</span>
            </button>

            <button
              onClick={() => setModalTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                modalTab === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>📑 展開全部深度報告</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-500 shrink-0">
            <span>現價: <strong className="text-slate-900">NT$ {stock.close.toFixed(2)}</strong></span>
            <span>({isUp ? '+' : ''}{(stock.priceChangePercent ?? 0).toFixed(2)}%)</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Strict Death Cross Warning Banner */}
          {stock.hasSubsequentDeathCross && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex items-start gap-2.5 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs text-rose-800">
                <span className="font-bold text-sm block">⚠️ 偵測到「金叉後二次死叉」防誘空警示</span>
                <p>
                  此檔股票雖然在過去 7 天內曾出現金叉反彈信號，但隨後已<strong>再次死亡交叉 (快線跌破慢線)</strong>。系統已自動將其從左側買進推薦中排除，以防買入後承受破底死叉風險！
                </p>
              </div>
            </div>
          )}

          {/* TOP SECTION: K-LINE CANDLESTICK CHART & REAL-TIME HOVER HUD */}
          {(modalTab === 'chart' || modalTab === 'all') && (
            <div className="space-y-3">
              {/* DYNAMIC HOVER PARAMETER INSPECTION HUD (指到哪裡即時顯示日期與各項指標) */}
              <div className="bg-slate-900 text-white rounded-xl p-3 shadow-md border border-slate-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-slate-700/80 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-sky-400 font-bold">
                      <Crosshair className="w-4 h-4 text-sky-400 animate-pulse" />
                      即時游標查價器 (指到哪顯示哪)
                    </span>
                    <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      {curDate || '最新資料日'}
                    </span>
                    {hoverIndex !== null && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({candles.length - 1 - hoverIndex === 0 ? '最新收盤日' : `${candles.length - 1 - hoverIndex} 日前`})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap">
                    <span className="text-slate-300">
                      開: <strong className="text-white">{curOpen.toFixed(1)}</strong>
                    </span>
                    <span className="text-slate-300">
                      高: <strong className="text-white">{curHigh.toFixed(1)}</strong>
                    </span>
                    <span className="text-slate-300">
                      低: <strong className="text-white">{curLow.toFixed(1)}</strong>
                    </span>
                    <span className="text-slate-300">
                      收: <strong className={`font-bold ${isCurUp ? 'text-rose-400' : 'text-emerald-400'}`}>{curPrice.toFixed(1)}</strong>
                    </span>
                    <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${isCurUp ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'}`}>
                      {isCurUp ? '+' : ''}{curChange.toFixed(1)} ({isCurUp ? '+' : ''}{curChangePct.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Dynamic Real-Time Parameter Values */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-amber-400 font-sans block text-[10px]">MA5 (5日線)</span>
                    <span className="font-bold text-amber-300">{curMa5 ? curMa5.toFixed(1) : '-'}</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-blue-400 font-sans block text-[10px]">MA10 (10日線)</span>
                    <span className="font-bold text-blue-300">{curMa10 ? curMa10.toFixed(1) : '-'}</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-purple-400 font-sans block text-[10px]">MA20 (月生命線)</span>
                    <span className="font-bold text-purple-300">{curMa20 ? curMa20.toFixed(1) : '-'}</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-emerald-400 font-sans block text-[10px]">MA60 (季線)</span>
                    <span className="font-bold text-emerald-300">{curMa60 ? curMa60.toFixed(1) : '-'}</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-sky-400 font-sans block text-[10px]">當日量 / 5日均量</span>
                    <span className="font-bold text-sky-200">
                      {(curVol / 1000).toFixed(0)}k / {curVolMa5 ? (curVolMa5 / 1000).toFixed(0) : '-'}k
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-indigo-400 font-sans block text-[10px]">5日量比 / 月量比</span>
                    <span className="font-bold text-indigo-200">
                      {curVolRatio5 ? `${curVolRatio5.toFixed(2)}x` : '-'} / {curVolRatio20 ? `${curVolRatio20.toFixed(2)}x` : '-'}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-rose-400 font-sans block text-[10px]">PPO 快線 / 慢線</span>
                    <span className="font-bold text-rose-300">
                      {curPpo > 0 ? `+${curPpo.toFixed(2)}` : curPpo.toFixed(2)}% / {curPpoSig.toFixed(2)}%
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-cyan-400 font-sans block text-[10px]">PPO 柱狀差值</span>
                    <span className={`font-bold ${curPpoHist >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {curPpoHist > 0 ? `+${curPpoHist.toFixed(2)}` : curPpoHist.toFixed(2)}%
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-yellow-400 font-sans block text-[10px]">SKDJ (K / D)</span>
                    <span className="font-bold text-yellow-300">
                      {curK.toFixed(1)} / {curD.toFixed(1)}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-purple-400 font-sans block text-[10px]">14D RSI 強弱</span>
                    <span className="font-bold text-purple-300">{curRsi.toFixed(1)}</span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-teal-400 font-sans block text-[10px]">20日乖離率 (Bias20)</span>
                    <span className={`font-bold ${curBias20 >= 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {curBias20 >= 0 ? `+${curBias20.toFixed(2)}%` : `${curBias20.toFixed(2)}%`}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                    <span className="text-slate-400 font-sans block text-[10px]">中期月線狀態</span>
                    <span className={`font-bold text-[10px] ${curMa20 && curPrice >= curMa20 ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {curMa20 && curPrice >= curMa20 ? '穩站月線之上' : '跌破月線承壓'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Main K-Line Candlestick Chart */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs mb-2 text-slate-600 flex-wrap gap-2">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-700" />
                      日 K 線圖 (游標滑動查價)
                    </span>
                    <span className="text-amber-600 font-semibold">MA5: NT${stock.ma5.toFixed(1)}</span>
                    <span className="text-blue-600 font-semibold">MA10: NT${stock.ma10.toFixed(1)}</span>
                    <span className="text-purple-600 font-semibold">MA20(月線): NT${stock.ma20.toFixed(1)}</span>
                    <span className="text-emerald-700 font-semibold">MA60: NT${stock.ma60.toFixed(1)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 font-mono">
                    <span className="text-rose-600">-- 短壓: NT${levels?.shortResistance?.toFixed(1)}</span>
                    <span className="text-rose-900">·· 中期壓(1M): NT${(levels?.midTermResistance || levels?.midLongResistance)?.toFixed(1)}</span>
                    <span className="text-emerald-600">-- 短支: NT${levels?.shortSupport?.toFixed(1)}</span>
                    <span className="text-teal-800">·· 中期支(月線): NT${(levels?.midTermSupport || levels?.midLongSupport)?.toFixed(1)}</span>
                  </div>
                </div>
                <div className="w-full h-[280px] relative cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={handleChartMouseLeave}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleChartMouseLeave}
                  />
                </div>
              </div>

              {/* 2. Volume Chart with Vol MA5 & Vol MA20 & Vol MA60 & Volume Ratio */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 flex-wrap gap-1">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <BarChart2 className="w-3.5 h-3.5 text-slate-700" />
                      成交量與均量線 (Volume)
                    </span>
                    <span className="text-amber-600 font-semibold">
                      5日均量: {stock.avgVolume5d?.toLocaleString() || '-'}
                    </span>
                    <span className="text-purple-600 font-semibold">
                      20日(月)均量: {stock.avgVolume20d?.toLocaleString() || '-'}
                    </span>
                    <span className="text-sky-600 font-semibold">
                      60日均量: {stock.avgVolume60d?.toLocaleString() || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-700">
                      5日量比: <strong className="text-blue-700 font-bold">{stock.volumeRatio5d ? `${stock.volumeRatio5d.toFixed(2)}x` : '-'}</strong>
                    </span>
                    <span className="px-2 py-0.2 rounded bg-white border border-slate-200 text-slate-800 font-semibold text-[10px]">
                      {evalInfo?.volumeStatusText}
                    </span>
                  </div>
                </div>
                <div className="w-full h-[90px] relative cursor-crosshair">
                  <canvas
                    ref={volCanvasRef}
                    className="w-full h-full"
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={handleChartMouseLeave}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleChartMouseLeave}
                  />
                </div>
              </div>

              {/* 3. Sub Indicators Tabs (PPO with Signal & Hist, SKDJ, RSI, Bollinger) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setActiveSubTab('ppo')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        activeSubTab === 'ppo'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      PPO 價格震盪百分比 (快線: {stock.ppo > 0 ? `+${stock.ppo.toFixed(2)}` : stock.ppo.toFixed(2)}% | 訊號慢線: {stock.ppoSignal.toFixed(2)}%)
                    </button>
                    <button
                      onClick={() => setActiveSubTab('skdj')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition cursor-pointer ${
                        activeSubTab === 'skdj'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                      }`}
                    >
                      SKDJ 慢速隨機 (K:{stock.k.toFixed(1)} / D:{stock.d.toFixed(1)})
                    </button>
                    <button
                      onClick={() => setActiveSubTab('rsi')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition cursor-pointer ${
                        activeSubTab === 'rsi'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                      }`}
                    >
                      RSI 強弱 (14D:{stock.rsi.toFixed(1)})
                    </button>
                  </div>

                  {activeSubTab === 'ppo' && (
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                      <span className="text-blue-600 font-bold">— 藍色實線: PPO快線</span>
                      <span className="text-amber-600 font-bold">··· 橘色虛線: 9日訊號慢線</span>
                      <span className="text-rose-600 font-bold">柱體: 差值({stock.ppoHist > 0 ? `+${stock.ppoHist.toFixed(2)}` : stock.ppoHist.toFixed(2)}%)</span>
                    </div>
                  )}
                </div>

                <div className="w-full h-[115px] relative cursor-crosshair">
                  <canvas
                    ref={subCanvasRef}
                    className="w-full h-full"
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={handleChartMouseLeave}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleChartMouseLeave}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Diagnostic Banner: Quant Volume-Price Momentum & Right-Side Diagnosis */}
          {(() => {
            const vp = evalInfo?.volumePriceAnalysis;
            const cons = evalInfo?.conservativePlan;
            const agg = evalInfo?.aggressivePlan;

            return (
              <div className="space-y-3">
                {/* 1. Quantitative Volume-Price Momentum Banner */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    evalInfo?.status === 'HIGH_CHASE_RISK'
                      ? 'bg-rose-50 border-rose-200'
                      : evalInfo?.status === 'MAIN_WAVE'
                      ? 'bg-emerald-50 border-emerald-200'
                      : evalInfo?.status === 'PULLBACK_BUY'
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {evalInfo?.status === 'HIGH_CHASE_RISK' ? (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    ) : evalInfo?.status === 'MAIN_WAVE' ? (
                      <Flame className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : evalInfo?.status === 'PULLBACK_BUY' ? (
                      <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    ) : (
                      <Activity className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-xs flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-bold text-sm ${
                              evalInfo?.status === 'HIGH_CHASE_RISK'
                                ? 'text-rose-900'
                                : evalInfo?.status === 'MAIN_WAVE'
                                ? 'text-emerald-900'
                                : evalInfo?.status === 'PULLBACK_BUY'
                                ? 'text-teal-900'
                                : 'text-slate-900'
                            }`}
                          >
                            量價結構評估：{vp?.patternName || evalInfo?.badgeText}
                          </span>
                          {vp && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                vp.volumeGrade === 'A+' || vp.volumeGrade === 'A'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : vp.volumeGrade === 'B'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              量能評級: {vp.volumeGrade} (健康分: {vp.volumeHealthScore}/100)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span className="px-2 py-0.2 rounded bg-white font-mono text-slate-700 border border-slate-200">
                            5日量比: {((evalInfo?.volumeRatioTo5d ?? 1) * 100).toFixed(0)}%
                          </span>
                          <span className="px-2 py-0.2 rounded bg-white font-mono text-slate-700 border border-slate-200">
                            20日量比: {((evalInfo?.volumeRatioTo20d ?? 1) * 100).toFixed(0)}%
                          </span>
                          <span className="px-2 py-0.2 rounded bg-white font-mono text-slate-700 border border-slate-200">
                            60日量比: {((evalInfo?.volumeRatioTo60d ?? 1) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {vp?.institutionalIntent && (
                        <div className="text-slate-800 text-[11px] font-medium bg-white/70 px-2 py-1 rounded border border-slate-200/50 flex items-center justify-between flex-wrap gap-1">
                          <span>
                            🎯 <strong>主力資金意圖：</strong>
                            {vp.institutionalIntent}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            資金流態: <strong>{vp.flowState}</strong>
                          </span>
                        </div>
                      )}

                      <p className="text-slate-700 leading-relaxed font-sans pt-0.5">
                        {vp?.analysisSummary || evalInfo?.analysis}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. DUAL-TRACK QUANT STRATEGY ACTION PLANS (穩健型 vs 超額收益進攻型) */}
                {(cons || agg) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-indigo-600" />
                        資深量化操盤建議：雙軌操作策略方案 (上看目標價 & 嚴格止損價位)
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        基準現價: <strong>NT$ {stock.close.toFixed(2)}</strong> | 依台股升降單位精準對齊
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Left: Conservative Plan (穩健型) */}
                      {cons && (
                        <div
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition relative ${
                            cons.isRecommended
                              ? 'bg-gradient-to-b from-blue-50/80 to-white border-blue-300 shadow-xs ring-1 ring-blue-400/30'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="space-y-2.5">
                            {/* Card Header */}
                            <div className="flex items-center justify-between flex-wrap gap-1 border-b border-slate-200/70 pb-2">
                              <div className="flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-blue-700" />
                                <span className="font-bold text-slate-900 text-xs">
                                  {cons.title}
                                </span>
                              </div>
                              {cons.isRecommended && (
                                <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                                  ★ 當前首選方案
                                </span>
                              )}
                            </div>

                            {/* Philosophy */}
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {cons.philosophy}
                            </p>

                            {/* Entry Trigger */}
                            <div className="bg-white p-2 rounded-lg border border-blue-100 text-xs space-y-1">
                              <div className="text-[11px] font-bold text-blue-900 flex items-center justify-between">
                                <span>🎯 建議進場時機與觸發條件</span>
                                <span className="font-mono text-blue-700">
                                  參考進場錨定: NT$ {cons.entryPriceSuggestion.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-700">
                                {cons.entryTrigger}
                              </div>
                            </div>

                            {/* Targets & Stop Loss Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {/* Target 1 */}
                              <div className="bg-rose-50/70 border border-rose-200 p-2 rounded-lg">
                                <span className="text-[10px] text-rose-800 font-semibold block">
                                  📈 上看第一目標 (短壓)
                                </span>
                                <div className="flex items-baseline justify-between mt-0.5">
                                  <span className="font-mono font-bold text-sm text-rose-700">
                                    NT$ {cons.targetPrice1.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-rose-600 bg-white px-1 rounded border border-rose-200">
                                    +{cons.targetGain1Pct}%
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-500 block truncate mt-0.5" title={cons.targetPrice1Label}>
                                  {cons.targetPrice1Label}
                                </span>
                              </div>

                              {/* Target 2 */}
                              <div className="bg-rose-100/70 border border-rose-300 p-2 rounded-lg">
                                <span className="text-[10px] text-rose-900 font-semibold block">
                                  🚀 上看第二目標 (月壓)
                                </span>
                                <div className="flex items-baseline justify-between mt-0.5">
                                  <span className="font-mono font-bold text-sm text-rose-900">
                                    NT$ {cons.targetPrice2.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-white px-1 rounded border border-rose-300">
                                    +{cons.targetGain2Pct}%
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-600 block truncate mt-0.5" title={cons.targetPrice2Label}>
                                  {cons.targetPrice2Label}
                                </span>
                              </div>

                              {/* Stop Loss */}
                              <div className="bg-emerald-50/70 border border-emerald-200 p-2 rounded-lg col-span-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-emerald-900 font-semibold">
                                    🛑 嚴格止損防守價
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-300">
                                    最大承擔風險: -{cons.stopLossPct}%
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <span className="font-mono font-bold text-sm text-emerald-800">
                                    NT$ {cons.stopLossPrice.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] text-slate-600 font-mono">
                                    ({cons.stopLossLabel})
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Risk/Reward & Position Sizing */}
                            <div className="flex items-center justify-between text-[11px] bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200">
                              <span className="text-slate-700">
                                ⚖️ 期望盈虧比: <strong className="text-slate-900 font-mono text-xs">{cons.riskRewardDisplay}</strong>
                              </span>
                              <span className="text-slate-600 text-[10px]">
                                💼 建議倉位: <strong>{cons.positionSizeSuggestion}</strong>
                              </span>
                            </div>

                            {/* Action Steps Checklist */}
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] font-bold text-slate-700 block">
                                📋 穩健操作執行清單：
                              </span>
                              <ul className="space-y-1 text-[10px] text-slate-600">
                                {cons.actionSteps.map((step, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Right: Aggressive Alpha Plan (超額收益進攻型) */}
                      {agg && (
                        <div
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition relative ${
                            agg.isRecommended
                              ? 'bg-gradient-to-b from-amber-50/80 to-white border-amber-300 shadow-xs ring-1 ring-amber-400/30'
                              : 'bg-slate-50/70 border-slate-200'
                          }`}
                        >
                          <div className="space-y-2.5">
                            {/* Card Header */}
                            <div className="flex items-center justify-between flex-wrap gap-1 border-b border-slate-200/70 pb-2">
                              <div className="flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-amber-600" />
                                <span className="font-bold text-slate-900 text-xs">
                                  {agg.title}
                                </span>
                              </div>
                              {agg.isRecommended && (
                                <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                                  ★ 當前首選方案
                                </span>
                              )}
                            </div>

                            {/* Philosophy */}
                            <p className="text-[11px] text-slate-600 leading-snug">
                              {agg.philosophy}
                            </p>

                            {/* Entry Trigger */}
                            <div className="bg-white p-2 rounded-lg border border-amber-100 text-xs space-y-1">
                              <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
                                <span>🎯 突破進場時機與觸發條件</span>
                                <span className="font-mono text-amber-700">
                                  突破追擊基準: NT$ {agg.entryPriceSuggestion.toFixed(1)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-700">
                                {agg.entryTrigger}
                              </div>
                            </div>

                            {/* Targets & Stop Loss Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {/* Target 1 */}
                              <div className="bg-amber-50/80 border border-amber-200 p-2 rounded-lg">
                                <span className="text-[10px] text-amber-900 font-semibold block">
                                  📈 上看主升目標 1
                                </span>
                                <div className="flex items-baseline justify-between mt-0.5">
                                  <span className="font-mono font-bold text-sm text-amber-800">
                                    NT$ {agg.targetPrice1.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-white px-1 rounded border border-amber-200">
                                    +{agg.targetGain1Pct}%
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-600 block truncate mt-0.5" title={agg.targetPrice1Label}>
                                  {agg.targetPrice1Label}
                                </span>
                              </div>

                              {/* Target 2 */}
                              <div className="bg-rose-100/80 border border-rose-300 p-2 rounded-lg">
                                <span className="text-[10px] text-rose-900 font-semibold block">
                                  🚀 上看終極爆發目標 2
                                </span>
                                <div className="flex items-baseline justify-between mt-0.5">
                                  <span className="font-mono font-bold text-sm text-rose-900">
                                    NT$ {agg.targetPrice2.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-rose-800 bg-white px-1 rounded border border-rose-300">
                                    +{agg.targetGain2Pct}%
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-700 block truncate mt-0.5" title={agg.targetPrice2Label}>
                                  {agg.targetPrice2Label}
                                </span>
                              </div>

                              {/* Stop Loss */}
                              <div className="bg-slate-100/90 border border-slate-300 p-2 rounded-lg col-span-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-800 font-semibold">
                                    🛑 動態移動停利/停損防守
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-white px-1.5 py-0.2 rounded border border-rose-200">
                                    防守停損: -{agg.stopLossPct}%
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <span className="font-mono font-bold text-sm text-slate-900">
                                    NT$ {agg.stopLossPrice.toFixed(1)}
                                  </span>
                                  <span className="text-[10px] text-slate-600 font-mono">
                                    ({agg.stopLossLabel})
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Risk/Reward & Position Sizing */}
                            <div className="flex items-center justify-between text-[11px] bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200">
                              <span className="text-amber-900">
                                ⚖️ 期望超額盈虧比: <strong className="text-amber-950 font-mono text-xs">{agg.riskRewardDisplay}</strong>
                              </span>
                              <span className="text-amber-800 text-[10px]">
                                💼 建議倉位: <strong>{agg.positionSizeSuggestion}</strong>
                              </span>
                            </div>

                            {/* Action Steps Checklist */}
                            <div className="space-y-1 pt-1">
                              <span className="text-[10px] font-bold text-slate-700 block">
                                📋 進攻突破執行清單：
                              </span>
                              <ul className="space-y-1 text-[10px] text-slate-600">
                                {agg.actionSteps.map((step, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 5-Day & 10-Day Timeframe Risk Assessment & MA Deduction Dashboard */}
          {riskAssessment && (
            <div className="bg-slate-900 text-white rounded-xl border border-slate-700/80 shadow-md p-3.5 sm:p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-100">
                        ⚠️ 5日與10日關鍵風險監控與均線扣抵儀表板
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold">
                        Quant Risk Engine
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      量化多空時效維度剖析 · 5MA/10MA/20MA扣抵轉折預警 · 系統現有缺陷與防禦解法
                    </p>
                  </div>
                </div>

                {/* Overall Risk Score Badge */}
                <div className="flex items-center gap-2 font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">綜合量化風險指數</span>
                    <span className="font-bold text-sm text-slate-200">
                      {riskAssessment.overallRiskScore} <span className="text-[10px] text-slate-400">/ 100</span>
                    </span>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                      riskAssessment.riskGrade === 'A'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                        : riskAssessment.riskGrade === 'B'
                        ? 'bg-blue-950/80 text-blue-300 border-blue-700'
                        : riskAssessment.riskGrade === 'C'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                        : 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse'
                    }`}
                  >
                    <span>等級 {riskAssessment.riskGrade}</span>
                    <span className="text-[10px] opacity-80 font-normal hidden sm:inline">({riskAssessment.riskGradeLabel})</span>
                  </div>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-1.5 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setActiveRiskTab('5day')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      activeRiskTab === '5day'
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ 5日極短線風險清單</span>
                    {riskAssessment.fiveDayRisks.keyAlert && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveRiskTab('10day')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      activeRiskTab === '10day'
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-300" />
                    <span>🛡️ 10日波段防守風險</span>
                    {riskAssessment.tenDayRisks.keyAlert && (
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveRiskTab('deduction')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      activeRiskTab === 'deduction'
                        ? 'bg-teal-600 text-white shadow-xs font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-teal-300" />
                    <span>🎯 均線扣抵值預警看板</span>
                  </button>

                  <button
                    onClick={() => setActiveRiskTab('chip')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      activeRiskTab === 'chip'
                        ? 'bg-rose-600 text-white shadow-xs font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5 text-rose-300" />
                    <span>🏛️ 三大法人籌碼與融資</span>
                  </button>

                  <button
                    onClick={() => setActiveRiskTab('deficiencies')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      activeRiskTab === 'deficiencies'
                        ? 'bg-rose-700 text-white shadow-xs font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-rose-300" />
                    <span>💡 系統 5 大缺失與優化指南</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400 hidden md:block">
                  基準參考價: <strong className="text-white">NT$ {stock.close.toFixed(1)}</strong>
                </div>
              </div>

              {/* Tab 1: 5-Day Short-Term Risks */}
              {activeRiskTab === '5day' && (
                <div className="space-y-3">
                  {/* Summary Banner */}
                  <div
                    className={`p-2.5 rounded-lg border flex items-start gap-2 text-xs ${
                      riskAssessment.fiveDayRisks.keyAlert
                        ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                        : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div className="space-y-0.5 flex-1">
                      <span className="font-bold block">5日超短線風險診斷摘要：</span>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {riskAssessment.fiveDayRisks.summary}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">5日極速停損防守</span>
                      <span className="text-rose-400 font-mono font-bold text-xs bg-black/40 px-2 py-0.5 rounded border border-rose-900/60">
                        NT$ {riskAssessment.fiveDayRisks.shortTermStopLoss.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* 5 Risk Items Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {riskAssessment.fiveDayRisks.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border transition space-y-1.5 flex flex-col justify-between ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-950/50 border-rose-700/80 shadow-xs'
                            : item.severity === 'WARNING'
                            ? 'bg-amber-950/40 border-amber-700/70'
                            : item.severity === 'NOTICE'
                            ? 'bg-blue-950/30 border-blue-800/60'
                            : 'bg-slate-800/60 border-slate-700/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-xs font-bold ${
                                item.severity === 'CRITICAL'
                                  ? 'text-rose-300'
                                  : item.severity === 'WARNING'
                                  ? 'text-amber-300'
                                  : item.severity === 'NOTICE'
                                  ? 'text-blue-300'
                                  : 'text-emerald-300'
                              }`}
                            >
                              {item.title}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                item.severity === 'CRITICAL'
                                  ? 'bg-rose-900 text-rose-200 border border-rose-600'
                                  : item.severity === 'WARNING'
                                  ? 'bg-amber-900 text-amber-200 border border-amber-600'
                                  : item.severity === 'NOTICE'
                                  ? 'bg-blue-900 text-blue-200 border border-blue-600'
                                  : 'bg-emerald-900 text-emerald-200 border border-emerald-600'
                              }`}
                            >
                              {item.severity === 'CRITICAL'
                                ? '🚨 極度高危'
                                : item.severity === 'WARNING'
                                ? '⚠️ 重點警戒'
                                : item.severity === 'NOTICE'
                                ? 'ℹ️ 防守提示'
                                : '✅ 安全常態'}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono bg-black/30 px-1.5 py-0.5 rounded border border-slate-700/50 inline-block mb-1">
                            觸發條件: <strong className="text-slate-200">{item.triggerValue}</strong>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-1.5 border-t border-slate-700/60 text-[10px] text-amber-300/90 flex items-start gap-1 font-sans">
                          <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>應對處置：</strong> {item.mitigation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: 10-Day Swing Risks */}
              {activeRiskTab === '10day' && (
                <div className="space-y-3">
                  {/* Summary Banner */}
                  <div
                    className={`p-2.5 rounded-lg border flex items-start gap-2 text-xs ${
                      riskAssessment.tenDayRisks.keyAlert
                        ? 'bg-indigo-950/50 border-indigo-800 text-indigo-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-200'
                    }`}
                  >
                    <Shield className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                    <div className="space-y-0.5 flex-1">
                      <span className="font-bold block">10日波段防守風險診斷摘要：</span>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {riskAssessment.tenDayRisks.summary}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">波段核心生命防守</span>
                      <span className="text-amber-400 font-mono font-bold text-xs bg-black/40 px-2 py-0.5 rounded border border-amber-900/60">
                        NT$ {riskAssessment.tenDayRisks.swingDefensiveLine.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* 10-Day Risk Items Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {riskAssessment.tenDayRisks.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border transition space-y-1.5 flex flex-col justify-between ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-950/50 border-rose-700/80 shadow-xs'
                            : item.severity === 'WARNING'
                            ? 'bg-amber-950/40 border-amber-700/70'
                            : item.severity === 'NOTICE'
                            ? 'bg-indigo-950/40 border-indigo-800/60'
                            : 'bg-slate-800/60 border-slate-700/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-xs font-bold ${
                                item.severity === 'CRITICAL'
                                  ? 'text-rose-300'
                                  : item.severity === 'WARNING'
                                  ? 'text-amber-300'
                                  : item.severity === 'NOTICE'
                                  ? 'text-indigo-300'
                                  : 'text-emerald-300'
                              }`}
                            >
                              {item.title}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                item.severity === 'CRITICAL'
                                  ? 'bg-rose-900 text-rose-200 border border-rose-600'
                                  : item.severity === 'WARNING'
                                  ? 'bg-amber-900 text-amber-200 border border-amber-600'
                                  : item.severity === 'NOTICE'
                                  ? 'bg-indigo-900 text-indigo-200 border border-indigo-600'
                                  : 'bg-emerald-900 text-emerald-200 border border-emerald-600'
                              }`}
                            >
                              {item.severity === 'CRITICAL'
                                ? '🚨 破位失守'
                                : item.severity === 'WARNING'
                                ? '⚠️ 波段警戒'
                                : item.severity === 'NOTICE'
                                ? 'ℹ️ 波動測算'
                                : '✅ 架構穩固'}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono bg-black/30 px-1.5 py-0.5 rounded border border-slate-700/50 inline-block mb-1">
                            條件: <strong className="text-slate-200">{item.triggerValue}</strong>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-1.5 border-t border-slate-700/60 text-[10px] text-indigo-300/90 flex items-start gap-1 font-sans">
                          <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>應對處置：</strong> {item.mitigation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Deduction Predictor */}
              {activeRiskTab === 'deduction' && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-teal-900/50 text-xs text-teal-200 flex items-center justify-between flex-wrap gap-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-teal-400" />
                      均線扣抵法則：扣低助漲支撐、扣高下彎壓制 (以歷史 N 日前價格精準推算未來均線斜率拐點)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      現價: NT$ {stock.close.toFixed(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {/* MA5 Card */}
                    {(() => {
                      const d = riskAssessment.fiveDayRisks.ma5Deduction;
                      const isHigh = d.deductionStatus === 'DEDUCTING_HIGH';
                      return (
                        <div
                          className={`p-3 rounded-xl border flex flex-col justify-between ${
                            isHigh
                              ? 'bg-rose-950/40 border-rose-800'
                              : 'bg-emerald-950/40 border-emerald-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-amber-300">
                                5日均線 (MA5 NT${d.currentMa.toFixed(1)})
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                  isHigh
                                    ? 'bg-rose-900 text-rose-200 border border-rose-600'
                                    : 'bg-emerald-900 text-emerald-200 border border-emerald-600'
                                }`}
                              >
                                {isHigh ? '🚨 扣高 (下彎壓迫)' : '🚀 扣低 (助漲推升)'}
                              </span>
                            </div>

                            <div className="mt-2 space-y-1 font-mono text-xs">
                              <div className="flex justify-between text-slate-400 text-[11px]">
                                <span>5天前扣抵價格:</span>
                                <strong className="text-white">NT$ {d.deductionPrice.toFixed(1)}</strong>
                              </div>
                              <div className="flex justify-between text-slate-400 text-[11px]">
                                <span>扣抵相對溢折:</span>
                                <strong className={isHigh ? 'text-rose-400' : 'text-emerald-400'}>
                                  {d.priceDiff >= 0 ? `+${d.priceDiff.toFixed(1)}` : `${d.priceDiff.toFixed(1)}`} ({d.priceDiffPct >= 0 ? `+${d.priceDiffPct}%` : `${d.priceDiffPct}%`})
                                </strong>
                              </div>
                              {d.deductionDate && (
                                <div className="flex justify-between text-slate-500 text-[10px]">
                                  <span>扣抵K棒日期:</span>
                                  <span>{d.deductionDate}</span>
                                </div>
                              )}
                            </div>

                            <p className="mt-2 text-[11px] text-slate-300 font-sans leading-relaxed">
                              {d.impactDescription}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* MA10 Card */}
                    {(() => {
                      const d = riskAssessment.tenDayRisks.ma10Deduction;
                      const isHigh = d.deductionStatus === 'DEDUCTING_HIGH';
                      return (
                        <div
                          className={`p-3 rounded-xl border flex flex-col justify-between ${
                            isHigh
                              ? 'bg-rose-950/40 border-rose-800'
                              : 'bg-indigo-950/40 border-indigo-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-blue-300">
                                10日雙週線 (MA10 NT${d.currentMa.toFixed(1)})
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                  isHigh
                                    ? 'bg-rose-900 text-rose-200 border border-rose-600'
                                    : 'bg-indigo-900 text-indigo-200 border border-indigo-600'
                                }`}
                              >
                                {isHigh ? '⚠️ 扣高 (走平下壓)' : '🛡️ 扣低 (雙週助漲)'}
                              </span>
                            </div>

                            <div className="mt-2 space-y-1 font-mono text-xs">
                              <div className="flex justify-between text-slate-400 text-[11px]">
                                <span>10天前扣抵價格:</span>
                                <strong className="text-white">NT$ {d.deductionPrice.toFixed(1)}</strong>
                              </div>
                              <div className="flex justify-between text-slate-400 text-[11px]">
                                <span>扣抵相對溢折:</span>
                                <strong className={isHigh ? 'text-rose-400' : 'text-indigo-400'}>
                                  {d.priceDiff >= 0 ? `+${d.priceDiff.toFixed(1)}` : `${d.priceDiff.toFixed(1)}`} ({d.priceDiffPct >= 0 ? `+${d.priceDiffPct}%` : `${d.priceDiffPct}%`})
                                </strong>
                              </div>
                              {d.deductionDate && (
                                <div className="flex justify-between text-slate-500 text-[10px]">
                                  <span>扣抵K棒日期:</span>
                                  <span>{d.deductionDate}</span>
                                </div>
                              )}
                            </div>

                            <p className="mt-2 text-[11px] text-slate-300 font-sans leading-relaxed">
                              {d.impactDescription}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* MA20 Card */}
                    {(() => {
                      const d = riskAssessment.tenDayRisks.ma20Deduction;
                      const isHigh = d.deductionStatus === 'DEDUCTING_HIGH';
                      return (
                        <div
                          className={`p-3 rounded-xl border flex flex-col justify-between ${
                            isHigh
                              ? 'bg-rose-950/40 border-rose-800'
                              : 'bg-purple-950/40 border-purple-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-purple-300">
                                20日月生命線 (MA20 NT${d.currentMa.toFixed(1)})
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                  isHigh
                                    ? 'bg-rose-900 text-rose-200 border border-rose-600'
                                    : 'bg-purple-900 text-purple-200 border border-purple-600'
                                }`}
                              >
                                {isHigh ? '⚠️ 扣高 (月壓轉折)' : '💎 扣低 (多頭生命線)'}
                              </span>
                            </div>

                            <div className="mt-2 space-y-1 font-mono text-xs">
                              <div className="flex justify-between text-slate-400 text-[11px]">
                                <span>20天前扣抵價格:</span>
                                <strong className="text-white">NT$ {d.deductionPrice.toFixed(1)}</strong>
                              </div>
                              <div className="flex justify-between text-slate-400 text-[11px]">
                                <span>扣抵相對溢折:</span>
                                <strong className={isHigh ? 'text-rose-400' : 'text-purple-400'}>
                                  {d.priceDiff >= 0 ? `+${d.priceDiff.toFixed(1)}` : `${d.priceDiff.toFixed(1)}`} ({d.priceDiffPct >= 0 ? `+${d.priceDiffPct}%` : `${d.priceDiffPct}%`})
                                </strong>
                              </div>
                              {d.deductionDate && (
                                <div className="flex justify-between text-slate-500 text-[10px]">
                                  <span>扣抵K棒日期:</span>
                                  <span>{d.deductionDate}</span>
                                </div>
                              )}
                            </div>

                            <p className="mt-2 text-[11px] text-slate-300 font-sans leading-relaxed">
                              {d.impactDescription}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Tab 3.5: Institutional Chip & Margin Analysis (三大法人與融資籌碼) */}
              {activeRiskTab === 'chip' && (
                <div className="space-y-3">
                  {/* Summary Banner */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <Landmark className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                          三大法人買賣超與散戶融資浮額深度診斷
                        </span>
                        {stock.institutionalChip && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                              籌碼健康分數: {stock.institutionalChip.chipScore} / 100
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-900/60 text-rose-300 border border-rose-700">
                              {stock.institutionalChip.chipGradeLabel}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {stock.institutionalChip?.summary || '證交所即時籌碼連線中，分析三大法人持股集中度與融資增減對短線價格之推升力道。'}
                      </p>
                    </div>
                  </div>

                  {/* 4 Cards: 外資, 投信, 自營商, 融資融券 */}
                  {(() => {
                    const chip = stock.institutionalChip;
                    const fBuy = chip?.foreignNetBuy ?? 0;
                    const tBuy = chip?.trustNetBuy ?? 0;
                    const dBuy = chip?.dealerNetBuy ?? 0;
                    const totBuy = chip?.totalNetBuy ?? (fBuy + tBuy + dBuy);
                    const mChange = chip?.marginChange ?? 0;
                    const mBalance = chip?.marginBalance ?? 0;
                    const sBalance = chip?.shortBalance ?? 0;

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-xs">
                        {/* Card 1: 外資 */}
                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
                            <span>外資買賣超</span>
                            <span className="text-[10px] text-slate-500">外資動向</span>
                          </div>
                          <div className={`text-base font-bold ${fBuy >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {fBuy > 0 ? `+${fBuy}` : fBuy} <span className="text-[10px] font-normal text-slate-400 font-sans">張</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-800">
                            {fBuy >= 1000 ? '外資強力大買推升' : fBuy <= -1000 ? '外資高檔調節賣壓' : '外資買賣力道均衡'}
                          </div>
                        </div>

                        {/* Card 2: 投信 */}
                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
                            <span>投信買賣超</span>
                            <span className="text-[10px] text-amber-400 font-bold">作帳核心</span>
                          </div>
                          <div className={`text-base font-bold ${tBuy >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {tBuy > 0 ? `+${tBuy}` : tBuy} <span className="text-[10px] font-normal text-slate-400 font-sans">張</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-800">
                            {tBuy >= 200 ? '投信連續認養波段主力' : tBuy <= -200 ? '投信結帳提款風險' : '投信常態操作'}
                          </div>
                        </div>

                        {/* Card 3: 三大法人合計 */}
                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
                            <span>三大法人合計</span>
                            <span className="text-[10px] text-slate-500">主力總動能</span>
                          </div>
                          <div className={`text-base font-bold ${totBuy >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {totBuy > 0 ? `+${totBuy}` : totBuy} <span className="text-[10px] font-normal text-slate-400 font-sans">張</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-800">
                            自營商: {dBuy > 0 ? `+${dBuy}` : dBuy} 張
                          </div>
                        </div>

                        {/* Card 4: 融資融券 */}
                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] font-sans">
                            <span>散戶融資增減</span>
                            <span className="text-[10px] text-slate-500">市場浮額</span>
                          </div>
                          <div className={`text-base font-bold ${mChange > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                            {mChange > 0 ? `+${mChange}` : mChange} <span className="text-[10px] font-normal text-slate-400 font-sans">張</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-800 flex justify-between">
                            <span>資餘: {mBalance.toLocaleString()}</span>
                            <span>券餘: {sBalance}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Taiwan Market Resonance Banner */}
                  {stock.marketRegime && (
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="text-slate-300">
                          <strong>大盤環境共振聯動：</strong>加權指數處於「{stock.marketRegime.regimeLabel}」，建議全市場總部位<strong>{stock.marketRegime.suggestedExposure}</strong>。
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        TAIEX {stock.marketRegime.taiexIndex.toLocaleString()} ({stock.marketRegime.taiexChangePercent >= 0 ? '+' : ''}{stock.marketRegime.taiexChangePercent.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: System Deficiencies Analysis */}
              {activeRiskTab === 'deficiencies' && (
                <div className="space-y-2.5">
                  <div className="bg-rose-950/40 p-2.5 rounded-lg border border-rose-800 text-xs text-rose-200 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-rose-400" />
                      專題診斷：您提出之 5 大結構性缺失 · 新版全面實裝優化對照表
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700">
                      ✅ 5 大功能已全數實裝上線
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {riskAssessment.systemDeficiencies.map((def, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-slate-100 text-xs flex items-center gap-1">
                              <span className="text-emerald-400 font-mono font-bold">[{idx + 1}]</span>
                              {def.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                              新版已實裝優化
                            </span>
                          </div>

                          <div className="text-[11px] text-rose-300/90 font-medium">
                            🚨 <strong>原系統盲點：</strong> {def.impact}
                          </div>

                          <p className="text-[11px] text-slate-400 font-sans mt-1">
                            {def.shortDescription}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-800/60 mt-1">
                          🚀 <strong>新版已上線解法：</strong> {def.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4-Column Metric Grid: Quant Multi-Factor Support and Resistance Levels */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Short-term Resistance */}
            <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-200/80 text-center flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[11px] font-bold text-rose-800">
                    短線即時壓力
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold tracking-tight">
                    {'★'.repeat(levels?.shortResistanceStars || 1)}
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-rose-600 mt-1 block">
                  NT$ {levels?.shortResistance ? levels.shortResistance.toFixed(2) : '-'}
                </span>
                <span className="text-[10px] text-rose-700 font-mono font-semibold block">
                  距短壓 +{levels?.distToShortResistancePct?.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-rose-200/60 text-[10px] text-slate-600 line-clamp-1" title={levels?.shortResistanceReason}>
                {levels?.shortResistanceReason || '3~7日短線壓力'}
              </div>
            </div>

            {/* Mid-term (1-Month) Resistance */}
            <div className="p-3 bg-rose-100/40 rounded-xl border border-rose-300 text-center flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[11px] font-bold text-rose-900">
                    中期關鍵月壓
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold tracking-tight">
                    {'★'.repeat(levels?.midTermResistanceStars || 1)}
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-rose-800 mt-1 block">
                  NT$ {levels?.midTermResistance ? levels.midTermResistance.toFixed(2) : (levels?.midLongResistance ? levels.midLongResistance.toFixed(2) : '-')}
                </span>
                <span className="text-[10px] text-rose-800 font-mono font-semibold block">
                  距月壓 +{levels?.distToMidTermResistancePct?.toFixed(1) || levels?.distToMidLongResistancePct?.toFixed(1) || '-'}%
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-rose-300/60 text-[10px] text-slate-600 line-clamp-1" title={levels?.midTermResistanceReason}>
                {levels?.midTermResistanceReason || '1個月波段壓力'}
              </div>
            </div>

            {/* Short-term Support */}
            <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/80 text-center flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[11px] font-bold text-emerald-800">
                    短線即時支撐
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold tracking-tight">
                    {'★'.repeat(levels?.shortSupportStars || 1)}
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-emerald-600 mt-1 block">
                  NT$ {levels?.shortSupport ? levels.shortSupport.toFixed(2) : '-'}
                </span>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold block">
                  距短支 -{levels?.distToShortSupportPct?.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-emerald-200/60 text-[10px] text-slate-600 line-clamp-1" title={levels?.shortSupportReason}>
                {levels?.shortSupportReason || 'MA5 / 3~7日低'}
              </div>
            </div>

            {/* Mid-term Support */}
            <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-200/80 text-center flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[11px] font-bold text-teal-900">
                    中期核心月支
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold tracking-tight">
                    {'★'.repeat(levels?.midTermSupportStars || 1)}
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-teal-700 mt-1 block">
                  NT$ {levels?.midTermSupport ? levels.midTermSupport.toFixed(2) : (levels?.midLongSupport ? levels.midLongSupport.toFixed(2) : '-')}
                </span>
                <span className="text-[10px] text-teal-800 font-mono font-semibold block">
                  距月支 -{levels?.distToMidTermSupportPct?.toFixed(1) || levels?.distToMidLongSupportPct?.toFixed(1) || '-'}%
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-teal-200/60 text-[10px] text-slate-600 line-clamp-1" title={levels?.midTermSupportReason}>
                {levels?.midTermSupportReason || 'MA20 月生命線'}
              </div>
            </div>
          </div>

          {/* Quant Multi-Factor Confluence Evidence Breakdown Matrix */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                多維量化共振定價引擎 (ATR / Fibonacci / VPOC / 均線 / 心理整數關卡)
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                共振星級: ★★★ 強度最高(3因子+) | ★★ 中度 | ★ 基準
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Resistance Factors */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-rose-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    壓力定價量化依據
                  </span>
                  <span className="text-[10px] text-rose-300 font-mono">
                    短壓: NT${levels?.shortResistance?.toFixed(1)} | 月壓: NT${levels?.midTermResistance?.toFixed(1)}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300 font-sans">
                  <div className="text-[11px] text-rose-200/90 font-medium">
                    📌 <strong>短壓依據:</strong> {levels?.shortResistanceReason}
                  </div>
                  {levels?.shortResistanceEvidence && levels.shortResistanceEvidence.length > 0 && (
                    <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5 pl-1">
                      {levels.shortResistanceEvidence.slice(0, 3).map((ev, i) => (
                        <li key={i} className="font-mono">{ev}</li>
                      ))}
                    </ul>
                  )}
                  <div className="text-[11px] text-rose-200/90 font-medium mt-1.5">
                    📌 <strong>月壓依據:</strong> {levels?.midTermResistanceReason}
                  </div>
                  {levels?.midTermResistanceEvidence && levels.midTermResistanceEvidence.length > 0 && (
                    <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5 pl-1">
                      {levels.midTermResistanceEvidence.slice(0, 3).map((ev, i) => (
                        <li key={i} className="font-mono">{ev}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Support Factors */}
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    支撐定價量化依據
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">
                    短支: NT${levels?.shortSupport?.toFixed(1)} | 月支: NT${levels?.midTermSupport?.toFixed(1)}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300 font-sans">
                  <div className="text-[11px] text-emerald-200/90 font-medium">
                    📌 <strong>短支依據:</strong> {levels?.shortSupportReason}
                  </div>
                  {levels?.shortSupportEvidence && levels.shortSupportEvidence.length > 0 && (
                    <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5 pl-1">
                      {levels.shortSupportEvidence.slice(0, 3).map((ev, i) => (
                        <li key={i} className="font-mono">{ev}</li>
                      ))}
                    </ul>
                  )}
                  <div className="text-[11px] text-emerald-200/90 font-medium mt-1.5">
                    📌 <strong>月支依據:</strong> {levels?.midTermSupportReason}
                  </div>
                  {levels?.midTermSupportEvidence && levels.midTermSupportEvidence.length > 0 && (
                    <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5 pl-1">
                      {levels.midTermSupportEvidence.slice(0, 3).map((ev, i) => (
                        <li key={i} className="font-mono">{ev}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Structural Price Action Analysis: 大陰線、大陽線、前高、前低、量比、月線 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs flex-wrap gap-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                1個月中期形態結構、月線 (MA20) 與關鍵K線反壓支撐深度剖析
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                1M前高: NT$ {structural?.swingHigh?.price.toFixed(1)} ({structural?.swingHigh?.daysAgo}天前) | 1M前低: NT$ {structural?.swingLow?.price.toFixed(1)} ({structural?.swingLow?.daysAgo}天前)
              </span>
            </div>

            {/* Monthly Line MA20 Pill Banner */}
            <div className="bg-purple-50/80 border border-purple-200 rounded-lg p-2.5 text-xs text-purple-950 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold bg-purple-600 text-white text-[11px] px-2 py-0.5 rounded">月線 (MA20)</span>
                <span className="font-mono font-bold text-purple-900">
                  NT$ {levels?.monthMa20?.toFixed(2) || stock.ma20.toFixed(2)}
                </span>
                <span className="font-mono text-purple-700">
                  (月線乖離 Bias20: {levels?.monthMa20BiasPct !== undefined ? (levels.monthMa20BiasPct > 0 ? `+${levels.monthMa20BiasPct}%` : `${levels.monthMa20BiasPct}%`) : `${stock.bias20.toFixed(1)}%`})
                </span>
              </div>
              <span className="font-semibold text-purple-800 text-[11px]">
                {levels?.monthMa20StatusText || (stock.close >= stock.ma20 ? '股價站穩月線之上，中期趨勢偏多' : '股價位於月線之下承壓，等待突破')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    1個月內巨量大陰線套牢賣壓
                  </span>
                  {structural?.keyBearishBar && (
                    <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-mono">
                      {structural.keyBearishBar.date} ({structural.keyBearishBar.daysAgo}天前)
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {structural?.keyBearishBar
                    ? structural.keyBearishBar.desc
                    : levels?.isNewHigh
                    ? '股價已突破1個月內所有K線高點創下新高，前期大陰線已全數向上突破消化解套，目前上方無任何歷史套牢盤，籌碼結構100%處於獲利狀態。'
                    : '1個月內無顯著巨量大陰線套牢密集區，上方籌碼結構相對乾淨。'}
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    1個月內放量大陽線主力防守線
                  </span>
                  {structural?.keyBullishBar && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                      {structural.keyBullishBar.date} ({structural.keyBullishBar.daysAgo}天前)
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {structural?.keyBullishBar
                    ? structural.keyBullishBar.desc
                    : '1個月內以月線 MA20 與近期波段低點作為主要防守基準。'}
                </p>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{structural?.volumeRatioEvaluation}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
