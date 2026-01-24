# models/__init__.py - Shared model utilities and base classes (Pydantic v2 compatible)
# Common code used across all model files

from pydantic import BaseModel, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from bson import ObjectId
from typing import Optional, Any

class PyObjectId(ObjectId):
    """
    Custom ObjectId type for Pydantic v2
    Converts MongoDB ObjectId to string for JSON serialization
    
    This class is shared across all models to avoid code duplication
    """
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetJsonSchemaHandler
    ) -> core_schema.CoreSchema:
        """
        Pydantic v2 method for defining core schema
        Replaces the old __get_validators__ method
        """
        return core_schema.union_schema([
            # Accept ObjectId instances
            core_schema.is_instance_schema(ObjectId),
            # Accept string representations and validate them
            core_schema.no_info_plain_validator_function(cls.validate_object_id),
        ])
    
    @classmethod
    def validate_object_id(cls, value: Any) -> ObjectId:
        """
        Validate and convert value to ObjectId
        
        Args:
            value: Input value (string or ObjectId)
            
        Returns:
            ObjectId: Valid ObjectId instance
            
        Raises:
            ValueError: If value is not a valid ObjectId
        """
        if isinstance(value, ObjectId):
            return value
        if isinstance(value, str) and ObjectId.is_valid(value):
            return ObjectId(value)
        raise ValueError("Invalid ObjectId")
    
    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        """
        Pydantic v2 method for JSON schema generation
        Replaces the old __modify_schema__ method
        """
        return {"type": "string", "format": "objectid"}

# You can also add other common base classes here if needed in the future
class BaseDBModel(BaseModel):
    """
    Base model for database documents
    Can be extended with common database fields if needed
    """
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
