use chrono::{Datelike, Duration, NaiveDate, Timelike};
use meval::eval_str;
use rust_decimal::prelude::*;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Serialize, Deserialize)]
pub struct CalculationResult {
    pub result: f64,
    pub formatted: String,
    pub execution_time_ms: u64,
}

#[tauri::command]
pub fn evaluate_scientific(expression: String) -> Result<CalculationResult, String> {
    let start = Instant::now();

    match eval_str(&expression) {
        Ok(res) => {
            let duration = start.elapsed().as_millis() as u64;
            Ok(CalculationResult {
                result: res,
                formatted: format!("{:.10}", res)
                    .trim_end_matches('0')
                    .trim_end_matches('.')
                    .to_string(),
                execution_time_ms: duration,
            })
        }
        Err(e) => Err(format!("Evaluation error: {}", e)),
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InterestResult {
    pub final_amount: Decimal,
    pub total_interest: Decimal,
    pub duration_ms: u64,
}

#[tauri::command]
pub fn calculate_compound_interest(
    principal: f64,
    rate: f64,
    time: f64,
    frequency: u32,
) -> Result<InterestResult, String> {
    let start = Instant::now();
    let p = Decimal::from_f64(principal).ok_or("Invalid principal")?;

    let final_amount_f64 =
        principal * (1.0 + rate / 100.0 / frequency as f64).powf(time * frequency as f64);
    let final_amount = Decimal::from_f64(final_amount_f64).unwrap_or(Decimal::ZERO);
    let total_interest = final_amount - p;

    Ok(InterestResult {
        final_amount: final_amount.round_dp(2),
        total_interest: total_interest.round_dp(2),
        duration_ms: start.elapsed().as_millis() as u64,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EMIResult {
    pub monthly_emi: Decimal,
    pub total_payable: Decimal,
    pub total_interest: Decimal,
    pub duration_ms: u64,
}

#[tauri::command]
pub fn calculate_emi(
    principal: f64,
    annual_rate: f64,
    tenure_years: f64,
) -> Result<EMIResult, String> {
    let start = Instant::now();
    let p = principal;
    let r = annual_rate / 12.0 / 100.0;
    let n = tenure_years * 12.0;

    let emi_f64 = if r > 0.0 {
        p * r * (1.0 + r).powf(n) / ((1.0 + r).powf(n) - 1.0)
    } else {
        p / n
    };

    let monthly_emi = Decimal::from_f64(emi_f64).unwrap_or(Decimal::ZERO);
    let total_payable = monthly_emi * Decimal::from_f64(n).unwrap();
    let total_interest = total_payable - Decimal::from_f64(p).unwrap();

    Ok(EMIResult {
        monthly_emi: monthly_emi.round_dp(2),
        total_payable: total_payable.round_dp(2),
        total_interest: total_interest.round_dp(2),
        duration_ms: start.elapsed().as_millis() as u64,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GSTResult {
    pub base_amount: Decimal,
    pub gst_amount: Decimal,
    pub total_amount: Decimal,
}

#[tauri::command]
pub fn calculate_gst(amount: f64, rate: f64, is_inclusive: bool) -> Result<GSTResult, String> {
    let amt = Decimal::from_f64(amount).ok_or("Invalid amount")?;
    let r = Decimal::from_f64(rate).ok_or("Invalid rate")?;
    let hundred = Decimal::from(100);

    if is_inclusive {
        let base = amt / (Decimal::ONE + (r / hundred));
        let gst = amt - base;
        Ok(GSTResult {
            base_amount: base.round_dp(2),
            gst_amount: gst.round_dp(2),
            total_amount: amt.round_dp(2),
        })
    } else {
        let gst = amt * (r / hundred);
        let total = amt + gst;
        Ok(GSTResult {
            base_amount: amt.round_dp(2),
            gst_amount: gst.round_dp(2),
            total_amount: total.round_dp(2),
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgeResult {
    pub years: i32,
    pub months: i32,
    pub days: i32,
    pub hours: i32,
    pub minutes: i32,
    pub days_to_birthday: i64,
    pub total_days: i64,
    pub total_hours: i64,
    pub total_minutes: i64,
}

#[tauri::command]
pub fn calculate_age(
    dob: String,
    birth_time: Option<String>,
    now_date: Option<String>,
) -> Result<AgeResult, String> {
    let birth_date = NaiveDate::parse_from_str(&dob, "%Y-%m-%d").map_err(|e| e.to_string())?;

    // Parse birth time if provided (format "HH:MM AM/PM")
    let birth_dt = if let Some(time_str) = birth_time {
        let time = chrono::NaiveTime::parse_from_str(&time_str, "%I:%M %p")
            .map_err(|e| format!("Time error: {}", e))?;
        birth_date.and_time(time)
    } else {
        birth_date.and_hms_opt(0, 0, 0).unwrap()
    };

    let now = if let Some(d) = now_date {
        NaiveDate::parse_from_str(&d, "%Y-%m-%d")
            .map_err(|e| e.to_string())?
            .and_hms_opt(0, 0, 0)
            .unwrap()
    } else {
        chrono::Utc::now().naive_utc()
    };

    if now < birth_dt {
        return Err("Birth date/time cannot be in the future".to_string());
    }

    let diff = now.signed_duration_since(birth_dt);

    // Calculate Y/M/D using dates
    let today = now.date();
    let birth = birth_date;

    let mut years = today.year() - birth.year();
    let mut months = today.month() as i32 - birth.month() as i32;
    let mut days = today.day() as i32 - birth.day() as i32;

    // Adjust for time of day if birth time was provided
    let mut hours = now.hour() as i32 - birth_dt.hour() as i32;
    let mut minutes = now.minute() as i32 - birth_dt.minute() as i32;

    if minutes < 0 {
        minutes += 60;
        hours -= 1;
    }
    if hours < 0 {
        hours += 24;
        days -= 1;
    }

    if days < 0 {
        let prev_month = if today.month() == 1 {
            12
        } else {
            today.month() - 1
        };
        let prev_year = if today.month() == 1 {
            today.year() - 1
        } else {
            today.year()
        };
        let days_in_prev_month = NaiveDate::from_ymd_opt(prev_year, prev_month + 1, 1)
            .unwrap_or(NaiveDate::from_ymd_opt(prev_year + 1, 1, 1).unwrap())
            .signed_duration_since(NaiveDate::from_ymd_opt(prev_year, prev_month, 1).unwrap())
            .num_days() as i32;

        days += days_in_prev_month;
        months -= 1;
    }

    if months < 0 {
        months += 12;
        years -= 1;
    }

    // Next Birthday calculation
    let next_bday_year = if (today.month(), today.day()) > (birth.month(), birth.day()) {
        today.year() + 1
    } else {
        today.year()
    };

    let next_bday = NaiveDate::from_ymd_opt(next_bday_year, birth.month(), birth.day()).unwrap_or(
        NaiveDate::from_ymd_opt(next_bday_year, 3, 1)
            .unwrap()
            .pred_opt()
            .unwrap(),
    ); // handle Feb 29

    let days_to_birthday = next_bday.signed_duration_since(today).num_days();

    let total_days = diff.num_days();
    let total_hours = diff.num_hours();
    let total_minutes = diff.num_minutes();

    Ok(AgeResult {
        years,
        months,
        days,
        hours,
        minutes,
        days_to_birthday,
        total_days,
        total_hours,
        total_minutes,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscountResult {
    pub final_price: Decimal,
    pub savings: Decimal,
    pub tax_amount: Decimal,
}

#[tauri::command]
pub fn calculate_discount(
    price: f64,
    discount_pct: f64,
    tax_pct: f64,
) -> Result<DiscountResult, String> {
    let p = Decimal::from_f64(price).ok_or("Invalid price")?;
    let d = Decimal::from_f64(discount_pct).ok_or("Invalid discount")?;
    let t = Decimal::from_f64(tax_pct).ok_or("Invalid tax")?;
    let hundred = Decimal::from(100);

    let savings = p * (d / hundred);
    let discounted_price = p - savings;
    let tax_amount = discounted_price * (t / hundred);
    let final_price = discounted_price + tax_amount;

    Ok(DiscountResult {
        final_price: final_price.round_dp(2),
        savings: savings.round_dp(2),
        tax_amount: tax_amount.round_dp(2),
    })
}

#[tauri::command]
pub fn calculate_percentage(value: f64, total: f64, mode: String) -> Result<f64, String> {
    match mode.as_str() {
        "percentage_of" => Ok((value / 100.0) * total),
        "what_percentage" => Ok((value / total) * 100.0),
        "increase" => Ok(value * (1.0 + total / 100.0)),
        "decrease" => Ok(value * (1.0 - total / 100.0)),
        _ => Err("Invalid mode".to_string()),
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConvertRequest {
    pub value: f64,
    pub from_unit: String,
    pub to_unit: String,
    pub category: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConvertResult {
    pub result: f64,
    pub formatted: String,
    pub factor: f64,
}

#[tauri::command]
pub fn convert_units(request: ConvertRequest) -> Result<ConvertResult, String> {
    let factor = match request.category.to_lowercase().as_str() {
        "length" => get_length_factor(&request.from_unit, &request.to_unit),
        "weight" => get_weight_factor(&request.from_unit, &request.to_unit),
        "area" | "area_rural" => get_area_factor(&request.from_unit, &request.to_unit),
        "volume" => get_volume_factor(&request.from_unit, &request.to_unit),
        "time" => get_time_factor(&request.from_unit, &request.to_unit),
        "data" => get_data_factor(&request.from_unit, &request.to_unit),
        "speed" => get_speed_factor(&request.from_unit, &request.to_unit),
        "energy" => get_energy_factor(&request.from_unit, &request.to_unit),
        "power" => get_power_factor(&request.from_unit, &request.to_unit),
        "pressure" => get_pressure_factor(&request.from_unit, &request.to_unit),
        "force" => get_force_factor(&request.from_unit, &request.to_unit),
        "angle" => get_angle_factor(&request.from_unit, &request.to_unit),
        "data_transfer" => get_data_transfer_factor(&request.from_unit, &request.to_unit),
        "cooking" => get_cooking_factor(&request.from_unit, &request.to_unit),
        "fuel" => return convert_fuel(request.value, &request.from_unit, &request.to_unit),
        "torque" => get_torque_factor(&request.from_unit, &request.to_unit),
        "illuminance" => get_illuminance_factor(&request.from_unit, &request.to_unit),
        "temperature" => {
            return convert_temperature(request.value, &request.from_unit, &request.to_unit)
        }
        _ => Err("Unsupported category".to_string()),
    }?;

    let res = request.value * factor;
    Ok(ConvertResult {
        result: res,
        formatted: format!("{:.10}", res)
            .trim_end_matches('0')
            .trim_end_matches('.')
            .to_string(),
        factor,
    })
}

fn get_length_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("meter", 1.0),
        ("kilometer", 1000.0),
        ("centimeter", 0.01),
        ("millimeter", 0.001),
        ("micrometer", 0.000001),
        ("nanometer", 0.000000001),
        ("picometer", 1e-12),
        ("fentometer", 1e-15),
        ("angstrom", 1e-10),
        ("inch", 0.0254),
        ("foot", 0.3048),
        ("yard", 0.9144),
        ("mile", 1609.344),
        ("nautical_mile", 1852.0),
        ("lightyear", 9.4607304725808e15),
        ("parsec", 3.08567758149137e16),
        ("au", 1.495978707e11),
        ("furlong", 201.168),
        ("chain", 20.1168),
        ("rod", 5.0292),
        ("hand", 0.1016),
        ("span", 0.2286),
        ("league", 4828.032),
        ("micron", 1e-6),
        ("smoot", 1.7018),
        ("thou", 0.0000254),
        ("caliper", 0.0000254),
        ("link", 0.201168),
        ("pica", 0.00423333333),
        ("point", 0.000352777778),
        ("plank_length", 1.616255e-35),
        ("ell", 1.143),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_weight_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("kilogram", 1.0),
        ("gram", 0.001),
        ("milligram", 0.000001),
        ("microgram", 1e-9),
        ("metric_ton", 1000.0),
        ("quintal", 100.0),
        ("pound", 0.45359237),
        ("ounce", 0.028349523),
        ("stone", 6.35029318),
        ("carat", 0.0002),
        ("grain", 0.00006479891),
        ("slug", 14.5939029),
        ("troy_ounce", 0.0311034768),
        ("troy_pound", 0.3732417216),
        ("pennyweight", 0.00155517384),
        ("amu", 1.6605390666e-27),
        ("solar_mass", 1.98847e30),
        ("dram", 0.0017718452),
        ("quarter", 12.7005864),
        ("hundredweight_us", 45.359237),
        ("hundredweight_uk", 50.8023454),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_area_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("square_meter", 1.0),
        ("square_kilometer", 1e6),
        ("square_centimeter", 0.0001),
        ("square_millimeter", 1e-6),
        ("hectare", 10000.0),
        ("acre", 4046.8564224),
        ("square_mile", 2589988.11),
        ("square_yard", 0.83612736),
        ("square_foot", 0.09290304),
        ("square_inch", 0.00064516),
        ("killa", 4046.85642),
        ("kanal", 505.85705),
        ("marla", 25.2928526),
        ("bigha", 2529.28526),
        ("kaccha_bigha", 843.095),
        ("biswa", 126.46426),
        ("biswansi", 6.323213),
        ("sq_karam", 2.8103166),
        ("guntha", 101.17141056),
        ("ground", 222.96751173),
        ("cent", 40.46856422),
        ("are", 100.0),
        ("chatak", 4.1806371),
        ("cottah", 66.890333),
        ("decimal", 40.468564),
        ("rood", 1011.7141),
        ("perch", 25.29285),
        ("section", 2589988.11),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_volume_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("liter", 1.0),
        ("milliliter", 0.001),
        ("cubic_meter", 1000.0),
        ("cubic_centimeter", 0.001),
        ("cubic_millimeter", 1e-6),
        ("us_gallon", 3.785411784),
        ("us_quart", 0.946352946),
        ("us_pint", 0.473176473),
        ("us_cup", 0.2365882365),
        ("us_fluid_ounce", 0.0295735295625),
        ("us_tablespoon", 0.01478676478125),
        ("us_teaspoon", 0.00492892159375),
        ("imp_gallon", 4.54609),
        ("imp_quart", 1.1365225),
        ("imp_pint", 0.56826125),
        ("imp_cup", 0.284130625),
        ("imp_fluid_ounce", 0.0284130625),
        ("imp_tablespoon", 0.017758164),
        ("imp_teaspoon", 0.005919388),
        ("barrel_oil", 158.987294928),
        ("hogshead", 238.481),
        ("bushel_us", 35.23907),
        ("peck_us", 8.8097675),
        ("gill_us", 0.118294118),
        ("dash", 0.0006),
        ("pinch", 0.0003),
        ("drop", 0.00005),
        ("minim", 0.0000616115),
        ("board_foot", 2.359737),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_time_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("second", 1.0),
        ("millisecond", 0.001),
        ("microsecond", 1e-6),
        ("nanosecond", 1e-9),
        ("picosecond", 1e-12),
        ("minute", 60.0),
        ("hour", 3600.0),
        ("day", 86400.0),
        ("week", 604800.0),
        ("fortnight", 1209600.0),
        ("month_avg", 2629746.0),
        ("year_julian", 31557600.0),
        ("decade", 315576000.0),
        ("century", 3155760000.0),
        ("millennium", 31557600000.0),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_data_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("bit", 0.125),
        ("byte", 1.0),
        ("kilobit", 125.0),
        ("kilobyte", 1000.0),
        ("megabit", 125000.0),
        ("megabyte", 1e6),
        ("gigabit", 1.25e8),
        ("gigabyte", 1e9),
        ("terabit", 1.25e11),
        ("terabyte", 1e12),
        ("petabit", 1.25e14),
        ("petabyte", 1e15),
        ("kibibyte", 1024.0),
        ("mebibyte", 1048576.0),
        ("gibibyte", 1073741824.0),
        ("tebibyte", 1099511627776.0),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_speed_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("mps", 1.0),
        ("kmph", 0.277777778),
        ("mph", 0.44704),
        ("knot", 0.514444444),
        ("mach", 340.3),
        ("light", 299792458.0),
        ("fps", 0.3048),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_energy_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("joule", 1.0),
        ("kilojoule", 1000.0),
        ("calorie", 4.184),
        ("kilocalorie", 4184.0),
        ("watt_hour", 3600.0),
        ("kilowatt_hour", 3.6e6),
        ("btu", 1055.05585),
        ("electronvolt", 1.602176634e-19),
        ("foot_pound", 1.35581794833),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn convert_temperature(value: f64, from: &str, to: &str) -> Result<ConvertResult, String> {
    let from = from.to_lowercase();
    let to = to.to_lowercase();
    let celsius = match from.as_str() {
        "celsius" => value,
        "fahrenheit" => (value - 32.0) * 5.0 / 9.0,
        "kelvin" => value - 273.15,
        _ => return Err("Invalid from unit".to_string()),
    };
    let result = match to.as_str() {
        "celsius" => celsius,
        "fahrenheit" => (celsius * 9.0 / 5.0) + 32.0,
        "kelvin" => celsius + 273.15,
        _ => return Err("Invalid to unit".to_string()),
    };
    Ok(ConvertResult {
        result,
        formatted: format!("{:.2}", result),
        factor: 1.0,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SalaryResult {
    pub hourly: Decimal,
    pub daily: Decimal,
    pub weekly: Decimal,
    pub bi_weekly: Decimal,
    pub monthly: Decimal,
    pub yearly: Decimal,
}

#[tauri::command]
pub fn calculate_salary(
    amount: f64,
    frequency: String,
    hours_per_week: f64,
) -> Result<SalaryResult, String> {
    let amt = Decimal::from_f64(amount).ok_or("Invalid amount")?;
    let hpw = Decimal::from_f64(hours_per_week).ok_or("Invalid hours")?;
    let weeks_per_year = Decimal::from(52);
    let work_days_per_week = Decimal::from(5);

    let yearly = match frequency.as_str() {
        "yearly" => amt,
        "monthly" => amt * Decimal::from(12),
        "weekly" => amt * weeks_per_year,
        "hourly" => amt * hpw * weeks_per_year,
        _ => return Err("Invalid frequency".to_string()),
    };

    let monthly = yearly / Decimal::from(12);
    let weekly = yearly / weeks_per_year;
    let bi_weekly = weekly * Decimal::from(2);
    let daily = weekly / work_days_per_week;
    let hourly = weekly / hpw;

    Ok(SalaryResult {
        hourly: hourly.round_dp(2),
        daily: daily.round_dp(2),
        weekly: weekly.round_dp(2),
        bi_weekly: bi_weekly.round_dp(2),
        monthly: monthly.round_dp(2),
        yearly: yearly.round_dp(2),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TipResult {
    pub tip_amount: Decimal,
    pub total_amount: Decimal,
    pub per_person_bill: Decimal,
    pub per_person_tip: Decimal,
}

#[tauri::command]
pub fn calculate_tip(bill: f64, tip_pct: f64, people: u32) -> Result<TipResult, String> {
    let b = Decimal::from_f64(bill).ok_or("Invalid bill")?;
    let t_pct = Decimal::from_f64(tip_pct).ok_or("Invalid tip percentage")?;
    let p = Decimal::from(people);
    let hundred = Decimal::from(100);

    let tip_amount = b * (t_pct / hundred);
    let total_amount = b + tip_amount;
    let per_person_bill = total_amount / p;
    let per_person_tip = tip_amount / p;

    Ok(TipResult {
        tip_amount: tip_amount.round_dp(2),
        total_amount: total_amount.round_dp(2),
        per_person_bill: per_person_bill.round_dp(2),
        per_person_tip: per_person_tip.round_dp(2),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ROIResult {
    pub profit: Decimal,
    pub roi_pct: Decimal,
    pub annualized_roi_pct: Option<Decimal>,
}

#[tauri::command]
pub fn calculate_roi(initial: f64, current: f64, years: f64) -> Result<ROIResult, String> {
    let init = Decimal::from_f64(initial).ok_or("Invalid initial investment")?;
    let curr = Decimal::from_f64(current).ok_or("Invalid current value")?;
    let hundred = Decimal::from(100);

    let profit = curr - init;
    let roi_pct = (profit / init) * hundred;

    let mut annualized_roi = None;
    if years > 0.0 {
        let gain_ratio = current / initial;
        let ann_roi = (gain_ratio.powf(1.0 / years) - 1.0) * 100.0;
        annualized_roi = Decimal::from_f64(ann_roi);
    }

    Ok(ROIResult {
        profit: profit.round_dp(2),
        roi_pct: roi_pct.round_dp(2),
        annualized_roi_pct: annualized_roi.map(|d| d.round_dp(2)),
    })
}

fn get_power_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("watt", 1.0),
        ("kilowatt", 1000.0),
        ("megawatt", 1e6),
        ("horsepower", 745.699872),
        ("btu_hr", 0.293071),
        ("dbm", 1.0), // dBm requires special handling but for factor we use mW ref
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_pressure_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("pascal", 1.0),
        ("bar", 100000.0),
        ("psi", 6894.75729),
        ("atmosphere", 101325.0),
        ("torr", 133.322),
        ("kpa", 1000.0),
        ("mpa", 1e6),
        ("inhg", 3386.388),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_force_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("newton", 1.0),
        ("kilonewton", 1000.0),
        ("dyne", 1e-5),
        ("lbf", 4.448222),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_angle_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("degree", 1.0),
        ("radian", 57.2957795),
        ("gradian", 0.9),
        ("arcminute", 1.0 / 60.0),
        ("arcsecond", 1.0 / 3600.0),
        ("revolution", 360.0),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SIPResult {
    pub total_value: Decimal,
    pub invested_amount: Decimal,
    pub wealth_gained: Decimal,
}

#[tauri::command]
pub fn calculate_sip(
    monthly_investment: f64,
    annual_rate: f64,
    years: f64,
) -> Result<SIPResult, String> {
    let p = monthly_investment;
    let r = annual_rate / 12.0 / 100.0;
    let n = years * 12.0;

    let total_value_f64 = if r > 0.0 {
        p * (((1.0 + r).powf(n) - 1.0) / r) * (1.0 + r)
    } else {
        p * n
    };
    let invested_f64 = p * n;

    let total_value = Decimal::from_f64(total_value_f64).unwrap_or(Decimal::ZERO);
    let invested_amount = Decimal::from_f64(invested_f64).unwrap_or(Decimal::ZERO);
    let wealth_gained = total_value - invested_amount;

    Ok(SIPResult {
        total_value: total_value.round_dp(0),
        invested_amount: invested_amount.round_dp(0),
        wealth_gained: wealth_gained.round_dp(0),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LumpsumResult {
    pub total_value: Decimal,
    pub invested_amount: Decimal,
    pub wealth_gained: Decimal,
}

#[tauri::command]
pub fn calculate_lumpsum(
    investment: f64,
    annual_rate: f64,
    years: f64,
) -> Result<LumpsumResult, String> {
    let p = investment;
    let r = annual_rate / 100.0;
    let t = years;

    let total_value_f64 = p * (1.0 + r).powf(t);
    let invested_f64 = p;

    let total_value = Decimal::from_f64(total_value_f64).unwrap_or(Decimal::ZERO);
    let invested_amount = Decimal::from_f64(invested_f64).unwrap_or(Decimal::ZERO);
    let wealth_gained = total_value - invested_amount;

    Ok(LumpsumResult {
        total_value: total_value.round_dp(0),
        invested_amount: invested_amount.round_dp(0),
        wealth_gained: wealth_gained.round_dp(0),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MortgageResult {
    pub monthly_payment: Decimal,
    pub total_payment: Decimal,
    pub total_interest: Decimal,
    pub payoff_years: f64,
}

#[tauri::command]
pub fn calculate_mortgage(
    principal: f64,
    annual_rate: f64,
    years: f64,
    extra_payment: f64,
) -> Result<MortgageResult, String> {
    let p = principal;
    let r = annual_rate / 12.0 / 100.0;
    let n = years * 12.0;

    if n <= 0.0 {
        return Err("Tenure must be greater than zero".to_string());
    }

    // Standard EMI
    let emi_std = if r > 0.0 {
        p * r * (1.0 + r).powf(n) / ((1.0 + r).powf(n) - 1.0)
    } else {
        p / n
    };

    let total_emi = emi_std + extra_payment;

    // Calculate new payoff time with extra payment
    let mut balance = p;
    let mut months = 0;
    let mut total_interest_paid = 0.0;

    while balance > 0.1 && months < 600 {
        // Limit to 50 years max
        let interest = balance * r;
        total_interest_paid += interest;
        balance = balance + interest - total_emi;
        months += 1;
    }

    let payoff_years = months as f64 / 12.0;
    let total_payment = principal + total_interest_paid;

    Ok(MortgageResult {
        monthly_payment: Decimal::from_f64(emi_std).unwrap().round_dp(0),
        total_payment: Decimal::from_f64(total_payment).unwrap().round_dp(0),
        total_interest: Decimal::from_f64(total_interest_paid).unwrap().round_dp(0),
        payoff_years: (payoff_years * 10.0).round() / 10.0,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalByajResult {
    pub total_interest: Decimal,
    pub final_amount: Decimal,
    pub monthly_interest: Decimal,
    pub yearly_breakup: Vec<YearlyBreakup>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct YearlyBreakup {
    pub year: i32,
    pub opening_balance: Decimal,
    pub interest: Decimal,
    pub closing_balance: Decimal,
}

#[tauri::command]
pub fn calculate_local_byaj(
    principal: f64,
    monthly_rate: f64,
    years: u32,
    months: u32,
) -> Result<LocalByajResult, String> {
    let mut current_principal = Decimal::from_f64(principal).ok_or("Invalid principal")?;
    let r = Decimal::from_f64(monthly_rate).ok_or("Invalid rate")? / Decimal::from(100);
    let mut total_interest = Decimal::ZERO;
    let mut yearly_breakup = Vec::new();

    let initial_monthly = (current_principal * r).round_dp(2);

    for year in 1..=years {
        let opening = current_principal;
        let year_interest = (opening * r * Decimal::from(12)).round_dp(2);
        current_principal += year_interest;
        total_interest += year_interest;

        yearly_breakup.push(YearlyBreakup {
            year: year as i32,
            opening_balance: opening.round_dp(0),
            interest: year_interest.round_dp(0),
            closing_balance: current_principal.round_dp(0),
        });
    }

    if months > 0 {
        let opening = current_principal;
        let month_interest = (opening * r * Decimal::from(months)).round_dp(2);
        current_principal += month_interest;
        total_interest += month_interest;

        yearly_breakup.push(YearlyBreakup {
            year: (years + 1) as i32,
            opening_balance: opening.round_dp(0),
            interest: month_interest.round_dp(0),
            closing_balance: current_principal.round_dp(0),
        });
    }

    Ok(LocalByajResult {
        total_interest: total_interest.round_dp(0),
        final_amount: current_principal.round_dp(0),
        monthly_interest: initial_monthly,
        yearly_breakup,
    })
}

#[tauri::command]
pub fn base_convert(value: String, from_base: u32, to_base: u32) -> Result<String, String> {
    let clean_value = value
        .trim()
        .trim_start_matches("0x")
        .trim_start_matches("0X")
        .trim_start_matches("0b")
        .trim_start_matches("0B")
        .trim_start_matches("0o")
        .trim_start_matches("0O");

    if clean_value.is_empty() {
        return Ok("".to_string());
    }

    let decimal = u64::from_str_radix(clean_value, from_base)
        .map_err(|e| format!("Invalid input for base {}: {}", from_base, e))?;

    let result = match to_base {
        2 => format!("{:b}", decimal),
        8 => format!("{:o}", decimal),
        10 => format!("{}", decimal),
        16 => format!("{:x}", decimal),
        _ => return Err("Unsupported target base".to_string()),
    };

    Ok(result.to_uppercase())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DateMathResult {
    pub years: i32,
    pub months: i32,
    pub days: i32,
    pub total_days: i64,
    pub target_date: Option<String>,
}

#[tauri::command]
pub fn calculate_date_math(
    mode: String, // "diff" or "add"
    start_date: String,
    end_date: Option<String>,
    years: Option<i32>,
    months: Option<i32>,
    days: Option<i32>,
    op: Option<String>, // "add" or "sub"
) -> Result<DateMathResult, String> {
    let start = NaiveDate::parse_from_str(&start_date, "%Y-%m-%d").map_err(|e| e.to_string())?;

    if mode == "diff" {
        let end = NaiveDate::parse_from_str(&end_date.ok_or("End date missing")?, "%Y-%m-%d")
            .map_err(|e| e.to_string())?;

        let (smaller, larger) = if start <= end {
            (start, end)
        } else {
            (end, start)
        };

        let mut y = larger.year() - smaller.year();
        let mut m = larger.month() as i32 - smaller.month() as i32;
        let mut d = larger.day() as i32 - smaller.day() as i32;

        if d < 0 {
            m -= 1;
            let last_month = if larger.month() == 1 {
                12
            } else {
                larger.month() - 1
            };
            let last_month_year = if larger.month() == 1 {
                larger.year() - 1
            } else {
                larger.year()
            };
            let days_in_last_month = NaiveDate::from_ymd_opt(last_month_year, last_month, 1)
                .and_then(|_d| {
                    NaiveDate::from_ymd_opt(last_month_year, last_month + 1, 1)
                        .or_else(|| NaiveDate::from_ymd_opt(last_month_year + 1, 1, 1))
                })
                .map(|next_month_start| {
                    next_month_start
                        .signed_duration_since(
                            NaiveDate::from_ymd_opt(last_month_year, last_month, 1).unwrap(),
                        )
                        .num_days()
                })
                .unwrap_or(30);

            d += days_in_last_month as i32;
        }
        if m < 0 {
            y -= 1;
            m += 12;
        }

        let total_days = end.signed_duration_since(start).num_days();

        Ok(DateMathResult {
            years: y,
            months: m,
            days: d,
            total_days,
            target_date: None,
        })
    } else {
        // Add/Sub logic
        let y_off = years.unwrap_or(0);
        let m_off = months.unwrap_or(0);
        let d_off = days.unwrap_or(0);

        let sign = if op.unwrap_or("add".to_string()) == "add" {
            1
        } else {
            -1
        };

        // Use a simple offset approach for months/years first
        let mut target_y = start.year() + (y_off * sign);
        let mut target_m = start.month() as i32 + (m_off * sign);

        while target_m > 12 {
            target_y += 1;
            target_m -= 12;
        }
        while target_m < 1 {
            target_y -= 1;
            target_m += 12;
        }

        let mut target_date = NaiveDate::from_ymd_opt(target_y, target_m as u32, start.day())
            .unwrap_or_else(|| {
                // Handle late days (e.g. Feb 31 -> Feb 28)
                NaiveDate::from_ymd_opt(target_y, target_m as u32 + 1, 1)
                    .unwrap_or(NaiveDate::from_ymd_opt(target_y + 1, 1, 1).unwrap())
                    .pred_opt()
                    .unwrap()
            });

        // Finally apply days
        if sign == 1 {
            target_date = target_date + Duration::days(d_off as i64);
        } else {
            target_date = target_date - Duration::days(d_off as i64);
        }

        let total_days = target_date.signed_duration_since(start).num_days();

        Ok(DateMathResult {
            years: y_off,
            months: m_off,
            days: d_off,
            total_days,
            target_date: Some(target_date.format("%Y-%m-%d").to_string()),
        })
    }
}

fn get_data_transfer_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("bps", 1.0),
        ("kbps", 1000.0),
        ("mbps", 1e6),
        ("gbps", 1e9),
        ("tbps", 1e12),
        ("b_s", 8.0),
        ("kb_s", 8000.0),
        ("mb_s", 8e6),
        ("gb_s", 8e9),
        ("tb_s", 8e12),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_cooking_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("us_tablespoon", 14.7867648),
        ("us_teaspoon", 4.92892159),
        ("us_cup", 236.588237),
        ("us_fluid_ounce", 29.5735296),
        ("imp_tablespoon", 17.758164),
        ("imp_teaspoon", 5.919388),
        ("imp_cup", 284.130625),
        ("imp_fluid_ounce", 28.4130625),
        ("dash", 0.616115),
        ("pinch", 0.308058),
        ("drop", 0.05),
        ("minim", 0.0616115),
        ("smidgen", 0.154029),
        ("tad", 1.23223),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn convert_fuel(value: f64, from: &str, to: &str) -> Result<ConvertResult, String> {
    let from = from.to_lowercase();
    let to = to.to_lowercase();

    let units = std::collections::HashMap::from([
        ("kml", 1.0),
        ("mpgu", 0.425144),
        ("mpgk", 0.354006),
        ("mpl", 1.60934),
    ]);

    // Convert to base (km/L)
    let base_v = if from == "l100km" {
        if value <= 0.0 {
            return Err("Invalid L/100km value".to_string());
        }
        100.0 / value
    } else {
        let f = units
            .get(from.as_str())
            .ok_or_else(|| format!("Invalid from unit: {}", from))?;
        value * f
    };

    // Convert from base to target
    let result = if to == "l100km" {
        if base_v <= 0.0 {
            return Err("Invalid km/L equivalent for L/100km".to_string());
        }
        100.0 / base_v
    } else {
        let f = units
            .get(to.as_str())
            .ok_or_else(|| format!("Invalid to unit: {}", to))?;
        base_v / f
    };

    Ok(ConvertResult {
        result,
        formatted: format!("{:.10}", result)
            .trim_end_matches('0')
            .trim_end_matches('.')
            .to_string(),
        factor: 1.0,
    })
}

fn get_torque_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("nm", 1.0),
        ("lbf_ft", 1.355818),
        ("lbf_in", 0.112985),
        ("kgf_m", 9.80665),
        ("ozf_in", 0.007062),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

fn get_illuminance_factor(from: &str, to: &str) -> Result<f64, String> {
    let units = std::collections::HashMap::from([
        ("lux", 1.0),
        ("foot_candle", 10.76391),
        ("phot", 10000.0),
        ("nox", 0.001),
        ("candlepower", 1.0),
    ]);
    let from_f = units
        .get(from.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid from unit: {}", from))?;
    let to_f = units
        .get(to.to_lowercase().as_str())
        .ok_or_else(|| format!("Invalid to unit: {}", to))?;
    Ok(from_f / to_f)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StepUpSIPResult {
    pub total_value: Decimal,
    pub invested_amount: Decimal,
    pub wealth_gained: Decimal,
    pub yearly_breakup: Vec<SIPYearlyBreakup>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SIPYearlyBreakup {
    pub year: i32,
    pub investment: Decimal,
    pub value: Decimal,
}

#[tauri::command]
pub fn calculate_step_up_sip(
    initial_monthly: f64,
    annual_rate: f64,
    years: u32,
    step_up_percent: f64,
) -> Result<StepUpSIPResult, String> {
    let mut current_monthly = Decimal::from_f64(initial_monthly).ok_or("Invalid investment")?;
    let r_monthly = annual_rate / 12.0 / 100.0;
    let s = Decimal::from_f64(step_up_percent).ok_or("Invalid step-up")? / Decimal::from(100);

    let mut total_value = Decimal::ZERO;
    let mut total_invested = Decimal::ZERO;
    let mut yearly_breakup = Vec::new();

    for year in 1..=years {
        for _month in 1..=12 {
            // Add monthly investment to value
            total_value += current_monthly;
            total_invested += current_monthly;

            // Apply monthly interest
            total_value *= Decimal::from_f64(1.0 + r_monthly).unwrap();
        }

        yearly_breakup.push(SIPYearlyBreakup {
            year: year as i32,
            investment: current_monthly,
            value: total_value.round_dp(0),
        });

        // Step up for next year
        current_monthly *= Decimal::ONE + s;
    }

    Ok(StepUpSIPResult {
        total_value: total_value.round_dp(0),
        invested_amount: total_invested.round_dp(0),
        wealth_gained: (total_value - total_invested).round_dp(0),
        yearly_breakup,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoalResult {
    pub monthly_needed: Decimal,
    pub total_invested: Decimal,
    pub interest_earned: Decimal,
}

#[tauri::command]
pub fn calculate_goal_sip(
    target_amount: f64,
    annual_rate: f64,
    years: f64,
) -> Result<GoalResult, String> {
    let t = target_amount;
    let r = annual_rate / 12.0 / 100.0;
    let n = years * 12.0;

    let monthly_needed_f64 = if r > 0.0 {
        t * (r / ((1.0 + r).powf(n) - 1.0)) / (1.0 + r)
    } else {
        t / n
    };

    let monthly_needed = Decimal::from_f64(monthly_needed_f64).unwrap_or(Decimal::ZERO);
    let total_invested = monthly_needed * Decimal::from_f64(n).unwrap();
    let interest_earned = Decimal::from_f64(t).unwrap() - total_invested;

    Ok(GoalResult {
        monthly_needed: monthly_needed.round_dp(0),
        total_invested: total_invested.round_dp(0),
        interest_earned: interest_earned.round_dp(0),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FDResult {
    pub maturity_amount: Decimal,
    pub total_invested: Decimal,
    pub total_interest: Decimal,
}

#[tauri::command]
pub fn calculate_fd_rd(
    amount: f64,
    annual_rate: f64,
    years: f64,
    is_rd: bool,
) -> Result<FDResult, String> {
    let r = annual_rate / 100.0;
    let n = 4.0; // Quarterly compounding
    let t = years;

    let (maturity, invested) = if !is_rd {
        // FD: A = P(1 + r/n)^(nt)
        let a = amount * (1.0 + r / n).powf(n * t);
        (a, amount)
    } else {
        // RD: Sum of monthly installments
        // In India, RD usually compounds quarterly
        // Formula: M = P * ((1+r/n)^(nt) - 1) / (1 - (1+r/n)^(-1/3))
        // Where n=4 (quarterly)
        let p = amount;
        let nt = n * t;
        let m = p * ((1.0 + r / n).powf(nt) - 1.0) / (1.0 - (1.0 + r / n).powf(-1.0 / 3.0));
        (m, amount * 12.0 * t)
    };

    let maturity_dec = Decimal::from_f64(maturity).unwrap_or(Decimal::ZERO);
    let invested_dec = Decimal::from_f64(invested).unwrap_or(Decimal::ZERO);

    Ok(FDResult {
        maturity_amount: maturity_dec.round_dp(0),
        total_invested: invested_dec.round_dp(0),
        total_interest: (maturity_dec - invested_dec).round_dp(0),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PPFResult {
    pub maturity_amount: Decimal,
    pub total_invested: Decimal,
    pub total_interest: Decimal,
    pub yearly_breakup: Vec<PPFYearly>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PPFYearly {
    pub year: i32,
    pub opening_balance: Decimal,
    pub interest_earned: Decimal,
    pub closing_balance: Decimal,
}

#[tauri::command]
pub fn calculate_ppf(
    annual_investment: f64,
    annual_rate: f64,
    years: u32,
) -> Result<PPFResult, String> {
    let mut opening_balance = 0.0;
    let r = annual_rate / 100.0;
    let mut total_invested = 0.0;
    let mut yearly_breakup = Vec::new();

    for year in 1..=years {
        let deposit = annual_investment;
        total_invested += deposit;

        // Interest is calculated on (opening + deposit) for the year
        let interest = (opening_balance + deposit) * r;
        let closing_balance = opening_balance + deposit + interest;

        yearly_breakup.push(PPFYearly {
            year: year as i32,
            opening_balance: Decimal::from_f64(opening_balance).unwrap().round_dp(0),
            interest_earned: Decimal::from_f64(interest).unwrap().round_dp(0),
            closing_balance: Decimal::from_f64(closing_balance).unwrap().round_dp(0),
        });

        opening_balance = closing_balance;
    }

    Ok(PPFResult {
        maturity_amount: Decimal::from_f64(opening_balance).unwrap().round_dp(0),
        total_invested: Decimal::from_f64(total_invested).unwrap().round_dp(0),
        total_interest: Decimal::from_f64(opening_balance - total_invested)
            .unwrap()
            .round_dp(0),
        yearly_breakup,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StatsResult {
    pub mean: f64,
    pub median: f64,
    pub mode: Vec<f64>,
    pub std_dev: f64,
    pub min: f64,
    pub max: f64,
    pub count: usize,
    pub sum: f64,
    pub variance: f64,
    pub range: f64,
    pub geometric_mean: f64,
}

#[tauri::command]
pub fn calculate_statistics(numbers: Vec<f64>) -> Result<StatsResult, String> {
    if numbers.is_empty() {
        return Err("No data provided".to_string());
    }

    let count = numbers.len();
    let sum: f64 = numbers.iter().sum();
    let mean = sum / count as f64;

    let mut sorted = numbers.clone();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let median = if count % 2 == 0 {
        (sorted[count / 2 - 1] + sorted[count / 2]) / 2.0
    } else {
        sorted[count / 2]
    };

    let mut counts = std::collections::HashMap::new();
    for &n in &numbers {
        *counts.entry(n.to_bits()).or_insert(0) += 1;
    }

    let max_count = counts.values().cloned().max().unwrap_or(0);
    let mode: Vec<f64> = counts
        .iter()
        .filter(|&(_, &c)| c == max_count && max_count > 1)
        .map(|(&bits, _)| f64::from_bits(bits))
        .collect();

    let variance = numbers.iter().map(|&n| (n - mean).powi(2)).sum::<f64>() / count as f64;
    let std_dev = variance.sqrt();

    let geo_mean = if numbers.iter().all(|&n| n > 0.0) {
        let log_sum: f64 = numbers.iter().map(|&n| n.ln()).sum();
        (log_sum / count as f64).exp()
    } else {
        0.0
    };

    Ok(StatsResult {
        mean,
        median,
        mode,
        std_dev,
        min: sorted[0],
        max: sorted[count - 1],
        count,
        sum,
        variance,
        range: sorted[count - 1] - sorted[0],
        geometric_mean: geo_mean,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InflationResult {
    pub future_value: Decimal,
    pub purchasing_power: Decimal,
    pub total_increase_pct: f64,
}

#[tauri::command]
pub fn calculate_inflation(
    amount: f64,
    inflation_rate: f64,
    years: f64,
) -> Result<InflationResult, String> {
    let r = inflation_rate / 100.0;
    let t = years;

    // FV = PV * (1 + r)^t
    let fv = amount * (1.0 + r).powf(t);

    // Purchasing Power: PV / (1 + r)^t
    let pp = amount / (1.0 + r).powf(t);

    let total_increase_pct = ((fv - amount) / amount) * 100.0;

    Ok(InflationResult {
        future_value: Decimal::from_f64(fv).unwrap().round_dp(0),
        purchasing_power: Decimal::from_f64(pp).unwrap().round_dp(0),
        total_increase_pct,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NPSResult {
    pub total_corpus: Decimal,
    pub total_invested: Decimal,
    pub interest_earned: Decimal,
    pub lump_sum_withdrawal: Decimal,
    pub annuity_corpus: Decimal,
    pub monthly_pension: Decimal,
}

#[tauri::command]
pub fn calculate_nps(
    monthly_investment: f64,
    annual_rate: f64,
    current_age: u32,
    annuity_percent: f64,
    annuity_rate: f64,
) -> Result<NPSResult, String> {
    let years = 60 - current_age;
    if years <= 0 {
        return Err("Age must be less than 60".to_string());
    }

    let r = annual_rate / 12.0 / 100.0;
    let n = (years * 12) as f64;

    // Future Value of Annuity (SIP formula)
    // FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    let total_corpus_f64 = if r > 0.0 {
        monthly_investment * (((1.0 + r).powf(n) - 1.0) / r) * (1.0 + r)
    } else {
        monthly_investment * n
    };

    let total_invested_f64 = monthly_investment * n;
    let annuity_corpus_f64 = total_corpus_f64 * (annuity_percent / 100.0);
    let lump_sum_f64 = total_corpus_f64 - annuity_corpus_f64;

    // Monthly Pension = (Annuity Corpus * Annuity Rate) / 12
    let monthly_pension_f64 = (annuity_corpus_f64 * (annuity_rate / 100.0)) / 12.0;

    Ok(NPSResult {
        total_corpus: Decimal::from_f64(total_corpus_f64).unwrap().round_dp(0),
        total_invested: Decimal::from_f64(total_invested_f64).unwrap().round_dp(0),
        interest_earned: Decimal::from_f64(total_corpus_f64 - total_invested_f64)
            .unwrap()
            .round_dp(0),
        lump_sum_withdrawal: Decimal::from_f64(lump_sum_f64).unwrap().round_dp(0),
        annuity_corpus: Decimal::from_f64(annuity_corpus_f64).unwrap().round_dp(0),
        monthly_pension: Decimal::from_f64(monthly_pension_f64).unwrap().round_dp(0),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuadraticResult {
    pub x1_real: f64,
    pub x1_imag: f64,
    pub x2_real: f64,
    pub x2_imag: f64,
    pub is_complex: bool,
    pub discriminant: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CubicResult {
    pub roots: Vec<Root>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Root {
    pub real: f64,
    pub imag: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QuarticResult {
    pub roots: Vec<Root>,
}

#[tauri::command]
pub fn solve_cubic(a: f64, b: f64, c: f64, d: f64) -> Result<CubicResult, String> {
    if a == 0.0 {
        return solve_quadratic(b, c, d).map(|r| CubicResult {
            roots: vec![
                Root {
                    real: r.x1_real,
                    imag: r.x1_imag,
                },
                Root {
                    real: r.x2_real,
                    imag: r.x2_imag,
                },
            ],
        });
    }

    // Normalized: x^3 + Ax^2 + Bx + C = 0
    let aa = b / a;
    let bb = c / a;
    let cc = d / a;

    let q = (3.0 * bb - aa * aa) / 9.0;
    let r = (9.0 * aa * bb - 27.0 * cc - 2.0 * aa * aa * aa) / 54.0;
    let det = q * q * q + r * r;

    let mut roots = Vec::new();

    if det > 0.0 {
        let s = (r + det.sqrt()).cbrt();
        let t = (r - det.sqrt()).cbrt();
        roots.push(Root {
            real: -aa / 3.0 + (s + t),
            imag: 0.0,
        });
        roots.push(Root {
            real: -aa / 3.0 - (s + t) / 2.0,
            imag: (s - t) * (3.0f64.sqrt() / 2.0),
        });
        roots.push(Root {
            real: -aa / 3.0 - (s + t) / 2.0,
            imag: -(s - t) * (3.0f64.sqrt() / 2.0),
        });
    } else if det == 0.0 {
        let r_cbrt = r.cbrt();
        roots.push(Root {
            real: -aa / 3.0 + 2.0 * r_cbrt,
            imag: 0.0,
        });
        roots.push(Root {
            real: -aa / 3.0 - r_cbrt,
            imag: 0.0,
        });
        roots.push(Root {
            real: -aa / 3.0 - r_cbrt,
            imag: 0.0,
        });
    } else {
        let theta = (r / (-q * q * q).sqrt()).acos();
        let q_sqrt = (-q).sqrt();
        roots.push(Root {
            real: 2.0 * q_sqrt * (theta / 3.0).cos() - aa / 3.0,
            imag: 0.0,
        });
        roots.push(Root {
            real: 2.0 * q_sqrt * ((theta + 2.0 * std::f64::consts::PI) / 3.0).cos() - aa / 3.0,
            imag: 0.0,
        });
        roots.push(Root {
            real: 2.0 * q_sqrt * ((theta + 4.0 * std::f64::consts::PI) / 3.0).cos() - aa / 3.0,
            imag: 0.0,
        });
    }

    Ok(CubicResult { roots })
}

#[tauri::command]
pub fn solve_quartic(a: f64, b: f64, c: f64, d: f64, e: f64) -> Result<QuarticResult, String> {
    if a == 0.0 {
        return solve_cubic(b, c, d, e).map(|r| QuarticResult { roots: r.roots });
    }

    // Special case: Biquadratic ax^4 + cx^2 + e = 0
    if b == 0.0 && d == 0.0 {
        let quad_res = solve_quadratic(a, c, e)?;
        let mut roots = Vec::new();

        // Root 1: sqrt(quad_res.x1)
        let z1_re = quad_res.x1_real;
        let z1_im = quad_res.x1_imag;
        let r1 = (z1_re * z1_re + z1_im * z1_im).sqrt().sqrt();
        let theta1 = z1_im.atan2(z1_re) / 2.0;
        roots.push(Root {
            real: r1 * theta1.cos(),
            imag: r1 * theta1.sin(),
        });
        roots.push(Root {
            real: -r1 * theta1.cos(),
            imag: -r1 * theta1.sin(),
        });

        // Root 2: sqrt(quad_res.x2)
        let z2_re = quad_res.x2_real;
        let z2_im = quad_res.x2_imag;
        let r2 = (z2_re * z2_re + z2_im * z2_im).sqrt().sqrt();
        let theta2 = z2_im.atan2(z2_re) / 2.0;
        roots.push(Root {
            real: r2 * theta2.cos(),
            imag: r2 * theta2.sin(),
        });
        roots.push(Root {
            real: -r2 * theta2.cos(),
            imag: -r2 * theta2.sin(),
        });

        return Ok(QuarticResult { roots });
    }

    Err("Full quartic solver is coming soon in the next update. Currently supports Biquadratic (ax^4 + cx^2 + e = 0).".to_string())
}

#[tauri::command]
pub fn solve_quadratic(a: f64, b: f64, c: f64) -> Result<QuadraticResult, String> {
    if a == 0.0 {
        return Err("Coefficient 'a' cannot be zero for a quadratic equation".to_string());
    }

    let d = b * b - 4.0 * a * c;

    if d >= 0.0 {
        let x1 = (-b + d.sqrt()) / (2.0 * a);
        let x2 = (-b - d.sqrt()) / (2.0 * a);
        Ok(QuadraticResult {
            x1_real: x1,
            x1_imag: 0.0,
            x2_real: x2,
            x2_imag: 0.0,
            is_complex: false,
            discriminant: d,
        })
    } else {
        let real = -b / (2.0 * a);
        let imag = (-d).sqrt() / (2.0 * a);
        Ok(QuadraticResult {
            x1_real: real,
            x1_imag: imag,
            x2_real: real,
            x2_imag: -imag,
            is_complex: true,
            discriminant: d,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Linear2Result {
    pub x: f64,
    pub y: f64,
}

#[tauri::command]
pub fn solve_linear_2(
    a1: f64,
    b1: f64,
    c1: f64,
    a2: f64,
    b2: f64,
    c2: f64,
) -> Result<Linear2Result, String> {
    let det = a1 * b2 - a2 * b1;
    if det == 0.0 {
        return Err("The system has no unique solution (determinant is zero)".to_string());
    }

    let x = (c1 * b2 - c2 * b1) / det;
    let y = (a1 * c2 - a2 * c1) / det;

    Ok(Linear2Result { x, y })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Linear3Result {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[tauri::command]
pub fn solve_linear_3(
    a1: f64,
    b1: f64,
    c1: f64,
    d1: f64,
    a2: f64,
    b2: f64,
    c2: f64,
    d2: f64,
    a3: f64,
    b3: f64,
    c3: f64,
    d3: f64,
) -> Result<Linear3Result, String> {
    // Determinant of the coefficient matrix
    let det = a1 * (b2 * c3 - b3 * c2) - b1 * (a2 * c3 - a3 * c2) + c1 * (a2 * b3 - a3 * b2);

    if det == 0.0 {
        return Err("The system has no unique solution (determinant is zero)".to_string());
    }

    // Cramer's rule
    let dx = d1 * (b2 * c3 - b3 * c2) - b1 * (d2 * c3 - d3 * c2) + c1 * (d2 * b3 - d3 * b2);
    let dy = a1 * (d2 * c3 - d3 * c2) - d1 * (a2 * c3 - a3 * c2) + c1 * (a2 * d3 - a3 * d2);
    let dz = a1 * (b2 * d3 - b3 * d2) - b1 * (a2 * d3 - a3 * d2) + d1 * (a2 * b3 - a3 * b2);

    Ok(Linear3Result {
        x: dx / det,
        y: dy / det,
        z: dz / det,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatrixResult {
    pub data: Vec<Vec<f64>>,
}

#[tauri::command]
pub fn calculate_matrix_ops(
    a: Vec<Vec<f64>>,
    b: Vec<Vec<f64>>,
    op: String,
) -> Result<MatrixResult, String> {
    let rows = a.len();
    let cols = a[0].len();

    match op.as_str() {
        "add" => {
            let mut res = vec![vec![0.0; cols]; rows];
            for i in 0..rows {
                for j in 0..cols {
                    res[i][j] = a[i][j] + b[i][j];
                }
            }
            Ok(MatrixResult { data: res })
        }
        "sub" => {
            let mut res = vec![vec![0.0; cols]; rows];
            for i in 0..rows {
                for j in 0..cols {
                    res[i][j] = a[i][j] - b[i][j];
                }
            }
            Ok(MatrixResult { data: res })
        }
        "mul" => {
            let a_rows = a.len();
            let a_cols = a[0].len();
            let b_rows = b.len();
            let b_cols = b[0].len();

            if a_cols != b_rows {
                return Err(
                    "Matrix A columns must equal Matrix B rows for multiplication".to_string(),
                );
            }

            let mut res = vec![vec![0.0; b_cols]; a_rows];
            for i in 0..a_rows {
                for j in 0..b_cols {
                    for k in 0..a_cols {
                        res[i][j] += a[i][k] * b[k][j];
                    }
                }
            }
            Ok(MatrixResult { data: res })
        }
        "transpose" => {
            let rows = a.len();
            let cols = a[0].len();
            let mut res = vec![vec![0.0; rows]; cols];
            for i in 0..rows {
                for j in 0..cols {
                    res[j][i] = a[i][j];
                }
            }
            Ok(MatrixResult { data: res })
        }
        "inverse" => {
            let size = a.len();
            if size != a[0].len() {
                return Err("Matrix must be square to calculate inverse".to_string());
            }
            if size == 2 {
                let det = a[0][0] * a[1][1] - a[0][1] * a[1][0];
                if det == 0.0 {
                    return Err("Matrix is singular (det=0)".to_string());
                }
                let res = vec![
                    vec![a[1][1] / det, -a[0][1] / det],
                    vec![-a[1][0] / det, a[0][0] / det],
                ];
                Ok(MatrixResult { data: res })
            } else if size == 3 {
                let det = a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
                    - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
                    + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
                if det == 0.0 {
                    return Err("Matrix is singular (det=0)".to_string());
                }

                let mut res = vec![vec![0.0; 3]; 3];
                // Adjugate / Det
                res[0][0] = (a[1][1] * a[2][2] - a[1][2] * a[2][1]) / det;
                res[0][1] = (a[0][2] * a[2][1] - a[0][1] * a[2][2]) / det;
                res[0][2] = (a[0][1] * a[1][2] - a[0][2] * a[1][1]) / det;
                res[1][0] = (a[1][2] * a[2][0] - a[1][0] * a[2][2]) / det;
                res[1][1] = (a[0][0] * a[2][2] - a[0][2] * a[2][0]) / det;
                res[1][2] = (a[1][0] * a[0][2] - a[0][0] * a[1][2]) / det;
                res[2][0] = (a[1][0] * a[2][1] - a[1][1] * a[2][0]) / det;
                res[2][1] = (a[2][0] * a[0][1] - a[0][0] * a[2][1]) / det;
                res[2][2] = (a[0][0] * a[1][1] - a[0][1] * a[1][0]) / det;
                Ok(MatrixResult { data: res })
            } else {
                Err("Inverse only supported for 2x2 and 3x3".to_string())
            }
        }
        _ => Err("Invalid operation".to_string()),
    }
}

#[tauri::command]
pub fn calculate_matrix_det(a: Vec<Vec<f64>>) -> Result<f64, String> {
    let size = a.len();
    if size != a[0].len() {
        return Err("Matrix must be square to calculate determinant".to_string());
    }

    if size == 2 {
        Ok(a[0][0] * a[1][1] - a[0][1] * a[1][0])
    } else if size == 3 {
        let det = a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
            - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
            + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
        Ok(det)
    } else {
        Err("Determinant only supported for 2x2 and 3x3".to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BMIResult {
    pub bmi: f64,
    pub category: String,
    pub healthy_range: String,
}

#[tauri::command]
pub fn calculate_bmi(weight: f64, height_cm: f64) -> Result<BMIResult, String> {
    if height_cm <= 0.0 {
        return Err("Height must be greater than zero".to_string());
    }
    let height_m = height_cm / 100.0;
    let bmi = weight / (height_m * height_m);

    let category = if bmi < 18.5 {
        "Underweight"
    } else if bmi < 25.0 {
        "Normal weight"
    } else if bmi < 30.0 {
        "Overweight"
    } else {
        "Obese"
    };

    Ok(BMIResult {
        bmi: (bmi * 10.0).round() / 10.0,
        category: category.to_string(),
        healthy_range: "18.5 - 24.9".to_string(),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MarksResult {
    pub total: f64,
    pub percentage: f64,
    pub grade: String,
}

#[tauri::command]
pub fn calculate_marks(marks: Vec<f64>, max_marks: Vec<f64>) -> Result<MarksResult, String> {
    if marks.is_empty() || marks.len() != max_marks.len() {
        return Err("Invalid input: marks and max_marks count must match".to_string());
    }

    let total_obtained: f64 = marks.iter().sum();
    let total_possible: f64 = max_marks.iter().sum();

    if total_possible <= 0.0 {
        return Err("Total maximum marks must be greater than zero".to_string());
    }

    let percentage = (total_obtained / total_possible) * 100.0;

    let grade = if percentage >= 90.0 {
        "A+"
    } else if percentage >= 80.0 {
        "A"
    } else if percentage >= 70.0 {
        "B"
    } else if percentage >= 60.0 {
        "C"
    } else if percentage >= 50.0 {
        "D"
    } else {
        "F"
    };

    Ok(MarksResult {
        total: total_obtained,
        percentage: (percentage * 100.0).round() / 100.0,
        grade: grade.to_string(),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvestmentComparisonRequest {
    pub amount: f64,
    pub years: f64,
    pub is_monthly: bool,
    pub scenarios: Vec<InvestmentScenario>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvestmentScenario {
    pub name: String,
    pub rate: f64,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvestmentComparisonResult {
    pub data: Vec<InvestmentDataPoint>,
    pub timeline: Vec<TimelinePoint>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvestmentDataPoint {
    pub name: String,
    pub value: f64,
    pub color: String,
    pub total_invested: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimelinePoint {
    pub year: String,
    pub values: std::collections::HashMap<String, f64>,
}

#[tauri::command]
pub fn calculate_investment_comparison(
    req: InvestmentComparisonRequest,
) -> Result<InvestmentComparisonResult, String> {
    let mut data = Vec::new();
    let total_invested = if req.is_monthly {
        req.amount * 12.0 * req.years
    } else {
        req.amount
    };

    for s in &req.scenarios {
        let value = calculate_fv(s.rate, req.amount, req.years, req.is_monthly);
        data.push(InvestmentDataPoint {
            name: s.name.clone(),
            value,
            color: s.color.clone(),
            total_invested,
        });
    }

    let mut timeline = Vec::new();
    for i in 0..=(req.years as u32) {
        let mut values = std::collections::HashMap::new();
        for s in &req.scenarios {
            values.insert(
                s.name.clone(),
                calculate_fv(s.rate, req.amount, i as f64, req.is_monthly),
            );
        }
        timeline.push(TimelinePoint {
            year: format!("Year {}", i),
            values,
        });
    }

    Ok(InvestmentComparisonResult { data, timeline })
}

fn calculate_fv(rate: f64, p: f64, t: f64, monthly: bool) -> f64 {
    let r = rate / 100.0;
    if monthly {
        if r == 0.0 {
            return p * 12.0 * t;
        }
        let mon_r = r / 12.0;
        let total_months = t * 12.0;
        p * (((1.0 + mon_r).powf(total_months) - 1.0) / mon_r) * (1.0 + mon_r)
    } else {
        p * (1.0 + r).powf(t)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PriceItem {
    pub name: String,
    pub price: f64,
    pub quantity: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PriceComparisonResult {
    pub items: Vec<PriceItemResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PriceItemResult {
    pub name: String,
    pub unit_price: f64,
    pub savings_vs_best: f64,
}

#[tauri::command]
pub fn calculate_price_comparison(items: Vec<PriceItem>) -> Result<PriceComparisonResult, String> {
    if items.is_empty() {
        return Err("No items provided".to_string());
    }

    let mut results: Vec<PriceItemResult> = items
        .iter()
        .map(|item| {
            let unit_price = if item.quantity > 0.0 {
                item.price / item.quantity
            } else {
                0.0
            };
            PriceItemResult {
                name: item.name.clone(),
                unit_price,
                savings_vs_best: 0.0,
            }
        })
        .collect();

    let min_unit_price = results
        .iter()
        .filter(|r| r.unit_price > 0.0)
        .map(|r| r.unit_price)
        .fold(f64::INFINITY, f64::min);

    for r in &mut results {
        if r.unit_price > 0.0 && min_unit_price != f64::INFINITY {
            r.savings_vs_best = ((r.unit_price - min_unit_price) / r.unit_price) * 100.0;
        }
    }

    Ok(PriceComparisonResult { items: results })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RealReturnResult {
    pub real_rate: f64,
    pub future_value_nominal: Decimal,
    pub future_value_real: Decimal,
}

#[tauri::command]
pub fn calculate_real_return(
    initial_amount: f64,
    nominal_rate: f64,
    inflation_rate: f64,
    years: f64,
) -> Result<RealReturnResult, String> {
    let n = nominal_rate / 100.0;
    let i = inflation_rate / 100.0;

    // Real Rate = ((1 + nominal) / (1 + inflation)) - 1
    let real_rate = ((1.0 + n) / (1.0 + i)) - 1.0;

    let fv_nominal = initial_amount * (1.0 + n).powf(years);
    let fv_real = initial_amount * (1.0 + real_rate).powf(years);

    Ok(RealReturnResult {
        real_rate: real_rate * 100.0,
        future_value_nominal: Decimal::from_f64(fv_nominal)
            .unwrap_or(Decimal::ZERO)
            .round_dp(2),
        future_value_real: Decimal::from_f64(fv_real)
            .unwrap_or(Decimal::ZERO)
            .round_dp(2),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaxResult {
    pub old_regime_tax: f64,
    pub new_regime_tax: f64,
    pub savings: f64,
}

#[tauri::command]
pub fn calculate_income_tax_india(
    income: f64,
    business_income: f64,
    deductions: f64,
) -> Result<TaxResult, String> {
    // FY 2024-25 Rules (Simplified)

    // Business Income (Presumptive 44AD) - assume 6% profit for digital transactions
    let business_profit = business_income * 0.06;
    let total_income = income + business_profit;

    // New Regime (Default)
    let std_ded_new = 75000.0;
    let taxable_new = (total_income - std_ded_new).max(0.0);
    let mut tax_new = 0.0;

    // New Slabs for FY 24-25
    if taxable_new > 300000.0 {
        if taxable_new <= 700000.0 {
            tax_new = (taxable_new - 300000.0) * 0.05;
        } else if taxable_new <= 1000000.0 {
            tax_new = 20000.0 + (taxable_new - 700000.0) * 0.10;
        } else if taxable_new <= 1200000.0 {
            tax_new = 50000.0 + (taxable_new - 1000000.0) * 0.15;
        } else if taxable_new <= 1500000.0 {
            tax_new = 80000.0 + (taxable_new - 1200000.0) * 0.20;
        } else {
            tax_new = 140000.0 + (taxable_new - 1500000.0) * 0.30;
        }
    }

    // Rebate u/s 87A for New Regime (up to 7L income)
    if total_income <= 700000.0 {
        tax_new = 0.0;
    }

    tax_new *= 1.04; // Cess 4%

    // Old Regime
    let std_ded_old = 50000.0;
    let taxable_old = (total_income - std_ded_old - deductions).max(0.0);
    let mut tax_old = 0.0;

    if taxable_old > 250000.0 {
        if taxable_old <= 500000.0 {
            tax_old = (taxable_old - 250000.0) * 0.05;
        } else if taxable_old <= 1000000.0 {
            tax_old = 12500.0 + (taxable_old - 500000.0) * 0.20;
        } else {
            tax_old = 112500.0 + (taxable_old - 1000000.0) * 0.30;
        }

        // Rebate u/s 87A for Old Regime (up to 5L taxable)
        if taxable_old <= 500000.0 {
            tax_old = 0.0;
        }
    }
    tax_old *= 1.04; // Cess 4%

    Ok(TaxResult {
        old_regime_tax: tax_old,
        new_regime_tax: tax_new,
        savings: (tax_old - tax_new).max(0.0),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FIREResult {
    pub corpus_needed: f64,
    pub years_to_fire: i32,
    pub future_annual_expenses: f64,
}

#[tauri::command]
pub fn calculate_fire_projection(
    current_age: i32,
    target_age: i32,
    monthly_expenses: f64,
    inflation_rate: f64,
    swr: f64,
) -> Result<FIREResult, String> {
    let years = target_age - current_age;
    if years <= 0 {
        return Err("Target age must be greater than current age".to_string());
    }
    let future_expenses = monthly_expenses * (1.0 + inflation_rate / 100.0).powf(years as f64);
    let annual_future_expenses = future_expenses * 12.0;
    let corpus_needed = annual_future_expenses / (swr / 100.0);
    Ok(FIREResult {
        corpus_needed,
        years_to_fire: years,
        future_annual_expenses: annual_future_expenses,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockAvgResult {
    pub total_qty: f64,
    pub avg_price: f64,
    pub total_cost: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockEntry {
    pub price: f64,
    pub qty: f64,
}

#[tauri::command]
pub fn calculate_stock_average(entries: Vec<StockEntry>) -> Result<StockAvgResult, String> {
    let mut total_qty = 0.0;
    let mut total_cost = 0.0;
    for e in entries {
        total_qty += e.qty;
        total_cost += e.price * e.qty;
    }
    if total_qty == 0.0 {
        return Err("Total quantity cannot be zero".to_string());
    }
    Ok(StockAvgResult {
        total_qty,
        avg_price: total_cost / total_qty,
        total_cost,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DataPoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GraphResult {
    pub functions: Vec<Vec<DataPoint>>,
}

#[tauri::command]
pub fn calculate_function_samples(
    expression: String,
    x_min: f64,
    x_max: f64,
    points: i32,
) -> Result<GraphResult, String> {
    let mut all_results = Vec::new();
    let exprs: Vec<&str> = expression
        .split(';')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();

    let step = (x_max - x_min) / (points as f64 - 1.0);

    for expr_str in exprs {
        let mut results = Vec::new();
        let expr: meval::Expr = match expr_str.parse() {
            Ok(e) => e,
            Err(_) => return Err(format!("Invalid expression syntax: {}", expr_str)),
        };

        let func = match expr.bind("x") {
            Ok(f) => f,
            Err(_) => return Err(format!("Expression must be a function of x: {}", expr_str)),
        };

        for i in 0..points {
            let x = x_min + (i as f64) * step;
            let y = func(x);
            if y.is_finite() {
                results.push(DataPoint { x, y });
            }
        }
        all_results.push(results);
    }

    Ok(GraphResult {
        functions: all_results,
    })
}
