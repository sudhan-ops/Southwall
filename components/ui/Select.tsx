import React, { forwardRef } from 'react';
// Fix: Changed `import type` to inline `import { type ... }` for UseFormRegisterReturn to fix namespace-as-type error.
import { type UseFormRegisterReturn } from 'react-hook-form';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  registration?: UseFormRegisterReturn;
  children: React.ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, error, registration, children, className, ...props }, ref) => {
    const baseClass = 'form-input';
    const errorClass = 'form-input--error';
    const finalClassName = `${baseClass} ${error ? errorClass : ''} ${className || ''}`;

    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-muted">
            {label}
          </label>
        )}
        <div className={label ? "mt-1" : ""}>
          <select
            ref={ref}
            id={id}
            className={finalClassName}
            aria-invalid={!!error}
            {...registration}
            {...props}
          >
            {children}
          </select>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;