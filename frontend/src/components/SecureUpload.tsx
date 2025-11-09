import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, QrCode, Check, X, AlertCircle, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SecureUploadProps {
  onSuccess?: () => void;
}

export default function SecureUpload({ onSuccess }: SecureUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'scan' | 'verify' | 'capture' | 'upload' | 'success'>('scan');
  const [qrData, setQrData] = useState<string>('');
  const [verificationData, setVerificationData] = useState<any>(null);
  const [capturedImages, setCapturedImages] = useState<File[]>([]);
  const [capturedVideos, setCapturedVideos] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile = /mobile|android|iphone|ipad|tablet/.test(userAgent);
      setIsMobile(mobile);
      
      if (!mobile) {
        toast({
          title: 'Desktop Device Detected',
          description: 'Construction updates can only be uploaded from mobile devices for security.',
          variant: 'destructive',
        });
      }
    };
    
    checkMobile();
  }, []);

  const handleQRScan = async (scannedData: string) => {
    try {
      setQrData(scannedData);
      setStep('verify');
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/projects/milestones/verify_qr/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          qr_data: scannedData,
          device_info: {
            is_mobile: isMobile,
            user_agent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'QR verification failed');
      }

      const data = await response.json();
      setVerificationData(data);
      setStep('capture');
      
      toast({
        title: 'QR Code Verified',
        description: `Ready to upload to ${data.title || data.unit_number}`,
      });
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
      setStep('scan');
    }
  };

  const handleManualQRInput = () => {
    const input = prompt('Enter QR code data manually:');
    if (input) {
      handleQRScan(input);
    }
  };

  const handleCameraCapture = (type: 'image' | 'video') => {
    if (type === 'image') {
      fileInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(event.target.files || []);
    
    if (type === 'image') {
      const maxImages = verificationData?.restrictions?.max_images || 10;
      if (capturedImages.length + files.length > maxImages) {
        toast({
          title: 'Too Many Images',
          description: `Maximum ${maxImages} images allowed`,
          variant: 'destructive',
        });
        return;
      }
      setCapturedImages([...capturedImages, ...files]);
    } else {
      const maxVideos = verificationData?.restrictions?.max_videos || 5;
      if (capturedVideos.length + files.length > maxVideos) {
        toast({
          title: 'Too Many Videos',
          description: `Maximum ${maxVideos} videos allowed`,
          variant: 'destructive',
        });
        return;
      }
      setCapturedVideos([...capturedVideos, ...files]);
    }
  };

  const handleUpload = async () => {
    if (!verificationData || (!capturedImages.length && !capturedVideos.length)) {
      toast({
        title: 'No Media Selected',
        description: 'Please capture at least one image or video',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setStep('upload');

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();

      // Add upload token
      formData.append('upload_token', verificationData.upload_token);
      
      // Add device info
      formData.append('device_info', JSON.stringify({
        is_mobile: isMobile,
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString(),
      }));
      
      // Add capture metadata (indicating camera capture)
      formData.append('capture_metadata', JSON.stringify({
        camera_captured: true,  // In production, verify this from file metadata
        capture_time: new Date().toISOString(),
        location: null,  // Can add GPS if permitted
      }));
      
      // Add description
      if (description) {
        formData.append('description', description);
      }
      
      // Add images
      capturedImages.forEach((file) => {
        formData.append('images', file);
      });
      
      // Add videos
      capturedVideos.forEach((file) => {
        formData.append('videos', file);
      });

      const uploadEndpoint = `${API_BASE_URL}${verificationData.upload_endpoint}`;
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const result = await response.json();
      setStep('success');
      
      toast({
        title: 'Upload Successful',
        description: `${result.uploaded_images || 0} images and ${result.uploaded_videos || 0} videos uploaded`,
      });

      if (onSuccess) {
        onSuccess();
      }

      // Reset after success
      setTimeout(() => {
        resetUpload();
      }, 3000);
      
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
      setStep('capture');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setStep('scan');
    setQrData('');
    setVerificationData(null);
    setCapturedImages([]);
    setCapturedVideos([]);
    setDescription('');
  };

  if (!isMobile) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Smartphone className="h-5 w-5" />
            Mobile Device Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              For security and authenticity, construction updates can only be uploaded from mobile devices.
              Please access this feature from your smartphone or tablet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 overflow-x-auto pb-2">
        {['scan', 'verify', 'capture', 'upload', 'success'].map((s, idx) => (
          <div key={s} className="flex items-center flex-shrink-0">
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : ['verify', 'capture', 'upload', 'success'].indexOf(step) >= idx
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {['verify', 'capture', 'upload', 'success'].indexOf(step) > idx ? (
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                idx + 1
              )}
            </div>
            {idx < 4 && <div className="w-6 sm:w-12 h-0.5 bg-muted mx-1 sm:mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Scan QR */}
      {step === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </CardTitle>
            <CardDescription>
              Scan the QR code on the property or milestone site to begin upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Each property and milestone has a unique QR code. Scanning ensures uploads are authentic
                and linked to the correct location.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col gap-2">
              <Button onClick={() => {/* Integrate QR scanner library */}} className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Open Camera to Scan
              </Button>
              <Button variant="outline" onClick={handleManualQRInput} className="w-full">
                Enter QR Code Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Verification */}
      {step === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle>Verifying QR Code...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Capture Media */}
      {step === 'capture' && verificationData && (
        <Card>
          <CardHeader>
            <CardTitle>Capture Construction Updates</CardTitle>
            <CardDescription>
              {verificationData.entity_type === 'milestone'
                ? `${verificationData.title} - Phase ${verificationData.phase_number}`
                : `Unit ${verificationData.unit_number} - ${verificationData.property_type}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription>
                Only camera-captured photos and videos are allowed. Gallery uploads are blocked for authenticity.
              </AlertDescription>
            </Alert>

            {/* Description Input */}
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 sm:p-3 border rounded-md text-sm max-w-full"
                rows={3}
                placeholder="Describe the construction progress..."
              />
            </div>

            {/* Capture Buttons */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button onClick={() => handleCameraCapture('image')} variant="outline" className="w-full text-xs sm:text-sm">
                <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Photos ({capturedImages.length})</span>
              </Button>
              <Button onClick={() => handleCameraCapture('video')} variant="outline" className="w-full text-xs sm:text-sm">
                <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Videos ({capturedVideos.length})</span>
              </Button>
            </div>

            {/* Hidden File Inputs (camera only) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => handleFileSelect(e, 'image')}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              multiple
              onChange={(e) => handleFileSelect(e, 'video')}
              className="hidden"
            />

            {/* Captured Media Preview */}
            {(capturedImages.length > 0 || capturedVideos.length > 0) && (
              <div className="border rounded-lg p-3 sm:p-4 w-full max-w-full overflow-hidden">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Captured Media</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {capturedImages.map((img, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                      <span className="truncate flex-1">📷 {img.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCapturedImages(capturedImages.filter((_, i) => i !== idx))}
                        className="flex-shrink-0"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ))}
                  {capturedVideos.map((vid, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                      <span className="truncate flex-1">🎥 {vid.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCapturedVideos(capturedVideos.filter((_, i) => i !== idx))}
                        className="flex-shrink-0"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button onClick={resetUpload} variant="outline" className="w-full sm:flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                className="w-full sm:flex-1 text-xs sm:text-sm"
                disabled={capturedImages.length === 0 && capturedVideos.length === 0}
              >
                <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Upload ({capturedImages.length + capturedVideos.length} files)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Uploading */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Uploading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Uploading your construction updates...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Success */}
      {step === 'success' && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Upload Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                Your construction updates have been uploaded successfully with QR verification.
              </AlertDescription>
            </Alert>
            <Button onClick={resetUpload} className="w-full mt-4">
              Upload More
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
