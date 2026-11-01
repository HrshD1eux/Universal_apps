/**
 * Pure TypeScript Web Calculation Engine
 * Provides instant client-side math execution for web browsers and fallback when running outside Tauri desktop.
 */

// Helper: safe evaluator for mathematical expressions
export function evalMathExpression(expr: string, xVal?: number): number {
  try {
    let s = expr.toLowerCase().trim();
    if (xVal !== undefined) {
      s = s.replace(/x/g, `(${xVal})`);
    }
    s = s
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/log10/g, 'Math.log10')
      .replace(/log/g, 'Math.log')
      .replace(/abs/g, 'Math.abs')
      .replace(/pi/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
      .replace(/\^/g, '**');

    // Implicit multiplication: 2(3) -> 2*(3), 2Math -> 2*Math
    s = s.replace(/(\d)\s*([a-zA-Z\(])/g, '$1*$2');
    s = s.replace(/(\))\s*(\d|[a-zA-Z\(])/g, '$1*$2');

    // Validate allowed tokens to avoid arbitrary code execution
    if (!/^[0-9+\-*/().\s,Math|sincotanqrlebgpE\*\^]+$/.test(s)) {
      return NaN;
    }

    // eslint-disable-next-line no-new-func
    const val = new Function(`"use strict"; return (${s});`)();
    return typeof val === 'number' && isFinite(val) ? val : NaN;
  } catch {
    return NaN;
  }
}

// Unit conversion ratios relative to base units
const UNIT_FACTORS: Record<string, Record<string, number>> = {
  length: {
    meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001, micrometer: 1e-6, nanometer: 1e-9,
    inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344, nautical_mile: 1852, lightyear: 9.461e15
  },
  weight: {
    kilogram: 1, gram: 0.001, milligram: 1e-6, metric_ton: 1000, pound: 0.45359237, ounce: 0.0283495, carat: 0.0002
  },
  area: {
    square_meter: 1, square_kilometer: 1e6, square_centimeter: 0.0001, square_millimeter: 1e-6,
    hectare: 10000, acre: 4046.8564224, square_mile: 2.59e6, square_yard: 0.836127, square_foot: 0.092903, square_inch: 0.00064516
  },
  volume: {
    liter: 1, milliliter: 0.001, cubic_meter: 1000, gallon: 3.78541, quart: 0.946353, pint: 0.473176, cup: 0.24
  },
  time: {
    second: 1, millisecond: 0.001, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2.628e6, year: 3.154e7
  }
};

export const webCalculations: Record<string, (args: any) => Promise<any> | any> = {
  // Scientific Calculator
  evaluate_scientific: ({ expression }: { expression: string }) => {
    const t0 = performance.now();
    const val = evalMathExpression(expression);
    if (isNaN(val)) throw new Error('Invalid mathematical expression');
    return {
      result: val,
      formatted: parseFloat(val.toFixed(10)).toString(),
      execution_time_ms: Math.round(performance.now() - t0)
    };
  },

  // Compound Interest
  calculate_compound_interest: ({ principal, rate, time, frequency }: any) => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 100;
    const t = parseFloat(time);
    const n = parseInt(frequency) || 1;
    const final_amount = p * Math.pow(1 + r / n, n * t);
    const total_interest = final_amount - p;
    return {
      final_amount: parseFloat(final_amount.toFixed(2)),
      total_interest: parseFloat(total_interest.toFixed(2)),
      duration_ms: 1
    };
  },

  // EMI Calculator
  calculate_emi: ({ principal, annual_rate, tenure_years }: any) => {
    const p = parseFloat(principal);
    const r = parseFloat(annual_rate) / 12 / 100;
    const n = parseFloat(tenure_years) * 12;

    const monthly_emi = r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n;
    const total_payable = monthly_emi * n;
    const total_interest = total_payable - p;

    return {
      monthly_emi: parseFloat(monthly_emi.toFixed(2)),
      total_payable: parseFloat(total_payable.toFixed(2)),
      total_interest: parseFloat(total_interest.toFixed(2)),
      duration_ms: 1
    };
  },

  // GST Calculator
  calculate_gst: ({ amount, rate, is_inclusive }: any) => {
    const amt = parseFloat(amount);
    const r = parseFloat(rate);

    if (is_inclusive) {
      const base = amt / (1 + r / 100);
      const gst = amt - base;
      return {
        base_amount: parseFloat(base.toFixed(2)),
        gst_amount: parseFloat(gst.toFixed(2)),
        total_amount: parseFloat(amt.toFixed(2))
      };
    } else {
      const gst = amt * (r / 100);
      const total = amt + gst;
      return {
        base_amount: parseFloat(amt.toFixed(2)),
        gst_amount: parseFloat(gst.toFixed(2)),
        total_amount: parseFloat(total.toFixed(2))
      };
    }
  },

  // Age Calculator
  calculate_age: ({ dob, birth_time }: any) => {
    const now = new Date();
    const [year, month, day] = dob.split('-').map(Number);
    let birthDate = new Date(year, month - 1, day);

    if (birth_time) {
      const parts = birth_time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (parts) {
        let h = parseInt(parts[1], 10);
        const m = parseInt(parts[2], 10);
        const ampm = parts[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        birthDate = new Date(year, month - 1, day, h, m);
      }
    }

    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    let days = now.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const diffMs = now.getTime() - birthDate.getTime();
    const total_days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const total_hours = Math.floor(diffMs / (1000 * 60 * 60));
    const total_minutes = Math.floor(diffMs / (1000 * 60));

    // Days to next birthday
    const nextBday = new Date(now.getFullYear(), month - 1, day);
    if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
    const days_to_birthday = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      years,
      months,
      days,
      hours: now.getHours(),
      minutes: now.getMinutes(),
      days_to_birthday,
      total_days,
      total_hours,
      total_minutes
    };
  },

  // Discount Calculator
  calculate_discount: ({ price, discount_pct, tax_pct }: any) => {
    const p = parseFloat(price);
    const d = parseFloat(discount_pct) / 100;
    const t = parseFloat(tax_pct || 0) / 100;

    const savings = p * d;
    const discounted = p - savings;
    const tax_amount = discounted * t;
    const final_price = discounted + tax_amount;

    return {
      final_price: parseFloat(final_price.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      tax_amount: parseFloat(tax_amount.toFixed(2))
    };
  },

  // Percentage Calculator
  calculate_percentage: ({ value, total, mode }: any) => {
    const v = parseFloat(value);
    const t = parseFloat(total);
    switch (mode) {
      case 'percentage_of': return (v / 100) * t;
      case 'what_percentage': return (v / t) * 100;
      case 'increase': return v * (1 + t / 100);
      case 'decrease': return v * (1 - t / 100);
      default: return (v / 100) * t;
    }
  },

  // Salary Calculator
  calculate_salary: ({ amount, frequency, hours_per_week }: any) => {
    const amt = parseFloat(amount);
    const hpw = parseFloat(hours_per_week) || 40;
    const weeks = 52;
    const workDays = 5;

    let yearly = 0;
    switch (frequency) {
      case 'yearly': yearly = amt; break;
      case 'monthly': yearly = amt * 12; break;
      case 'weekly': yearly = amt * weeks; break;
      case 'hourly': yearly = amt * hpw * weeks; break;
      default: yearly = amt;
    }

    const monthly = yearly / 12;
    const weekly = yearly / weeks;
    const bi_weekly = weekly * 2;
    const daily = weekly / workDays;
    const hourly = weekly / hpw;

    return {
      hourly: parseFloat(hourly.toFixed(2)),
      daily: parseFloat(daily.toFixed(2)),
      weekly: parseFloat(weekly.toFixed(2)),
      bi_weekly: parseFloat(bi_weekly.toFixed(2)),
      monthly: parseFloat(monthly.toFixed(2)),
      yearly: parseFloat(yearly.toFixed(2))
    };
  },

  // Tip Calculator
  calculate_tip: ({ bill, tip_pct, people }: any) => {
    const b = parseFloat(bill);
    const t = parseFloat(tip_pct) / 100;
    const p = parseInt(people) || 1;

    const tip_amount = b * t;
    const total_amount = b + tip_amount;
    const per_person_bill = total_amount / p;
    const per_person_tip = tip_amount / p;

    return {
      tip_amount: parseFloat(tip_amount.toFixed(2)),
      total_amount: parseFloat(total_amount.toFixed(2)),
      per_person_bill: parseFloat(per_person_bill.toFixed(2)),
      per_person_tip: parseFloat(per_person_tip.toFixed(2))
    };
  },

  // ROI Calculator
  calculate_roi: ({ initial, current, years }: any) => {
    const init = parseFloat(initial);
    const curr = parseFloat(current);
    const y = parseFloat(years) || 0;

    const profit = curr - init;
    const roi_pct = (profit / init) * 100;
    let annualized_roi_pct = null;
    if (y > 0 && curr > 0 && init > 0) {
      annualized_roi_pct = (Math.pow(curr / init, 1 / y) - 1) * 100;
    }

    return {
      profit: parseFloat(profit.toFixed(2)),
      roi_pct: parseFloat(roi_pct.toFixed(2)),
      annualized_roi_pct: annualized_roi_pct !== null ? parseFloat(annualized_roi_pct.toFixed(2)) : null
    };
  },

  // SIP Calculator
  calculate_sip: ({ monthly_investment, annual_rate, years }: any) => {
    const p = parseFloat(monthly_investment);
    const r = parseFloat(annual_rate) / 12 / 100;
    const n = parseFloat(years) * 12;

    const total_value = r > 0 ? p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : p * n;
    const invested_amount = p * n;
    const wealth_gained = total_value - invested_amount;

    return {
      total_value: Math.round(total_value),
      invested_amount: Math.round(invested_amount),
      wealth_gained: Math.round(wealth_gained)
    };
  },

  // Step-Up SIP
  calculate_step_up_sip: ({ initial_monthly, annual_step_up_pct, annual_rate, years }: any) => {
    let p = parseFloat(initial_monthly);
    const stepUp = parseFloat(annual_step_up_pct) / 100;
    const r = parseFloat(annual_rate) / 12 / 100;
    const y = parseInt(years);

    let totalInvested = 0;
    let totalValue = 0;

    for (let yr = 1; yr <= y; yr++) {
      for (let m = 1; m <= 12; m++) {
        totalInvested += p;
        const monthsRemaining = (y - yr) * 12 + (12 - m + 1);
        totalValue += p * Math.pow(1 + r, monthsRemaining);
      }
      p += p * stepUp;
    }

    return {
      total_value: Math.round(totalValue),
      invested_amount: Math.round(totalInvested),
      wealth_gained: Math.round(totalValue - totalInvested)
    };
  },

  // Goal SIP
  calculate_goal_sip: ({ target_amount, annual_rate, years }: any) => {
    const target = parseFloat(target_amount);
    const r = parseFloat(annual_rate) / 12 / 100;
    const n = parseFloat(years) * 12;

    const factor = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const monthly_sip = r > 0 ? target / factor : target / n;
    const total_investment = monthly_sip * n;
    const total_gain = target - total_investment;

    return {
      monthly_sip: Math.round(monthly_sip),
      total_investment: Math.round(total_investment),
      total_gain: Math.round(total_gain)
    };
  },

  // FD & RD Calculator
  calculate_fd_rd: ({ principal, annual_rate, tenure_years, is_rd, compounding_frequency }: any) => {
    const p = parseFloat(principal);
    const r = parseFloat(annual_rate) / 100;
    const t = parseFloat(tenure_years);
    const freq = parseInt(compounding_frequency) || 4; // default quarterly

    if (is_rd) {
      // Recurring Deposit (monthly contribution)
      const n = t * 12;
      const i = r / freq;
      let maturity = 0;
      for (let m = 1; m <= n; m++) {
        maturity += p * Math.pow(1 + i, (n - m + 1) / (12 / freq));
      }
      const invested = p * n;
      return {
        maturity_amount: Math.round(maturity),
        invested_amount: Math.round(invested),
        total_interest: Math.round(maturity - invested)
      };
    } else {
      // Fixed Deposit
      const maturity = p * Math.pow(1 + r / freq, freq * t);
      return {
        maturity_amount: Math.round(maturity),
        invested_amount: Math.round(p),
        total_interest: Math.round(maturity - p)
      };
    }
  },

  // PPF Calculator
  calculate_ppf: ({ yearly_investment, rate, years }: any) => {
    const p = parseFloat(yearly_investment);
    const r = (parseFloat(rate) || 7.1) / 100;
    const y = parseInt(years) || 15;

    let balance = 0;
    let totalInvested = 0;
    const yearlyBreakup = [];

    for (let yr = 1; yr <= y; yr++) {
      totalInvested += p;
      const interest = (balance + p) * r;
      balance = balance + p + interest;
      yearlyBreakup.push({
        year: yr,
        invested: Math.round(totalInvested),
        interest: Math.round(interest),
        balance: Math.round(balance)
      });
    }

    return {
      total_investment: Math.round(totalInvested),
      maturity_amount: Math.round(balance),
      total_interest: Math.round(balance - totalInvested),
      yearly_breakup: yearlyBreakup
    };
  },

  // Inflation Calculator
  calculate_inflation: ({ current_amount, inflation_rate, years }: any) => {
    const amt = parseFloat(current_amount);
    const inf = parseFloat(inflation_rate) / 100;
    const y = parseFloat(years);

    const future_value = amt * Math.pow(1 + inf, y);
    const purchasing_power = amt / Math.pow(1 + inf, y);

    return {
      future_value: parseFloat(future_value.toFixed(2)),
      purchasing_power: parseFloat(purchasing_power.toFixed(2))
    };
  },

  // NPS Calculator
  calculate_nps: ({ monthly_investment, current_age, retirement_age, expected_return, annuity_ratio }: any) => {
    const p = parseFloat(monthly_investment);
    const cAge = parseInt(current_age);
    const rAge = parseInt(retirement_age) || 60;
    const years = Math.max(1, rAge - cAge);
    const r = parseFloat(expected_return) / 12 / 100;
    const n = years * 12;

    const total_corpus = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const total_invested = p * n;
    const total_gain = total_corpus - total_invested;

    const annRatio = (parseFloat(annuity_ratio) || 40) / 100;
    const annuity_amount = total_corpus * annRatio;
    const lumpsum_amount = total_corpus - annuity_amount;
    const monthly_pension = (annuity_amount * 0.06) / 12; // 6% annuity rate estimate

    return {
      total_corpus: Math.round(total_corpus),
      total_invested: Math.round(total_invested),
      total_gain: Math.round(total_gain),
      lumpsum_amount: Math.round(lumpsum_amount),
      annuity_amount: Math.round(annuity_amount),
      monthly_pension: Math.round(monthly_pension)
    };
  },

  // Indian Income Tax Calculator (Old vs New Regime)
  calculate_income_tax_india: ({ income, business_income }: any) => {
    const inc = (parseFloat(income) || 0) + (parseFloat(business_income) || 0);

    // New Regime (FY 2024-25 / 2025-26 slabs with standard deduction of 75,000)
    const stdDeductionNew = 75000;
    const taxableNew = Math.max(0, inc - stdDeductionNew);
    let taxNew = 0;
    if (taxableNew <= 700000) {
      taxNew = 0; // Section 87A rebate
    } else {
      if (taxableNew > 300000) taxNew += Math.min(taxableNew - 300000, 400000) * 0.05;
      if (taxableNew > 700000) taxNew += Math.min(taxableNew - 700000, 300000) * 0.10;
      if (taxableNew > 1000000) taxNew += Math.min(taxableNew - 1000000, 200000) * 0.15;
      if (taxableNew > 1200000) taxNew += Math.min(taxableNew - 1200000, 300000) * 0.20;
      if (taxableNew > 1500000) taxNew += (taxableNew - 1500000) * 0.30;
      taxNew += taxNew * 0.04; // Cess
    }

    // Old Regime (Standard deduction 50,000)
    const stdDeductionOld = 50000;
    const taxableOld = Math.max(0, inc - stdDeductionOld);
    let taxOld = 0;
    if (taxableOld <= 500000) {
      taxOld = 0;
    } else {
      if (taxableOld > 250000) taxOld += Math.min(taxableOld - 250000, 250000) * 0.05;
      if (taxableOld > 500000) taxOld += Math.min(taxableOld - 500000, 500000) * 0.20;
      if (taxableOld > 1000000) taxOld += (taxableOld - 1000000) * 0.30;
      taxOld += taxOld * 0.04;
    }

    return {
      old_regime_tax: Math.round(taxOld),
      new_regime_tax: Math.round(taxNew),
      savings: Math.round(Math.abs(taxOld - taxNew))
    };
  },

  // FIRE Calculator
  calculate_fire_projection: ({ current_age, retirement_age, current_savings, monthly_savings, monthly_expenses, expected_return, inflation }: any) => {
    const cAge = parseInt(current_age);
    const rAge = parseInt(retirement_age) || 50;
    const curSav = parseFloat(current_savings) || 0;
    const mSav = parseFloat(monthly_savings) || 0;
    const mExp = parseFloat(monthly_expenses) || 0;
    const ret = (parseFloat(expected_return) || 12) / 100;
    const inf = (parseFloat(inflation) || 6) / 100;
    const realRate = (1 + ret) / (1 + inf) - 1;

    const annualExpenses = mExp * 12;
    const fire_number = annualExpenses * 25; // 4% rule

    const yearsToRetire = Math.max(0, rAge - cAge);
    const rMonthly = realRate / 12;
    const n = yearsToRetire * 12;

    const corpusFromSavings = curSav * Math.pow(1 + realRate, yearsToRetire);
    const corpusFromContributions = rMonthly > 0 ? mSav * ((Math.pow(1 + rMonthly, n) - 1) / rMonthly) : mSav * n;
    const projectedCorpus = corpusFromSavings + corpusFromContributions;

    return {
      fire_number: Math.round(fire_number),
      current_corpus_at_retirement: Math.round(projectedCorpus),
      monthly_retirement_spend: Math.round((projectedCorpus * 0.04) / 12),
      years_to_fire: yearsToRetire,
      is_fire_ready: projectedCorpus >= fire_number
    };
  },

  // Stock Average
  calculate_stock_average: ({ entries }: { entries: Array<{ price: number; quantity: number }> }) => {
    let totalQty = 0;
    let totalInvested = 0;
    entries.forEach(e => {
      const q = parseFloat(e.quantity as any) || 0;
      const p = parseFloat(e.price as any) || 0;
      totalQty += q;
      totalInvested += q * p;
    });

    const avgPrice = totalQty > 0 ? totalInvested / totalQty : 0;
    return {
      total_quantity: totalQty,
      total_investment: parseFloat(totalInvested.toFixed(2)),
      average_price: parseFloat(avgPrice.toFixed(2))
    };
  },

  // Local Byaj (Sekda)
  calculate_local_byaj: ({ principal, rate, months }: any) => {
    const p = parseFloat(principal);
    const r = parseFloat(rate); // per 100 rupees per month
    const m = parseFloat(months);

    const monthly_interest = p * (r / 100);
    const total_interest = monthly_interest * m;
    const final_amount = p + total_interest;

    return {
      monthly_interest: parseFloat(monthly_interest.toFixed(2)),
      total_interest: parseFloat(total_interest.toFixed(2)),
      final_amount: parseFloat(final_amount.toFixed(2)),
      yearly_breakup: []
    };
  },

  // Base Converter
  base_convert: ({ value, from_base, to_base }: any) => {
    const fromB = parseInt(from_base);
    const toB = parseInt(to_base);
    const num = parseInt(value.toString().trim(), fromB);
    if (isNaN(num)) throw new Error('Invalid number for specified base');
    return num.toString(toB).toUpperCase();
  },

  // Date Math
  calculate_date_math: ({ start_date, end_date, operation, days_to_add }: any) => {
    if (operation === 'add_days') {
      const d = new Date(start_date);
      d.setDate(d.getDate() + (parseInt(days_to_add) || 0));
      return {
        result_date: d.toISOString().split('T')[0],
        total_days: parseInt(days_to_add) || 0,
        weekdays: 0,
        weekend_days: 0
      };
    } else {
      const d1 = new Date(start_date);
      const d2 = new Date(end_date);
      const diffMs = Math.abs(d2.getTime() - d1.getTime());
      const total_days = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return {
        result_date: end_date,
        total_days,
        weekdays: Math.round(total_days * (5 / 7)),
        weekend_days: Math.round(total_days * (2 / 7))
      };
    }
  },

  // BMI Calculator
  calculate_bmi: ({ weight, height_cm }: any) => {
    const w = parseFloat(weight);
    const h = parseFloat(height_cm) / 100;
    const bmi = w / (h * h);

    let category = 'Normal';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal weight';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';

    return {
      bmi: parseFloat(bmi.toFixed(1)),
      category,
      ideal_weight_min: parseFloat((18.5 * h * h).toFixed(1)),
      ideal_weight_max: parseFloat((24.9 * h * h).toFixed(1)),
      prime: parseFloat((bmi / 25).toFixed(2))
    };
  },

  // Marks Calculator
  calculate_marks: ({ marks, max_marks }: { marks: number[]; max_marks: number[] }) => {
    const total_marks = marks.reduce((a, b) => a + (parseFloat(b as any) || 0), 0);
    const total_max = max_marks.reduce((a, b) => a + (parseFloat(b as any) || 0), 0);
    const percentage = total_max > 0 ? (total_marks / total_max) * 100 : 0;

    let grade = 'F';
    let gpa = 0;
    if (percentage >= 90) { grade = 'A+'; gpa = 10; }
    else if (percentage >= 80) { grade = 'A'; gpa = 9; }
    else if (percentage >= 70) { grade = 'B+'; gpa = 8; }
    else if (percentage >= 60) { grade = 'B'; gpa = 7; }
    else if (percentage >= 50) { grade = 'C'; gpa = 6; }
    else if (percentage >= 40) { grade = 'D'; gpa = 5; }

    return {
      total_marks: parseFloat(total_marks.toFixed(2)),
      total_max: parseFloat(total_max.toFixed(2)),
      percentage: parseFloat(percentage.toFixed(2)),
      grade,
      gpa,
      cgpa: gpa
    };
  },

  // Statistics Tool
  calculate_statistics: ({ numbers }: { numbers: number[] }) => {
    if (!numbers || numbers.length === 0) throw new Error('No numbers provided');
    const sorted = [...numbers].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

    // Mode
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    sorted.forEach(x => {
      freq[x] = (freq[x] || 0) + 1;
      if (freq[x] > maxFreq) maxFreq = freq[x];
    });
    const modes = Object.keys(freq).filter(k => freq[Number(k)] === maxFreq).map(Number);

    const variance = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const std_dev = Math.sqrt(variance);

    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];

    return {
      mean: parseFloat(mean.toFixed(4)),
      median: parseFloat(median.toFixed(4)),
      mode: modes,
      variance: parseFloat(variance.toFixed(4)),
      std_dev: parseFloat(std_dev.toFixed(4)),
      min: sorted[0],
      max: sorted[n - 1],
      count: n,
      sum: parseFloat(sum.toFixed(4)),
      range: sorted[n - 1] - sorted[0],
      q1,
      q3,
      iqr: q3 - q1
    };
  },

  // Unit Converter
  convert_units: ({ request }: any) => {
    const { value, from_unit, to_unit, category } = request;
    const cat = category.toLowerCase();
    const factors = UNIT_FACTORS[cat];
    if (!factors || !factors[from_unit] || !factors[to_unit]) {
      return { result: value, formatted: value.toString(), factor: 1 };
    }
    const inBase = value * factors[from_unit];
    const converted = inBase / factors[to_unit];
    return {
      result: converted,
      formatted: parseFloat(converted.toFixed(6)).toString(),
      factor: factors[from_unit] / factors[to_unit]
    };
  },

  // Equation Solver (Quadratic, Cubic, Linear)
  solve_quadratic: ({ a, b, c }: any) => {
    const disc = b * b - 4 * a * c;
    const vertex = { x: -b / (2 * a), y: c - (b * b) / (4 * a) };
    if (disc >= 0) {
      const r1 = (-b + Math.sqrt(disc)) / (2 * a);
      const r2 = (-b - Math.sqrt(disc)) / (2 * a);
      return {
        roots: [r1.toFixed(4), r2.toFixed(4)],
        discriminant: disc,
        vertex: [vertex.x, vertex.y]
      };
    } else {
      const real = (-b / (2 * a)).toFixed(4);
      const imag = (Math.sqrt(-disc) / (2 * a)).toFixed(4);
      return {
        roots: [`${real} + ${imag}i`, `${real} - ${imag}i`],
        discriminant: disc,
        vertex: [vertex.x, vertex.y]
      };
    }
  },

  solve_cubic: ({ a, b, c, d }: any) => {
    // Cardano numerical root approximation
    const roots: string[] = [];
    const f = (x: number) => a * x * x * x + b * x * x + c * x + d;
    // Simple bisection search
    for (let x = -50; x <= 50; x += 0.5) {
      if (f(x) * f(x + 0.5) <= 0) {
        let low = x, high = x + 0.5;
        for (let iter = 0; iter < 20; iter++) {
          const mid = (low + high) / 2;
          if (f(low) * f(mid) <= 0) high = mid;
          else low = mid;
        }
        const root = parseFloat(((low + high) / 2).toFixed(4));
        if (!roots.includes(root.toString())) roots.push(root.toString());
      }
    }
    return { roots: roots.length > 0 ? roots : ['No real roots in range'] };
  },

  solve_quartic: ({ a, b, c, d, e }: any) => {
    const roots: string[] = [];
    const f = (x: number) => a * x ** 4 + b * x ** 3 + c * x ** 2 + d * x + e;
    for (let x = -50; x <= 50; x += 0.5) {
      if (f(x) * f(x + 0.5) <= 0) {
        let low = x, high = x + 0.5;
        for (let iter = 0; iter < 20; iter++) {
          const mid = (low + high) / 2;
          if (f(low) * f(mid) <= 0) high = mid;
          else low = mid;
        }
        const root = parseFloat(((low + high) / 2).toFixed(4));
        if (!roots.includes(root.toString())) roots.push(root.toString());
      }
    }
    return { roots: roots.length > 0 ? roots : ['No real roots in range'] };
  },

  solve_linear_2: ({ a1, b1, c1, a2, b2, c2 }: any) => {
    // a1*x + b1*y = c1; a2*x + b2*y = c2
    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-9) throw new Error('Lines are parallel: no unique solution');
    const x = (c1 * b2 - c2 * b1) / det;
    const y = (a1 * c2 - a2 * c1) / det;
    return { x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) };
  },

  solve_linear_3: ({ a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3 }: any) => {
    // Cramer's Rule for 3x3
    const det3 = (m: number[][]) => 
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

    const D = det3([[a1, b1, c1], [a2, b2, c2], [a3, b3, c3]]);
    if (Math.abs(D) < 1e-9) throw new Error('Singular system: no unique solution');
    const Dx = det3([[d1, b1, c1], [d2, b2, c2], [d3, b3, c3]]);
    const Dy = det3([[a1, d1, c1], [a2, d2, c2], [a3, d3, c3]]);
    const Dz = det3([[a1, b1, d1], [a2, b2, d2], [a3, b3, d3]]);

    return {
      x: parseFloat((Dx / D).toFixed(4)),
      y: parseFloat((Dy / D).toFixed(4)),
      z: parseFloat((Dz / D).toFixed(4))
    };
  },

  // Matrix Ops
  calculate_matrix_ops: ({ a, b, op }: any) => {
    const rows = a.length;
    const cols = a[0].length;
    const res: number[][] = [];

    if (op === 'add' || op === 'sub') {
      for (let r = 0; r < rows; r++) {
        res[r] = [];
        for (let c = 0; c < cols; c++) {
          res[r][c] = op === 'add' ? a[r][c] + b[r][c] : a[r][c] - b[r][c];
        }
      }
    } else if (op === 'mul') {
      const bCols = b[0].length;
      for (let r = 0; r < rows; r++) {
        res[r] = [];
        for (let c = 0; c < bCols; c++) {
          let sum = 0;
          for (let k = 0; k < cols; k++) sum += a[r][k] * b[k][c];
          res[r][c] = sum;
        }
      }
    }
    return { result: res };
  },

  calculate_matrix_det: ({ a }: { a: number[][] }) => {
    if (a.length === 2) return a[0][0] * a[1][1] - a[0][1] * a[1][0];
    if (a.length === 3) {
      return (
        a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
        a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
        a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0])
      );
    }
    return 0;
  },

  // Function Sampling for Graphing
  calculate_function_samples: ({ expression, xMin, xMax, points }: any) => {
    const exprList = expression.split(';').map((s: string) => s.trim()).filter(Boolean);
    const x0 = parseFloat(xMin) || -10;
    const x1 = parseFloat(xMax) || 10;
    const ptCount = parseInt(points) || 100;
    const step = (x1 - x0) / (ptCount - 1);

    const functions = exprList.map((expr: string) => {
      const pts = [];
      for (let i = 0; i < ptCount; i++) {
        const x = x0 + i * step;
        const y = evalMathExpression(expr, x);
        pts.push({ x: parseFloat(x.toFixed(3)), y: isFinite(y) ? parseFloat(y.toFixed(3)) : 0 });
      }
      return pts;
    });

    return { functions };
  }
};

/**
 * Universal calculation runner for safeInvoke fallback
 */
export async function runWebCalculation<T>(command: string, args?: any): Promise<T> {
  const handler = webCalculations[command];
  if (!handler) {
    throw new Error(`Web engine does not support IPC command '${command}'.`);
  }
  return (await handler(args)) as T;
}
