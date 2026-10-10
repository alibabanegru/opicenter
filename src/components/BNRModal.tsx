import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Landmark,
  RefreshCw,
  X,
  Calculator,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format, subDays, subMonths, subYears, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { cn, CurrencyRow } from "../appConstants";

export interface BNRModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export const BNRModal: React.FC<BNRModalProps> = ({
  isOpen,
  onClose,
  darkMode,
}) => {
  const [bnrRates, setBnrRates] = useState<Record<string, number> | null>(null);
  const [bnrLoading, setBnrLoading] = useState(false);
  const [bnrError, setBnrError] = useState<string | null>(null);
  const [bnrTrends, setBnrTrends] = useState<
    Record<string, "up" | "down" | "flat">
  >({});

  // History modal states
  const [isCurrencyHistoryModalOpen, setIsCurrencyHistoryModalOpen] =
    useState(false);
  const [selectedHistoryCurrency, setSelectedHistoryCurrency] =
    useState<string>("EUR");
  const [historyRange, setHistoryRange] = useState<
    "10d" | "30d" | "6m" | "1y" | "5y"
  >("30d");
  const [historyDirection, setHistoryDirection] = useState<"toRON" | "fromRON">(
    "toRON"
  );
  const [currencyHistory, setCurrencyHistory] = useState<
    { date: string; rate: number }[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchBNRRates = useCallback(async () => {
    setBnrLoading(true);
    setBnrError(null);
    try {
      let response = null;
      const apiUrls = [
        "https://open.er-api.com/v6/latest/RON",
        "https://api.exchangerate-api.com/v4/latest/RON",
        "https://api.frankfurter.app/latest?from=RON&to=EUR,USD,GBP,CHF,HUF,BGN",
        "https://api.frankfurter.dev/latest?from=RON&to=EUR,USD,GBP,CHF,HUF,BGN",
      ];

      for (const url of apiUrls) {
        try {
          const res = await fetch(url);
          if (res && res.ok) {
            response = res;
            break;
          }
        } catch (err) {
          console.warn(`Failed to fetch exchange rates from URL ${url}:`, err);
        }
      }

      if (!response) {
        throw new Error(
          "Nu s-a putut realiza conexiunea cu niciunul dintre serverele de curs valuar (Open ER, ExchangeRate-API, Frankfurter). Vă rugăm să verificați conexiunea la internet sau sistemul de securitate al rețelei."
        );
      }

      const data = await response.json();
      if (data && data.rates) {
        const getRate = (curr: string) => {
          const r = data.rates[curr];
          if (
            r === undefined ||
            r === null ||
            isNaN(Number(r)) ||
            Number(r) <= 0
          )
            return null;
          return Number(r);
        };

        const rawEUR = getRate("EUR");
        const rawUSD = getRate("USD");
        const rawGBP = getRate("GBP");
        const rawCHF = getRate("CHF");
        const rawHUF = getRate("HUF");
        const rawBGN = getRate("BGN");

        const rates: Record<string, number> = {};
        if (rawEUR) rates.EUR = 1 / rawEUR;
        if (rawUSD) rates.USD = 1 / rawUSD;
        if (rawGBP) rates.GBP = 1 / rawGBP;
        if (rawCHF) rates.CHF = 1 / rawCHF;
        if (rawHUF) rates.HUF = 1 / (rawHUF / 100);
        if (rawBGN) rates.BGN = 1 / rawBGN;

        if (Object.keys(rates).length > 0) {
          setBnrRates(rates);

          try {
            const fiveDaysAgo = subDays(new Date(), 5);
            const startStr = format(fiveDaysAgo, "yyyy-MM-dd");
            const endStr = format(new Date(), "yyyy-MM-dd");

            const trendUrl = `https://api.frankfurter.app/${startStr}..${endStr}?from=RON&to=EUR,USD,GBP,CHF,HUF,BGN`;
            let histRes = null;
            try {
              histRes = await fetch(trendUrl);
            } catch (e) {
              const fallbackUrl = `https://api.frankfurter.dev/${startStr}..${endStr}?from=RON&to=EUR,USD,GBP,CHF,HUF,BGN`;
              histRes = await fetch(fallbackUrl);
            }

            if (histRes && !histRes.ok) {
              const fallbackUrl = `https://api.frankfurter.dev/${startStr}..${endStr}?from=RON&to=EUR,USD,GBP,CHF,HUF,BGN`;
              histRes = await fetch(fallbackUrl);
            }

            if (histRes && histRes.ok) {
              const histData = await histRes.json();
              if (histData && histData.rates) {
                const dates = Object.keys(histData.rates).sort();
                if (dates.length >= 2) {
                  const lastDate = dates[dates.length - 1];
                  const prevDate = dates[dates.length - 2];
                  const lastRates = histData.rates[lastDate];
                  const prevRates = histData.rates[prevDate];

                  const trends: Record<string, "up" | "down" | "flat"> = {};
                  ["EUR", "USD", "GBP", "CHF", "HUF", "BGN"].forEach((curr) => {
                    const last = lastRates[curr];
                    const prev = prevRates[curr];
                    if (last && prev) {
                      if (last < prev) trends[curr] = "up";
                      else if (last > prev) trends[curr] = "down";
                      else trends[curr] = "flat";
                    }
                  });
                  setBnrTrends(trends);
                }
              }
            }
          } catch (trendErr) {
            console.warn("Could not fetch trends:", trendErr);
          }
        } else {
          throw new Error(
            "Răspunsul API nu a returnat monedele principale de curs valuar (EUR, USD etc.)."
          );
        }
      } else {
        throw new Error(
          "Formatul datelor returnate de serverul de curs valuar este incorect."
        );
      }
    } catch (error) {
      console.warn("Error fetching BNR rates:", error);
      setBnrError(
        error instanceof Error
          ? error.message
          : "Eroare de rețea la preluarea cursului."
      );
    } finally {
      setBnrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBNRRates();
    }
  }, [isOpen, fetchBNRRates]);

  const fetchHistory = useCallback(async () => {
    if (!isCurrencyHistoryModalOpen) return;

    setHistoryLoading(true);
    setHistoryError(null);
    setCurrencyHistory([]);

    try {
      const supportedCurrencies = [
        "AUD",
        "BGN",
        "BRL",
        "CAD",
        "CHF",
        "CNY",
        "CZK",
        "DKK",
        "EUR",
        "GBP",
        "HKD",
        "HUF",
        "IDR",
        "ILS",
        "INR",
        "ISK",
        "JPY",
        "KRW",
        "MXN",
        "MYR",
        "NOK",
        "NZD",
        "PHP",
        "PLN",
        "RON",
        "SEK",
        "SGD",
        "THB",
        "TRY",
        "USD",
        "ZAR",
      ];

      if (
        !supportedCurrencies.includes(selectedHistoryCurrency) ||
        selectedHistoryCurrency === "RON"
      ) {
        setCurrencyHistory([]);
        return;
      }

      let startDate: Date;
      switch (historyRange) {
        case "10d":
          startDate = subDays(new Date(), 10);
          break;
        case "30d":
          startDate = subDays(new Date(), 30);
          break;
        case "6m":
          startDate = subMonths(new Date(), 6);
          break;
        case "1y":
          startDate = subYears(new Date(), 1);
          break;
        case "5y":
          startDate = subYears(new Date(), 5);
          break;
        default:
          startDate = subDays(new Date(), 30);
      }

      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(new Date(), "yyyy-MM-dd");

      const primaryUrl = `https://api.frankfurter.dev/v1/${startStr}..${endStr}?from=${selectedHistoryCurrency}&to=RON`;
      const secondaryUrl = `https://api.frankfurter.app/v1/${startStr}..${endStr}?from=${selectedHistoryCurrency}&to=RON`;
      const tertiaryUrl = `https://api.frankfurter.app/${startStr}..${endStr}?from=${selectedHistoryCurrency}&to=RON`;

      let response: Response | null = null;
      const tryFetch = async (url: string) => {
        try {
          const res = await fetch(url);
          if (res.ok) return res;
        } catch (e) {
          console.warn(`Fetch failed for ${url}:`, e);
        }
        return null;
      };

      response = await tryFetch(primaryUrl);
      if (!response) response = await tryFetch(secondaryUrl);
      if (!response) response = await tryFetch(tertiaryUrl);

      if (!response) {
        throw new Error(
          "Nu s-a putut conecta la serverele de istoric valutar. Verificați conexiunea la internet."
        );
      }

      const data = await response.json();

      if (data && data.rates) {
        const historyArr = Object.entries(data.rates)
          .map(([date, rates]: [string, any]) => {
            let rate = rates.RON;
            if (rate === undefined || rate === null) return null;
            if (selectedHistoryCurrency === "HUF") {
              rate = rate * 100;
            }
            return {
              date,
              rate: parseFloat(Number(rate).toFixed(4)),
            };
          })
          .filter((item) => item !== null) as { date: string; rate: number }[];

        if (historyArr.length === 0) {
          throw new Error("Nu există date pentru perioada selectată.");
        }
        setCurrencyHistory(historyArr);
      } else {
        setCurrencyHistory([]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Eroare la preluarea istoricului"
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [isCurrencyHistoryModalOpen, selectedHistoryCurrency, historyRange]);

  useEffect(() => {
    if (isCurrencyHistoryModalOpen) {
      fetchHistory();
    }
  }, [isCurrencyHistoryModalOpen, fetchHistory]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                "relative w-full max-w-2xl rounded-[2.5rem] shadow-2xl border overflow-hidden",
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              )}
            >
              {/* Header */}
              <div className="p-8 pb-4 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                    <Landmark className="w-8 h-8" />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-3xl font-black uppercase tracking-tighter",
                        darkMode ? "text-white" : "text-slate-900"
                      )}
                    >
                      Curs Valutar BNR
                    </h3>
                    <p
                      className={cn(
                        "text-sm font-bold opacity-60 uppercase tracking-widest",
                        darkMode ? "text-slate-400" : "text-slate-500"
                      )}
                    >
                      Curs informativ •{" "}
                      {format(new Date(), "d  MMMM  yyyy", { locale: ro })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bnrRates && (
                    <button
                      onClick={fetchBNRRates}
                      disabled={bnrLoading}
                      title="Reîmprospătează Curs"
                      className={cn(
                        "p-3 rounded-2xl transition-all cursor-pointer",
                        bnrLoading && "opacity-50 cursor-not-allowed",
                        darkMode
                          ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                      )}
                    >
                      <RefreshCw
                        className={cn("w-5 h-5", bnrLoading && "animate-spin")}
                      />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className={cn(
                      "p-3 rounded-2xl transition-all cursor-pointer",
                      darkMode
                        ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                    )}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-8 pt-0 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                {bnrLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-60">
                      Se încarcă datele BNR...
                    </p>
                  </div>
                ) : bnrRates ? (
                  <div className="space-y-4">
                    {Object.entries(bnrRates).map(([currency, rate]) => (
                      <CurrencyRow
                        key={currency}
                        currency={currency}
                        rate={rate}
                        darkMode={darkMode}
                        trend={bnrTrends[currency]}
                        onClickIcon={() => {
                          setSelectedHistoryCurrency(currency);
                          setIsCurrencyHistoryModalOpen(true);
                        }}
                      />
                    ))}

                    <div
                      className={cn(
                        "mt-8 p-6 rounded-[2rem] border",
                        darkMode
                          ? "bg-slate-800/50 border-slate-700"
                          : "bg-slate-50 border-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Calculator className="w-5 h-5 text-blue-500" />
                        <h4 className="text-sm font-black uppercase tracking-widest">
                          Calculator Conversie
                        </h4>
                      </div>
                      <p className="text-xs opacity-60 leading-relaxed">
                        Introduceți suma în oricare dintre câmpurile de mai sus
                        pentru a vedea echivalentul în RON (sau invers). Cursul
                        este cel oficial BNR valabil pentru ziua curentă.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-5 text-center px-4">
                    <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/20">
                      <AlertTriangle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-extrabold uppercase tracking-wider text-rose-500">
                        Eroare de Conectare BNR
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md font-semibold leading-relaxed">
                        {bnrError ||
                          "Nu s-a putut prelua cursul valutar din sursele API autorizate."}
                      </p>
                    </div>
                    <button
                      onClick={fetchBNRRates}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-xs text-white font-black rounded-2xl shadow-md transition-all uppercase tracking-wider h-11 flex items-center gap-2 cursor-pointer outline-none"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reîncearcă Preluarea
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCurrencyHistoryModalOpen && (
          <motion.div
            key="currency-history-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCurrencyHistoryModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full max-w-4xl rounded-[2.5rem] shadow-2xl border overflow-hidden",
                darkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              )}
            >
              <div className="p-8 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-2xl",
                      darkMode
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-amber-50 text-amber-600"
                    )}
                  >
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-2xl font-black uppercase tracking-tighter",
                        darkMode ? "text-white" : "text-slate-900"
                      )}
                    >
                      Istoric {selectedHistoryCurrency} / RON
                    </h3>
                    <p
                      className={cn(
                        "text-xs font-bold opacity-60 uppercase tracking-widest",
                        darkMode ? "text-slate-400" : "text-slate-500"
                      )}
                    >
                      Evoluția cursului valutar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCurrencyHistoryModalOpen(false)}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    darkMode
                      ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                  )}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 pt-0 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {(["10d", "30d", "6m", "1y", "5y"] as const).map(
                      (range) => (
                        <button
                          key={range}
                          onClick={() => setHistoryRange(range)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            historyRange === range
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                              : darkMode
                                ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          {range === "10d"
                            ? "10 Zile"
                            : range === "30d"
                              ? "30 Zile"
                              : range === "6m"
                                ? "6 Luni"
                                : range === "1y"
                                  ? "1 An"
                                  : "5 Ani"}
                        </button>
                      )
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex p-1 rounded-2xl border",
                      darkMode
                        ? "bg-slate-800 border-slate-700"
                        : "bg-slate-100 border-slate-200"
                    )}
                  >
                    <button
                      onClick={() => setHistoryDirection("toRON")}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        historyDirection === "toRON"
                          ? "bg-amber-500 text-white shadow-md"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {selectedHistoryCurrency} → RON
                    </button>
                    <button
                      onClick={() => setHistoryDirection("fromRON")}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        historyDirection === "fromRON"
                          ? "bg-amber-500 text-white shadow-md"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      RON → {selectedHistoryCurrency}
                    </button>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  {historyLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                      <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                      <p className="text-xs font-black uppercase tracking-widest opacity-60">
                        Se prelucrează istoricul...
                      </p>
                    </div>
                  ) : historyError ? (
                    <div className="h-full flex flex-col items-center justify-center text-red-500 gap-2">
                      <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                      <p className="text-sm font-black uppercase tracking-widest">
                        Eroare Istoric
                      </p>
                      <p className="text-[10px] font-bold opacity-60 max-w-[200px] text-center">
                        {historyError}
                      </p>
                      <button
                        onClick={() => {
                          setHistoryError(null);
                          fetchHistory();
                        }}
                        className="mt-2 px-4 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Reîncearcă
                      </button>
                    </div>
                  ) : currencyHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={currencyHistory.map((item) => ({
                          ...item,
                          displayRate:
                            historyDirection === "toRON"
                              ? item.rate
                              : 1 / item.rate,
                        }))}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorRate"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={darkMode ? "#1e293b" : "#f1f5f9"}
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={true}
                          tickLine={true}
                          stroke={darkMode ? "#1e293b" : "#e2e8f0"}
                          tick={{
                            fontSize: 10,
                            fill: darkMode ? "#94a3b8" : "#64748b",
                            fontWeight: "bold",
                          }}
                          tickFormatter={(val) =>
                            format(parseISO(val), "dd.MM")
                          }
                          minTickGap={20}
                        />
                        <YAxis
                          domain={["auto", "auto"]}
                          orientation="right"
                          axisLine={true}
                          tickLine={true}
                          stroke={darkMode ? "#1e293b" : "#e2e8f0"}
                          tick={{
                            fontSize: 10,
                            fill: darkMode ? "#94a3b8" : "#64748b",
                            fontWeight: "bold",
                          }}
                          tickFormatter={(val) =>
                            val.toFixed(historyDirection === "toRON" ? 4 : 4)
                          }
                          width={60}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                            border: darkMode
                              ? "1px solid #1e293b"
                              : "1px solid #e2e8f0",
                            borderRadius: "1rem",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                          labelStyle={{
                            color: darkMode ? "#94a3b8" : "#64748b",
                            marginBottom: "4px",
                          }}
                          labelFormatter={(val) =>
                            format(parseISO(val as string), "d  MMMM  yyyy", {
                              locale: ro,
                            })
                          }
                          formatter={(val: number) => [
                            `${val.toFixed(4)} ${
                              historyDirection === "toRON"
                                ? "RON"
                                : selectedHistoryCurrency
                            }`,
                            "Curs",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="displayRate"
                          stroke="#3b82f6"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorRate)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                      <TrendingUp className="w-12 h-12 mb-2" />
                      <p className="text-sm font-black uppercase tracking-widest">
                        Nicio dată disponibilă
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-center sm:text-left">
                    * Sursă date: Frankfurter API (bazat pe BCE)
                  </p>
                  <div className="flex gap-4">
                    {currencyHistory.length > 1 && (
                      <div className="text-center sm:text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                          Variație Periodă
                        </p>
                        {(() => {
                          const firstItem = currencyHistory[0];
                          const lastItem =
                            currencyHistory[currencyHistory.length - 1];
                          const firstVal =
                            historyDirection === "toRON"
                              ? firstItem.rate
                              : 1 / firstItem.rate;
                          const lastVal =
                            historyDirection === "toRON"
                              ? lastItem.rate
                              : 1 / lastItem.rate;
                          const isUp = lastVal >= firstVal;
                          const diff = lastVal - firstVal;
                          const percent = (diff / firstVal) * 100;

                          return (
                            <div
                              className={cn(
                                "text-sm font-black flex items-center justify-center sm:justify-end gap-1",
                                isUp ? "text-green-500" : "text-red-500"
                              )}
                            >
                              {isUp ? (
                                <TrendingUp className="w-3" />
                              ) : (
                                <TrendingDown className="w-3" />
                              )}
                              {percent.toFixed(2)}%
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BNRModal;
