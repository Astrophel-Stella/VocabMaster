/**
 * Password strength validation utilities for REQ-AUTH-006
 *
 * This module provides password strength validation functionality
 * that can be reused across the application (SOU-26, SOU-28, etc.).
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    digit: boolean;
  };
}

/**
 * Validate password strength according to REQ-AUTH-006 and ADR-0011
 *
 * Requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 *
 * Strength levels:
 * - weak: Does not meet basic requirements
 * - strong: Meets all basic requirements (8+ chars, upper, lower, digit)
 * - very_strong: 12+ characters AND contains special characters
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
  };

  const errors: string[] = [];

  if (!checks.length) {
    errors.push('密码长度至少8个字符');
  }
  if (!checks.uppercase) {
    errors.push('密码需包含至少1个大写字母');
  }
  if (!checks.lowercase) {
    errors.push('密码需包含至少1个小写字母');
  }
  if (!checks.digit) {
    errors.push('密码需包含至少1个数字');
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' | 'very_strong' = 'weak';

  if (errors.length === 0) {
    if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength = 'very_strong';
    } else {
      strength = 'strong';
    }
  } else if (password.length > 0) {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    checks,
  };
}

/**
 * Get strength text for display
 */
export function getStrengthText(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'very_strong':
      return '密码强度：非常强';
    case 'strong':
      return '密码强度：强';
    case 'medium':
      return '密码强度：中';
    case 'weak':
    default:
      return '密码强度：弱';
  }
}

/**
 * Get strength color for display
 */
export function getStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'very_strong':
      return 'bg-green-600';
    case 'strong':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'weak':
    default:
      return 'bg-red-500';
  }
}
