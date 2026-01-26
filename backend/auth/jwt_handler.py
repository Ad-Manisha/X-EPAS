# auth/jwt_handler.py - JWT token creation and validation
# Handles JSON Web Tokens for user authentication

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from config import settings

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    JWT (JSON Web Token) contains:
    - User information (user_id, role, etc.)
    - Expiration time
    - Digital signature (prevents tampering)
    
    Args:
        data (dict): Information to encode in token (user_id, role, etc.)
        expires_delta (timedelta, optional): Custom expiration time
        
    Returns:
        str: JWT token string
        
    Example:
        token_data = {"user_id": "ADM001", "role": "admin", "user_type": "admin"}
        token = create_access_token(token_data)
        # Returns: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    """
    # Make a copy of the data to avoid modifying the original
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Use default expiration from config (24 hours)
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    
    # Add expiration to token data
    to_encode.update({"exp": expire})
    
    # Create and return the JWT token
    encoded_jwt = jwt.encode(
        to_encode,                    # Data to encode
        settings.jwt_secret_key,      # Secret key for signing
        algorithm=settings.jwt_algorithm  # Algorithm (HS256)
    )
    
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token
    
    This function:
    1. Checks if token is valid (not tampered with)
    2. Checks if token is not expired
    3. Returns the decoded data if valid
    
    Args:
        token (str): JWT token to verify
        
    Returns:
        dict: Decoded token data if valid, None if invalid
        
    Example:
        token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
        payload = verify_token(token)
        if payload:
            user_id = payload.get("user_id")
            role = payload.get("role")
    """
    try:
        # Decode and verify the token
        payload = jwt.decode(
            token,                       # Token to decode
            settings.jwt_secret_key,     # Secret key for verification
            algorithms=[settings.jwt_algorithm]  # Expected algorithm
        )
        
        # Check if token has required fields
        user_id: str = payload.get("user_id")
        if user_id is None:
            return None
            
        return payload
        
    except JWTError:
        # Token is invalid, expired, or tampered with
        return None

def create_token_response(user_id: str, role: str, user_type: str) -> Dict[str, Any]:
    """
    Create a complete token response for login
    
    This creates the standard response format for successful login
    
    Args:
        user_id (str): User's ID (ADM001, EMP001, etc.)
        role (str): User's role (admin, employee)
        user_type (str): Type of user (admin, employee)
        
    Returns:
        dict: Complete token response
    """
    # Data to encode in the token
    token_data = {
        "user_id": user_id,
        "role": role,
        "user_type": user_type
    }
    
    # Create the access token
    access_token = create_access_token(token_data)
    
    # Return complete response
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.jwt_expiration_hours * 3600,  # Convert hours to seconds
        "user_id": user_id,
        "role": role,
        "user_type": user_type
    }

# Token validation utilities
def extract_user_from_token(token: str) -> Optional[Dict[str, str]]:
    """
    Extract user information from a valid token
    
    Args:
        token (str): JWT token
        
    Returns:
        dict: User information if token is valid, None otherwise
    """
    payload = verify_token(token)
    if not payload:
        return None
    
    return {
        "user_id": payload.get("user_id"),
        "role": payload.get("role"),
        "user_type": payload.get("user_type")
    }
