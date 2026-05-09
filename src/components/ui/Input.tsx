import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`input-field${className ? ` ${className}` : ''}`}
        spellCheck="false"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
