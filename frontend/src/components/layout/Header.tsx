import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  Bell, 
  Mail,
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  UserCog,
  CalendarDays,
  Settings,
  FileSpreadsheet,
  CheckSquare,
  Eye,
  Ticket
} from 'lucide-react';

interface HeaderSettings {
  site_title: string;
  header_title: string;
  header_bg_color: string;
  header_text_color: string;
  header_logo_url: string;
}

const Header: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<HeaderSettings | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dateTime, setDateTime] = useState('');

  // ====== تابع کمکی برای دریافت هدرهای احراز هویت ======
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // ====== بارگذاری تنظیمات هدر ======
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings/current');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.log('⚠️ خطا در دریافت تنظیمات هدر');
      }
    };
    loadSettings();
  }, []);

  // ====== بارگذاری اعلان‌ها با توکن ======
  useEffect(() => {
    const loadNotifications = async () => {
      // ✅ اگر در صفحه لاگین هستیم، درخواست نده
      if (window.location.pathname === '/login') return;
      
      try {
        const headers = getAuthHeaders();
        const res = await fetch('/api/notifications', { headers });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        } else if (res.status === 401) {
          // ✅ فقط یک بار هدایت کن
          if (!localStorage.getItem('_redirecting')) {
            localStorage.setItem('_redirecting', 'true');
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.log('ℹ️ اتصال به API اعلان‌ها ممکن نیست');
      }
    };
    loadNotifications();
  }, []);

  // ====== بارگذاری پیام‌ها با توکن ======
  useEffect(() => {
    const loadMessages = async () => {
      // ✅ اگر در صفحه لاگین هستیم، درخواست نده
      if (window.location.pathname === '/login') return;
      
      try {
        const headers = getAuthHeaders();
        const res = await fetch('/api/work/messages', { headers });
        if (res.ok) {
          const data = await res.json();
          const count = data.unread_count || 
            (Array.isArray(data) ? data.filter((m: any) => !m.is_read).length : 0);
          setUnreadMessages(count);
        } else if (res.status === 401) {
          // ✅ فقط یک بار هدایت کن
          if (!localStorage.getItem('_redirecting')) {
            localStorage.setItem('_redirecting', 'true');
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.log('ℹ️ اتصال به API پیام‌ها ممکن نیست');
      }
    };
    loadMessages();
  }, []);

  // ====== بروزرسانی تاریخ و زمان ======
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const persianDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(now);
      setDateTime(`📅 ${persianDate}`);
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('_redirecting');
    clearAuth();
    navigate('/login');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleNotification = () => setIsNotificationOpen(!isNotificationOpen);

  const getRolePersian = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'مدیر کل سیستم',
      org_manager: 'مدیر سازمان',
      dept_manager: 'مدیر اداره',
      hr_manager: 'مدیر منابع انسانی',
      unit_supervisor: 'سرپرست واحد',
      subordinate: 'کاربر عادی'
    };
    return roles[role] || 'کاربر';
  };

  // ====== منوی سایدبار بر اساس نقش ======
  const getMenuItems = () => {
    const role = user?.role || 'subordinate';
    
    const menuItems: Record<string, any[]> = {
      admin: [
        { icon: <LayoutDashboard size={20} />, label: 'داشبورد مدیریت', link: '/admin/dashboard' },
        { icon: <Users size={20} />, label: 'مدیریت کاربران', link: '/admin/users' },
        { icon: <Building2 size={20} />, label: 'مدیریت ادارات', link: '/admin/departments' },
        { icon: <Briefcase size={20} />, label: 'مدیریت واحدها', link: '/admin/units' },
        { icon: <UserCog size={20} />, label: 'مدیریت پرسنل', link: '/admin/personnel' },
        { icon: <CalendarDays size={20} />, label: 'دوره‌های کارکرد', link: '/admin/periods' },
        { icon: <Settings size={20} />, label: 'مدیریت فیلدها', link: '/admin/fields' },
        { icon: <CheckSquare size={20} />, label: 'درخواست‌های تایید', link: '/admin/approvals' },
        { icon: <FileSpreadsheet size={20} />, label: 'قالب گزارش اکسل', link: '/admin/excel-template' },
        { icon: <Settings size={20} />, label: 'تنظیمات سامانه', link: '/admin/settings' },
        { divider: true },
        { icon: <Eye size={20} />, label: 'پیش‌نمایش مدیر سازمان', link: '/admin/org-manager-preview' },
        { icon: <Eye size={20} />, label: 'پیش‌نمایش مدیر اداره', link: '/admin/dept-manager-preview' },
        { icon: <Eye size={20} />, label: 'پیش‌نمایش سرپرست واحد', link: '/admin/unit-supervisor-preview' },
        { divider: true },
        { icon: <Ticket size={20} />, label: 'تیکت‌ها و پیام‌ها', link: '/tickets' },
      ],
      org_manager: [
        { icon: <LayoutDashboard size={20} />, label: 'داشبورد سازمان', link: '/org-manager/dashboard' },
        { icon: <Building2 size={20} />, label: 'ادارات', link: '/org-manager/departments' },
        { icon: <Briefcase size={20} />, label: 'واحدها', link: '/org-manager/units' },
        { icon: <UserCog size={20} />, label: 'پرسنل', link: '/org-manager/personnel' },
        { icon: <Ticket size={20} />, label: 'تیکت‌ها و پیام‌ها', link: '/tickets' },
      ],
      dept_manager: [
        { icon: <LayoutDashboard size={20} />, label: 'داشبورد اداره', link: '/dept-manager/dashboard' },
        { icon: <Briefcase size={20} />, label: 'واحدها', link: '/dept-manager/units' },
        { icon: <UserCog size={20} />, label: 'پرسنل', link: '/dept-manager/personnel' },
        { icon: <Ticket size={20} />, label: 'تیکت‌ها و پیام‌ها', link: '/tickets' },
      ],
      unit_supervisor: [
        { icon: <LayoutDashboard size={20} />, label: 'داشبورد واحد', link: '/unit-supervisor/dashboard' },
        { icon: <UserCog size={20} />, label: 'پرسنل', link: '/unit-supervisor/personnel' },
        { icon: <CheckSquare size={20} />, label: 'درخواست‌های پرسنل', link: '/unit-supervisor/requests' },
        { icon: <Ticket size={20} />, label: 'تیکت‌ها و پیام‌ها', link: '/tickets' },
      ],
      subordinate: [
        { icon: <LayoutDashboard size={20} />, label: 'داشبورد', link: '/dashboard' },
        { icon: <UserCog size={20} />, label: 'پروفایل', link: '/profile' },
        { icon: <CheckSquare size={20} />, label: 'درخواست‌های من', link: '/requests' },
        { icon: <Ticket size={20} />, label: 'تیکت‌ها', link: '/tickets' },
      ],
    };

    return menuItems[role] || menuItems.subordinate;
  };

  const headerStyle = {
    background: settings?.header_bg_color || 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: settings?.header_text_color || '#ffffff'
  };

  return (
    <>
      {/* ====== هدر اصلی ====== */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 h-[70px] flex items-center justify-between px-4 md:px-6 shadow-lg"
        style={headerStyle}
      >
        {/* بخش چپ هدر - لوگو و منو */}
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            className="hamburger-btn text-white text-2xl cursor-pointer bg-white/10 border-none rounded-xl w-10 h-10 md:w-11 md:h-11 flex items-center justify-center hover:bg-white/25 transition-all flex-shrink-0"
            onClick={toggleMenu}
            aria-label="منو"
          >
            ☰
          </button>
          
          <div className="logo-area flex items-center gap-2 md:gap-3">
            <div className="logo-icon w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-lg md:text-xl shadow-lg flex-shrink-0">
              {settings?.header_logo_url ? (
                <img src={settings.header_logo_url} alt="logo" className="w-6 h-6 md:w-8 md:h-8 object-contain rounded-lg" />
              ) : (
                '📊'
              )}
            </div>
            <div className="logo text-base md:text-xl font-bold text-white whitespace-nowrap">
              {settings?.header_title ? (
                settings.header_title.split(' ').map((word, i, arr) => 
                  i === arr.length - 1 ? <span key={i} className="text-amber-400">{word}</span> : <span key={i}>{word} </span>
                )
              ) : (
                <>سامانه کارکرد <span className="text-amber-400">آوان</span></>
              )}
            </div>
          </div>
        </div>

        {/* بخش راست هدر - کاربر و دکمه‌ها */}
        <div className="user-area flex items-center gap-2 md:gap-4">
          <div className="user-info text-left hidden sm:block">
            <div className="user-info-wrapper flex items-center gap-2 md:gap-3">
              <div className="user-avatar w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-amber-400 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm md:text-lg flex-shrink-0">
                {user?.first_name ? user.first_name.charAt(0) : '👤'}
              </div>
              <div className="user-details hidden lg:block">
                <div className="user-name font-semibold text-white text-xs md:text-sm">{user?.full_name || 'کاربر'}</div>
                <div className="user-role text-amber-400 font-semibold text-[10px] md:text-xs">{getRolePersian(user?.role || '')}</div>
                <div className="user-datetime text-slate-400 text-[10px] md:text-xs">{dateTime}</div>
              </div>
            </div>
          </div>

          <div className="message-bell relative cursor-pointer hover:scale-105 transition-transform">
            <Mail size={20} className="text-white" />
            {unreadMessages > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </div>

          <div className="notification-bell relative cursor-pointer hover:scale-105 transition-transform" onClick={toggleNotification}>
            <Bell size={20} className="text-white" />
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {notifications.length > 99 ? '99+' : notifications.length}
              </span>
            )}
          </div>

          <button 
            onClick={handleLogout}
            className="btn-logout bg-white/10 text-white px-3 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm border border-white/20 hover:bg-red-500 hover:border-red-500 transition-all hover:-translate-y-0.5 hidden sm:inline-flex"
          >
            خروج
          </button>
        </div>
      </header>

      {/* ====== فضای خالی برای جبران ارتفاع هدر ====== */}
      <div className="h-[70px]" />

      {/* ====== سایدبار منو ====== */}
      <div 
        className={`fixed top-0 right-0 w-72 md:w-80 h-full bg-gradient-to-b from-slate-900 to-slate-800 z-40 transition-all duration-300 overflow-y-auto pt-[70px] shadow-2xl ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="menu-header flex justify-between items-center p-4 md:p-6 border-b border-white/10">
          <h3 className="text-white text-base md:text-lg font-bold">📋 منوی مدیریت</h3>
          <button 
            className="close-menu bg-white/10 border-none text-white w-8 h-8 md:w-9 md:h-9 rounded-xl text-xl md:text-2xl cursor-pointer hover:bg-white/20 transition-all flex items-center justify-center"
            onClick={toggleMenu}
          >
            ✕
          </button>
        </div>
        <div className="menu-links p-2">
          {getMenuItems().map((item, index) => {
            if (item.divider) {
              return <div key={index} className="h-px bg-white/10 my-2 md:my-3 mx-4 md:mx-5" />;
            }
            return (
              <Link
                key={index}
                to={item.link}
                className="flex items-center gap-3 px-4 md:px-6 py-2.5 md:py-3 text-white/80 hover:bg-white/10 hover:text-white transition-all rounded-xl hover:pr-6 md:hover:pr-8 text-sm md:text-base"
                onClick={toggleMenu}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ====== اوورلی سایدبار ====== */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 pt-[70px]"
          onClick={toggleMenu}
        />
      )}

      {/* ====== کانتینر اعلان‌ها ====== */}
      {isNotificationOpen && (
        <div className="notification-dropdown fixed top-[75px] left-2 md:left-5 w-[90vw] md:w-96 max-w-sm bg-white rounded-2xl shadow-2xl z-[51] overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 md:px-5 py-3 text-white font-bold text-sm md:text-base">
            📢 اعلان‌ها
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                ✅ همه اعلان‌ها خوانده شده است
              </div>
            ) : (
              notifications.map((notif, index) => (
                <div key={index} className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="font-semibold text-slate-800 text-sm">{notif.title}</div>
                  <div className="text-slate-500 text-xs mt-1">{notif.message}</div>
                  <div className="text-slate-400 text-[10px] mt-2">📅 {notif.created_at}</div>
                </div>
              ))
            )}
          </div>
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-100">
            <button className="w-full py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl text-sm font-medium hover:from-slate-700 hover:to-slate-800 transition-all">
              ✓ علامت‌گذاری همه به عنوان خوانده شده
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;