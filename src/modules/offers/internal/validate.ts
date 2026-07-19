/**
 * Pure offer validation. Amount is required and must be positive. Returns a
 * message or null. (Conditions text and settlement days are free/optional.)
 */
export function validateOffer(input: {
  amount: number | null;
}): string | null {
  if (input.amount == null || Number.isNaN(input.amount)) {
    return "Enter an offer amount.";
  }
  if (input.amount <= 0) {
    return "Offer amount must be greater than zero.";
  }
  return null;
}
