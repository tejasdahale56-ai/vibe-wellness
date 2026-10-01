import type { BiometricData, DashboardData, Experiment, Insight, Meal, Pattern, PatternSummary } from "@/types";
import { formatDurationMinutes } from "@/lib/utils";

const todayBiometrics: BiometricData = {
  recordedAt: "2026-10-14T09:00:00.000Z",
  sleepMinutes: 462,
  steps: 8240,
  restingHeartRateBpm: 67,
  hrvMilliseconds: 31,
  energyScore: 6.4,
  activeMinutes: 41,
};

const todayInsight: Insight = {
  id: "insight-afternoon-energy",
  dateLabel: "TODAY’S INSIGHT",
  heading: "Something worth noticing",
  score: 78,
  title: "Afternoon energy may be lower today.",
  summary: "Across 6 comparable days in your recent history, your afternoon energy averaged 5.8 / 10.",
  context: "Today, your current signals look similar to some of those days.",
  methodNote: "VIBE looked at recent biometric signals, today’s meal, and comparable days in your history.",
  comparison: {
    comparableDays: 6,
    averageAfternoonEnergy: 5.8,
  },
  category: "general",
};

const todayMeal: Meal = {
  id: "meal-chicken-biryani",
  name: "Chicken Biryani",
  mealType: "Lunch",
  description: "Medium portion",
  loggedAt: "2026-10-14T13:15:00.000Z",
  timeLabel: "1:15 PM",
  tags: [],
};

let currentTodayMeal = todayMeal;
const mealListeners = new Set<() => void>();

const demoExperiments: Experiment[] = [
  { id: "experiment-after-lunch-walk", title: "Take a 10-minute walk after lunch.", description: "On a few previous higher-energy days, some post-lunch movement was present. One small experiment can help you collect another observation.", context: "VIBE noticed that post-lunch movement appeared on several higher-energy days in your history.", why: "Some of your higher-energy days included movement after lunch. We're curious whether another observation looks similar.", durationDays: 1, progressPercent: 0, status: "planned", statusLabel: "A small experiment" },
];

const demoExperimentResult: Experiment = {
  ...demoExperiments[0],
  status: "completed",
  statusLabel: "Observation recorded",
  selfReportedEnergy: 7,
  energyAfter: 7.1,
  baselineEnergy: 5.8,
  completedAt: "2026-10-14T14:00:00.000Z",
};

let currentExperimentResult: Experiment | null = null;
let savedExperimentPattern: Experiment | null = null;
const experimentResultListeners = new Set<() => void>();

const demoPatterns: Pattern[] = [
  { id: "pattern-sleep-energy", title: "Sleep & afternoon energy", description: "Short-sleep days have coincided with lower afternoon energy in your history.", category: "sleep", observationCount: 6, supportingDetail: "Seen across several comparable days." },
  { id: "pattern-lunch-movement", title: "Post-lunch movement", description: "Post-lunch movement has appeared on several higher-energy days.", category: "movement", observationCount: 3, supportingDetail: "An observation worth exploring further." },
  { id: "pattern-lunch-activity", title: "Meals & afternoon energy", description: "Heavier lunches combined with lower activity have been associated with lower afternoon energy in your recent history.", category: "meals", observationCount: 4, supportingDetail: "Association does not establish cause." },
];

const demoPatternSummary: PatternSummary = {
  comparableDays: 6,
  observations: 3,
  experimentsCompleted: 1,
};

const dashboardData: DashboardData = {
  biometrics: todayBiometrics,
  metrics: [
    { id: "sleep", label: "Sleep", value: todayBiometrics.sleepMinutes === null ? "—" : formatDurationMinutes(todayBiometrics.sleepMinutes), description: "A little more rest", icon: "☾", tone: "green" },
    { id: "resting-heart-rate", label: "Resting HR", value: todayBiometrics.restingHeartRateBpm === null ? "—" : `${todayBiometrics.restingHeartRateBpm} bpm`, description: "At rest", icon: "♡", tone: "neutral" },
    { id: "steps", label: "Steps", value: todayBiometrics.steps?.toLocaleString("en-US") ?? "—", description: "Today so far", icon: "↗", tone: "amber" },
    { id: "hrv", label: "HRV", value: todayBiometrics.hrvMilliseconds === null ? "—" : `${todayBiometrics.hrvMilliseconds} ms`, description: "Daily average", icon: "⌁", tone: "green" },
    { id: "energy", label: "Energy", value: todayBiometrics.energyScore === null ? "—" : `${todayBiometrics.energyScore.toFixed(1)} / 10`, description: "Your check-in", icon: "✳", tone: "neutral" },
    { id: "active-minutes", label: "Active minutes", value: todayBiometrics.activeMinutes === null ? "—" : `${todayBiometrics.activeMinutes} min`, description: "Movement today", icon: "◷", tone: "amber" },
  ],
};

// Replace these mock returns with API calls when a backend is available.
export function getDashboardData(): DashboardData {
  return dashboardData;
}

export function getTodayMeal(): Meal {
  return currentTodayMeal;
}

export function logMeal(meal: Meal): void {
  currentTodayMeal = meal;
  mealListeners.forEach((listener) => listener());
}

export function subscribeToTodayMeal(listener: () => void): () => void {
  mealListeners.add(listener);
  return () => mealListeners.delete(listener);
}

export function getInsight(): Insight {
  return todayInsight;
}

export function getPatterns(): Pattern[] {
  return demoPatterns;
}

export function getPatternSummary(): PatternSummary {
  return demoPatternSummary;
}

export function getExperiments(): Experiment[] {
  return demoExperiments;
}

export function getExperimentResult(): Experiment {
  return currentExperimentResult ?? demoExperimentResult;
}

export function hasCompletedExperimentThisSession(): boolean {
  return currentExperimentResult !== null;
}

export function completeExperiment(selfReportedEnergy: number, reflection: string): void {
  currentExperimentResult = {
    ...demoExperimentResult,
    selfReportedEnergy,
    reflection: reflection.trim(),
    completedAt: new Date().toISOString(),
  };
  experimentResultListeners.forEach((listener) => listener());
}

export function subscribeToExperimentResult(listener: () => void): () => void {
  experimentResultListeners.add(listener);
  return () => experimentResultListeners.delete(listener);
}

export function saveExperimentPattern(): void {
  savedExperimentPattern = { ...getExperimentResult(), patternSaved: true };
}

export function getSavedExperimentPattern(): Experiment | null {
  return savedExperimentPattern;
}
