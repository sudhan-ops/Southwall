// Default logo is SouthWall
export const originalDefaultLogoBase64 = "/SouthWall-Logo.jpg";

// Logo paths for each organization
export const paradigmLogoPath =
    "https://fmyafuhxlorbafbacywa.supabase.co/storage/v1/object/sign/logo/Paradigm-Logo-3-1024x157.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDgwNWUxZC0yMTk2LTQxMjktYjUwMC0yMGZiYzgwN2I3NjUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvL1BhcmFkaWdtLUxvZ28tMy0xMDI0eDE1Ny5wbmciLCJpYXQiOjE3NjM2MTQwNzUsImV4cCI6MjA3ODk3NDA3NX0.TYFTGDrqZ3frG3wS6gbF5TQchyBX3kb2VV49Il4X-34";
export const southwallLogoPath = "/SouthWall-Logo.jpg";

// Local path for the logo, used specifically for client-side PDF generation
// This now returns the appropriate logo based on the color scheme
export const pdfLogoLocalPath =
    "https://fmyafuhxlorbafbacywa.supabase.co/storage/v1/object/sign/logo/Paradigm-Logo-3-1024x157.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDgwNWUxZC0yMTk2LTQxMjktYjUwMC0yMGZiYzgwN2I3NjUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvL1BhcmFkaWdtLUxvZ28tMy0xMDI0eDE1Ny5wbmciLCJpYXQiOjE3NjM2MTQwNzUsImV4cCI6MjA3ODk3NDA3NX0.TYFTGDrqZ3frG3wS6gbF5TQchyBX3kb2VV49Il4X-34";

// Helper function to get the correct logo path for PDF generation based on color scheme
export const getPdfLogoPath = (colorScheme: string) => {
    return (colorScheme === "blue" || colorScheme === "professional-blue")
        ? southwallLogoPath
        : paradigmLogoPath;
};

// Helper function to get the organization name based on color scheme
export const getOrganizationName = (colorScheme: string) => {
    return (colorScheme === "blue" || colorScheme === "professional-blue")
        ? "SouthWall Security"
        : "Paradigm Services";
};
