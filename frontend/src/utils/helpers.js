import dayjs from 'dayjs';

export const formatDate = (date, format = 'DD MMM YYYY') => {
  if (!date) return 'N/A';
  return dayjs(date).format(format);
};

export const formatDateTime = (date, format = 'DD MMM YYYY, hh:mm A') => {
  if (!date) return 'N/A';
  return dayjs(date).format(format);
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'active':
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'submitted':
    case 'processing':
    case 'pending':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'under_review':
    case 'upcoming':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'rejected':
    case 'closed':
    case 'failed':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'correction_required':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};
