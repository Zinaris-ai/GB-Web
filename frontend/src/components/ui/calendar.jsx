import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { cn } from "../../lib/utils";

export function DateRangeCalendar({ 
  value, 
  onChange, 
  numberOfMonths = 1,
  className,
  ...props 
}) {
  // Преобразуем формат { from, to } в [Date, Date] для react-calendar
  const calendarValue = value?.from && value?.to 
    ? [value.from, value.to] 
    : value?.from 
    ? value.from 
    : null;

  const handleChange = (newValue) => {
    if (Array.isArray(newValue)) {
      // Диапазон дат
      onChange({ from: newValue[0], to: newValue[1] });
    } else if (newValue) {
      // Одна дата - начало диапазона
      onChange({ from: newValue, to: null });
    }
  };

  return (
    <div className={cn("react-calendar-wrapper", className)}>
      {numberOfMonths === 2 ? (
        <div className="flex gap-4">
          <Calendar
            locale="ru-RU"
            selectRange={true}
            onChange={handleChange}
            value={calendarValue}
            showDoubleView={true}
            {...props}
          />
        </div>
      ) : (
        <Calendar
          locale="ru-RU"
          selectRange={true}
          onChange={handleChange}
          value={calendarValue}
          showDoubleView={false}
          {...props}
        />
      )}
    </div>
  );
}

export { DateRangeCalendar as Calendar };
