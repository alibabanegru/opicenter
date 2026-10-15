import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { TrendingUp, RefreshCw } from "lucide-react";
import { DOCTOR_ROLES, cn } from "../appConstants";
import { Users } from "lucide-react";

export interface AdminStatsPanelProps {
  darkMode: boolean;
  adminStatsDoctor: string;
  setAdminStatsDoctor: (doc: string) => void;
  adminStatsYear: string;
  setAdminStatsYear: (year: string) => void;
  adminStatsMonth: string;
  setAdminStatsMonth: (month: string) => void;
  adminStatsDay: string;
  setAdminStatsDay: (day: string) => void;
  availableYears: string[];
  activeDoctorRoles: string[];
  getRoleLabel: (role: any) => string;
  statsData: {
    totalPatients: number;
    reveniriCount: number;
    consultatiiCompleteCount: number;
    ochelariCount: number;
    doarTratamentCount: number;
    alteCount: number;
    categories: Array<{ name: string; value: number; color: string }>;
  };
}

export const AdminStatsPanel: React.FC<AdminStatsPanelProps> = ({
  darkMode,
  adminStatsDoctor,
  setAdminStatsDoctor,
  adminStatsYear,
  setAdminStatsYear,
  adminStatsMonth,
  setAdminStatsMonth,
  adminStatsDay,
  setAdminStatsDay,
  availableYears,
  activeDoctorRoles,
  getRoleLabel,
  statsData,
}) => {
  return (
    <div className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          Statistici Clinică & Evidență Trimestrială
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                          Aici aveți evidența detaliată a pacienților, serviciilor medicale prestate și activitatea medicilor.
                        </p>
                      </div>

                      {/* Reset Filters button */}
                      <button
                        onClick={() => {
                          setAdminStatsDoctor("all");
                          setAdminStatsYear("all");
                          setAdminStatsMonth("all");
                          setAdminStatsDay("all");
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resetează Filtre
                      </button>
                    </div>

                    {/* Filter Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-900/40">
                      {/* Doctor Filter */}
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase px-1 tracking-wider">
                          Medic:
                        </label>
                        <select
                          value={adminStatsDoctor}
                          onChange={(e) => setAdminStatsDoctor(e.target.value)}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                            darkMode
                              ? "bg-slate-900 border-slate-700 text-slate-100"
                              : "bg-white border-slate-200 text-slate-900"
                          )}
                        >
                          <option value="all">Toți Medicii</option>
                          {activeDoctorRoles.map((role) => (
                            <option key={role} value={role}>
                              {getRoleLabel(role)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Year Filter */}
                      <div className="space-y-1.5 flex flex-col justify-end border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase px-1 tracking-wider">
                          An:
                        </label>
                        <select
                          value={adminStatsYear}
                          onChange={(e) => setAdminStatsYear(e.target.value)}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                            darkMode
                              ? "bg-slate-900 border-slate-700 text-slate-100"
                              : "bg-white border-slate-200 text-slate-900"
                          )}
                        >
                          <option value="all">Toți Anii</option>
                          {availableYears.map((yr) => (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Month Filter */}
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase px-1 tracking-wider">
                          Lună:
                        </label>
                        <select
                          value={adminStatsMonth}
                          onChange={(e) => setAdminStatsMonth(e.target.value)}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                            darkMode
                              ? "bg-slate-900 border-slate-700 text-slate-100"
                              : "bg-white border-slate-200 text-slate-900"
                          )}
                        >
                          <option value="all">Toate Lunile</option>
                          {[
                            { value: "0", label: "Ianuarie" },
                            { value: "1", label: "Februarie" },
                            { value: "2", label: "Martie" },
                            { value: "3", label: "Aprilie" },
                            { value: "4", label: "Mai" },
                            { value: "5", label: "Iunie" },
                            { value: "6", label: "Iulie" },
                            { value: "7", label: "August" },
                            { value: "8", label: "Septembrie" },
                            { value: "9", label: "Octombrie" },
                            { value: "10", label: "Noiembrie" },
                            { value: "11", label: "Decembrie" },
                          ].map((mo) => (
                            <option key={mo.value} value={mo.value}>
                              {mo.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Day Filter */}
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase px-1 tracking-wider">
                          Filtru Zi:
                        </label>
                        <div className="flex gap-1">
                          <select
                            value={adminStatsDay === "all" || adminStatsDay === "today" ? adminStatsDay : "custom"}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "all" || val === "today") {
                                setAdminStatsDay(val);
                              } else {
                                setAdminStatsDay(new Date().toISOString().substring(0, 10));
                              }
                            }}
                            className={cn(
                              "flex-1 px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                              darkMode
                                ? "bg-slate-900 border-slate-700 text-slate-100"
                                : "bg-white border-slate-200 text-slate-900"
                            )}
                          >
                            <option value="all">Toate Zilele</option>
                            <option value="today">Azi</option>
                            <option value="custom">Dată Specifică</option>
                          </select>
                          {adminStatsDay !== "all" && adminStatsDay !== "today" && (
                            <input
                              type="date"
                              value={adminStatsDay}
                              onChange={(e) => setAdminStatsDay(e.target.value)}
                              className={cn(
                                "flex-1 px-2 py-1.5 rounded-xl border text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 transition-all",
                                darkMode
                                  ? "bg-slate-900 border-slate-700 text-slate-100"
                                  : "bg-white border-slate-200 text-slate-900"
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Summary & Pie Chart Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                      {/* Left: Detailed stats */}
                      <div className="lg:col-span-2 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                          {/* Total Indicator */}
                          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                Total Consultații Active
                              </p>
                              <h4 className="text-2xl font-black font-sans leading-none mt-1">
                                {statsData.totalPatients}
                              </h4>
                            </div>
                            <div className="p-2 w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-500" />
                            </div>
                          </div>

                          {/* Breakdowns */}
                          <div className="space-y-2">
                            {[
                              {
                                name: "Sesiuni Control / Reveniri",
                                count: statsData.reveniriCount,
                                colorBg: darkMode ? "bg-purple-950/20" : "bg-purple-50",
                                border: "border-purple-500/20",
                                text: "text-purple-600 dark:text-purple-400",
                                dotBg: "bg-purple-500"
                              },
                              {
                                name: "Consultații Complete",
                                count: statsData.consultatiiCompleteCount,
                                colorBg: darkMode ? "bg-blue-950/20" : "bg-blue-50",
                                border: "border-blue-500/20",
                                text: "text-blue-600 dark:text-blue-400",
                                dotBg: "bg-blue-500"
                              },
                              {
                                name: "Ochelari Comandați",
                                count: statsData.ochelariCount,
                                colorBg: darkMode ? "bg-emerald-950/20" : "bg-emerald-50",
                                border: "border-emerald-500/20",
                                text: "text-emerald-500 dark:text-emerald-400",
                                dotBg: "bg-emerald-500"
                              },
                              {
                                name: "Doar cu Tratament",
                                count: statsData.doarTratamentCount,
                                colorBg: darkMode ? "bg-amber-950/20" : "bg-amber-50",
                                border: "border-amber-500/20",
                                text: "text-amber-550 dark:text-amber-400",
                                dotBg: "bg-amber-500"
                              },
                              {
                                name: "Consult Simplu / Altele",
                                count: statsData.alteCount,
                                colorBg: darkMode ? "bg-slate-950/20" : "bg-slate-50",
                                border: "border-slate-500/15",
                                text: "text-slate-600 dark:text-slate-400",
                                dotBg: "bg-slate-500"
                              }
                            ].map((cat, idx) => {
                              const percent = statsData.totalPatients > 0
                                ? ((cat.count / statsData.totalPatients) * 100).toFixed(0)
                                : "0";
                              return (
                                <div
                                  key={idx}
                                  className={cn(
                                    "p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all",
                                    cat.colorBg,
                                    cat.border
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full shrink-0", cat.dotBg)} />
                                    <span className={darkMode ? "text-slate-200" : "text-slate-705"}>
                                      {cat.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs dark:text-white">
                                      {cat.count}
                                    </span>
                                    <span className={cn("text-[9px] font-black px-1 py-0.5 rounded-md border", cat.border, cat.text)}>
                                      {percent}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Pie chart */}
                      <div className="lg:col-span-3 flex flex-col items-center justify-center p-4 rounded-3xl border border-slate-150 dark:border-slate-800 bg-slate-500/5 min-h-[285px]">
                        {statsData.totalPatients === 0 ? (
                          <div className="text-center text-slate-450 italic py-12 flex flex-col items-center gap-2">
                            <TrendingUp className="w-10 h-10 text-slate-350 shrink-0" />
                            <p className="text-xs font-bold">Nu există consultații înregistrate conform filtrelor.</p>
                            <p className="text-[10px]">Selectați alt medic, an sau lună.</p>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center">
                            <div className="w-full h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={statsData.categories.filter(c => c.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {statsData.categories.filter(c => c.value > 0).map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={({ active, payload }: any) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const total = statsData.totalPatients || 1;
                                        const pct = ((data.value / total) * 100).toFixed(1);
                                        return (
                                          <div className="bg-slate-950 border border-slate-800 text-white p-3 rounded-xl shadow-2xl text-[11px] font-bold space-y-1">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                              {data.name}
                                            </p>
                                            <p className="text-xs font-extrabold flex items-center justify-between gap-4">
                                              <span>Pacienți:</span>
                                              <span className="text-blue-400 font-mono text-sm">{data.value}</span>
                                            </p>
                                            <p className="text-xs text-emerald-400 font-bold flex items-center justify-between">
                                              <span>Proporție:</span>
                                              <span className="font-mono">{pct}%</span>
                                            </p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2 px-2">
                              {statsData.categories.filter(c => c.value > 0).map((cat, index) => (
                                <div key={index} className="flex items-center gap-1 text-[10px] font-bold">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                  <span className={darkMode ? "text-slate-400" : "text-slate-500"}>
                                    {cat.name} ({cat.value})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

  );
};
