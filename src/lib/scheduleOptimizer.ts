import { Appointment, MedicalRecord, ScheduleConfig, DayConfig } from "../appConstants";
import { parseISO, getDay, isSameDay, differenceInDays } from "date-fns";

export interface CaseMix {
  completPct: number;
  controlPct: number;
  standardPct: number;
  gratisPct: number;
  withExamsPct: number;
}

export type CongestionLevel = "scăzut" | "moderat" | "ridicat" | "critic";

export interface DayOptimizationResult {
  dayOfWeek: number; // 1 (Mon) to 6 (Sat)
  dayName: string;
  isAvailable: boolean;
  currentInterval: number;
  recommendedInterval: number;
  currentStartHour: number;
  currentEndHour: number;
  recommendedStartHour: number;
  recommendedEndHour: number;
  historicalConsultationsCount: number;
  activeDaysSampled: number;
  avgConsultationsPerDay: number;
  caseMix: CaseMix;
  avgDurationMinutes: number;
  stdDevDurationMinutes: number;
  currentAvgWaitTimeMinutes: number;
  optimizedAvgWaitTimeMinutes: number;
  waitTimeSavedMinutes: number;
  waitTimeReductionPct: number;
  congestionLevel: CongestionLevel;
  explanation: string;
  actionReason: string;
  isDifferent: boolean;
}

export interface DoctorOptimizationSummary {
  doctorId: string;
  doctorName: string;
  totalAppointmentsAnalyzed: number;
  totalDaysAnalyzed: number;
  currentOverallAvgWaitTime: number;
  optimizedOverallAvgWaitTime: number;
  overallWaitTimeSaved: number;
  overallWaitReductionPct: number;
  days: DayOptimizationResult[];
  hasRecommendations: boolean;
}

export interface ClinicOptimizationOverview {
  doctors: DoctorOptimizationSummary[];
  totalPatientsAnalyzed: number;
  clinicWideAvgWaitBefore: number;
  clinicWideAvgWaitAfter: number;
  clinicWideSavedHoursMonthly: number;
  mostCongestedDoctor: string;
  mostCongestedDay: string;
  generatedAt: string;
}

// Benchmark durations for ophthalmology practice (Oftalmologie)
export const DURATION_BENCHMARKS = {
  COMPLET: 32,    // Refraction, dilated fundus exam, slit lamp, IOP, diagnostics
  STANDARD: 22,   // Routine vision check, glasses/contacts refraction
  CONTROL: 14,    // Follow-up, IOP recheck, post-op control
  GRATIS: 10,     // Quick check or document validation
  EXAM_ADD_ON: 6, // Specific additional procedures (pachymetry, gonioscopy, biometry, etc.)
};

const DAY_NAMES: Record<number, string> = {
  1: "Luni",
  2: "Marți",
  3: "Miercuri",
  4: "Joi",
  5: "Vineri",
  6: "Sâmbătă",
};

const CANDIDATE_INTERVALS = [15, 20, 25, 30, 35, 40, 45, 60];

/**
 * Simulates expected patient waiting time and doctor idle time for a sequence of appointments
 * using Lindley's queueing recursive formula:
 * W_0 = 0
 * W_k = max(0, W_{k-1} + S_{k-1} - Interval)
 */
function simulateQueueWaitTime(
  meanDuration: number,
  stdDevDuration: number,
  interval: number,
  patientCountPerDay: number,
  cancellationRate: number = 0.05
): { avgWaitMinutes: number; maxWaitMinutes: number; avgIdleMinutes: number } {
  if (patientCountPerDay <= 0 || interval <= 0) {
    return { avgWaitMinutes: 0, maxWaitMinutes: 0, avgIdleMinutes: 0 };
  }

  const effectivePatients = Math.max(2, Math.round(patientCountPerDay * (1 - cancellationRate)));
  let totalWait = 0;
  let maxWait = 0;
  let totalIdle = 0;
  let currentWait = 0;

  // Run 100 Monte Carlo repetitions for statistically stable queue wait estimation
  const REPETITIONS = 80;
  let sumAvgWait = 0;
  let sumMaxWait = 0;
  let sumTotalIdle = 0;

  for (let rep = 0; rep < REPETITIONS; rep++) {
    currentWait = 0;
    let repTotalWait = 0;
    let repMaxWait = 0;
    let repTotalIdle = 0;

    for (let i = 0; i < effectivePatients; i++) {
      // Box-Muller transform for normal distribution of consultation length
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const duration = Math.max(8, meanDuration + z * stdDevDuration);

      if (i === 0) {
        // First patient has 0 wait
        currentWait = 0;
      } else {
        const arrivalDelta = interval;
        const previousServiceAndOverrun = currentWait + duration;
        if (previousServiceAndOverrun > arrivalDelta) {
          currentWait = previousServiceAndOverrun - arrivalDelta;
        } else {
          repTotalIdle += arrivalDelta - previousServiceAndOverrun;
          currentWait = 0;
        }
      }

      repTotalWait += currentWait;
      if (currentWait > repMaxWait) {
        repMaxWait = currentWait;
      }
    }

    sumAvgWait += repTotalWait / effectivePatients;
    sumMaxWait += repMaxWait;
    sumTotalIdle += repTotalIdle;
  }

  return {
    avgWaitMinutes: Math.round((sumAvgWait / REPETITIONS) * 10) / 10,
    maxWaitMinutes: Math.round((sumMaxWait / REPETITIONS) * 10) / 10,
    avgIdleMinutes: Math.round((sumTotalIdle / REPETITIONS) * 10) / 10,
  };
}

/**
 * Computes optimal interval for a specific day configuration based on historical load.
 */
function findOptimalInterval(
  meanDuration: number,
  stdDevDuration: number,
  avgPatientsPerDay: number,
  currentInterval: number,
  cancellationRate: number
): { recommendedInterval: number; currentWait: number; optimizedWait: number; reason: string } {
  const currentSim = simulateQueueWaitTime(
    meanDuration,
    stdDevDuration,
    currentInterval,
    avgPatientsPerDay,
    cancellationRate
  );

  let bestInterval = currentInterval;
  let bestScore = Number.MAX_VALUE;
  let bestWait = currentSim.avgWaitMinutes;

  for (const cand of CANDIDATE_INTERVALS) {
    const sim = simulateQueueWaitTime(
      meanDuration,
      stdDevDuration,
      cand,
      avgPatientsPerDay,
      cancellationRate
    );

    // Objective function: heavily penalize patient wait time (weight 1.2),
    // moderate penalty for doctor idle time (weight 0.35)
    // slight penalty for changing from standard 20/30 intervals
    const waitPenalty = Math.pow(sim.avgWaitMinutes, 1.35) * 1.2;
    const idlePenalty = sim.avgIdleMinutes * 0.35;
    const score = waitPenalty + idlePenalty;

    if (score < bestScore) {
      bestScore = score;
      bestInterval = cand;
      bestWait = sim.avgWaitMinutes;
    }
  }

  // Generate clear Romanian reasoning
  let reason = "";
  const diff = bestInterval - currentInterval;
  if (diff > 0) {
    reason = `Volumul de consultații complexe depășește intervalul actual (${currentInterval} min). Mărirea la ${bestInterval} min previne acumularea întârzierilor în cascadă.`;
  } else if (diff < 0) {
    reason = `Ponderea mare de controale rapide permite reducerea la ${bestInterval} min fără a mări timpul de așteptare, optimizând disponibilitatea medicului.`;
  } else {
    reason = `Intervalul actual de ${currentInterval} min este deja echilibrat pentru profilul actual de pacienți.`;
  }

  return {
    recommendedInterval: bestInterval,
    currentWait: currentSim.avgWaitMinutes,
    optimizedWait: bestWait,
    reason,
  };
}

/**
 * Main function: Analyzes workload history for all or specific doctors and returns
 * detailed optimization recommendations.
 */
export function analyzeWorkloadAndOptimizeSchedules(
  appointments: Appointment[] = [],
  medicalRecords: MedicalRecord[] = [],
  configs: ScheduleConfig[] = [],
  doctorNames: Record<string, string> = {},
  targetDoctorId?: string,
  daysHistoryLookback: number = 90
): ClinicOptimizationOverview {
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeMedicalRecords = Array.isArray(medicalRecords) ? medicalRecords : [];
  const safeConfigs = Array.isArray(configs) ? configs : [];
  const safeDoctorNames = doctorNames || {};

  const now = new Date();
  const cutoffDate = daysHistoryLookback > 0
    ? new Date(now.getTime() - daysHistoryLookback * 24 * 60 * 60 * 1000)
    : new Date(0);

  // Filter relevant historical appointments
  const validAppointments = safeAppointments.filter((app) => {
    if (!app || !app.startTime) return false;
    try {
      const d = parseISO(app.startTime);
      if (isNaN(d.getTime())) return false;
      return d >= cutoffDate && d <= now;
    } catch {
      return false;
    }
  });

  // Map of patients for case-mix matching
  const patientRecordMap = new Map<string, MedicalRecord>();
  safeMedicalRecords.forEach((r) => {
    if (!r) return;
    const key = (r.patientName || "").toLowerCase().trim();
    if (key) {
      patientRecordMap.set(key, r);
    }
  });

  // Extract all distinct doctors
  const distinctDoctorIds = targetDoctorId && targetDoctorId !== "all"
    ? [targetDoctorId]
    : Array.from(
        new Set([
          ...safeConfigs.map((c) => c.doctorId),
          ...validAppointments.map((a) => a.doctorId),
        ])
      ).filter((id) => Boolean(id) && id !== "patient");

  const doctorSummaries: DoctorOptimizationSummary[] = [];

  for (const docId of distinctDoctorIds) {
    const docConfig = safeConfigs.find((c) => c.doctorId === docId);
    const docApps = validAppointments.filter((a) => a.doctorId === docId);
    const docName = safeDoctorNames[docId] || `Dr. ${docId}`;

    const daysResults: DayOptimizationResult[] = [];

    // Analyze days Monday (1) through Saturday (6)
    for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek++) {
      const dayCfg: DayConfig = docConfig?.dayConfigs?.[dayOfWeek] || {
        startHour: 9,
        endHour: 17,
        intervalMinutes: 20,
        isAvailable: dayOfWeek <= 5,
      };

      const dayApps = docApps.filter((a) => {
        try {
          return getDay(parseISO(a.startTime)) === dayOfWeek;
        } catch {
          return false;
        }
      });

      // Count unique operating dates sampled
      const uniqueDates = new Set<string>();
      let completCount = 0;
      let controlCount = 0;
      let gratisCount = 0;
      let standardCount = 0;
      let withExamsCount = 0;
      let cancelledCount = 0;

      const hourBookingCounts: Record<number, number> = {};

      dayApps.forEach((app) => {
        try {
          const dt = parseISO(app.startTime);
          if (isNaN(dt.getTime())) return;
          const dateStr = dt.toISOString().split("T")[0];
          uniqueDates.add(dateStr);

          const hr = dt.getHours();
          hourBookingCounts[hr] = (hourBookingCounts[hr] || 0) + 1;

          if (app.status === "cancelled") {
            cancelledCount++;
            return;
          }

          const cleanName = (app.patientName || "").toLowerCase().trim();
          const rec = patientRecordMap.get(cleanName);

          const isComplet =
            Boolean(app.isConsultComplet) ||
            Boolean(rec?.isConsultComplet);
          const isControl =
            Boolean(app.isControl) ||
            Boolean(rec?.isControl);
          const isGratis =
            Boolean(app.isGratis) ||
            Boolean(rec?.isGratis);

          const hasExams = Boolean(
            rec?.examinations &&
            Array.isArray(rec.examinations) &&
            rec.examinations.length > 0
          );

          if (hasExams) withExamsCount++;

          if (isComplet) {
            completCount++;
          } else if (isControl) {
            controlCount++;
          } else if (isGratis) {
            gratisCount++;
          } else {
            standardCount++;
          }
        } catch {
          // ignore parsing error
        }
      });

      const totalActive = completCount + controlCount + gratisCount + standardCount;
      const sampledDays = Math.max(1, uniqueDates.size);
      const avgPatientsPerDay = totalActive > 0 ? totalActive / sampledDays : (dayCfg.isAvailable ? 8 : 0);
      const cancellationRate = dayApps.length > 0 ? cancelledCount / dayApps.length : 0.05;

      // Calculate Case Mix percentages
      const completPct = totalActive > 0 ? (completCount / totalActive) * 100 : 30;
      const controlPct = totalActive > 0 ? (controlCount / totalActive) * 100 : 25;
      const gratisPct = totalActive > 0 ? (gratisCount / totalActive) * 100 : 5;
      const standardPct = totalActive > 0 ? (standardCount / totalActive) * 100 : 40;
      const withExamsPct = totalActive > 0 ? (withExamsCount / totalActive) * 100 : 15;

      // Weighted average duration based on real case-mix
      const weightedDuration =
        (completPct / 100) * DURATION_BENCHMARKS.COMPLET +
        (standardPct / 100) * DURATION_BENCHMARKS.STANDARD +
        (controlPct / 100) * DURATION_BENCHMARKS.CONTROL +
        (gratisPct / 100) * DURATION_BENCHMARKS.GRATIS +
        (withExamsPct / 100) * DURATION_BENCHMARKS.EXAM_ADD_ON;

      const avgDuration = Math.round(weightedDuration * 10) / 10;
      const stdDev = Math.round((Math.max(4, avgDuration * 0.28)) * 10) / 10;

      // Determine congestion level
      let congestionLevel: CongestionLevel = "moderat";
      if (avgPatientsPerDay >= 12 || (avgDuration > dayCfg.intervalMinutes && avgPatientsPerDay >= 7)) {
        congestionLevel = "critic";
      } else if (avgPatientsPerDay >= 8 || avgDuration > dayCfg.intervalMinutes) {
        congestionLevel = "ridicat";
      } else if (avgPatientsPerDay < 4) {
        congestionLevel = "scăzut";
      }

      // Optimize interval
      const { recommendedInterval, currentWait, optimizedWait, reason } = findOptimalInterval(
        avgDuration,
        stdDev,
        avgPatientsPerDay,
        dayCfg.intervalMinutes || 20,
        cancellationRate
      );

      const waitTimeSaved = Math.max(0, currentWait - optimizedWait);
      const waitTimeReductionPct = currentWait > 0
        ? Math.min(95, Math.round((waitTimeSaved / currentWait) * 100))
        : 0;

      // Check hours optimization
      let recommendedStartHour = dayCfg.startHour;
      let recommendedEndHour = dayCfg.endHour;

      // If there is significant history, check if early morning or late evening slots are completely unused
      if (uniqueDates.size >= 3) {
        const hoursWithBookings = Object.keys(hourBookingCounts).map(Number);
        if (hoursWithBookings.length > 0) {
          const minBookedHour = Math.min(...hoursWithBookings);
          const maxBookedHour = Math.max(...hoursWithBookings) + 1;

          // Adjust only if difference is >= 2 hours to avoid micro-shifts
          if (minBookedHour - dayCfg.startHour >= 2 && minBookedHour <= 11) {
            recommendedStartHour = minBookedHour;
          }
          if (dayCfg.endHour - maxBookedHour >= 2 && maxBookedHour >= 14) {
            recommendedEndHour = maxBookedHour;
          }
        }
      }

      const isDifferent =
        recommendedInterval !== dayCfg.intervalMinutes ||
        recommendedStartHour !== dayCfg.startHour ||
        recommendedEndHour !== dayCfg.endHour;

      let detailedExplanation = "";
      if (completPct >= 40) {
        detailedExplanation = `Pondere ridicată de consultații complete (${Math.round(completPct)}% din cazuri) cu durată medie de ${Math.round(avgDuration)} min. `;
      } else if (controlPct >= 40) {
        detailedExplanation = `Pondere mare de controale și evaluări scurte (${Math.round(controlPct)}% din cazuri). `;
      } else {
        detailedExplanation = `Distribuție echilibrată a consultațiilor (${Math.round(avgPatientsPerDay)} pacienți/zi). `;
      }

      if (currentWait >= 20) {
        detailedExplanation += `Timpul actual de așteptare atinge în medie ${Math.round(currentWait)} min din cauza decalajelor cumulate. Cu intervalul optimizat de ${recommendedInterval} min, timpul mediu de așteptare scade la ${Math.round(optimizedWait)} min.`;
      } else {
        detailedExplanation += `Intervalul recomandat de ${recommendedInterval} min menține timpii de așteptare la un nivel minim (${Math.round(optimizedWait)} min).`;
      }

      daysResults.push({
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        isAvailable: dayCfg.isAvailable,
        currentInterval: dayCfg.intervalMinutes || 20,
        recommendedInterval,
        currentStartHour: dayCfg.startHour,
        currentEndHour: dayCfg.endHour,
        recommendedStartHour,
        recommendedEndHour,
        historicalConsultationsCount: totalActive,
        activeDaysSampled: sampledDays,
        avgConsultationsPerDay: Math.round(avgPatientsPerDay * 10) / 10,
        caseMix: {
          completPct: Math.round(completPct),
          controlPct: Math.round(controlPct),
          standardPct: Math.round(standardPct),
          gratisPct: Math.round(gratisPct),
          withExamsPct: Math.round(withExamsPct),
        },
        avgDurationMinutes: avgDuration,
        stdDevDurationMinutes: stdDev,
        currentAvgWaitTimeMinutes: currentWait,
        optimizedAvgWaitTimeMinutes: optimizedWait,
        waitTimeSavedMinutes: waitTimeSaved,
        waitTimeReductionPct,
        congestionLevel,
        explanation: detailedExplanation,
        actionReason: reason,
        isDifferent,
      });
    }

    const availableDays = daysResults.filter((d) => d.isAvailable);
    const currentOverallWait = availableDays.length > 0
      ? Math.round((availableDays.reduce((acc, d) => acc + d.currentAvgWaitTimeMinutes, 0) / availableDays.length) * 10) / 10
      : 0;
    const optimizedOverallWait = availableDays.length > 0
      ? Math.round((availableDays.reduce((acc, d) => acc + d.optimizedAvgWaitTimeMinutes, 0) / availableDays.length) * 10) / 10
      : 0;
    const overallWaitSaved = Math.max(0, currentOverallWait - optimizedOverallWait);
    const overallWaitReduction = currentOverallWait > 0
      ? Math.round((overallWaitSaved / currentOverallWait) * 100)
      : 0;

    doctorSummaries.push({
      doctorId: docId,
      doctorName: docName,
      totalAppointmentsAnalyzed: docApps.length,
      totalDaysAnalyzed: Array.from(new Set(docApps.map((a) => a.startTime?.split("T")[0]))).length,
      currentOverallAvgWaitTime: currentOverallWait,
      optimizedOverallAvgWaitTime: optimizedOverallWait,
      overallWaitTimeSaved: overallWaitSaved,
      overallWaitReductionPct: overallWaitReduction,
      days: daysResults,
      hasRecommendations: daysResults.some((d) => d.isDifferent && d.isAvailable),
    });
  }

  // Clinic wide summary calculations
  const totalAnalyzed = validAppointments.length;
  const allAvailableDays = doctorSummaries.flatMap((d) => d.days.filter((day) => day.isAvailable));

  const clinicWaitBefore = allAvailableDays.length > 0
    ? Math.round((allAvailableDays.reduce((acc, d) => acc + d.currentAvgWaitTimeMinutes, 0) / allAvailableDays.length) * 10) / 10
    : 0;
  const clinicWaitAfter = allAvailableDays.length > 0
    ? Math.round((allAvailableDays.reduce((acc, d) => acc + d.optimizedAvgWaitTimeMinutes, 0) / allAvailableDays.length) * 10) / 10
    : 0;

  // Monthly hours saved estimation: (saved minutes per patient * avg daily patients * 22 working days) / 60
  const totalDailyPatients = doctorSummaries.reduce(
    (acc, d) => acc + d.days.reduce((dAcc, day) => dAcc + day.avgConsultationsPerDay, 0) / Math.max(1, d.days.length),
    0
  );
  const avgSavedMinutesPerPatient = Math.max(0, clinicWaitBefore - clinicWaitAfter);
  const monthlySavedHours = Math.round((totalDailyPatients * avgSavedMinutesPerPatient * 22) / 60);

  // Identify most congested doctor & day
  let mostCongestedDoctor = "N/A";
  let highestWait = -1;
  doctorSummaries.forEach((d) => {
    if (d.currentOverallAvgWaitTime > highestWait) {
      highestWait = d.currentOverallAvgWaitTime;
      mostCongestedDoctor = d.doctorName;
    }
  });

  let mostCongestedDay = "Luni";
  let maxDayCongestionWait = -1;
  allAvailableDays.forEach((d) => {
    if (d.currentAvgWaitTimeMinutes > maxDayCongestionWait) {
      maxDayCongestionWait = d.currentAvgWaitTimeMinutes;
      mostCongestedDay = d.dayName;
    }
  });

  return {
    doctors: doctorSummaries,
    totalPatientsAnalyzed: totalAnalyzed,
    clinicWideAvgWaitBefore: clinicWaitBefore,
    clinicWideAvgWaitAfter: clinicWaitAfter,
    clinicWideSavedHoursMonthly: monthlySavedHours,
    mostCongestedDoctor,
    mostCongestedDay,
    generatedAt: new Date().toISOString(),
  };
}
