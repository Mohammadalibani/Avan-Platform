# app/services/auth_service.py
from typing import Optional, Dict
from flask_login import login_user, logout_user, current_user
from app.services.user_service import UserService


class AuthService:
    """Authentication service"""
    
    def __init__(self):
        self.user_service = UserService()
    
    def login(self, username: str, password: str, remember: bool = False) -> Dict:
        """Login user and return result"""
        user = self.user_service.authenticate(username, password)
        
        if not user:
            return {
                'success': False,
                'message': 'Invalid username or password'
            }
        
        if not user.is_active:
            return {
                'success': False,
                'message': 'Account is deactivated'
            }
        
        # Login user
        login_user(user, remember=remember)
        self.user_service.update_last_login(user.id)
        
        return {
            'success': True,
            'user': user.to_dict(),
            'message': 'Login successful'
        }
    
    def logout(self) -> Dict:
        """Logout user"""
        logout_user()
        return {
            'success': True,
            'message': 'Logout successful'
        }
    
    def get_current_user(self) -> Optional[Dict]:
        """Get current logged-in user"""
        if current_user.is_authenticated:
            return current_user.to_dict()
        return None
    
    def is_authenticated(self) -> bool:
        """Check if user is authenticated"""
        return current_user.is_authenticated
    
    def change_password(self, user_id: int, old_password: str, 
                        new_password: str) -> Dict:
        """Change user password"""
        user = self.user_service.get_by_id(user_id)
        if not user:
            return {
                'success': False,
                'message': 'User not found'
            }
        
        if not user.check_password(old_password):
            return {
                'success': False,
                'message': 'Current password is incorrect'
            }
        
        user.set_password(new_password)
        user.save()
        
        return {
            'success': True,
            'message': 'Password changed successfully'
        }
    
    def reset_password(self, email: str) -> Dict:
        """Send password reset email (placeholder)"""
        user = self.user_service.get_by_email(email)
        if not user:
            return {
                'success': False,
                'message': 'Email not found'
            }
        
        # TODO: Send password reset email
        # Generate token, send email, etc.
        
        return {
            'success': True,
            'message': f'Password reset email sent to {email}'
        }