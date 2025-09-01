// MTM (Methods Time Measurement) Standard Time References
// Based on industrial engineering standards for occupational tasks

export interface MTMStandard {
  taskId: string;
  taskName: string;
  standardTime: number; // in seconds
  unit: string;
  factors: {
    weight?: number; // lbs
    distance?: number; // feet
    reps?: number;
    difficulty?: "easy" | "medium" | "hard";
  };
  description: string;
}

export interface MTMCalculationParams {
  weight?: number;
  distance?: number;
  reps?: number;
  difficulty?: "easy" | "medium" | "hard";
}

// Base MTM standards for different occupational tasks
export const MTM_STANDARDS: Record<string, MTMStandard> = {
  fingering: {
    taskId: "fingering",
    taskName: "Fingering",
    standardTime: 12.0, // 12 seconds for standard fingering task
    unit: "seconds",
    factors: {
      reps: 10,
      difficulty: "medium",
    },
    description: "Fine motor dexterity task requiring precise finger movements",
  },

  "reach-immediate": {
    taskId: "reach-immediate",
    taskName: "Reach Immediate",
    standardTime: 8.5, // 8.5 seconds for immediate reach
    unit: "seconds",
    factors: {
      distance: 18, // inches
      difficulty: "easy",
    },
    description: "Immediate reaching movement within arm's length",
  },

  "reach-extended": {
    taskId: "reach-extended",
    taskName: "Reach Extended",
    standardTime: 15.0, // 15 seconds for extended reach
    unit: "seconds",
    factors: {
      distance: 36, // inches
      difficulty: "medium",
    },
    description: "Extended reaching requiring body movement",
  },

  balance: {
    taskId: "balance",
    taskName: "Balance",
    standardTime: 30.0, // 30 seconds for balance task
    unit: "seconds",
    factors: {
      distance: 10, // feet
      difficulty: "medium",
    },
    description: "Static and dynamic balance maintenance",
  },

  carry: {
    taskId: "carry",
    taskName: "Carry",
    standardTime: 25.0, // 25 seconds for carrying task
    unit: "seconds",
    factors: {
      weight: 20, // lbs
      distance: 50, // feet
      difficulty: "medium",
    },
    description: "Carrying objects over specified distance",
  },

  lifting: {
    taskId: "lifting",
    taskName: "Lifting",
    standardTime: 10.0, // 10 seconds for lifting task
    unit: "seconds",
    factors: {
      weight: 25, // lbs
      difficulty: "medium",
    },
    description: "Lifting objects from floor to waist level",
  },

  pushing: {
    taskId: "pushing",
    taskName: "Pushing",
    standardTime: 18.0, // 18 seconds for pushing task
    unit: "seconds",
    factors: {
      weight: 30, // lbs
      distance: 20, // feet
      difficulty: "medium",
    },
    description: "Pushing objects across surface",
  },

  pulling: {
    taskId: "pulling",
    taskName: "Pulling",
    standardTime: 20.0, // 20 seconds for pulling task
    unit: "seconds",
    factors: {
      weight: 25, // lbs
      distance: 20, // feet
      difficulty: "medium",
    },
    description: "Pulling objects toward body",
  },

  crawling: {
    taskId: "crawling",
    taskName: "Crawling",
    standardTime: 45.0, // 45 seconds for crawling task
    unit: "seconds",
    factors: {
      distance: 20, // feet
      difficulty: "hard",
    },
    description: "Crawling movement on hands and knees",
  },

  kneeling: {
    taskId: "kneeling",
    taskName: "Kneeling",
    standardTime: 35.0, // 35 seconds for kneeling task
    unit: "seconds",
    factors: {
      difficulty: "medium",
    },
    description: "Sustained kneeling position",
  },

  crouching: {
    taskId: "crouching",
    taskName: "Crouching",
    standardTime: 25.0, // 25 seconds for crouching task
    unit: "seconds",
    factors: {
      difficulty: "medium",
    },
    description: "Sustained crouching position",
  },

  "stair-climbing": {
    taskId: "stair-climbing",
    taskName: "Stair Climbing",
    standardTime: 40.0, // 40 seconds for stair climbing
    unit: "seconds",
    factors: {
      distance: 15, // steps
      difficulty: "hard",
    },
    description: "Climbing stairs with proper form",
  },
};

// Weight adjustment factors (multipliers)
export const WEIGHT_FACTORS = {
  light: 0.85, // < 10 lbs
  medium: 1.0, // 10-30 lbs
  heavy: 1.3, // 31-50 lbs
  very_heavy: 1.6, // > 50 lbs
};

// Distance adjustment factors (multipliers)
export const DISTANCE_FACTORS = {
  short: 0.8, // < 20 feet
  medium: 1.0, // 20-50 feet
  long: 1.2, // 51-100 feet
  very_long: 1.4, // > 100 feet
};

// Difficulty adjustment factors (multipliers)
export const DIFFICULTY_FACTORS = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.3,
};

/**
 * Calculate standard time for a specific task with given parameters
 */
export function calculateStandardTime(
  taskId: string,
  params: MTMCalculationParams = {},
): number {
  const standard = MTM_STANDARDS[taskId];
  if (!standard) {
    console.warn(`No MTM standard found for task: ${taskId}`);
    return 30.0; // Default fallback time
  }

  let adjustedTime = standard.standardTime;

  // Apply weight factor
  if (params.weight && standard.factors.weight) {
    const weightCategory = getWeightCategory(params.weight);
    adjustedTime *= WEIGHT_FACTORS[weightCategory];
  }

  // Apply distance factor
  if (params.distance && standard.factors.distance) {
    const distanceCategory = getDistanceCategory(params.distance);
    adjustedTime *= DISTANCE_FACTORS[distanceCategory];
  }

  // Apply difficulty factor
  if (params.difficulty) {
    adjustedTime *= DIFFICULTY_FACTORS[params.difficulty];
  }

  // Apply reps factor (linear scaling)
  if (params.reps && standard.factors.reps) {
    const repsFactor = params.reps / standard.factors.reps;
    adjustedTime *= repsFactor;
  }

  return Math.round(adjustedTime * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate Industrial Standard percentage
 */
export function calculatePercentIS(
  actualTime: number,
  standardTime: number,
): number {
  if (actualTime <= 0) return 0;
  const percentIS = (standardTime / actualTime) * 100;
  return Math.round(percentIS * 10) / 10; // Round to 1 decimal place
}

/**
 * Get weight category for factor calculation
 */
function getWeightCategory(weight: number): keyof typeof WEIGHT_FACTORS {
  if (weight < 10) return "light";
  if (weight <= 30) return "medium";
  if (weight <= 50) return "heavy";
  return "very_heavy";
}

/**
 * Get distance category for factor calculation
 */
function getDistanceCategory(distance: number): keyof typeof DISTANCE_FACTORS {
  if (distance < 20) return "short";
  if (distance <= 50) return "medium";
  if (distance <= 100) return "long";
  return "very_long";
}

/**
 * Get available MTM standards
 */
export function getMTMStandards(): MTMStandard[] {
  return Object.values(MTM_STANDARDS);
}

/**
 * Get MTM standard by task ID
 */
export function getMTMStandard(taskId: string): MTMStandard | null {
  return MTM_STANDARDS[taskId] || null;
}
