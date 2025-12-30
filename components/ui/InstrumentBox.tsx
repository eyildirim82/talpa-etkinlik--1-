import React from 'react';

interface InstrumentBoxProps {
  label: string;
  value: string | number | React.ReactNode;
  highlight?: boolean;
  className?: string;
}

export const InstrumentBox: React.FC<InstrumentBoxProps> = ({ label, value, highlight = false, className = '' }) => {
  return (
    <div className={`flex flex-col p-6 h-full justify-center ${className} ${highlight ? 'bg-blue-50/50' : ''}`}>
      <span className="text-xs font-medium text-talpa-secondary mb-2 tracking-wide">
        {label}
      </span>
      <div className={`text-lg md:text-xl font-semibold text-talpa-primary ${highlight ? 'text-talpa-accent' : ''}`}>
        {value}
      </div>
    </div>
  );
};