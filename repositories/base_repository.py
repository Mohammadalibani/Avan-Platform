# app/repositories/base_repository.py (اضافه کردن pagination)
from typing import Optional, List, Dict, Tuple
from app.extensions import db
from app.models.base import BaseModel


class BaseRepository:
    """Base repository with optimized queries"""
    
    def __init__(self, model_class):
        self.model_class = model_class
    
    def get_all(self, page: int = 1, per_page: int = 20) -> Tuple[List[BaseModel], int]:
        """Get all records with pagination"""
        query = self.model_class.query
        total = query.count()
        
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total
    
    def get_by_id(self, id: int) -> Optional[BaseModel]:
        """Get record by ID with caching"""
        return self.model_class.query.get(id)
    
    def filter_by(self, page: int = 1, per_page: int = 20, **kwargs) -> Tuple[List[BaseModel], int]:
        """Filter records with pagination"""
        query = self.model_class.query.filter_by(**kwargs)
        total = query.count()
        
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total
    
    def create(self, **kwargs) -> BaseModel:
        """Create a new record"""
        instance = self.model_class(**kwargs)
        instance.save()
        return instance
    
    def update(self, id: int, **kwargs) -> Optional[BaseModel]:
        """Update a record"""
        instance = self.get_by_id(id)
        if not instance:
            return None
        
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        
        instance.save()
        return instance
    
    def delete(self, id: int) -> bool:
        """Delete a record"""
        instance = self.get_by_id(id)
        if not instance:
            return False
        
        instance.delete()
        return True
    
    def bulk_create(self, items: List[Dict]) -> List[BaseModel]:
        """Bulk create records"""
        instances = [self.model_class(**item) for item in items]
        db.session.add_all(instances)
        db.session.commit()
        return instances
    
    def count(self, **kwargs) -> int:
        """Count records with filters"""
        return self.model_class.query.filter_by(**kwargs).count()