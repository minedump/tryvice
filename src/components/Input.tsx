'use client';
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Tooltip from './Tooltip';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  multiline?: boolean;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  tooltip?: string;
}
export default function Input({
  label,
  error,
  multiline = false,
  icon,
  onIconClick,
  tooltip,
  className,
  ...props
}: InputProps) {
  const inputStyles = cn(
    "w-full border border-zinc-200 rounded-lg px-4 py-2.5 outline-none focus:border-black transition-colors placeholder:text-zinc-300 text-sm",
    error && "border-red-500 focus:border-red-500",
    multiline && "min-h-[100px] resize-none",
    (icon || tooltip) && !multiline && "pr-11",
    "[&::-webkit-calendar-picker-indicator]:hidden",
    className
  );

  const labelStyles = "block text-[10px] font-bold uppercase text-zinc-400 mb-1 tracking-widest";
  return (
    <div className="w-full">
      {label && <label className={labelStyles}>{label}</label>}
      <div className="relative">
        {multiline ? (
          <textarea className={inputStyles} {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input className={inputStyles} {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />
        )}
        {icon ? (
          <div 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 right-4 flex items-center text-zinc-400",
              onIconClick ? "cursor-pointer hover:text-black transition-colors" : "pointer-events-none"
            )}
            onClick={onIconClick}
          >
            {icon}
          </div>
        ) : tooltip ? (
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center">
            <Tooltip content={tooltip} />
          </div>
        ) : null}
      </div>
      {error && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">{error}</p>}
    </div>
  );
}