export const APP_NAME = 'Reappear Examination Form Management System';
export const INSTITUTION_NAME = 'JCC, Rohini Sector 3, Delhi';
export const FOOTER_CREDIT = 'Designed by Aditya Kaushik';

export const FIELD_TYPES = [
  { value: 'text', label: 'Single Line Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email Address' },
  { value: 'mobile', label: 'Mobile Number' },
  { value: 'textarea', label: 'Multi-line Text (Textarea)' },
  { value: 'dropdown', label: 'Dropdown Select' },
  { value: 'radio', label: 'Radio Selection' },
  { value: 'checkbox', label: 'Multiple Checkboxes' },
  { value: 'date', label: 'Date Picker' },
  { value: 'info', label: 'Read-only Information' },
];

export const APPLICATION_STATUS = {
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', color: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' },
  CORRECTION_REQUIRED: { label: 'Correction Required', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const FORM_STATUS = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  UPCOMING: { label: 'Upcoming', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACTIVE: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOSED: { label: 'Closed', color: 'bg-red-50 text-red-700 border-red-200' },
};
