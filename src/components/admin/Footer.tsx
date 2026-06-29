import React from 'react';

export default function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="py-4 px-12 border-t border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto flex justify-center items-center">
        <div className="text-xs text-zinc-400">
          {year} © TryVice
        </div>
      </div>
    </footer>
  );
}
