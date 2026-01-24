# auth/password.py - Password hashing and verification (Direct bcrypt - Python 3.13 compatible)
# Handles secure password operations using bcrypt directly

import bcrypt
from config import settings

def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt directly
    
    This approach is more reliable with Python 3.13
    
    Args:
        password (str): Plain text password from user input
        
    Returns:
        str: Hashed password safe for database storage
    """
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    
    # Generate salt with configured rounds
    salt = bcrypt.gensalt(rounds=settings.password_hash_rounds)
    
    # Hash the password
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Return as string for database storage
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password
    
    Args:
        plain_password (str): Password provided by user during login
        hashed_password (str): Hashed password stored in database
        
    Returns:
        bool: True if password matches, False otherwise
    """
    try:
        # Convert both to bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # Verify using bcrypt
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        # Log error in production
        print(f"Password verification error: {e}")
        return False

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements
    
    Requirements:
    - At least 8 characters
    - Contains uppercase letter
    - Contains lowercase letter  
    - Contains digit
    - Contains special character
    
    Args:
        password (str): Password to validate
        
    Returns:
        tuple[bool, str]: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is strong"

# Alias for compatibility (if needed elsewhere)
def get_password_hash(password: str) -> str:
    """Alias for hash_password for compatibility"""
    return hash_password(password)

# Test function for development
if __name__ == "__main__":
    # Test the password functions
    test_password = "TestPassword123!"
    print(f"Testing password: {test_password}")
    
    # Test hashing
    hashed = hash_password(test_password)
    print(f"Hashed: {hashed[:50]}...")  # Show first 50 chars
    
    # Test verification
    is_valid = verify_password(test_password, hashed)
    print(f"Verification (correct): {is_valid}")
    
    # Test wrong password
    is_invalid = verify_password("WrongPassword", hashed)
    print(f"Verification (wrong): {is_invalid}")
    
    # Test password strength
    is_strong, message = validate_password_strength(test_password)
    print(f"Password strength: {is_strong} - {message}")
