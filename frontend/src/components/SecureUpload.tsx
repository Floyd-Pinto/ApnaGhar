import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, QrCode, Check, X, AlertCircle, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate, useLocation } from 'react-router-dom';

interface SecureUploadProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

type Step = 'scan' | 'capture' | 'upload';

export default function SecureUpload({ onSuccess, onClose }: SecureUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>('scan');
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const [qrData, setQrData] = useState<string>('');
  const [verificationData, setVerificationData] = useState<any>(null);
  const [capturedImages, setCapturedImages] = useState<File[]>([]);
  const [capturedVideos, setCapturedVideos] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [sourcePath, setSourcePath] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    // Store the current path when component mounts
    setSourcePath(location.pathname);
    
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
  }, [location.pathname]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const markStepComplete = (stepToComplete: Step) => {
    if (!completedSteps.includes(stepToComplete)) {
      setCompletedSteps([...completedSteps, stepToComplete]);
    }
  };

  const checkCameraSupport = (): { supported: boolean; error?: string } => {
    // Check if running on HTTPS or localhost (required for camera access)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      return {
        supported: false,
        error: 'Camera access requires HTTPS. Please use HTTPS or localhost.'
      };
    }

    // Check if MediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        error: 'Camera API not supported in this browser. Please use a modern browser.'
      };
    }

    return { supported: true };
  };

  const startQRScanner = async () => {
    if (!isMobile) {
      toast({
        title: 'Mobile Device Required',
        description: 'QR scanning is only available on mobile devices',
        variant: 'destructive',
      });
      return;
    }

    // Check camera support first
    const cameraCheck = checkCameraSupport();
    if (!cameraCheck.supported) {
      toast({
        title: 'Camera Not Available',
        description: cameraCheck.error || 'Camera is not available on this device.',
        variant: 'destructive',
      });
      return;
    }

    // Set scanning state first so the qr-reader element gets rendered
    setIsScanning(true);
    
    // Wait for React to render the element
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Now check if qr-reader element exists
    let qrReaderElement = document.getElementById('qr-reader');
    if (!qrReaderElement) {
      setIsScanning(false);
      toast({
        title: 'Scanner Error',
        description: 'QR scanner container not found. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    // Ensure element is visible and has dimensions
    if (qrReaderElement.offsetWidth === 0 || qrReaderElement.offsetHeight === 0) {
      console.warn('QR reader element has zero dimensions, waiting a bit more...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      // Clean up any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      // Try different camera configurations as fallback
      const cameraConfigs = [
        { facingMode: 'environment' }, // Rear camera (preferred)
        { facingMode: 'user' }, // Front camera (fallback)
        { video: true }, // Any available camera
      ];

      let lastError: any = null;
      let started = false;

      for (const cameraConfig of cameraConfigs) {
        try {
          console.log('Attempting to start camera with config:', cameraConfig);
          
          await scanner.start(
            cameraConfig,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              disableFlip: false,
            },
            (decodedText) => {
              // Success callback
              console.log('QR code scanned:', decodedText);
              scanner.stop().then(() => {
                setIsScanning(false);
                handleQRScan(decodedText);
              }).catch((err) => {
                console.error('Error stopping scanner:', err);
                setIsScanning(false);
              });
            },
            (errorMessage) => {
              // Error callback - can be ignored for continuous scanning
              // Only log actual errors, not scan failures
              if (!errorMessage.includes('NotFoundException') && 
                  !errorMessage.includes('No QR code found') &&
                  !errorMessage.includes('QR code parse error')) {
                console.log('QR scan error:', errorMessage);
              }
            },
            undefined // verbose - not needed
          );
          
          started = true;
          console.log('Camera started successfully with config:', cameraConfig);
          break; // Success, exit loop
        } catch (configError: any) {
          console.log('Camera config failed:', cameraConfig, 'Error:', configError);
          lastError = configError;
          
          // Try to stop if partially started
          try {
            await scanner.stop();
          } catch (stopError) {
            // Ignore
          }
          
          // Continue to next config
          continue;
        }
      }

      if (!started) {
        throw lastError || new Error('Failed to start camera with any configuration');
      }
    } catch (error: any) {
      console.error('Error starting scanner - Full error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        error: error
      });
      setIsScanning(false);
      
      let errorMessage = 'Failed to start camera. ';
      let errorTitle = 'Camera Error';
      
      // Check for specific error types
      const errorName = error?.name || '';
      const errorMsg = error?.message || error?.toString() || '';
      
      console.log('Error details:', { errorName, errorMsg, fullError: error });
      
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || 
          errorMsg.includes('Permission denied') || errorMsg.includes('permission')) {
        errorTitle = 'Camera Permission Denied';
        errorMessage += 'Please allow camera access in your browser settings. ';
        errorMessage += 'On mobile: Settings > Privacy > Camera > Enable for this website. ';
        errorMessage += 'Then refresh the page and try again.';
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError' ||
                 errorMsg.includes('No camera') || errorMsg.includes('not found')) {
        errorTitle = 'Camera Not Found';
        errorMessage += 'No camera found on this device.';
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError' ||
                 errorMsg.includes('in use') || errorMsg.includes('busy')) {
        errorTitle = 'Camera In Use';
        errorMessage += 'Camera is being used by another application. Please close other apps using the camera and try again.';
      } else if (errorMsg.includes('Could not start video stream') || 
                 errorMsg.includes('getUserMedia')) {
        errorTitle = 'Camera Access Error';
        errorMessage += 'Unable to access camera. Please check permissions and try again.';
      } else {
        errorMessage += `Error: ${errorMsg || 'Unknown error'}. Please check permissions and try again.`;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        duration: 6000,
      });
    }
  };

  const stopQRScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
        .then(() => {
          setIsScanning(false);
          scannerRef.current = null;
        })
        .catch(console.error);
    }
  };

  const handleQRScan = async (scannedData: string) => {
    try {
      setQrData(scannedData);
      
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
      markStepComplete('scan');
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


  const handleCameraCapture = (type: 'image' | 'video') => {
    // Check camera support
    const cameraCheck = checkCameraSupport();
    if (!cameraCheck.supported) {
      toast({
        title: 'Camera Not Available',
        description: cameraCheck.error || 'Camera is not available on this device.',
        variant: 'destructive',
      });
      return;
    }

    // File input with capture attribute will handle permission request
    if (type === 'image') {
      fileInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(event.target.files || []);
    
    // Ensure only camera capture (no gallery)
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
    
    // Clear the input so same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleContinueToUpload = () => {
    if (!description.trim() && capturedImages.length === 0 && capturedVideos.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please add a description or capture at least one image/video',
        variant: 'destructive',
      });
      return;
    }
    markStepComplete('capture');
    setStep('upload');
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
        camera_captured: true,
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
      markStepComplete('upload');
      
      toast({
        title: 'Upload Successful',
        description: `${result.uploaded_images || 0} images and ${result.uploaded_videos || 0} videos uploaded successfully`,
      });

      // Call onSuccess callback first
      if (onSuccess) {
        onSuccess();
      }

      // Close the popup
      if (onClose) {
        onClose();
      }

      // Reset state
      resetUpload();

      // Redirect to property page based on verification data
      if (verificationData) {
        if (verificationData.entity_type === 'property' && verificationData.entity_id) {
          // Redirect to property page
          setTimeout(() => {
            navigate(`/property/${verificationData.entity_id}`);
            // Refresh the page to show updated data
            setTimeout(() => {
              window.location.reload();
            }, 300);
          }, 500);
        } else if (verificationData.entity_type === 'milestone' && verificationData.entity_id) {
          // For milestones, redirect to source page or project page
          if (sourcePath) {
            setTimeout(() => {
              navigate(sourcePath);
              setTimeout(() => {
                window.location.reload();
              }, 300);
            }, 500);
          }
        } else {
          // Fallback: redirect to source page
          if (sourcePath) {
            setTimeout(() => {
              navigate(sourcePath);
              setTimeout(() => {
                window.location.reload();
              }, 300);
            }, 500);
          }
        }
      } else if (sourcePath) {
        // Fallback: redirect to source page
        setTimeout(() => {
          navigate(sourcePath);
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }, 500);
      }
      
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
      setStep('capture');
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Stop scanner if running
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
    }
    
    // Reset state
    resetUpload();
    
    // Call onClose if provided
    if (onClose) {
      onClose();
    }
    
    // Redirect to source page
    if (sourcePath) {
      navigate(sourcePath);
    }
  };

  const resetUpload = () => {
    setStep('scan');
    setCompletedSteps([]);
    setQrData('');
    setVerificationData(null);
    setCapturedImages([]);
    setCapturedVideos([]);
    setDescription('');
    setIsScanning(false);
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

  const steps: { key: Step; label: string }[] = [
    { key: 'scan', label: 'Scan QR' },
    { key: 'capture', label: 'Capture & Describe' },
    { key: 'upload', label: 'Upload' },
  ];

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Progress Indicator - 3 Steps */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 overflow-x-auto pb-2">
        {steps.map((s, idx) => {
          const isCompleted = completedSteps.includes(s.key);
          const isCurrent = step === s.key;
          const currentStepIndex = steps.findIndex(st => st.key === step);
          const isPast = idx < currentStepIndex;
          
          return (
            <div key={s.key} className="flex items-center flex-shrink-0">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 transition-colors ${
                  isPast || isCompleted ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Scan QR Code */}
      {step === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Step 1: Scan QR Code
            </CardTitle>
            <CardDescription>
              Scan the QR code on the property or milestone site to fetch all information
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
            
            {/* QR Scanner Container */}
            {isScanning && (
              <div className="space-y-3">
                <div id="qr-reader" className="w-full rounded-lg overflow-hidden border-2 border-primary"></div>
                <Button 
                  onClick={stopQRScanner} 
                  variant="destructive" 
                  className="w-full min-h-[44px]"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Scanning
                </Button>
              </div>
            )}
            
            {!isScanning && (
              <Button 
                onClick={startQRScanner} 
                className="w-full min-h-[44px]"
              >
                <Camera className="mr-2 h-4 w-4" />
                Open Camera to Scan QR Code
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Capture Media & Describe Progress */}
      {step === 'capture' && verificationData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Step 2: Capture & Describe Progress
            </CardTitle>
            <CardDescription>
              {verificationData.entity_type === 'milestone'
                ? `${verificationData.title} - Phase ${verificationData.phase_number}`
                : `Unit ${verificationData.unit_number} - ${verificationData.property_type}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6 max-h-[60vh] overflow-y-auto">
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription>
                Only camera-captured photos and videos are allowed. Gallery uploads are blocked for authenticity.
              </AlertDescription>
            </Alert>

            {/* Description Input */}
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-medium mb-2 text-foreground">Progress Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 sm:p-3 border border-border rounded-md text-sm max-w-full resize-none bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
                rows={4}
                placeholder="Describe the construction progress, milestones achieved, or any updates..."
              />
            </div>

            {/* Capture Buttons */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button 
                onClick={() => handleCameraCapture('image')} 
                variant="outline" 
                className="w-full text-xs sm:text-sm min-h-[44px]"
              >
                <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Photos ({capturedImages.length})</span>
              </Button>
              <Button 
                onClick={() => handleCameraCapture('video')} 
                variant="outline" 
                className="w-full text-xs sm:text-sm min-h-[44px]"
              >
                <Camera className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Videos ({capturedVideos.length})</span>
              </Button>
            </div>

            {/* Hidden File Inputs (camera only - no gallery) */}
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
              <div className="border border-border rounded-lg p-3 sm:p-4 w-full max-w-full overflow-hidden bg-background">
                <h4 className="font-medium mb-2 text-sm sm:text-base text-foreground">Captured Media</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {capturedImages.map((img, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs sm:text-sm gap-2 text-foreground">
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
                    <div key={idx} className="flex items-center justify-between text-xs sm:text-sm gap-2 text-foreground">
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

            {/* Continue Button */}
            <div className="w-full pt-2">
              <Button
                onClick={handleContinueToUpload}
                className="w-full min-h-[44px]"
                disabled={!description.trim() && capturedImages.length === 0 && capturedVideos.length === 0}
              >
                Continue to Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Step 3: Upload to Cloudinary
            </CardTitle>
            <CardDescription>
              Upload images and videos to Cloudinary. Metadata and hash will be stored in database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground text-center">Uploading to Cloudinary...</p>
                <p className="text-sm text-muted-foreground text-center">
                  Uploading {capturedImages.length} images and {capturedVideos.length} videos
                </p>
              </div>
            ) : (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ready to upload {capturedImages.length} image(s) and {capturedVideos.length} video(s).
                    This will upload to Cloudinary and store metadata in the database.
                  </AlertDescription>
                </Alert>

                {description && (
                  <div className="border border-border rounded-lg p-3 bg-background">
                    <p className="text-sm font-medium mb-1 text-foreground">Description:</p>
                    <p className="text-sm text-foreground">{description}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button 
                    onClick={() => setStep('capture')} 
                    variant="outline" 
                    className="w-full sm:flex-1 min-h-[44px]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleUpload}
                    className="w-full sm:flex-1 min-h-[44px]"
                    disabled={capturedImages.length === 0 && capturedVideos.length === 0}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload to Cloudinary
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
