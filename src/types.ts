export type ShiftType = 'morning' | 'afternoon' | 'night';
export type DayType = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type AvailabilityType = 'available' | 'unavailable' | 'preferred' | 'required';

export interface Person {
  id: string;
  name: string;
  isManager: boolean;
  maxShiftsPerWeek: number;
  color: string;
}

export interface ShiftRequirements {
  morning: number;
  afternoon: number;
  night: number;
}

export interface ScheduleSettings {
  firstDayOfWeek: DayType;
  shiftRequirements: Record<DayType, ShiftRequirements>;
  persons: Person[];
  incompatiblePairs: [string, string][];
  availability: Record<string, Record<DayType, Record<ShiftType, AvailabilityType>>>;
}

export interface ShiftAssignment {
  day: DayType;
  shift: ShiftType;
  personId: string;
}

export interface Schedule {
  assignments: ShiftAssignment[];
  generationAttempts: number;
} 