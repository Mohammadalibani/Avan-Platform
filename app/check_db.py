# check_db.py
import os
import sys

# اضافه کردن مسیر پروژه به sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models.user import User
from app.models.department import Department
from app.models.unit import Unit
from app.models.personnel import Personnel
from app.models.settings import Setting

def check_database():
    print("=" * 60)
    print("📊 بررسی دیتابیس")
    print("=" * 60)
    
    try:
        app = create_app('development')
        
        with app.app_context():
            # مسیر دیتابیس
            db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
            print(f"📁 مسیر دیتابیس: {db_path}")
            print(f"📁 وجود فایل: {os.path.exists(db_path)}")
            
            if os.path.exists(db_path):
                size = os.path.getsize(db_path)
                print(f"📁 حجم فایل: {size / 1024:.2f} KB")
            else:
                print("❌ فایل دیتابیس وجود ندارد!")
                print("   برای ایجاد دیتابیس، دستور زیر را اجرا کنید:")
                print("   python init_db.py")
                return
            
            print("\n📋 لیست کاربران:")
            users = User.query.all()
            if users:
                for user in users:
                    print(f"   - ID: {user.id} | {user.first_name} {user.last_name} | نقش: {user.role} | فعال: {user.is_active}")
            else:
                print("   ❌ هیچ کاربری در دیتابیس وجود ندارد!")
            
            print(f"\n📊 تعداد کاربران: {User.query.count()}")
            print(f"📊 تعداد دپارتمان‌ها: {Department.query.count()}")
            print(f"📊 تعداد واحدها: {Unit.query.count()}")
            print(f"📊 تعداد پرسنل: {Personnel.query.count()}")
            print(f"📊 تعداد تنظیمات: {Setting.query.count()}")
            
            print("=" * 60)
            
    except Exception as e:
        print(f"❌ خطا: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_database()