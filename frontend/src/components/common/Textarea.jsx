import React, { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  rows = 3,
  id,
  required,
  ...props
}, ref) => {
  const textareaId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-content-primary mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`block w-full text-base sm:text-sm rounded-lg border transition-colors bg-white text-content-primary placeholder-content-muted p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 touch-manipulation ${
          error ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-content-muted">{helperText}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
