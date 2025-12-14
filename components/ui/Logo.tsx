import React from 'react';
import { useBrandingStore } from '../../store/brandingStore';
import { useLogoStore } from '../../store/logoStore';
import { originalDefaultLogoBase64 } from './logoData';
import { Leaf } from 'lucide-react';

interface LogoProps {
  className?: string;
  localPath?: string; // Optional prop for PDF generation or overrides
}

const Logo: React.FC<LogoProps> = ({ className = '', localPath }) => {
  const { colorScheme } = useBrandingStore();
  const { currentLogo } = useLogoStore();
  
  // Check if we are using a custom logo
  const isCustomLogo = currentLogo && currentLogo !== originalDefaultLogoBase64;

  // Theme-specific colors for logo text
  const textColor = (() => {
    switch (colorScheme) {
      case 'purple': return '#5B21B6';
      case 'red': return '#991B1B';
      case 'amber': return '#B45309';
      default: return '#006B3F'; // green
    }
  })();

  if (isCustomLogo) {
      return (
          <img 
            src={currentLogo} 
            alt="Logo" 
            className={`object-contain ${className}`}
          />
      );
  }

  // Fallback to localPath specific logic if provided (mostly for PDF generation where we might want specific file paths)
  // However, usually we want the custom logo to override everything if set. 
  // If localPath is provided but NO custom logo, we might want to respect it? 
  // For now, let's assume default behavior is what we want if no custom logo.

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
