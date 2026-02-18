export interface Project {
  id: string;
  name: string;
  job_number: string;
  location: string;
  client: string;
  status: 'active' | 'on-hold' | 'completed';
  start_date: string;
  end_date: string;
  created_at?: string;
}

export interface DailyLog {
  id: string;
  project_id: string;
  log_date: string;
  weather: string;
  temperature: string;
  wind: string;
  site_conditions: string;
  safety_incidents: string;
  critical_items: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
  is_completed: boolean;
  created_at?: string;
  // Joined
  project?: Project;
  crew?: CrewAttendance[];
  activities?: WorkActivity[];
  materials?: Material[];
  equipment?: EquipmentLog[];
  visitors?: Visitor[];
}

export interface CrewAttendance {
  id: string;
  daily_log_id: string;
  worker_name: string;
  trade: string;
  start_time: string;
  finish_time: string;
  lunch_minutes: number;
  hours_worked: number;
  due_date: string;
  is_completed: boolean;
  notes: string;
  created_at?: string;
}

export interface WorkActivity {
  id: string;
  daily_log_id: string;
  description: string;
  location: string;
  trade: string;
  progress_pct: number;
  due_date: string;
  is_completed: boolean;
  notes: string;
  created_at?: string;
}

export interface Material {
  id: string;
  daily_log_id: string;
  description: string;
  quantity: string;
  unit: string;
  supplier: string;
  required_date: string;
  status: 'pending' | 'ordered' | 'in-transit' | 'delivered';
  is_completed: boolean;
  notes: string;
  created_at?: string;
}

export interface EquipmentLog {
  id: string;
  daily_log_id: string;
  equipment_name: string;
  equipment_type: string;
  hours_used: number;
  condition: 'good' | 'fair' | 'poor' | 'needs-repair';
  due_date: string;
  is_completed: boolean;
  notes: string;
  created_at?: string;
}

export interface Visitor {
  id: string;
  daily_log_id: string;
  visitor_name: string;
  company: string;
  purpose: string;
  time_in: string;
  time_out: string;
  due_date: string;
  is_completed: boolean;
  notes: string;
  created_at?: string;
}

export interface CalendarNote {
  id: string;
  note_date: string;
  project_id: string | null;
  title: string;
  description: string;
  note_type: 'note' | 'reminder' | 'meeting' | 'deadline' | 'inspection' | 'delivery';
  priority: 'high' | 'medium' | 'low';
  is_completed: boolean;
  created_at?: string;
}

export interface AppSettings {
  weekEndingDay: 'Sunday' | 'Saturday' | 'Friday' | 'Thursday' | 'Wednesday' | 'Tuesday' | 'Monday';
  timesheetPeriod: 1 | 2;
  companyName: string;
  companyLogo: string;
  lunchDefaultMinutes: 30 | 60;
  roundingMinutes: number;
  features: {
    analytics: boolean;
    weatherAlerts: boolean;
    teamCollaboration: boolean;
    approvalWorkflow: boolean;
    customReports: boolean;
    autoCarryForward: boolean;
    aiSummary: boolean;
    notifications: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  weekEndingDay: 'Sunday',
  timesheetPeriod: 1,
  companyName: '',
  companyLogo: '',
  lunchDefaultMinutes: 30,
  roundingMinutes: 15,
  features: {
    analytics: true,
    weatherAlerts: true,
    teamCollaboration: true,
    approvalWorkflow: false,
    customReports: true,
    autoCarryForward: true,
    aiSummary: true,
    notifications: true,
  },
};

export const TRADES = [
  'Suspended Ceilings / 2-way',
  'Rondo Ceilings',
  'Partition Walls',
  'Aluminium',
  'Plasterboard / Linings',
  'Stopping',
  'Insulation',
  'Carpentry',
  'Fire Rating',
  'Timber Partitions',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Painting',
  'Concrete',
  'Roofing',
  'Landscaping',
  'General Labour',
  'Other',
];

export const ANALYSIS_CODES = [
  { code: '101', label: 'Suspended Ceilings / 2-way' },
  { code: '102', label: 'Rondo Ceilings' },
  { code: '103', label: 'Partition Walls' },
  { code: '104', label: 'Aluminium' },
  { code: '105', label: 'Plasterboard / Linings' },
  { code: '106', label: 'Stopping' },
  { code: '107', label: 'Insulation' },
  { code: '108', label: 'Carpentry' },
  { code: '109', label: 'Other' },
  { code: '110', label: 'Carpet' },
  { code: '111', label: 'FIRE RATING' },
  { code: '115', label: 'Timber Partitions' },
  { code: 'ACCOM', label: 'Accommodation Allowance' },
  { code: 'Other', label: 'Other (please specify)' },
  { code: 'P&G', label: 'Preliminary and General' },
  { code: 'P&Gs', label: 'P&G Supervision' },
  { code: 'P&Gt', label: 'P&G Travel' },
  { code: 'R/M', label: 'Repairs and Maintenance' },
  { code: 'Safety', label: 'Safety Equipment' },
  { code: 'Staff', label: 'Staff Purchases on Company account' },
  { code: 'Tools', label: 'Tools' },
  { code: 'training', label: 'Staff Training' },
];

export const WEATHER_OPTIONS = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain', 'Wind', 'Storm', 'Snow', 'Fog', 'Hot', 'Cold'];

export const NOTE_TYPES = [
  { value: 'note', label: 'General Note', color: 'bg-blue-500' },
  { value: 'reminder', label: 'Reminder', color: 'bg-purple-500' },
  { value: 'meeting', label: 'Meeting', color: 'bg-indigo-500' },
  { value: 'deadline', label: 'Deadline', color: 'bg-red-500' },
  { value: 'inspection', label: 'Inspection', color: 'bg-amber-500' },
  { value: 'delivery', label: 'Delivery', color: 'bg-green-500' },
];

export type PageKey = 'dashboard' | 'daily-logs' | 'calendar' | 'timesheets' | 'reports' | 'settings';

export type UserRole = 'site_manager' | 'foreman' | 'safety_officer';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'site_manager', label: 'Site Manager', description: 'Full access to all features including settings, reports, and team management' },
  { value: 'foreman', label: 'Foreman', description: 'Access to daily logs, timesheets, calendar, and basic reports' },
  { value: 'safety_officer', label: 'Safety Officer', description: 'Access to daily logs, safety reports, and inspections' },
];

// Role-based feature access map
export const ROLE_ACCESS: Record<UserRole, PageKey[]> = {
  site_manager: ['dashboard', 'daily-logs', 'calendar', 'timesheets', 'reports', 'settings'],
  foreman: ['dashboard', 'daily-logs', 'calendar', 'timesheets', 'reports'],
  safety_officer: ['dashboard', 'daily-logs', 'calendar', 'reports'],
};
