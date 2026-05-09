import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const cls = `btn${variant !== 'primary' ? ` btn-${variant}` : ''}${className ? ` ${className}` : ''}`;
  return <button className={cls} {...props} />;
}
