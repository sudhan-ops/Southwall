import React from 'react';
import { useBrandingStore } from '../../store/brandingStore';
import { Leaf } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  const { colorScheme } = useBrandingStore();
  
  // Theme-specific colors for logo text
  const textColor = (() => {
    switch (colorScheme) {

      case 'purple': return '#5B21B6';
      case 'red': return '#991B1B';
      case 'amber': return '#B45309';
      default: return '#006B3F'; // green
    }
  })();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Leaf className="w-8 h-8" style={{ color: textColor }} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-lg tracking-wide" style={{ color: textColor }}>
          PARADIGM SER<span className="text-xs align-super">vi</span>CES
        </span>
      </div>
    </div>
  );
};

export default Logo;
