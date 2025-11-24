import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Camera, Loader2 } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (decodedText: string, decodedResult: any) => void;
    onScanError?: (error: string) => void;
    onClose?: () => void;
}

export default function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const qrCodeRegionId = "qr-reader";

    useEffect(() => {
        if (scanning && !scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                qrCodeRegionId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                false
            );

            scanner.render(
                (decodedText, decodedResult) => {
                    setSuccess(true);
                    setScanning(false);
                    scanner.clear();
                    onScanSuccess(decodedText, decodedResult);
                },
                (errorMessage) => {
                    // Ignore frequent scan errors
                    if (!errorMessage.includes('NotFoundException')) {
                        console.error('QR Scan Error:', errorMessage);
                    }
                }
            );

            scannerRef.current = scanner;
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [scanning, onScanSuccess]);

    const startScanning = () => {
        setError(null);
        setSuccess(false);
        setScanning(true);
    };

    const stopScanning = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
        setScanning(false);
        if (onClose) onClose();
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    QR Code Scanner
                </CardTitle>
                <CardDescription>
                    Scan a QR code to verify and access construction milestone details
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!scanning && !success && (
                    <Button onClick={startScanning} className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        Start Scanning
                    </Button>
                )}

                {scanning && (
                    <div className="space-y-4">
                        <div id={qrCodeRegionId} className="w-full"></div>
                        <Button onClick={stopScanning} variant="outline" className="w-full">
                            Cancel Scanning
                        </Button>
                    </div>
                )}

                {success && (
                    <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 dark:text-green-400">
                            QR Code scanned successfully! Redirecting...
                        </AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
