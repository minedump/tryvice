import React from 'react';
import { IconInfoCircle } from '@tabler/icons-react';

interface TooltipProps {
  content: string;
  className?: string;
}

export default function Tooltip({ content, className = "" }: TooltipProps) {
  return (
    <div className={`group relative inline-block ${className}`}>
      <IconInfoCircle 
        size={16} 
        className="text-zinc-500 cursor-help hover:text-zinc-800 transition-colors" 
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-zinc-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 leading-relaxed">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
      </div>
    </div>
  );
}
