import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
  entityType: 'milestone' | 'property';
  entityId: string;
  projectName: string;
  title?: string;  // For milestone
  unitNumber?: string;  // For property
  qrCodeData: string;
}

export default function QRCodeDisplay({
  entityType,
  entityId,
  projectName,
  title,
  unitNumber,
  qrCodeData,
}: QRCodeDisplayProps) {
  const [showPrintView, setShowPrintView] = useState(false);

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${entityId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${entityType}-${entityId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (showPrintView) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">{projectName}</h1>
          <h2 className="text-xl text-gray-600 mb-4">
            {entityType === 'milestone' ? title : `Unit ${unitNumber}`}
          </h2>
          <Badge variant="outline" className="text-sm">
            {entityType === 'milestone' ? 'Milestone QR Code' : 'Property QR Code'}
          </Badge>
        </div>
        
        <div className="border-4 border-black p-4 mb-6">
          <QRCodeSVG
            id={`qr-${entityId}`}
            value={qrCodeData}
            size={400}
            level="H"
            includeMargin
          />
        </div>
        
        <div className="text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">Scan to Upload Construction Updates</p>
          <p className="text-xs mb-1">Camera-only uploads • Mobile devices only</p>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded">{entityId}</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code for Secure Upload
        </CardTitle>
        <CardDescription>
          Display this QR code at the construction site for mobile uploads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <QRCodeSVG
              id={`qr-${entityId}`}
              value={qrCodeData}
              size={200}
              level="H"
              includeMargin
            />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm font-medium">
              {entityType === 'milestone' ? title : `Unit ${unitNumber}`}
            </p>
            <Badge variant="outline" className="mt-2">
              {entityType === 'milestone' ? 'Milestone' : 'Property'} QR
            </Badge>
          </div>
        </div>

        <div className="border-l-4 border-primary pl-4 text-sm text-muted-foreground">
          <p className="font-semibold mb-1">Security Features:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Mobile device detection (desktop blocked)</li>
            <li>Camera-only capture (gallery blocked)</li>
            <li>GPS and timestamp metadata</li>
            <li>QR verification token required</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Print and display this QR code at the construction site</li>
            <li>Scan with mobile device when uploading updates</li>
            <li>Only camera-captured photos/videos will be accepted</li>
            <li>Uploads are verified and time-stamped</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
