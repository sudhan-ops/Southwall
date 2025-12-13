import React, { forwardRef } from 'react';
// Fix: Changed `import type` to inline `import { type ... }` for UseFormRegisterReturn to fix namespace-as-type error.
import { type UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  registration?: UseFormRegisterReturn;
  labelClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, registration, className, labelClassName, ...props }, ref) => {
    const baseClass = 'form-input';
    const errorClass = 'form-input--error';
    const finalClassName = `${baseClass} ${error ? errorClass : ''} ${className || ''}`;

    return (
      <div>
        {label && (
          <label htmlFor={id} className={`block text-sm font-medium text-muted ${labelClassName || ''}`}>
            {label}
          </label>
        )}
        <div className={label ? "mt-1" : ""}>
          <input
            ref={ref}
            id={id}
            className={finalClassName}
            aria-invalid={!!error}
            {...registration}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;