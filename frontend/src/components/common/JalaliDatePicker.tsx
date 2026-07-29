// JalaliDatePicker.tsx
import React from "react";
import { DatePicker } from "antd";
import moment from "moment-jalaali";
import type { Moment } from "moment";

// بارگذاری locale فارسی
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: true });

export interface JalaliDatePickerProps {
  value?: string;
  onChange?: (value: string | null) => void;
  placeholder?: string;
}

const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  // تبدیل مقدار ورودی به شیء Moment
  const momentValue = value ? moment(value, 'YYYY-MM-DD') : null;

  const handleChange = (date: Moment | null) => {
    if (!date) {
      onChange?.(null);
      return;
    }
    // ذخیره به صورت میلادی در دیتابیس
    onChange?.(date.format('YYYY-MM-DD'));
  };

  return (
    <DatePicker
      value={momentValue}
      onChange={handleChange}
      placeholder={placeholder}
      format="jYYYY/jMM/jDD"
      style={{ width: '100%' }}
    />
  );
};

export default JalaliDatePicker;