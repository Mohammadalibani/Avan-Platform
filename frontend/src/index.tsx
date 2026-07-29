// frontend/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ConfigProvider } from 'antd';
import faIR from 'antd/locale/fa_IR';
import moment from 'moment-jalaali';
import 'moment-jalaali';

// ===== تنظیم locale جلالی برای تقویم شمسی =====
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: true });

// ===== تنظیم locale برای antd =====
const antdLocale = {
    ...faIR,
    DatePicker: {
        ...faIR.DatePicker,
        lang: {
            ...faIR.DatePicker?.lang,
            locale: 'fa',
            placeholder: 'انتخاب تاریخ',
            rangePlaceholder: ['تاریخ شروع', 'تاریخ پایان'],
            today: 'امروز',
            now: 'اکنون',
            backToToday: 'بازگشت به امروز',
            ok: 'تأیید',
            clear: 'پاک کردن',
            month: 'ماه',
            year: 'سال',
            timeSelect: 'انتخاب زمان',
            dateSelect: 'انتخاب تاریخ',
            weekSelect: 'انتخاب هفته',
            monthSelect: 'انتخاب ماه',
            yearSelect: 'انتخاب سال',
            decadeSelect: 'انتخاب دهه',
            yearFormat: 'YYYY',
            dateFormat: 'jYYYY/jMM/jDD',
            dayFormat: 'DD',
            dateTimeFormat: 'jYYYY/jMM/jDD HH:mm:ss',
            monthBeforeYear: true,
            previousMonth: 'ماه قبل',
            nextMonth: 'ماه بعد',
            previousYear: 'سال قبل',
            nextYear: 'سال بعد',
            previousDecade: 'دهه قبل',
            nextDecade: 'دهه بعد',
            previousCentury: 'قرن قبل',
            nextCentury: 'قرن بعد',
        },
        timePickerLocale: {
            placeholder: 'انتخاب زمان',
        },
    },
};

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <ConfigProvider
            locale={antdLocale}
            direction="rtl"
            theme={{
                token: {
                    fontFamily: "'Vazirmatn', 'Segoe UI', Tahoma, sans-serif",
                },
            }}
        >
            <App />
        </ConfigProvider>
    </React.StrictMode>
);

// ===== غیرفعال کردن console.warn =====
if (window.console) {
    window.console.warn = function() {};
}