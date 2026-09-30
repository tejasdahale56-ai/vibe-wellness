import type {
  DashboardData,
  Experiment,
  Insight,
  Meal,
  Pattern,
  ChatMessage,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    },
  );

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `API request failed (${response.status}): ${message}`,
    );
  }

  return response.json();
}

type ApiDashboardResponse = {
  biometrics: {
    id: number;
    user_id: number;
    recorded_at: string;
    sleep_minutes: number;
    steps: number;
    resting_heart_rate_bpm: number;
    hrv_milliseconds: number;
    energy_score: number;
    active_minutes: number;
  };
  metrics: {
    id: string;
    label: string;
    value: string;
    description: string;
    icon: string;
    tone: string;
  }[];
};

type ApiMeal = {
  id: number;
  user_id: number;
  name: string;
  meal_type?: string | null;
  description: string;
  logged_at: string;
  time_label: string;
  tags: string[];
};

type ApiExperiment = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  why?: string | null;
  context?: string | null;
  duration_days: number;
  progress_percent: number;
  status: "planned" | "active" | "completed";
  status_label: string;
  self_reported_energy?: number | null;
  energy_after?: number | null;
  baseline_energy?: number | null;
  reflection?: string | null;
  completed_at?: string | null;
  pattern_saved: boolean;
  category?: "sleep" | "meals" | "movement" | null;
  type?: string | null;
};

type ApiPattern = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: "sleep" | "meals" | "movement";
  observation_count: number;
  supporting_detail: string;
};

type ApiInsight = {
  id: string;
  date_label?: string | null;
  heading?: string | null;
  score?: number | null;
  title: string;
  summary: string;
  context?: string | null;
  method_note?: string | null;
  comparison: {
    comparable_days: number;
    average_afternoon_energy: number;
  };
  category: "sleep" | "movement" | "nutrition" | "mood" | "general";
};

type ApiChatResponse = {
  message: string;
};

export type AnalyticsSummary = {
  baseline: {
    days: number;
  };
  insight: {
    comparison: {
      comparable_days: number;
    };
  };
};

type ApiPersonalBaselineMetric = {
  baseline: number | null;
  latest: number | null;
  difference: number | null;
};

type ApiPersonalBaseline = {
  observation_count: number;
  latest_recorded_at: string | null;
  metrics: {
    sleep_minutes: ApiPersonalBaselineMetric;
    steps: ApiPersonalBaselineMetric;
    resting_heart_rate_bpm: ApiPersonalBaselineMetric;
    hrv_milliseconds: ApiPersonalBaselineMetric;
    active_minutes: ApiPersonalBaselineMetric;
    energy_score: ApiPersonalBaselineMetric;
  };
};

export type PersonalBaseline = {
  observationCount: number;
  latestRecordedAt?: string;
  metrics: {
    sleepMinutes: ApiPersonalBaselineMetric;
    steps: ApiPersonalBaselineMetric;
    restingHeartRateBpm: ApiPersonalBaselineMetric;
    hrvMilliseconds: ApiPersonalBaselineMetric;
    activeMinutes: ApiPersonalBaselineMetric;
    energyScore: ApiPersonalBaselineMetric;
  };
};

export type PatternAnalysisObservation = {
  kind: string;
  feature_type: string;
  feature_value: string;
  positive_experiments_with_feature: number;
  positive_experiments_analyzed: number;
  repetition_rate: number;
  window_rule: string;
  causal_claim: boolean;
};

export type PatternAnalysisResponse = {
  completed_experiments: number;
  measurable_completed_experiments: number;
  positive_energy_experiments: number;
  positive_experiments_analyzed: number;
  enough_data_for_pattern: boolean;
  minimum_positive_experiments: number;
  observations: PatternAnalysisObservation[];
};

function mapDashboard(
  data: ApiDashboardResponse,
): DashboardData {
  return {
    biometrics: {
      recordedAt: data.biometrics.recorded_at,
      sleepMinutes: data.biometrics.sleep_minutes,
      steps: data.biometrics.steps,
      restingHeartRateBpm:
        data.biometrics.resting_heart_rate_bpm,
      hrvMilliseconds:
        data.biometrics.hrv_milliseconds,
      energyScore: data.biometrics.energy_score,
      activeMinutes: data.biometrics.active_minutes,
    },
    metrics: data.metrics.map((metric) => ({
      id: metric.id,
      label: metric.label,
      value: metric.value,
      description: metric.description,
      icon: metric.icon,
      tone:
        metric.tone === "green" ||
        metric.tone === "amber"
          ? metric.tone
          : "neutral",
    })),
  };
}

function mapMeal(data: ApiMeal): Meal {
  return {
    id: String(data.id),
    name: data.name,
    mealType:
      data.meal_type === "Breakfast" ||
      data.meal_type === "Lunch" ||
      data.meal_type === "Dinner" ||
      data.meal_type === "Snack"
        ? data.meal_type
        : undefined,
    description: data.description,
    loggedAt: data.logged_at,
    timeLabel: data.time_label,
    tags: data.tags || [],
  };
}

function mapExperiment(
  data: ApiExperiment,
): Experiment {
  return {
    id: String(data.id),
    title: data.title,
    description: data.description,
    why: data.why ?? undefined,
    context: data.context ?? undefined,
    durationDays: data.duration_days,
    progressPercent: data.progress_percent,
    status: data.status,
    statusLabel: data.status_label,
    selfReportedEnergy:
      data.self_reported_energy ?? undefined,
    energyAfter: data.energy_after ?? undefined,
    baselineEnergy:
      data.baseline_energy ?? undefined,
    reflection: data.reflection ?? undefined,
    completedAt:
      data.completed_at ?? undefined,
    patternSaved: data.pattern_saved,
    category: data.category ?? undefined,
    type: data.type ?? undefined,
  };
}

function mapPattern(data: ApiPattern): Pattern {
  return {
    id: String(data.id),
    title: data.title,
    description: data.description,
    category: data.category,
    observationCount: data.observation_count,
    supportingDetail: data.supporting_detail,
  };
}

function mapInsight(data: ApiInsight): Insight {
  return {
    id: data.id,
    dateLabel: data.date_label ?? undefined,
    heading: data.heading ?? undefined,
    score: data.score ?? undefined,
    title: data.title,
    summary: data.summary,
    context: data.context ?? undefined,
    methodNote: data.method_note ?? undefined,
    comparison: {
      comparableDays: data.comparison.comparable_days,
      averageAfternoonEnergy:
        data.comparison.average_afternoon_energy,
    },
    category: data.category,
  };
}

export async function getDashboardFromApi(): Promise<DashboardData> {
  const data = await request<ApiDashboardResponse>(
    "/api/dashboard",
  );

  return mapDashboard(data);
}

export async function createBiometricFromApi(biometric: {
  recordedAt: string;
  sleepMinutes: number;
  steps: number;
  restingHeartRateBpm: number;
  hrvMilliseconds: number;
  energyScore: number;
  activeMinutes: number;
}): Promise<void> {
  await request("/api/biometrics", {
    method: "POST",
    body: JSON.stringify({
      recorded_at: biometric.recordedAt,
      sleep_minutes: biometric.sleepMinutes,
      steps: biometric.steps,
      resting_heart_rate_bpm: biometric.restingHeartRateBpm,
      hrv_milliseconds: biometric.hrvMilliseconds,
      energy_score: biometric.energyScore,
      active_minutes: biometric.activeMinutes,
    }),
  });
}

export async function getMealsFromApi(): Promise<Meal[]> {
  const data = await request<ApiMeal[]>(
    "/api/meals",
  );

  return data.map(mapMeal);
}

export async function createMealFromApi(
  meal: Omit<Meal, "id">,
): Promise<Meal> {
  const data = await request<ApiMeal>("/api/meals", {
    method: "POST",
    body: JSON.stringify({
      name: meal.name,
      meal_type: meal.mealType,
      description: meal.description,
      logged_at: meal.loggedAt,
      time_label: meal.timeLabel,
      tags: meal.tags,
    }),
  });

  return mapMeal(data);
}

export async function getExperimentsFromApi(): Promise<Experiment[]> {
  const data = await request<ApiExperiment[]>(
    "/api/experiments",
  );

  return data.map(mapExperiment);
}

export async function getExperimentFromApi(
  experimentId: Experiment["id"],
): Promise<Experiment> {
  const data = await request<ApiExperiment>(
    `/api/experiments/${encodeURIComponent(experimentId)}`,
  );

  return mapExperiment(data);
}

export async function createExperimentFromApi(
  experiment: Omit<Experiment, "id">,
): Promise<Experiment> {
  const data = await request<ApiExperiment>("/api/experiments", {
    method: "POST",
    body: JSON.stringify({
      title: experiment.title,
      description: experiment.description,
      why: experiment.why,
      context: experiment.context,
      duration_days: experiment.durationDays,
      progress_percent: experiment.progressPercent,
      status: experiment.status,
      status_label: experiment.statusLabel,
      self_reported_energy: experiment.selfReportedEnergy,
      energy_after: experiment.energyAfter,
      baseline_energy: experiment.baselineEnergy,
      reflection: experiment.reflection,
      completed_at: experiment.completedAt,
      pattern_saved: experiment.patternSaved,
    }),
  });

  return mapExperiment(data);
}

export async function completeExperimentFromApi(
  experimentId: Experiment["id"],
  selfReportedEnergy: number,
  reflection = "",
): Promise<Experiment> {
  const params = new URLSearchParams({
    self_reported_energy: String(selfReportedEnergy),
    reflection,
  });
  const data = await request<ApiExperiment>(
    `/api/experiments/${encodeURIComponent(experimentId)}/complete?${params}`,
    { method: "PATCH" },
  );

  return mapExperiment(data);
}

export async function getPatternsFromApi(): Promise<Pattern[]> {
  const data = await request<ApiPattern[]>(
    "/api/patterns",
  );

  return data.map(mapPattern);
}

export async function getPatternAnalysisFromApi(): Promise<PatternAnalysisResponse> {
  return request<PatternAnalysisResponse>(
    "/api/patterns/analysis",
  );
}

export async function createPatternFromApi(
  pattern: Omit<Pattern, "id">,
): Promise<Pattern> {
  const data = await request<ApiPattern>("/api/patterns", {
    method: "POST",
    body: JSON.stringify({
      title: pattern.title,
      description: pattern.description,
      category: pattern.category,
      observation_count: pattern.observationCount,
      supporting_detail: pattern.supportingDetail,
    }),
  });

  return mapPattern(data);
}

export async function getTodayInsightFromApi(): Promise<Insight> {
  const data = await request<ApiInsight>(
    "/api/insights/today",
  );

  return mapInsight(data);
}

export async function sendChatMessage(
  messages: ChatMessage[],
): Promise<string> {
  const data = await request<ApiChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });

  return data.message;
}

export async function getAnalyticsSummaryFromApi(): Promise<AnalyticsSummary> {
  return request<AnalyticsSummary>(
    "/api/analytics/summary",
  );
}

export async function getPersonalBaselineFromApi(): Promise<PersonalBaseline> {
  const data = await request<ApiPersonalBaseline>("/api/analytics/baseline");

  return {
    observationCount: data.observation_count,
    latestRecordedAt: data.latest_recorded_at ?? undefined,
    metrics: {
      sleepMinutes: data.metrics.sleep_minutes,
      steps: data.metrics.steps,
      restingHeartRateBpm: data.metrics.resting_heart_rate_bpm,
      hrvMilliseconds: data.metrics.hrv_milliseconds,
      activeMinutes: data.metrics.active_minutes,
      energyScore: data.metrics.energy_score,
    },
  };
}
