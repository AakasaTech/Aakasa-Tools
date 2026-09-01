export interface BmiCategory {
  label: string;
  /** The numeric range for this category, as shown to the user. */
  range: string;
}

const LB_TO_KG = 0.45359237;

/** Standard BMI formula: weight (kg) ÷ height (m)². */
export function calculateBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/** WHO standard adult BMI category thresholds. */
export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return { label: 'Underweight', range: 'below 18.5' };
  if (bmi < 25) return { label: 'Normal weight', range: '18.5–24.9' };
  if (bmi < 30) return { label: 'Overweight', range: '25.0–29.9' };
  return { label: 'Obese', range: '30.0 and above' };
}

export function lbToKg(lb: number): number {
  return lb * LB_TO_KG;
}

export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return totalInches * 2.54;
}
