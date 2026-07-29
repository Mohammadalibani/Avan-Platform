# app/services/base_service.py
from typing import Optional, List, Dict, Any
from app.extensions import db
from app.models.base import BaseModel


class BaseService:
    """Base service with common CRUD operations"""
    
    def __init__(self, model_class):
        self.model_class = model_class
    
    def get_all(self) -> List[BaseModel]:
        """Get all records"""
        return self.model_class.query.all()
    
    def get_by_id(self, id: int) -> Optional[BaseModel]:
        """Get record by ID"""
        return self.model_class.query.get(id)
    
    def create(self, **kwargs) -> BaseModel:
        """Create a new record"""
        instance = self.model_class(**kwargs)
        instance.save()
        return instance
    
    def update(self, id: int, **kwargs) -> Optional[BaseModel]:
        """Update a record by ID"""
        instance = self.get_by_id(id)
        if not instance:
            return None
        
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        
        instance.save()
        return instance
    
    def delete(self, id: int) -> bool:
        """Delete a record by ID"""
        instance = self.get_by_id(id)
        if not instance:
            return False
        
        instance.delete()
        return True
    
    def filter_by(self, **kwargs) -> List[BaseModel]:
        """Filter records by criteria"""
        return self.model_class.query.filter_by(**kwargs).all()
    
    def get_or_create(self, defaults: Dict = None, **kwargs) -> tuple:
        """Get or create a record"""
        instance = self.model_class.query.filter_by(**kwargs).first()
        if instance:
            return instance, False
        
        if defaults:
            kwargs.update(defaults)
        instance = self.create(**kwargs)
        return instance, True