'use client'

import * as React from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  getDaysInMonth,
  getDay,
  isToday,
  isSameDay,
  startOfToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CustomCalendarProps {
  selectedDate?: Date
  onSelectDate: (date: Date) => void
  disabled?: (date: Date) => boolean
}

export function CustomCalendar({ selectedDate, onSelectDate, disabled }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date())
  const today = startOfToday()

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDayOfWeek = getDay(monthStart)

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const emptyDays = Array.from({ length: firstDayOfWeek })

    return { days, emptyDays }
  }, [currentMonth])

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (disabled && disabled(date)) {
      return
    }
    onSelectDate(date)
  }

  return (
    <div className="p-1">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="font-semibold text-center text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="h-8 w-8"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdays.map((day) => (
          <div key={day} className="font-medium h-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-1">
        {calendarDays.emptyDays.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {calendarDays.days.map((day) => {
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
          )
          const isDateDisabled = disabled ? disabled(date) : false
          const isSelected = selectedDate && isSameDay(date, selectedDate)

          return (
            <button
              key={day}
              disabled={isDateDisabled}
              onClick={() => handleDateClick(day)}
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-full text-sm transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isDateDisabled
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'hover:bg-accent hover:text-accent-foreground',
                isToday(date) &&
                  !isSelected &&
                  'border border-primary/50',
                isSelected &&
                  'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
