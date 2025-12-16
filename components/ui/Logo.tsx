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
  
  if (currentLogo) {
      return (
          <img 
            src={currentLogo} 
            alt="Logo" 
            className={`object-contain ${className}`}
          />
      );
  }

  return null;
};

export default Logo;
