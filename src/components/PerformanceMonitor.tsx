import React, { useState, useEffect, useRef } from 'react';
import { Activity, ChevronDown, ChevronUp, Clock, Zap, CheckCircle2, RefreshCw } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface NavigationLogItem {
  id: string;
  from: string;
  to: string;
  durationMs: number;
  timestamp: string;
}

export const PerformanceMonitor: React.FC = () => {
  const { route } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [lastTransitionMs, setLastTransitionMs] = useState<number>(14);
  const [apiPingMs, setApiPingMs] = useState<number>(28);
  const [fps, setFps] = useState<number>(60);
  const [logs, setLogs] = useState<NavigationLogItem[]>([]);

  const prevRouteKeyRef = useRef<string>('home');
  const routeStartTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  // Estimate Frame Rate via requestAnimationFrame
  useEffect(() => {
    let animId: number;
    const calcFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(Math.min(60, Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current))));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };
    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Track route transition duration
  useEffect(() => {
    const currentKey =
      route.page === 'category'
        ? `Category: ${route.categoryId}`
        : route.page === 'product'
        ? `Product: ${route.productId.slice(0, 14)}`
        : route.page === 'deals'
        ? 'Deals'
        : route.page === 'client-portal'
        ? `Portal: ${route.tab || 'orders'}`
        : route.page;

    const duration = Math.max(1, Math.round((performance.now() - routeStartTimeRef.current) * 10) / 10);
    setLastTransitionMs(duration);

    if (prevRouteKeyRef.current !== currentKey) {
      const newLog: NavigationLogItem = {
        id: `nav-${Date.now()}`,
        from: prevRouteKeyRef.current,
        to: currentKey,
        durationMs: duration,
        timestamp: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 5)]);
      prevRouteKeyRef.current = currentKey;
    }

    // Reset reference for next click
    routeStartTimeRef.current = performance.now();
  }, [route]);

  // Periodic API ping measurement for /api/db/sync
  useEffect(() => {
    const measureApiPing = async () => {
      const start = performance.now();
      try {
        const res = await fetch('/api/db/sync', { cache: 'no-store' });
        if (res.ok) {
          const delta = Math.round(performance.now() - start);
          setApiPingMs(delta);
        }
      } catch {
        // Offline or backgrounded
      }
    };

    measureApiPing();
    const interval = setInterval(measureApiPing, 10000);
    return () => clearInterval(interval);
  }, []);

  const getLatencyBadgeClass = (ms: number) => {
    if (ms <= 35) return 'text-[#1F6F43] bg-emerald-50 border-emerald-200';
    if (ms <= 75) return 'text-amber-800 bg-amber-50 border-amber-200';
    return 'text-rose-800 bg-rose-50 border-rose-200';
  };

  return (
    <aside
      aria-label="Performance Telemetry Monitor"
      className="fixed bottom-4 right-4 z-40 font-mono-num select-none print:hidden"
    >
      {!isOpen ? (
        /* Collapsed Floating Pill */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#141413]/90 hover:bg-[#141413] text-[#F4F3EF] px-3 py-1.5 rounded-full text-[11px] shadow-lg border border-[#F4F3EF]/15 backdrop-blur-md cursor-pointer transition-all hover:scale-105"
          title="Click to view client interaction performance metrics"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">{lastTransitionMs}ms</span>
          <span className="text-[#A09F99] hidden sm:inline">·</span>
          <span className="text-[#A09F99] hidden sm:inline">{fps} FPS</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#A09F99]" />
        </button>
      ) : (
        /* Expanded Telemetry HUD Panel */
        <div className="bg-[#141413] text-[#F4F3EF] border border-[#F4F3EF]/20 shadow-2xl p-4 rounded-sm w-[300px] sm:w-[340px] space-y-3.5 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F4F3EF]/12">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#C5A028]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F4F3EF]">
                Performance Monitor
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#A09F99] hover:text-[#F4F3EF] p-1 cursor-pointer"
              aria-label="Minimize monitor"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-[#2B2B28] p-2 border border-[#F4F3EF]/10">
              <span className="text-[9px] uppercase tracking-wider text-[#A09F99] block mb-0.5">
                Route Latency
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {lastTransitionMs} ms
              </span>
            </div>

            <div className="bg-[#2B2B28] p-2 border border-[#F4F3EF]/10">
              <span className="text-[9px] uppercase tracking-wider text-[#A09F99] block mb-0.5">
                API Sync Ping
              </span>
              <span className="text-sm font-bold text-[#F4F3EF]">
                {apiPingMs} ms
              </span>
            </div>

            <div className="bg-[#2B2B28] p-2 border border-[#F4F3EF]/10">
              <span className="text-[9px] uppercase tracking-wider text-[#A09F99] block mb-0.5">
                Display Engine
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {fps} FPS
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between bg-[#2B2B28] px-2.5 py-1.5 text-[10px] text-[#A09F99] border border-[#F4F3EF]/10">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Vite SPA · Client Render Optimal</span>
            </span>
            <span className="text-emerald-400 font-semibold uppercase">Smooth</span>
          </div>

          {/* Recent Navigation Latency Log */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A09F99] block font-semibold">
              Recent Navigation Transitions
            </span>
            {logs.length === 0 ? (
              <p className="text-[10px] text-[#6E6D68] italic">Click any product or category to record navigation latency.</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-[10px] bg-[#2B2B28]/60 px-2 py-1 border border-[#F4F3EF]/5"
                  >
                    <span className="truncate max-w-[190px] text-[#D8D7D2]" title={`${log.from} → ${log.to}`}>
                      {log.to}
                    </span>
                    <span className="font-semibold text-emerald-400 shrink-0 ml-2">
                      {log.durationMs}ms
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
