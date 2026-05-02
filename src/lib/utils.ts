import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currencyCode: string = 'INR') {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val)) return currencyCode === 'INR' ? "₹0.00" : "$0.00";
  
  // Use en-IN for INR to get Lakh/Crore grouping, otherwise use en-US
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatINR(amount: number | string) {
  return formatCurrency(amount, 'INR');
}

export function formatNumber(amount: number | string) {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val)) return "0";
  return new Intl.NumberFormat('en-IN').format(val);
}

export function numberToWords(amount: number | string, currencyCode: string = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return "";

  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];

  const formatSegment = (n: number) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + a[n % 10];
  };

  const isINR = currencyCode === 'INR';

  const convertInternational = (n: number): string => {
    if (n === 0) return "";
    if (n < 100) return formatSegment(n);
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + convertInternational(n % 100);
    if (n < 1000000) return convertInternational(Math.floor(n / 1000)) + "Thousand " + convertInternational(n % 1000);
    if (n < 1000000000) return convertInternational(Math.floor(n / 1000000)) + "Million " + convertInternational(n % 1000000);
    return convertInternational(Math.floor(n / 1000000000)) + "Billion " + convertInternational(n % 1000000000);
  };

  const convertIndian = (n: number): string => {
    if (n === 0) return "";
    if (n < 100) return formatSegment(n);
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + convertIndian(n % 100);
    if (n < 100000) return convertIndian(Math.floor(n / 1000)) + "Thousand " + convertIndian(n % 1000);
    if (n < 10000000) return convertIndian(Math.floor(n / 100000)) + "Lakh " + convertIndian(n % 100000);
    return convertIndian(Math.floor(n / 10000000)) + "Crore " + convertIndian(n % 10000000);
  };

  const whole = Math.floor(num);
  const decimal = Math.round((num - whole) * 100);

  let currencyName = "Rupee";
  let decimalName = "Paise";

  if (currencyCode === 'USD') { currencyName = "Dollar"; decimalName = "Cent"; }
  else if (currencyCode === 'EUR') { currencyName = "Euro"; decimalName = "Cent"; }
  else if (currencyCode === 'GBP') { currencyName = "Pound"; decimalName = "Penny"; }

  const convert = isINR ? convertIndian : convertInternational;
  
  let result = "";
  if (whole > 0) {
    result += convert(whole) + (whole === 1 ? currencyName : currencyName + "s") + " ";
  }
  if (decimal > 0) {
    if (result) result += "and ";
    result += convert(decimal) + (decimal === 1 ? decimalName : decimalName + "s") + " ";
  }

  return result.trim();
}

export function numberToWordsINR(amount: number | string): string {
  return numberToWords(amount, 'INR');
}

export function exportToPDF() {
  window.print();
}
