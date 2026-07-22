from app import create_app
from app.extensions import db
from app.models.user import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # 1. بررسی وجود کاربر
    admin = User.query.filter_by(username="1234567890").first()

    if admin:
        print("⚠️ کاربر ادمین قبلاً وجود دارد!")
        print(f"   نام: {admin.get_full_name()}")
        print(f"   نقش: {admin.role}")
        print(f"   فعال: {admin.is_active}")
        print(f"   تایید شده: {admin.is_approved}")

        # به‌روزرسانی رمز عبور
        admin.password_hash = generate_password_hash("6968")
        admin.is_active = True
        admin.is_approved = True
        db.session.commit()
        print("✅ رمز عبور به‌روزرسانی شد!")

    else:
        # 2. ایجاد کاربر جدید
        admin = User(
            username="1234567890",
            national_code="1234567890",
            first_name="مدیر",
            last_name="سیستم",
            phone="09123456789",
            role="admin",
            is_active=True,
            is_approved=True,
        )
        admin.set_password("6968")

        db.session.add(admin)
        db.session.commit()
        print("✅ کاربر ادمین با موفقیت ایجاد شد!")
        print(f"   کد ملی: 1234567890")
        print(f"   رمز عبور: 6968")
        print(f"   نقش: admin")

    # 3. نمایش همه کاربران
    print("\n👥 لیست همه کاربران:")
    users = User.query.all()
    for u in users:
        print(
            f"   {u.username} - {u.get_full_name()} ({u.role}) - {'✅ فعال' if u.is_active else '❌ غیرفعال'}"
        )
