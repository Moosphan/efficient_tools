import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`tool-textarea${className ? ` ${className}` : ''}`}
        spellCheck="false"
        autoComplete="off"
        {...props}
      />
    );
  }
);

TextArea.displayName = 'TextArea';
