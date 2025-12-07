import { calculateMonthlyPayment, calculateDSCR, getDSCRMessage, parseNumber } from './calculations';

describe('Calculations', () => {
  describe('parseNumber', () => {
    it('should parse a number', () => {
      expect(parseNumber(100)).toBe(100);
    });

    it('should parse a string with decimal point', () => {
      expect(parseNumber('100.50')).toBe(100.5);
    });

    it('should parse a string with comma as decimal separator', () => {
      expect(parseNumber('100,50')).toBe(100.5);
    });

    it('should return 0 for null or empty string', () => {
      expect(parseNumber(null)).toBe(0);
      expect(parseNumber('')).toBe(0);
    });
  });

  describe('calculateMonthlyPayment', () => {
    it('should calculate monthly payment with basic values', () => {
      // Loan: 250,000€ at 3.5% for 25 years
      const payment = calculateMonthlyPayment(250000, 3.5, 25);
      // Expected: ~1251.56€ per month
      expect(payment).toBeCloseTo(1251.56, 1);
    });

    it('should return 0 for zero principal', () => {
      expect(calculateMonthlyPayment(0, 3.5, 25)).toBe(0);
    });

    it('should return 0 for zero years', () => {
      expect(calculateMonthlyPayment(250000, 3.5, 0)).toBe(0);
    });

    it('should handle zero interest rate', () => {
      // Loan: 250,000€ at 0% for 25 years
      const payment = calculateMonthlyPayment(250000, 0, 25);
      // Expected: 250000 / (25 * 12) = ~833.33€
      expect(payment).toBeCloseTo(833.33, 1);
    });
  });

  describe('calculateDSCR', () => {
    it('should calculate DSCR correctly', () => {
      // Monthly rent: 2000€, expenses: 300€, debt: 1000€
      // NOI = 2000 - 300 = 1700€/month = 20,400€/year
      // Debt = 1000€/month = 12,000€/year
      // DSCR = 20400 / 12000 = 1.7
      const dscr = calculateDSCR(2000, 300, 1000);
      expect(dscr).toBeCloseTo(1.7, 1);
    });

    it('should return 0 for zero debt payment', () => {
      expect(calculateDSCR(2000, 300, 0)).toBe(0);
    });

    it('should handle negative NOI (negative cash flow)', () => {
      // Monthly rent: 1000€, expenses: 2000€, debt: 500€
      // NOI = 1000 - 2000 = -1000€/month = -12,000€/year
      // Debt = 500€/month = 6000€/year
      // DSCR = -12000 / 6000 = -2
      const dscr = calculateDSCR(1000, 2000, 500);
      expect(dscr).toBeCloseTo(-2, 1);
    });
  });

  describe('getDSCRMessage', () => {
    it('should return warning message for DSCR < 1', () => {
      const msg = getDSCRMessage(0.8);
      expect(msg).toContain('DSCR < 1');
    });

    it('should return caution message for 1 <= DSCR < 1.2', () => {
      const msg = getDSCRMessage(1.1);
      expect(msg).toContain('1 ≤ DSCR < 1,2');
    });

    it('should return positive message for DSCR >= 1.2', () => {
      const msg = getDSCRMessage(1.5);
      expect(msg).toContain('DSCR ≥ 1,2');
    });
  });
});
