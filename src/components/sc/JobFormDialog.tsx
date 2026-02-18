import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Project } from '@/lib/sitecommand-types';
import { WEATHER_OPTIONS } from '@/lib/sitecommand-types';
import { todayStr } from '@/lib/sitecommand-utils';
import { fetchProjects, createProject, createDailyLog } from '@/lib/sitecommand-store';

interface JobFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (logId: string) => void;
}

const JobFormDialog: React.FC<JobFormDialogProps> = ({ open, onClose, onCreated }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mode, setMode] = useState<'existing' | 'new'>('new');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [saving, setSaving] = useState(false);

  // New project fields
  const [projectName, setProjectName] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [location, setLocation] = useState('');
  const [client, setClient] = useState('');

  // Log fields
  const [logDate, setLogDate] = useState(todayStr());
  const [weather, setWeather] = useState('');
  const [temperature, setTemperature] = useState('');
  const [wind, setWind] = useState('');
  const [siteConditions, setSiteConditions] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      fetchProjects().then(setProjects).catch(console.error);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let projectId = selectedProjectId;
      if (mode === 'new') {
        const p = await createProject({
          name: projectName,
          job_number: jobNumber,
          location,
          client,
          status: 'active',
        });
        projectId = p.id;
      }
      const log = await createDailyLog({
        project_id: projectId,
        log_date: logDate,
        weather,
        temperature,
        wind,
        site_conditions: siteConditions,
        priority,
        notes,
        safety_incidents: '',
        critical_items: '',
        is_completed: false,
      });
      onCreated(log.id);
      resetForm();
    } catch (e) {
      console.error(e);
      alert('Failed to create job');
    }
    setSaving(false);
  };

  const resetForm = () => {
    setProjectName('');
    setJobNumber('');
    setLocation('');
    setClient('');
    setLogDate(todayStr());
    setWeather('');
    setTemperature('');
    setWind('');
    setSiteConditions('');
    setPriority('low');
    setNotes('');
    setSelectedProjectId('');
    setMode('new');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">New Job Entry</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'new' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              New Project
            </button>
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'existing' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Existing Project
            </button>
          </div>

          {mode === 'existing' ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Select Project</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="">Choose a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.job_number ? `[${p.job_number}] ` : ''}{p.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Project Name *</label>
                  <input
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Smith St Fitout"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Job Number</label>
                  <input
                    value={jobNumber}
                    onChange={e => setJobNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 1234"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Auckland CBD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Client</label>
                  <input
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
                    placeholder="e.g. ABC Corp"
                  />
                </div>
              </div>
            </div>
          )}

          <hr className="border-slate-700" />

          {/* Daily Log fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Date *</label>
              <input
                type="date"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Weather</label>
              <select
                value={weather}
                onChange={e => setWeather(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="">Select...</option>
                {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Temperature</label>
              <input
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder="e.g. 18°C"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Wind</label>
              <input
                value={wind}
                onChange={e => setWind(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
                placeholder="e.g. Light NW"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Site Conditions</label>
            <input
              value={siteConditions}
              onChange={e => setSiteConditions(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="e.g. Dry, good access"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobFormDialog;
