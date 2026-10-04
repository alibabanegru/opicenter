import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceDot,
  Label
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User } from 'lucide-react';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MyopiaDataPoint {
  age: number;
  p2: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p98: number;
}

// Approximate data based on Tideman et al. (2018)
const GIRLS_DATA: MyopiaDataPoint[] = [
  { age: 6, p2: 20.8, p5: 21.2, p10: 21.5, p25: 22.0, p50: 22.5, p75: 23.0, p90: 23.5, p95: 23.8, p98: 24.2 },
  { age: 9, p2: 21.3, p5: 21.8, p10: 22.2, p25: 22.7, p50: 23.2, p75: 23.8, p90: 24.4, p95: 24.8, p98: 25.3 },
  { age: 12, p2: 21.6, p5: 22.2, p10: 22.6, p25: 23.1, p50: 23.5, p75: 24.3, p90: 25.0, p95: 25.5, p98: 26.1 },
  { age: 15, p2: 21.7, p5: 22.3, p10: 22.7, p25: 23.2, p50: 23.7, p75: 24.6, p90: 25.5, p95: 26.2, p98: 26.8 },
  { age: 21, p2: 21.6, p5: 22.2, p10: 22.6, p25: 23.2, p50: 23.8, p75: 24.8, p90: 25.8, p95: 26.5, p98: 27.2 },
];

const BOYS_DATA: MyopiaDataPoint[] = [
  { age: 6, p2: 21.3, p5: 21.7, p10: 22.0, p25: 22.5, p50: 23.0, p75: 23.5, p90: 24.0, p95: 24.3, p98: 24.7 },
  { age: 9, p2: 21.8, p5: 22.3, p10: 22.7, p25: 23.2, p50: 23.7, p75: 24.3, p90: 24.9, p95: 25.3, p98: 25.8 },
  { age: 12, p2: 22.1, p5: 22.7, p10: 23.1, p25: 23.6, p50: 24.0, p75: 24.8, p90: 25.5, p95: 26.0, p98: 26.6 },
  { age: 15, p2: 22.2, p5: 22.8, p10: 23.2, p25: 23.7, p50: 24.2, p75: 25.1, p90: 26.0, p95: 26.7, p98: 27.3 },
  { age: 21, p2: 22.1, p5: 22.7, p10: 23.1, p25: 23.7, p50: 24.3, p75: 25.3, p90: 26.3, p95: 27.0, p98: 27.7 },
];

interface MyopiaChartProps {
  sex?: 'M' | 'F' | '';
  patientData: { age: number; axialLength: number; date?: string; isFromHistory?: boolean; historyItem?: any }[];
  darkMode?: boolean;
  onDeletePoint?: (item: any) => void;
}

const PERCENTILE_COLORS: Record<string, string> = {
  p98: '#991b1b', // Dark Red
  p95: '#dc2626', // Red
  p90: '#ea580c', // Orange-Red
  p75: '#f97316', // Orange
  p50: '#eab308', // Yellow
  p25: '#84cc16', // Lime
  p10: '#22c55e', // Green
  p5: '#16a34a',  // Dark Green
  p2: '#15803d',  // Deep Green
};

const GIRLS_RISK: Record<string, string> = {
  p98: 'Risc de miopie 100%, risc de miopie forte 31%',
  p95: 'Risc de miopie 100%, risc de miopie forte 16%',
  p90: 'Risc de miopie 87%, risc de miopie forte 9%',
  p75: 'Risc de miopie 61%, risc de miopie forte 1%',
  p50: 'Risc de miopie 33%, fără risc de miopie forte',
  p25: 'Risc de miopie 16%, fără risc de miopie forte',
  p10: 'Risc de miopie 8%, fără risc de miopie forte',
  p5: 'Risc de miopie 4%, fără risc de miopie forte',
  p2: 'Fără risc de miopie',
};

const BOYS_RISK: Record<string, string> = {
  p98: 'Risc de miopie 100%, risc de miopie forte 43%',
  p95: 'Risc de miopie 94%, risc de miopie forte 16%',
  p90: 'Risc de miopie 94%, risc de miopie forte 8%',
  p75: 'Risc de miopie 73%, fără risc de miopie forte',
  p50: 'Risc de miopie 26%, risc de miopie forte 0.2%',
  p25: 'Risc de miopie 12%, risc de miopie forte 0.2%',
  p10: 'Risc de miopie 5%, fără risc de miopie forte',
  p5: 'Risc de miopie 1%, fără risc de miopie forte',
  p2: 'Risc de miopie 2%, fără risc de miopie forte',
};

const MyopiaChart: React.FC<MyopiaChartProps> = ({ sex, patientData, darkMode, onDeletePoint }) => {
  const isMale = sex === 'M';
  const chartData = isMale ? BOYS_DATA : GIRLS_DATA;
  const riskLabels = isMale ? BOYS_RISK : GIRLS_RISK;
  
  // Combine chart data with patient data for the line
  const sortedPatientData = [...(patientData || [])]
    .filter(d => d && typeof d.axialLength === 'number' && d.axialLength > 0 && !isNaN(d.age))
    .sort((a, b) => a.age - b.age);

  const minPatientAge = sortedPatientData.length > 0 ? Math.min(...sortedPatientData.map(d => d.age)) : 6;
  const maxPatientAge = sortedPatientData.length > 0 ? Math.max(...sortedPatientData.map(d => d.age)) : 21;
  const minAL = sortedPatientData.length > 0 ? Math.min(...sortedPatientData.map(d => d.axialLength)) : 21;
  const maxAL = sortedPatientData.length > 0 ? Math.max(...sortedPatientData.map(d => d.axialLength)) : 26;

  const xAxisMin = Math.max(1, Math.min(5, Math.floor(minPatientAge)));
  const xAxisMax = Math.max(21, Math.ceil(maxPatientAge));
  const yAxisMin = Math.max(16, Math.min(20, Math.floor(minAL - 0.5)));
  const yAxisMax = Math.min(32, Math.max(28, Math.ceil(maxAL + 0.5)));

  const textColor = darkMode ? '#cbd5e1' : '#475569';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';

  const [hoveredPoint, setHoveredPoint] = React.useState<any | null>(null);
  const hoverTimeoutRef = React.useRef<any>(null);

  const handleDotMouseEnter = (dotProps: any) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const { cx, cy, payload } = dotProps;
    setHoveredPoint({
      x: cx,
      y: cy,
      data: payload
    });
  };

  const handleDotMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPoint(null);
    }, 400); // 400ms allows the user to transition from dot to tooltip smoothly
  };

  const handleTooltipMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPoint(null);
    }, 400); // Also delay leaving the tooltip so buttons are safely clickable
  };

  const formatDateSafe = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateStr;
    }
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || payload.age === undefined) return null;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#3b82f6"
        stroke="#fff"
        strokeWidth={2}
        className="cursor-pointer hover:r-8 transition-all"
        onMouseEnter={() => handleDotMouseEnter(props)}
        onMouseLeave={handleDotMouseLeave}
      />
    );
  };

  // Calculate current risk based on last measurement
  const lastMeasurement = sortedPatientData.length > 0 ? sortedPatientData[sortedPatientData.length - 1] : null;
  
  const getCurrentRisk = () => {
    if (!lastMeasurement || !chartData || chartData.length === 0) return null;
    
    const age = lastMeasurement.age;
    const al = lastMeasurement.axialLength;
    
    // Find the closest age point in chart data
    const agePoint = chartData.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.age - age);
      const currDiff = Math.abs(curr.age - age);
      return currDiff < prevDiff ? curr : prev;
    });
    
    // Find which percentile the current AL is closest to or between
    const percentiles = [98, 95, 90, 75, 50, 25, 10, 5, 2];
    let closestP = 2;
    
    for (const p of percentiles) {
      const pVal = (agePoint as any)[`p${p}`];
      if (typeof pVal === 'number' && al >= pVal) {
        closestP = p;
        break;
      }
    }
    
    return {
      percentile: closestP,
      riskText: riskLabels[`p${closestP}`] || 'Analiză risk indisponibilă'
    };
  };

  const currentRisk = getCurrentRisk();

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <div className="w-full h-[400px] mt-4 relative overflow-visible flex items-center justify-center">
        {/* Background Gender Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className={cn(
            "text-[120px] font-black opacity-[0.1] dark:opacity-[0.15] tracking-tighter",
            isMale ? "text-blue-500" : sex === 'F' ? "text-rose-500" : "text-slate-500"
          )}>
            {isMale ? '♂' : sex === 'F' ? '♀' : ''}
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="age" 
              type="number" 
              domain={[xAxisMin, xAxisMax]} 
              ticks={Array.from(new Set([xAxisMin, 5, 10, 15, 20, 21, xAxisMax])).filter(t => t >= xAxisMin && t <= xAxisMax).sort((a, b) => a - b)}
              stroke={textColor}
              tickFormatter={(value) => value >= 21 ? 'Adulți' : value.toString()}
            >
              <Label value="Vârstă (ani)" offset={-10} position="insideBottom" fill={textColor} style={{ fontWeight: 'bold' }} />
            </XAxis>
            <YAxis 
              domain={[yAxisMin, yAxisMax]} 
              stroke={textColor}
            >
              <Label value="Lungime axială (mm)" angle={-90} position="insideLeft" fill={textColor} style={{ fontWeight: 'bold' }} />
            </YAxis>
            <Tooltip 
              contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: textColor }}
              formatter={(value: any, name: string) => [value.toFixed(2) + ' mm', name]}
              labelFormatter={(label) => `Vârstă ${label === 21 ? 'Adulți' : label + ' ani'}`}
              itemSorter={(item) => (item.value as number) * -1}
            />
            
            {/* Percentile Lines */}
            {[98, 95, 90, 75, 50, 25, 10, 5, 2].map((p) => (
              <Line
                key={p}
                data={chartData}
                type="monotone"
                dataKey={`p${p}`}
                name={`Percentila ${p}`}
                stroke={PERCENTILE_COLORS[`p${p}`]}
                strokeWidth={p === 50 ? 2 : 1}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}

            {/* Patient Data Line with hoverable custom dots */}
            <Line
              data={sortedPatientData}
              type="linear"
              dataKey="axialLength"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={<CustomDot />}
              name="Pacient"
            />

            {/* Labels for percentiles at the end of the curves */}
            {chartData.length > 0 && [98, 95, 90, 75, 50, 25, 10, 5, 2].map((p) => {
              const lastPoint = chartData[chartData.length - 1];
              return (
                <ReferenceDot
                  key={`label-${p}`}
                  x={lastPoint.age}
                  y={(lastPoint as any)[`p${p}`]}
                  r={0}
                  label={{ position: 'right', value: p.toString(), fill: PERCENTILE_COLORS[`p${p}`], fontSize: 10, fontWeight: 'bold' }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>

        {/* Floating Tooltip with absolute coordinates from cx, cy relative wrapper */}
        {hoveredPoint && (
          <div
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            className={cn(
              "absolute z-50 p-4 rounded-2xl shadow-xl border w-60 flex flex-col gap-2 transition-all duration-200 pointer-events-auto",
              darkMode 
                ? "bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/80" 
                : "bg-white border-slate-200 text-slate-900 shadow-slate-200/50"
            )}
            style={{
              top: Math.max(10, hoveredPoint.y - 145), // Positioned above the dot with boundary check
              left: Math.max(10, Math.min(650, hoveredPoint.x - 120)), // Centered with boundary checks
            }}
          >
            {/* Simple arrow design pointing down to dot */}
            <div 
              className={cn(
                "absolute bottom-[-5px] left-[114px] w-2.5 h-2.5 rotate-45 border-r border-b",
                darkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
              )} 
            />

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Pacient</span>
                <span className={cn("text-[11px] font-mono px-2 py-0.5 rounded-full font-bold", darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600")}>
                  {hoveredPoint.data.age.toFixed(1)} ani
                </span>
              </div>
              <div className="text-xl font-black text-rose-500 dark:text-rose-400 tracking-tight mt-1">
                {hoveredPoint.data.axialLength.toFixed(2)} mm
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1 border-t border-slate-100 dark:border-slate-850/60 pt-2">
              <div className="flex justify-between">
                <span>Data măsurată:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatDateSafe(hoveredPoint.data.date)}</span>
              </div>
            </div>

            {onDeletePoint && (
              <button
                type="button"
                onClick={() => {
                  onDeletePoint(hoveredPoint.data);
                  setHoveredPoint(null);
                }}
                className="mt-1.5 w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-all tracking-wide flex items-center justify-center gap-1 shadow-md border border-rose-500"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Șterge
              </button>
            )}
          </div>
        )}
      </div>

      {currentRisk && (
        <div className={cn(
          "p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all",
          darkMode ? "bg-slate-800/50 border-blue-500/20" : "bg-blue-50 border-blue-200"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PERCENTILE_COLORS[`p${currentRisk.percentile}`] }} />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Analiză Risc (Percentila {currentRisk.percentile})</span>
          </div>
          <p className={cn("text-lg font-bold leading-tight", darkMode ? "text-slate-100" : "text-slate-900")}>
            {currentRisk.riskText}
          </p>
          <p className="text-[10px] mt-2 text-slate-500 italic">
            Bazat pe ultima măsurătoare: {lastMeasurement.axialLength.toFixed(2)} mm la vârsta de {lastMeasurement.age} ani.
          </p>
        </div>
      )}

      <p className="text-center text-[10px] text-slate-500 italic">
        Grafice de creștere a lungimii axiale pentru copiii europeni, în funcție de sex. (Tideman et al.)
      </p>
    </div>
  );
};

export default React.memo(MyopiaChart);
