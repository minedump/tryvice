'use client';
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'S' | 'M' | 'L';
  color?: 'black' | 'red';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'M',
  color = 'black',
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl";
  
  const variants = {
    primary: {
      black: "bg-black text-white hover:bg-zinc-800",
      red: "bg-red-600 text-white hover:bg-red-700",
    },
    secondary: {
      black: "border border-zinc-200 text-black hover:border-black hover:bg-zinc-50",
      red: "border border-red-200 text-red-600 hover:border-red-600 hover:bg-red-50",
    }
  };

  const sizes = {
    S: "px-3 py-1.5 text-[10px] gap-1.5",
    M: "px-5 py-2.5 text-xs gap-2",
    L: "px-8 py-4 text-sm gap-3",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant][color],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
