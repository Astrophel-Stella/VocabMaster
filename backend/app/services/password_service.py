"""
Password validation service for REQ-AUTH-006.

This module provides password strength validation functionality
that can be reused across the application (SOU-26, SOU-28, etc.).
"""

import re
from pydantic import BaseModel


class PasswordValidationResult(BaseModel):
    """Result of password strength validation"""
    is_valid: bool
    errors: list[str] = []
    strength: str  # "weak", "medium", "strong", "very_strong"


def validate_password_strength(password: str) -> PasswordValidationResult:
    """
    Validate password strength according to REQ-AUTH-006 and ADR-0011.

    Requirements:
    - At least 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit

    Returns validation result with errors and strength level.

    Strength levels:
    - weak: Does not meet basic requirements
    - strong: Meets all basic requirements (8+ chars, upper, lower, digit)
    - very_strong: 12+ characters AND contains special characters
    """
    errors = []

    # Check length
    if len(password) < 8:
        errors.append("密码长度至少8个字符")

    # Check uppercase
    if not re.search(r'[A-Z]', password):
        errors.append("密码需包含至少1个大写字母")

    # Check lowercase
    if not re.search(r'[a-z]', password):
        errors.append("密码需包含至少1个小写字母")

    # Check digit
    if not re.search(r'\d', password):
        errors.append("密码需包含至少1个数字")

    # Determine strength
    if errors:
        strength = "weak"
    elif len(password) >= 12 and re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        strength = "very_strong"
    elif len(password) >= 8:
        strength = "strong"
    else:
        strength = "medium"

    is_valid = len(errors) == 0

    return PasswordValidationResult(
        is_valid=is_valid,
        errors=errors,
        strength=strength
    )
