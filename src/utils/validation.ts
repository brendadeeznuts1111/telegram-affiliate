/**
 * Input Validation Utilities
 * Validates user input for security and data integrity
 */

export class Validator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (international format)
   */
  static isValidPhone(phone: string): boolean {
    // Allows: +1234567890, +1-234-567-8900, etc.
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Validate customer name
   */
  static isValidName(name: string): boolean {
    return name.length >= 2 && name.length <= 100;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * Validate commission percentage
   */
  static isValidPercentage(percentage: number): boolean {
    return percentage >= 0 && percentage <= 100;
  }

  /**
   * Validate amount (currency)
   */
  static isValidAmount(amount: number): boolean {
    return amount > 0 && amount < 1000000 && !isNaN(amount);
  }

  /**
   * Parse customer data from message
   */
  static parseCustomerData(text: string): {
    name?: string;
    phone?: string;
    email?: string;
  } {
    const data: { name?: string; phone?: string; email?: string } = {};
    const lines = text.trim().split('\n');

    for (const line of lines) {
      if (!line.includes(':')) continue;

      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      const normalizedKey = key.trim().toLowerCase();

      if (normalizedKey === 'name') {
        data.name = this.sanitizeString(value);
      } else if (normalizedKey === 'phone') {
        data.phone = this.sanitizeString(value);
      } else if (normalizedKey === 'email') {
        data.email = this.sanitizeString(value).toLowerCase();
      }
    }

    return data;
  }

  /**
   * Validate customer data completeness
   */
  static validateCustomerData(data: {
    name?: string;
    phone?: string;
    email?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || !this.isValidName(data.name)) {
      errors.push('Invalid or missing name');
    }

    if (!data.phone || !this.isValidPhone(data.phone)) {
      errors.push('Invalid or missing phone number');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Invalid or missing email');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

