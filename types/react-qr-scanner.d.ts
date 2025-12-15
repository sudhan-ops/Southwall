declare module "react-qr-scanner" {
    import * as React from "react";

    export interface QrScannerProps {
        onError: (error: any) => void;
        onScan: (data: { text: string } | null) => void;
        style?: React.CSSProperties;
        constraints?: MediaStreamConstraints;
        delay?: number;
        className?: string;
    }

    const QrScanner: React.ComponentType<QrScannerProps>;
    export default QrScanner;
}
