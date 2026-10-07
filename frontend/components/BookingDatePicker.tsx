'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  label: 'CHECK IN' | 'CHECK OUT';
  value: string;
  bookedRanges: string[][];
  checkIn?: string;
  time: string;
  checkInTime?: string;
  onChange: (value: string) => void;
  onTimeChange: (value: string) => void;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const todayIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const isoDate = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const parseIso = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};
const formatValue = (value: string) => value ? parseIso(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date';

export default function BookingDatePicker({ label, value, bookedRanges, checkIn, time, checkInTime = "15:00", onChange, onTimeChange }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const date = value ? parseIso(value) : checkIn ? parseIso(checkIn) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const isCheckOut = label === 'CHECK OUT';
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [month]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const next = value ? parseIso(value) : checkIn ? parseIso(checkIn) : new Date();
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [value, checkIn]);

  function statusFor(day: number) {
    const date = isoDate(month.getFullYear(), month.getMonth(), day);
    if (date < todayIso()) return 'past';
    if (isCheckOut) {
      if (!checkIn || date <= checkIn) return 'invalid';
      // The departure date is exclusive, so check-out can share a booking's check-in boundary.
      const requestedStart = `${checkIn}T${checkInTime}`;
      const requestedEnd = `${date}T${time}`;
      if (bookedRanges.some(([start, end, startTime = '15:00', endTime = '11:00']) => requestedStart < `${end}T${endTime}` && requestedEnd > `${start}T${startTime}`)) return 'booked';
      return 'available';
    }
    // A booking occupies [check-in, check-out); its checkout day can host the next arrival.
    const requestedStart = `${date}T${time}`;
    if (bookedRanges.some(([start, end, startTime = '15:00', endTime = '11:00']) => requestedStart >= `${start}T${startTime}` && requestedStart < `${end}T${endTime}`)) return 'booked';
    return 'available';
  }

  return <div className="booking-date-field" ref={rootRef}>
    <label>{label}
      <button className="booking-date-trigger" type="button" aria-label={`${isCheckOut ? 'Check-out' : 'Check-in'} date`} aria-haspopup="dialog" aria-expanded={open} disabled={isCheckOut && !checkIn} onClick={() => setOpen(current => !current)}>
        <span>{formatValue(value)}</span><span aria-hidden="true">▦</span>
      </button>
    </label>
    <label className="booking-time-label">{isCheckOut ? 'DEPARTURE TIME' : 'ARRIVAL TIME'}
      <select aria-label={isCheckOut ? 'Departure time' : 'Arrival time'} value={time} onChange={event => onTimeChange(event.target.value)}>
        {Array.from({ length: 48 }, (_, index) => { const hour = Math.floor(index / 2); const minute = index % 2 ? '30' : '00'; const option = `${String(hour).padStart(2, '0')}:${minute}`; return <option key={option} value={option}>{option}</option>; })}
      </select>
    </label>
    {open && <div className="booking-calendar" role="dialog" aria-label={`Choose ${isCheckOut ? 'check-out' : 'check-in'} date`}>
      <div className="booking-calendar-header">
        <button type="button" className="booking-calendar-nav" aria-label="Previous month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button>
        <strong>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
        <button type="button" className="booking-calendar-nav" aria-label="Next month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="booking-calendar-grid" role="grid" aria-label={month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}>
        {WEEKDAYS.map(day => <span className="booking-calendar-weekday" role="columnheader" key={day}>{day}</span>)}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} aria-hidden="true" />;
          const date = isoDate(month.getFullYear(), month.getMonth(), day);
          const status = statusFor(day);
          const disabled = status !== 'available';
          const label = status === 'booked' ? 'Booked' : status === 'past' ? 'Past date' : status === 'invalid' ? 'Choose a date after check-in' : 'Available';
          return <button key={date} type="button" role="gridcell" className={`booking-calendar-day ${status}${value === date ? ' selected' : ''}`} disabled={disabled} aria-label={`${month.toLocaleDateString(undefined, { month: 'long' })} ${day}, ${label}`} aria-pressed={value === date} title={label} onClick={() => { onChange(date); setOpen(false); }}>{day}</button>;
        })}
      </div>
      <div className="booking-calendar-legend" aria-label="Date availability legend"><span><i className="available-key" />Available</span><span><i className="booked-key" />Booked</span><span><i className="past-key" />Past</span></div>
      {isCheckOut && checkIn && <p className="booking-calendar-hint">Choose your departure date. Checkout day is not counted as a booked night.</p>}
    </div>}
  </div>;
}
