import React from 'react';
import { useLogoStore } from '../../store/logoStore';
import { useBrandingStore } from '../../store/brandingStore';

const Logo: React.FC<{ className?: string; localPath?: string }> = ({ className = '', localPath }) => {
    const logo = useLogoStore((state) => state.currentLogo);
    const { colorScheme } = useBrandingStore();
    
    // Use SouthWall logo for blue theme, otherwise default store logo
    const effectiveLogo = colorScheme === 'blue' ? '/SouthWall-Logo.jpg' : logo;
    const src = localPath || effectiveLogo;
    return (
        <img
            src={src}
            alt="Paradigm Logo"
            className={`w-auto object-contain ${className || 'h-10'}`}
        />
    );
};

export default Logo;
