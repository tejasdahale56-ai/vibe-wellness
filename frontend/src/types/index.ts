export type BiometricData = {
  recordedAt: string;
  sleepMinutes: number;
  steps: number;
  restingHeartRateBpm: number;
  hrvMilliseconds: number;
  energyScore: number;
  activeMinutes: number;
};

export type WellnessMetric = {
  id: string;
  label: string;
  value: string;
  description: string;
  icon: string;
  tone: "green" | "amber" | "neutral";
};

export type Meal = {
  id: string;
  name: string;
  mealType?: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  description: string;
  loggedAt: string;
  timeLabel: string;
  tags: string[];
  portionSize?: "small" | "medium" | "large";
  estimatedCalories?: number;
  estimatedProteinG?: number;
  estimatedCarbsG?: number;
  estimatedFatG?: number;
  estimatedFiberG?: number;
  nutritionConfidence?: "low" | "medium" | "high";
};

export type Insight = {
  id: string;
  dateLabel?: string;
  heading?: string;
  score?: number;
  title: string;
  summary: string;
  context?: string;
  methodNote?: string;
  comparison: {
    comparableDays: number;
    averageAfternoonEnergy: number;
  };
  category: "sleep" | "movement" | "nutrition" | "mood" | "general";
};

export type Experiment = {
  id: string;
  title: string;
  description: string;
  why?: string;
  context?: string;
  durationDays: number;
  progressPercent: number;
  status: "planned" | "active" | "completed";
  statusLabel: string;
  selfReportedEnergy?: number;
  energyAfter?: number;
  baselineEnergy?: number;
  reflection?: string;
  completedAt?: string;
  patternSaved?: boolean;
  category?: "sleep" | "meals" | "movement";
  type?: string;
};

export type Pattern = {
  id: string;
  title: string;
  description: string;
  category: "sleep" | "meals" | "movement";
  observationCount: number;
  supportingDetail: string;
};

export type PatternSummary = {
  comparableDays: number;
  observations: number;
  experimentsCompleted: number;
};

export type DashboardData = {
  biometrics: BiometricData;
  metrics: WellnessMetric[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
