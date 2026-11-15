import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { Settings, CheckCircle2, Save, Info } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await adminService.getSettings();
        const map = {};
        (res.data || []).forEach((s) => {
          map[s.key] = s.value;
        });
        setSettings(map);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key) => {
    try {
      setSaving(true);
      setSuccessMsg('');
      await adminService.updateSetting(key, settings[key]);
      setSuccessMsg(`Setting "${key}" updated successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save setting:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading system settings..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-content-primary">System Settings</h2>
          <p className="text-xs text-content-muted">
            Configure institutional branding, support contacts, and examination system defaults
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex-1">
              <Input
                label="Institution Name"
                value={settings.INSTITUTION_NAME || 'JCC, Rohini Sector 3, Delhi'}
                onChange={(e) => handleChange('INSTITUTION_NAME', e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => handleSave('INSTITUTION_NAME')} isLoading={saving}>
              Save
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex-1">
              <Input
                label="Application Name"
                value={settings.SYSTEM_NAME || 'Reappear Examination Form Management System'}
                onChange={(e) => handleChange('SYSTEM_NAME', e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => handleSave('SYSTEM_NAME')} isLoading={saving}>
              Save
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex-1">
              <Input
                label="Support Contact Email"
                value={settings.SUPPORT_EMAIL || 'support@jcc.edu.in'}
                onChange={(e) => handleChange('SUPPORT_EMAIL', e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => handleSave('SUPPORT_EMAIL')} isLoading={saving}>
              Save
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex-1">
              <Input
                label="Official Footer Credit"
                value={settings.FOOTER_CREDIT || 'Designed by Aditya Kaushik'}
                disabled
                helperText="Fixed system attribute"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
