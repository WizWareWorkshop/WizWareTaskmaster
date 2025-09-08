
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from './input';

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      return;
    }
    
    // Preserve time if a date is already set, otherwise default to midnight
    const newHours = date ? date.getHours() : 0;
    const newMinutes = date ? date.getMinutes() : 0;

    selectedDate.setHours(newHours);
    selectedDate.setMinutes(newMinutes);
    
    setDate(selectedDate);
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    const [hours, minutes] = time.split(':').map(Number);
    
    const newDate = date ? new Date(date.getTime()) : new Date();
    if (!isNaN(hours)) newDate.setHours(hours);
    if (!isNaN(minutes)) newDate.setMinutes(minutes);

    setDate(newDate);
  };

  const timeValue = date ? format(date, 'HH:mm') : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP HH:mm') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            handleDateSelect(d);
          }}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <Input 
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

    