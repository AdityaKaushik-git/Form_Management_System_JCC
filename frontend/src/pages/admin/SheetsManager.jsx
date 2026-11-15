import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatDateTime } from '../../utils/helpers.js';
import {
  FileSpreadsheet,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Settings2,
  Trash2,
  ListRestart,
  Clock,
} from 'lucide-react';

const SheetsManager = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Sheet Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [worksheetName, setWorksheetName] = useState('Sheet1');
  const [addingSheet, setAddingSheet] = useState(false);
  const [addError, setAddError] = useState('');

  // Test Connection
  const [testResult, setTestResult] = useState(null);
  const [testingId, setTestingId] = useState(null);

  // Sync operations
  const [syncingId, setSyncingId] = useState(null);
  const [syncResult, setSyncResult] = useState('');

  // Delete Confirm
  const [deletingSheet, setDeletingSheet] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchFormAndSheets = async () => {
    try {
      setLoading(true);
      const [formRes, sheetsRes] = await Promise.all([
        adminService.getFormById(formId),
        adminService.getSheets(formId),
      ]);
      setForm(formRes.data);
      setSheets(sheetsRes.data || []);
    } catch (err) {
      console.error('Failed to load sheets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormAndSheets();
  }, [formId]);

  const handleAddSheet = async (e) => {
    e.preventDefault();
    try {
      setAddingSheet(true);
      setAddError('');
      await adminService.addSheet(formId, {
        displayName,
        spreadsheetUrl,
        worksheetName,
      });
      setIsAddModalOpen(false);
      setDisplayName('');
      setSpreadsheetUrl('');
      setWorksheetName('Sheet1');
      fetchFormAndSheets();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to connect Google Sheet');
    } finally {
      setAddingSheet(false);
    }
  };

  const handleTestConnection = async (sheetId) => {
    try {
      setTestingId(sheetId);
      setTestResult(null);
      const res = await adminService.testSheet(sheetId);
      setTestResult({ id: sheetId, success: true, message: res.message });
    } catch (err) {
      setTestResult({
        id: sheetId,
        success: false,
        message: err.response?.data?.message || 'Connection failed',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncAll = async (sheetId) => {
    try {
      setSyncingId(sheetId);
      setSyncResult('');
      const res = await adminService.syncAll(sheetId);
      setSyncResult(res.message);
      fetchFormAndSheets();
    } catch (err) {
      setSyncResult(err.response?.data?.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleRetryFailed = async (sheetId) => {
    try {
      setSyncingId(sheetId);
      setSyncResult('');
      const res = await adminService.retryFailed(sheetId);
      setSyncResult(res.message);
      fetchFormAndSheets();
    } catch (err) {
      setSyncResult(err.response?.data?.message || 'Retry failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteSheet = async () => {
    if (!deletingSheet) return;
    try {
      await adminService.deleteSheet(deletingSheet.id);
      setIsConfirmOpen(false);
      setDeletingSheet(null);
      fetchFormAndSheets();
    } catch (err) {
      console.error('Failed to remove sheet:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading connected Google Sheets..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/admin/forms"
              className="text-xs text-content-muted hover:text-content-primary flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Forms
            </Link>
            <span className="text-xs text-content-muted">•</span>
            <span className="text-xs font-semibold text-primary-600">{form?.title}</span>
          </div>
          <h2 className="text-xl font-bold text-content-primary">Connected Google Spreadsheets</h2>
          <p className="text-xs text-content-muted">
            Attach multiple Google Sheets (Exam Dept, Accounts, Student Contact) and map custom columns
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} icon={Plus} size="sm">
          Connect New Spreadsheet
        </Button>
      </div>

      {syncResult && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-700">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{syncResult}</span>
        </div>
      )}

      {/* Connected Sheets List */}
      {sheets.length === 0 ? (
        <div className="p-10 bg-white rounded-xl border border-dashed border-gray-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-content-primary">No Google Sheets Connected Yet</h3>
          <p className="text-xs text-content-muted max-w-sm mx-auto">
            Attach a spreadsheet URL shared with the service account email with Editor permissions to enable real-time synchronization.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            Connect Spreadsheet
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sheets.map((sheet) => {
            const hasTested = testResult && testResult.id === sheet.id;

            return (
              <div
                key={sheet.id}
                className="bg-white rounded-xl border border-gray-100 shadow-card p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-content-primary">{sheet.displayName}</h3>
                      <p className="text-xs text-content-muted">
                        Tab/Worksheet: <span className="font-semibold">{sheet.worksheetName}</span> •{' '}
                        ID: <span className="font-mono">{sheet.spreadsheetId?.slice(0, 15)}...</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={sheet.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-content-muted hover:text-content-primary border border-gray-200 rounded-lg text-xs flex items-center gap-1"
                      title="Open in Google Sheets"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Open Sheet</span>
                    </a>

                    <Link to={`/admin/sheets/${sheet.id}/mappings`}>
                      <Button variant="outline" size="sm" icon={Settings2}>
                        Column Mappings
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => {
                        setDeletingSheet(sheet);
                        setIsConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Status and Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-surface-secondary rounded-lg">
                    <span className="text-content-muted block mb-0.5">Total Synced Rows</span>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      {sheet.totalSynced || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-surface-secondary rounded-lg">
                    <span className="text-content-muted block mb-0.5">Last Sync Time</span>
                    <span className="text-content-primary font-medium">
                      {sheet.lastSyncAt ? formatDateTime(sheet.lastSyncAt) : 'Never'}
                    </span>
                  </div>
                  <div className="p-3 bg-surface-secondary rounded-lg">
                    <span className="text-content-muted block mb-0.5">Active Status</span>
                    <Badge variant={sheet.isActive ? 'active' : 'closed'}>
                      {sheet.isActive ? 'CONNECTED' : 'PAUSED'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-surface-secondary rounded-lg">
                    <span className="text-content-muted block mb-0.5">Configured Columns</span>
                    <span className="text-content-primary font-medium">
                      {sheet.columnMappings?.length || 0} Columns Mapped
                    </span>
                  </div>
                </div>

                {sheet.lastError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Last Sync Error: {sheet.lastError}</span>
                  </div>
                )}

                {hasTested && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                {/* Operations Action Bar */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(sheet.id)}
                    isLoading={testingId === sheet.id}
                  >
                    Test Access
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ListRestart}
                    onClick={() => handleSyncAll(sheet.id)}
                    isLoading={syncingId === sheet.id}
                  >
                    Sync All Previous Submissions
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={RotateCcw}
                    onClick={() => handleRetryFailed(sheet.id)}
                    isLoading={syncingId === sheet.id}
                  >
                    Retry Failed Rows
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Sheet Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Connect Google Spreadsheet"
      >
        <form onSubmit={handleAddSheet} className="space-y-4">
          {addError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {addError}
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
            <span className="font-bold block">Important Google Sheets Requirement:</span>
            <span>
              Share the target spreadsheet with the service account email (as configured in your backend environment) with{' '}
              <strong>Editor</strong> permission.
            </span>
          </div>

          <Input
            label="Display Name (Department / Purpose)"
            placeholder="e.g. Examination Department Sheet or Accounts Sheet"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Input
            label="Google Spreadsheet URL"
            placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
            required
            value={spreadsheetUrl}
            onChange={(e) => setSpreadsheetUrl(e.target.value)}
          />

          <Input
            label="Worksheet Tab Name"
            placeholder="e.g. Sheet1 or Dec2026_Reappear"
            required
            value={worksheetName}
            onChange={(e) => setWorksheetName(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={addingSheet}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addingSheet}>
              Connect & Validate Sheet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Sheet Confirmation */}
      {deletingSheet && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDeleteSheet}
          title="Disconnect Google Spreadsheet"
          message={`Are you sure you want to disconnect "${deletingSheet.displayName}"? Automatic background synchronizations to this sheet will stop.`}
          confirmText="Disconnect Sheet"
        />
      )}
    </div>
  );
};

export default SheetsManager;
