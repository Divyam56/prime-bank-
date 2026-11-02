import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, Upload, AlertCircle, CheckCircle2, Flashlight } from 'lucide-react';
import { extractAccountNumberFromQR } from '../utils/qrParser';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedAccount: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setHasScanned(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser environment. You can upload an image with a QR code instead.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      // Check flashlight/torch support
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() || {}) as any;
        if (capabilities.torch) {
          setTorchSupported(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      let errorMsg = 'Unable to access device camera. Please check camera permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please allow camera permissions in browser settings, or upload a QR image.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found on this system. You can upload an image with a QR code instead.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is currently in use by another application.';
      }
      setCameraError(errorMsg);
      setIsScanning(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    setIsScanning(false);
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {}
      });
      setStream(null);
    }
  };

  // Toggle Torch if available
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && torchSupported) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn('Failed to toggle torch', e);
      }
    }
  };

  // Animation Frame Loop for QR Scanning
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  useEffect(() => {
    let animationFrameId: number;

    const scanFrame = () => {
      if (hasScanned || !isScanning || !videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          const account = extractAccountNumberFromQR(code.data);
          if (account) {
            setHasScanned(true);
            stopCamera();
            // Provide gentle audio/haptic feedback if supported
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(100);
            }
            onScanSuccess(account);
            onClose();
            return;
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanFrame);
    };

    if (isScanning && !hasScanned) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isScanning, hasScanned]);

  // Handle Image File Upload for QR Decoding
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          if (code && code.data) {
            const account = extractAccountNumberFromQR(code.data);
            if (account) {
              setHasScanned(true);
              stopCamera();
              onScanSuccess(account);
              onClose();
              return;
            } else {
              setCameraError(`QR code found ("${code.data}"), but could not detect a valid account number.`);
            }
          } else {
            setCameraError('No QR code could be detected in this uploaded image.');
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Camera size={18} />
            </div>
            <div>
              <h3 id="qr-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                Scan Recipient QR Code
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Point camera at a PrimeBank or UPI QR code
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close scanner"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder / Camera View */}
        <div className="relative bg-black w-full aspect-square flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for Decoding Frames */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Active Live Video Stream */}
          <video 
            ref={videoRef}
            muted
            playsInline
            className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
          />

          {/* Scanning Reticle Overlay */}
          {!cameraError && isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              {/* Darkened Vignette Mask */}
              <div className="relative w-64 h-64 border-2 border-teal-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Scanner Target Corners */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-teal-500 via-teal-300 to-teal-500 shadow-[0_0_8px_#2dd4bf] animate-[bounce_2.5s_infinite]" />
              </div>
            </div>
          )}

          {/* Torch & Camera Control Floating Buttons */}
          {!cameraError && isScanning && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-full backdrop-blur-md text-white transition ${
                    torchOn ? 'bg-amber-500 shadow-lg' : 'bg-black/60 hover:bg-black/80'
                  }`}
                  aria-label="Toggle flashlight"
                >
                  <Flashlight size={18} />
                </button>
              )}
            </div>
          )}

          {/* Fallback & Error State inside viewfinder */}
          {cameraError && (
            <div className="p-6 text-center text-white z-10 max-w-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw size={14} /> Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Upload size={14} /> Upload QR Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer & Image Upload Alternative */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload QR code image file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload size={14} /> Upload QR File
          </button>

          {/* Quick Demo QR shortcut for instant simulated test */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Demo QR:</span>
            <button
              type="button"
              onClick={() => {
                onScanSuccess('SB100003');
                stopCamera();
                onClose();
              }}
              className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[11px] font-mono text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Rahul (SB100003)
            </button>
            <button
              type="button"
              onClick={() => {
                onScanSuccess('SB100004');
                stopCamera();
                onClose();
              }}
              className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[11px] font-mono text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Meera (SB100004)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
