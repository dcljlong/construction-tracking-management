import { supabase } from '@/lib/supabase';
import type { Project, DailyLog, CrewAttendance, WorkActivity, Material, EquipmentLog, Visitor, CalendarNote, AppSettings } from './sitecommand-types';
import { DEFAULT_SETTINGS } from './sitecommand-types';

// Helper to get current user ID for RLS-compatible inserts
async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Attach user_id to an object if user is logged in
async function withUserId<T extends Record<string, any>>(obj: T): Promise<T & { user_id?: string }> {
  const uid = await getUserId();
  if (uid) return { ...obj, user_id: uid };
  return obj;
}

// ─── Projects ───
export async function fetchProjects() {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Project[];
}

export async function createProject(p: Partial<Project>) {
  const payload = await withUserId(p);
  const { data, error } = await supabase.from('projects').insert(payload).select().single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, p: Partial<Project>) {
  const { data, error } = await supabase.from('projects').update(p).eq('id', id).select().single();
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ─── Daily Logs ───
export async function fetchDailyLogs(filters?: { date?: string; project_id?: string }) {
  let q = supabase.from('daily_logs').select('*, projects(*)').order('log_date', { ascending: false });
  if (filters?.date) q = q.eq('log_date', filters.date);
  if (filters?.project_id) q = q.eq('project_id', filters.project_id);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, project: d.projects })) as DailyLog[];
}

export async function fetchDailyLogFull(id: string) {
  const [logRes, crewRes, actRes, matRes, eqRes, visRes] = await Promise.all([
    supabase.from('daily_logs').select('*, projects(*)').eq('id', id).single(),
    supabase.from('crew_attendance').select('*').eq('daily_log_id', id).order('created_at'),
    supabase.from('work_activities').select('*').eq('daily_log_id', id).order('created_at'),
    supabase.from('materials').select('*').eq('daily_log_id', id).order('created_at'),
    supabase.from('equipment_logs').select('*').eq('daily_log_id', id).order('created_at'),
    supabase.from('visitors').select('*').eq('daily_log_id', id).order('created_at'),
  ]);
  if (logRes.error) throw logRes.error;
  const log = logRes.data as any;
  return {
    ...log,
    project: log.projects,
    crew: (crewRes.data || []) as CrewAttendance[],
    activities: (actRes.data || []) as WorkActivity[],
    materials: (matRes.data || []) as Material[],
    equipment: (eqRes.data || []) as EquipmentLog[],
    visitors: (visRes.data || []) as Visitor[],
  } as DailyLog;
}

export async function createDailyLog(log: Partial<DailyLog>) {
  const { project, crew, activities, materials, equipment, visitors, ...rest } = log as any;
  const payload = await withUserId(rest);
  const { data, error } = await supabase.from('daily_logs').insert(payload).select('*, projects(*)').single();
  if (error) throw error;
  return { ...data, project: (data as any).projects } as DailyLog;
}

export async function updateDailyLog(id: string, log: Partial<DailyLog>) {
  const { project, crew, activities, materials, equipment, visitors, ...rest } = log as any;
  const { data, error } = await supabase.from('daily_logs').update(rest).eq('id', id).select('*, projects(*)').single();
  if (error) throw error;
  return { ...data, project: (data as any).projects } as DailyLog;
}

export async function deleteDailyLog(id: string) {
  const { error } = await supabase.from('daily_logs').delete().eq('id', id);
  if (error) throw error;
}

// ─── Crew ───
export async function createCrew(c: Partial<CrewAttendance>) {
  const payload = await withUserId(c);
  const { data, error } = await supabase.from('crew_attendance').insert(payload).select().single();
  if (error) throw error;
  return data as CrewAttendance;
}

export async function updateCrew(id: string, c: Partial<CrewAttendance>) {
  const { data, error } = await supabase.from('crew_attendance').update(c).eq('id', id).select().single();
  if (error) throw error;
  return data as CrewAttendance;
}

export async function deleteCrew(id: string) {
  const { error } = await supabase.from('crew_attendance').delete().eq('id', id);
  if (error) throw error;
}

// ─── Work Activities ───
export async function createActivity(a: Partial<WorkActivity>) {
  const payload = await withUserId(a);
  const { data, error } = await supabase.from('work_activities').insert(payload).select().single();
  if (error) throw error;
  return data as WorkActivity;
}

export async function updateActivity(id: string, a: Partial<WorkActivity>) {
  const { data, error } = await supabase.from('work_activities').update(a).eq('id', id).select().single();
  if (error) throw error;
  return data as WorkActivity;
}

export async function deleteActivity(id: string) {
  const { error } = await supabase.from('work_activities').delete().eq('id', id);
  if (error) throw error;
}

// ─── Materials ───
export async function createMaterial(m: Partial<Material>) {
  const payload = await withUserId(m);
  const { data, error } = await supabase.from('materials').insert(payload).select().single();
  if (error) throw error;
  return data as Material;
}

export async function updateMaterial(id: string, m: Partial<Material>) {
  const { data, error } = await supabase.from('materials').update(m).eq('id', id).select().single();
  if (error) throw error;
  return data as Material;
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}

// ─── Equipment ───
export async function createEquipment(e: Partial<EquipmentLog>) {
  const payload = await withUserId(e);
  const { data, error } = await supabase.from('equipment_logs').insert(payload).select().single();
  if (error) throw error;
  return data as EquipmentLog;
}

export async function updateEquipment(id: string, e: Partial<EquipmentLog>) {
  const { data, error } = await supabase.from('equipment_logs').update(e).eq('id', id).select().single();
  if (error) throw error;
  return data as EquipmentLog;
}

export async function deleteEquipment(id: string) {
  const { error } = await supabase.from('equipment_logs').delete().eq('id', id);
  if (error) throw error;
}

// ─── Visitors ───
export async function createVisitor(v: Partial<Visitor>) {
  const payload = await withUserId(v);
  const { data, error } = await supabase.from('visitors').insert(payload).select().single();
  if (error) throw error;
  return data as Visitor;
}

export async function updateVisitor(id: string, v: Partial<Visitor>) {
  const { data, error } = await supabase.from('visitors').update(v).eq('id', id).select().single();
  if (error) throw error;
  return data as Visitor;
}

export async function deleteVisitor(id: string) {
  const { error } = await supabase.from('visitors').delete().eq('id', id);
  if (error) throw error;
}

// ─── Calendar Notes ───
export async function fetchCalendarNotes(month?: number, year?: number) {
  let q = supabase.from('calendar_notes').select('*').order('note_date');
  if (month !== undefined && year !== undefined) {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endMonth = month === 11 ? 0 : month + 1;
    const endYear = month === 11 ? year + 1 : year;
    const end = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`;
    q = q.gte('note_date', start).lt('note_date', end);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as CalendarNote[];
}

export async function createCalendarNote(n: Partial<CalendarNote>) {
  const payload = await withUserId(n);
  const { data, error } = await supabase.from('calendar_notes').insert(payload).select().single();
  if (error) throw error;
  return data as CalendarNote;
}

export async function updateCalendarNote(id: string, n: Partial<CalendarNote>) {
  const { data, error } = await supabase.from('calendar_notes').update(n).eq('id', id).select().single();
  if (error) throw error;
  return data as CalendarNote;
}

export async function deleteCalendarNote(id: string) {
  const { error } = await supabase.from('calendar_notes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Settings ───
export async function fetchSettings(): Promise<AppSettings> {
  const uid = await getUserId();
  let q = supabase.from('app_settings').select('*').eq('setting_key', 'main');
  if (uid) q = q.eq('user_id', uid);
  const { data } = await q;
  if (data && data.length > 0 && data[0].setting_value) {
    return { ...DEFAULT_SETTINGS, ...data[0].setting_value } as AppSettings;
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings) {
  const uid = await getUserId();
  const payload: any = {
    setting_key: 'main',
    setting_value: settings,
    updated_at: new Date().toISOString(),
  };
  if (uid) payload.user_id = uid;
  const { error } = await supabase.from('app_settings').upsert(payload, { onConflict: 'setting_key' });
  if (error) throw error;
}

// ─── Aggregation helpers ───
export async function fetchAllIncompleteItems() {
  const [actRes, matRes, eqRes, crewRes] = await Promise.all([
    supabase.from('work_activities').select('*, daily_logs(*, projects(*))').eq('is_completed', false).order('due_date'),
    supabase.from('materials').select('*, daily_logs(*, projects(*))').eq('is_completed', false).order('required_date'),
    supabase.from('equipment_logs').select('*, daily_logs(*, projects(*))').eq('is_completed', false).order('due_date'),
    supabase.from('crew_attendance').select('*, daily_logs(*, projects(*))').eq('is_completed', false).order('due_date'),
  ]);
  return {
    activities: (actRes.data || []) as any[],
    materials: (matRes.data || []) as any[],
    equipment: (eqRes.data || []) as any[],
    crew: (crewRes.data || []) as any[],
  };
}

export async function fetchDashboardStats() {
  const [projRes, logsRes, actRes, matRes] = await Promise.all([
    supabase.from('projects').select('id, status').eq('status', 'active'),
    supabase.from('daily_logs').select('id, priority, safety_incidents, is_completed'),
    supabase.from('work_activities').select('id, is_completed, due_date'),
    supabase.from('materials').select('id, is_completed, required_date, status'),
  ]);
  
  const activeProjects = (projRes.data || []).length;
  const totalLogs = (logsRes.data || []).length;
  const highPriorityLogs = (logsRes.data || []).filter((l: any) => l.priority === 'high').length;
  const safetyIncidents = (logsRes.data || []).filter((l: any) => l.safety_incidents && l.safety_incidents.trim()).length;
  
  const today = new Date().toISOString().split('T')[0];
  const overdueActivities = (actRes.data || []).filter((a: any) => !a.is_completed && a.due_date && a.due_date < today).length;
  const overdueMaterials = (matRes.data || []).filter((m: any) => !m.is_completed && m.required_date && m.required_date < today).length;
  const pendingMaterials = (matRes.data || []).filter((m: any) => m.status === 'pending').length;
  
  return {
    activeProjects,
    totalLogs,
    highPriorityLogs,
    safetyIncidents,
    overdueActivities,
    overdueMaterials,
    pendingMaterials,
    totalOverdue: overdueActivities + overdueMaterials,
  };
}
