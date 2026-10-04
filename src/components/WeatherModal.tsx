import React from "react";
import { motion } from "motion/react";
import { X, RefreshCw, AlertTriangle, Droplets, Wind } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ro } from "date-fns/locale";
import { WeatherIcon, getWeatherDescription, WeatherData } from "../appConstants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  fetchWeather: () => void;
  darkMode: boolean;
  currentTime: Date;
}

export const WeatherModal = React.memo(function WeatherModal({
  isOpen,
  onClose,
  weather,
  weatherLoading,
  weatherError,
  fetchWeather,
  darkMode,
  currentTime,
}: WeatherModalProps) {
  if (!isOpen) return null;

  return (
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
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
        )}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <h3
              className={cn(
                "text-3xl font-black uppercase tracking-tighter",
                darkMode ? "text-white" : "text-slate-900",
              )}
            >
              Vremea în Pitești
            </h3>
            <p
              className={cn(
                "text-sm font-bold opacity-60 uppercase tracking-widest",
                darkMode ? "text-slate-400" : "text-slate-505",
              )}
            >
              Argeș, România
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchWeather}
              disabled={weatherLoading}
              title="Reîmprospătează Vreme"
              className={cn(
                "p-3 rounded-2xl transition-all cursor-pointer",
                weatherLoading && "opacity-50 cursor-not-allowed",
                darkMode
                  ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900",
              )}
            >
              <RefreshCw className={cn("w-5 h-5", weatherLoading && "animate-spin")} />
            </button>
            <button
              onClick={onClose}
              className={cn(
                "p-3 rounded-2xl transition-all cursor-pointer",
                darkMode
                  ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  : "bg-slate-100 text-slate-505 hover:bg-slate-200 hover:text-slate-900",
              )}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 pt-0 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {weatherLoading && !weather ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-60">
                Se încarcă datele meteo...
              </p>
            </div>
          ) : weatherError && !weather ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-center px-4">
              <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 dark:bg-rose-500/20">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-extrabold uppercase tracking-wider text-rose-500">
                  Eroare de Conectare Meteo
                </p>
                <p className="text-xs text-slate-505 dark:text-slate-400 max-w-md font-semibold leading-relaxed">
                  {weatherError || "Nu s-au putut prelua datele despre vreme de la serverul Open-Meteo."}
                </p>
              </div>
              <button
                onClick={fetchWeather}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs text-white font-black rounded-2xl shadow-md transition-all uppercase tracking-wider h-11 flex items-center gap-2 cursor-pointer outline-none"
              >
                <RefreshCw className="w-4 h-4" />
                Reîncearcă Preluarea
              </button>
            </div>
          ) : weather ? (
            <>
              {/* Current Weather card */}
              <div
                className={cn(
                  "p-8 rounded-[2rem] border flex flex-col sm:flex-row items-center justify-between gap-8",
                  darkMode ? "bg-slate-800/50 border-slate-700" : "bg-blue-50/50 border-blue-100",
                )}
              >
                <div className="flex items-center gap-6">
                  <div className="p-6 rounded-[1.5rem] bg-white/10 backdrop-blur-md shadow-xl border border-white/10">
                    <WeatherIcon
                      code={weather.current.weatherCode}
                      className="w-16 h-16 text-amber-500 drop-shadow-lg"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-6xl font-black font-mono leading-none",
                        darkMode ? "text-white" : "text-slate-900",
                      )}
                    >
                      {Math.round(weather.current.temp)}°
                    </span>
                    <span
                      className={cn(
                        "text-sm font-black uppercase tracking-widest mt-2",
                        darkMode ? "text-blue-400" : "text-blue-600",
                      )}
                    >
                      {getWeatherDescription(weather.current.weatherCode)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        Umiditate
                      </span>
                      <span className="text-sm font-black font-mono">
                        {weather.current.humidity}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                      <Wind className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        Vânt
                      </span>
                      <span className="text-sm font-black font-mono">
                        {weather.current.windSpeed} km/h
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly Forecast */}
              <div>
                <h4
                  className={cn(
                    "text-xs font-black uppercase tracking-widest mb-4 opacity-70",
                    darkMode ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  Următoarele ore
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                  {weather.hourly.time.slice(0, 24).map((time, i) => {
                    const d = new Date(time);
                    const hour = format(d, "HH:mm");
                    const isNow = i === new Date().getHours();
                    return (
                      <div
                        key={time}
                        className={cn(
                          "flex flex-col items-center gap-3 min-w-[70px] p-4 rounded-2xl border transition-all",
                          isNow
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30 ring-2 ring-blue-500/20"
                            : darkMode
                              ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800/50"
                              : "bg-white border-slate-100 hover:bg-slate-50 shadow-sm",
                        )}
                      >
                        <span className="text-[10px] font-black">{hour}</span>
                        <WeatherIcon
                          code={weather.hourly.weatherCode[i]}
                          className={cn("w-6 h-6", isNow ? "text-white" : "text-amber-500")}
                        />
                        <span className="text-sm font-black font-mono">
                          {Math.round(weather.hourly.temp[i])}°
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Forecast */}
              <div>
                <h4
                  className={cn(
                    "text-xs font-black uppercase tracking-widest mb-4 opacity-70",
                    darkMode ? "text-slate-400" : "text-slate-505",
                  )}
                >
                  Următoarele 7 zile
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {weather.daily.time.map((time, i) => {
                    const date = new Date(time);
                    const isToday = isSameDay(date, new Date());
                    return (
                      <div
                        key={time}
                        className={cn(
                          "flex items-center justify-between p-4 px-6 rounded-2xl border transition-all",
                          isToday
                            ? "bg-blue-600/5 border-blue-500/20"
                            : darkMode
                              ? "bg-slate-800/20 border-slate-700"
                              : "bg-slate-50/50 border-slate-100",
                        )}
                      >
                        <div className="flex items-center gap-4 w-40">
                          <div className="flex flex-col">
                            <span
                              className={cn(
                                "text-[11px] font-black uppercase tracking-widest",
                                isToday ? "text-blue-500" : "",
                              )}
                            >
                              {isToday ? "Azi" : format(date, "EEEE", { locale: ro })}
                            </span>
                            <span className="text-[9px] font-bold opacity-50 lowercase first-letter:uppercase">
                              {format(date, "dd  MMMM  yyyy", { locale: ro })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-1 justify-center">
                          <WeatherIcon code={weather.daily.weatherCode[i]} className="w-6 h-6 text-amber-500" />
                          <span className="text-[10px] font-bold opacity-60 w-24 text-center">
                            {getWeatherDescription(weather.daily.weatherCode[i])}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 w-32 justify-end">
                          <span className="text-sm font-black font-mono">
                            {Math.round(weather.daily.tempMax[i])}°
                          </span>
                          <span className="text-sm font-black font-mono opacity-30">
                            {Math.round(weather.daily.tempMin[i])}°
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className={cn("p-4 flex items-center justify-center gap-2", darkMode ? "bg-slate-950/50" : "bg-slate-50")}>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
            Actualizat la {format(currentTime, "HH:mm")} • Open-Meteo.com
          </span>
        </div>
      </motion.div>
    </div>
  );
});
