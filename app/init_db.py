# init_db.py
import os
import sys

# اضافه کردن مسیر پروژه به sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.settings import Setting
from app.models.department import Department
from app.models.unit import Unit
from app.models.personnel import Personnel
from app.models.request import Request
from app.models.ticket import Ticket

def init_database():
    print("=" * 60)
    print("🔄 در حال راه‌اندازی دیتابیس...")
    print("=" * 60)
    
    try:
        app = create_app('development')
        
        with app.app_context():
            # ایجاد پوشه instance
            instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
            os.makedirs(instance_path, exist_ok=True)
            print(f"✅ پوشه instance ایجاد شد: {instance_path}")
            
            # مسیر دیتابیس
            db_path = os.path.join(instance_path, 'avan_system.db')
            print(f"📁 مسیر دیتابیس: {db_path}")
            
            # ایجاد جداول
            db.create_all()
            print("✅ جداول دیتابیس ایجاد شدند")
            
            # ایجاد ادمین
            print("\n👤 ایجاد کاربر ادمین...")
            admin = User.query.filter_by(role='admin').first()
            if not admin:
                admin = User(
                    national_code='1234567890',
                    username='1234567890',
                    first_name='مدیر',
                    last_name='سیستم',
                    role='admin',
                    personnel_code='ADMIN001',
                    is_active=True,
                    is_approved=True
                )
                admin.set_password('1234')
                db.session.add(admin)
                db.session.commit()
                print("✅ ادمین پیش‌فرض ایجاد شد")
                print("   👤 کد ملی: 1234567890")
                print("   🔑 رمز عبور: 1234")
            else:
                print(f"✅ ادمین موجود است: {admin.first_name} {admin.last_name}")
            
            # تنظیمات پیش‌فرض
            print("\n⚙️ ایجاد تنظیمات پیش‌فرض...")
            default_settings = {
                'base_url': 'localhost',
                'port': '5000',
                'site_name': 'سامانه مدیریت پیشرفته',
                'theme': 'light',
                'timezone': 'Asia/Tehran'
            }
            
            for key, value in default_settings.items():
                if not Setting.query.filter_by(key=key).first():
                    Setting.set(key, value)
                    print(f"   - {key}: {value}")
            print("✅ تنظیمات پیش‌فرض ایجاد شد")
            
            # دپارتمان پیش‌فرض
            print("\n🏢 ایجاد دپارتمان پیش‌فرض...")
            if not Department.query.first():
                dept = Department(
                    name='مدیریت',
                    code='MNG',
                    description='دپارتمان مدیریت سیستم',
                    is_active=True
                )
                db.session.add(dept)
                db.session.commit()
                print(f"✅ دپارتمان پیش‌فرض ایجاد شد: {dept.name}")
            
            # نمایش اطلاعات
            print("\n" + "=" * 60)
            print("📊 وضعیت دیتابیس:")
            print("=" * 60)
            print(f"   👤 کاربران: {User.query.count()}")
            print(f"   🏢 دپارتمان‌ها: {Department.query.count()}")
            print(f"   📋 واحدها: {Unit.query.count()}")
            print(f"   👥 پرسنل: {Personnel.query.count()}")
            print("=" * 60)
            
            print("\n✅ مقداردهی اولیه دیتابیس با موفقیت انجام شد!")
            print("=" * 60)
            
    except Exception as e:
        print(f"\n❌ خطا: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    init_database()