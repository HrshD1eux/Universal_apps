export interface CalculationResult {
  result: number;
  formatted: string;
  execution_time_ms: number;
}

export interface InterestResult {
  final_amount: number;
  total_interest: number;
  duration_ms: number;
}

export interface CalculatorHistoryItem {
  id: string;
  calculator_name: string;
  category: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  execution_time_ms: number;
  created_at: string;
}

export interface DateMathResult {
  years: number;
  months: number;
  days: number;
  total_days: number;
  target_date: string | null;
}
