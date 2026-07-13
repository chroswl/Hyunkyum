import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, Image as ImageIcon } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropDone: (croppedImageBase64: string, copyrightText?: string, copyrightLink?: string) => void;
  onCropCancel: () => void;
  aspect?: number;
  copyright?: string;
  copyrightUrl?: string;
}

export const getRadianAngle = (degreeValue: number) => {
  return (degreeValue * Math.PI) / 180;
};

export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  maxWidth = 1200
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return null;
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  let dataUrl = '';
  if (croppedCanvas.width > maxWidth || croppedCanvas.height > maxWidth) {
    const resizeCanvas = document.createElement('canvas');
    const resizeCtx = resizeCanvas.getContext('2d');
    let width = croppedCanvas.width;
    let height = croppedCanvas.height;
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else if (height > maxWidth) {
      width = Math.round((width * maxWidth) / height);
      height = maxWidth;
    }
    resizeCanvas.width = width;
    resizeCanvas.height = height;
    resizeCtx?.drawImage(croppedCanvas, 0, 0, width, height);
    
    let currentMaxWidth = maxWidth;
    let currentQuality = 0.8;

    const compress = (mw: number, q: number): string => {
      let w = croppedCanvas.width;
      let h = croppedCanvas.height;
      if (w > mw) {
        h = Math.round((h * mw) / w);
        w = mw;
      } else if (h > mw) {
        w = Math.round((w * mw) / h);
        h = mw;
      }
      resizeCanvas.width = w;
      resizeCanvas.height = h;
      resizeCtx?.drawImage(croppedCanvas, 0, 0, w, h);
      return resizeCanvas.toDataURL('image/jpeg', q);
    };

    dataUrl = compress(currentMaxWidth, currentQuality);
    
    while (dataUrl.length > 950000 && currentMaxWidth > 400) {
      currentMaxWidth -= 200;
      currentQuality -= 0.1;
      dataUrl = compress(currentMaxWidth, Math.max(0.3, currentQuality));
    }
    
  } else {
    dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.8);
    let currentQuality = 0.8;
    let mw = croppedCanvas.width;
    
    const compress = (mwInner: number, q: number): string => {
      let w = croppedCanvas.width;
      let h = croppedCanvas.height;
      if (w > mwInner) {
        h = Math.round((h * mwInner) / w);
        w = mwInner;
      } else if (h > mwInner) {
        w = Math.round((w * mwInner) / h);
        h = mwInner;
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      tempCanvas.getContext('2d')?.drawImage(croppedCanvas, 0, 0, w, h);
      return tempCanvas.toDataURL('image/jpeg', q);
    };

    while (dataUrl.length > 950000 && mw > 400) {
      mw -= 200;
      currentQuality -= 0.1;
      dataUrl = compress(mw, Math.max(0.3, currentQuality));
    }
  }

  if (dataUrl.length > 1048000) {
    alert("Image is still too large after compression. Please use a smaller image.");
    return null;
  }

  return dataUrl;
}


async function compressOriginalImage(imageSrc: string, maxWidth = 1200): Promise<string | null> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    let width = image.width;
    let height = image.height;
    
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else if (height > maxWidth) {
      width = Math.round((width * maxWidth) / height);
      height = maxWidth;
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);
    
    let currentMaxWidth = maxWidth;
    let currentQuality = 0.8;
    
    const compress = (mw: number, q: number): string => {
      let w = image.width;
      let h = image.height;
      if (w > mw) {
        h = Math.round((h * mw) / w);
        w = mw;
      } else if (h > mw) {
        w = Math.round((w * mw) / h);
        h = mw;
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      tempCanvas.getContext('2d')?.drawImage(image, 0, 0, w, h);
      return tempCanvas.toDataURL('image/jpeg', q);
    };
    
    let dataUrl = compress(currentMaxWidth, currentQuality);
    while (dataUrl.length > 950000 && currentMaxWidth > 400) {
      currentMaxWidth -= 200;
      currentQuality -= 0.1;
      dataUrl = compress(currentMaxWidth, Math.max(0.3, currentQuality));
    }
    
    if (dataUrl.length > 1048000) {
      alert("Image is still too large after compression. Please use a smaller image.");
      return null;
    }
    return dataUrl;
  } catch (err) {
    console.error("Error compressing original:", err);
    return null;
  }
}
export default function ImageCropperModal({ imageSrc, onCropDone, onCropCancel, aspect: initialAspect, copyright, copyrightUrl }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(initialAspect || 1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number, height: number, x: number, y: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropRect, setCropRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
  
  const [currentCopyright, setCurrentCopyright] = useState(copyright || '');
  const [currentCopyrightUrl, setCurrentCopyrightUrl] = useState(copyrightUrl || '');

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  useEffect(() => {
    const el = document.querySelector('.reactEasyCrop_CropArea');
    if (!el) return;
    
    const updateRect = () => {
      const rect = el.getBoundingClientRect();
      const container = el.closest('.reactEasyCrop_Container');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        setCropRect({
          top: rect.top - containerRect.top,
          left: rect.left - containerRect.left,
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateRect();
    
    const observer = new ResizeObserver(updateRect);
    observer.observe(el);
    window.addEventListener('resize', updateRect);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateRect);
    };
  }, [aspect]);

  const handleDone = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedImage) {
        onCropDone(croppedImage, currentCopyright, currentCopyrightUrl);
      } else {
        onCropCancel();
      }
    } catch (e) {
      console.error(e);
      onCropCancel();
    } finally {
      setIsProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onCropDone, onCropCancel, currentCopyright, currentCopyrightUrl]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCropCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleDone();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCropCancel, handleDone]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-bg)]">
      {croppedAreaPixels && (
        <div className="absolute top-4 left-4 z-[120] flex items-center space-x-2 bg-black/80 backdrop-blur-md px-3 py-2 rounded-sm border border-white/10 text-white font-mono text-[10px] tracking-wider uppercase shadow-xl">
          <ImageIcon className="w-3.5 h-3.5 text-accent" />
          <span>Output Resolution: {Math.round(croppedAreaPixels.width)} × {Math.round(croppedAreaPixels.height)} px</span>
        </div>
      )}
      
      <div className="flex-1 relative w-full h-full bg-[var(--color-bg)]">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          showGrid={true}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          classes={{
            containerClassName: 'bg-[var(--color-bg)]',
          }}
          style={{
            cropAreaStyle: {
              boxShadow: 'none',
              border: '1.5px solid rgba(255, 255, 255, 0.6)'
            }
          }}
        />
        
        {/* Blurry darkened outer area using 4 rects to avoid artifacts */}
        {cropRect && (
          <div className="absolute inset-0 pointer-events-none z-[5]">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: cropRect.top, backdropFilter: 'blur(12px) brightness(0.6)', WebkitBackdropFilter: 'blur(12px) brightness(0.6)' }} />
            <div style={{ position: 'absolute', top: cropRect.top + cropRect.height, left: 0, right: 0, bottom: 0, backdropFilter: 'blur(12px) brightness(0.6)', WebkitBackdropFilter: 'blur(12px) brightness(0.6)' }} />
            <div style={{ position: 'absolute', top: cropRect.top, left: 0, width: cropRect.left, height: cropRect.height, backdropFilter: 'blur(12px) brightness(0.6)', WebkitBackdropFilter: 'blur(12px) brightness(0.6)' }} />
            <div style={{ position: 'absolute', top: cropRect.top, left: cropRect.left + cropRect.width, right: 0, height: cropRect.height, backdropFilter: 'blur(12px) brightness(0.6)', WebkitBackdropFilter: 'blur(12px) brightness(0.6)' }} />
          </div>
        )}

        {/* Copyright Preview Overlay */}
        {cropRect && currentCopyright && (
          <div 
            className="absolute z-[20] pointer-events-none flex justify-end items-end p-6 overflow-hidden"
            style={{
              top: cropRect.top,
              left: cropRect.left,
              width: cropRect.width,
              height: cropRect.height,
            }}
          >
            <div className="text-white/90 text-[10px] sm:text-[11px] font-sans tracking-[0.2em] uppercase font-medium drop-shadow-md">
              {currentCopyright}
            </div>
          </div>
        )}
      </div>
      <div className="bg-[var(--color-bg)] p-4 pb-8 flex flex-col space-y-4 border-t border-neutral-900 z-10 relative">
        {!initialAspect && (
          <div className="flex justify-center space-x-2">
            {[
              { label: 'FREE', value: undefined },
              { label: '1:1', value: 1 },
              { label: '3:4', value: 3/4 },
              { label: '4:3', value: 4/3 },
              { label: '16:9', value: 16/9 },
              { label: '9:16', value: 9/16 }
            ].map(a => (
              <button
                key={a.label}
                onClick={() => setAspect(a.value)}
                className={`px-3 py-1.5 text-[10px] uppercase font-sans border rounded-sm transition-colors ${aspect === a.value ? 'bg-accent text-black border-accent font-bold' : 'text-neutral-400 border-neutral-700 hover:text-[var(--color-text)]'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex flex-col space-y-3 px-4 relative">
          <button
            type="button"
            onClick={() => {
              setCrop({ x: 0, y: 0 });
              setZoom(1);
              setRotation(0);
            }}
            className="absolute -top-6 right-4 px-2 py-0.5 border border-neutral-800 text-[9px] uppercase font-mono tracking-wider text-neutral-400 hover:text-white hover:border-neutral-600 rounded bg-neutral-900/60 transition-colors cursor-pointer"
          >
            Reset Editor
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-[var(--color-text)] text-xs w-12 font-sans uppercase tracking-wider text-neutral-400 text-[10px]">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value));
              }}
              className="w-full accent-accent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-[var(--color-text)] text-xs w-12 font-sans uppercase tracking-wider text-neutral-400 text-[10px]">Rotate</span>
            <input
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              aria-labelledby="Rotation"
              onChange={(e) => {
                setRotation(Number(e.target.value));
              }}
              className="w-full accent-accent"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-3 px-4 mt-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[var(--color-text)] text-xs font-sans uppercase tracking-wider text-neutral-400 text-[10px]">Copyright / Photo Credit Name (Optional)</span>
            <input
              type="text"
              placeholder="e.g. John Doe Photography"
              value={currentCopyright}
              onChange={(e) => setCurrentCopyright(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-[var(--color-text)] rounded-sm px-3 py-2 text-xs font-sans focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[var(--color-text)] text-xs font-sans uppercase tracking-wider text-neutral-400 text-[10px]">Copyright Link / URL (Optional)</span>
            <input
              type="text"
              placeholder="e.g. https://instagram.com/johndoe"
              value={currentCopyrightUrl}
              onChange={(e) => setCurrentCopyrightUrl(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-[var(--color-text)] rounded-sm px-3 py-2 text-xs font-sans focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-between space-x-4 mt-4">
          <button
            type="button"
            onClick={onCropCancel}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 border border-neutral-700 rounded-sm text-neutral-300 font-sans uppercase tracking-wider text-xs flex justify-center items-center hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4 mr-2" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-accent text-black font-semibold rounded-sm font-sans uppercase tracking-wider text-xs flex justify-center items-center hover:bg-[#b08d22] transition-colors"
          >
            {isProcessing ? 'Processing...' : (
              <><Check className="w-4 h-4 mr-2" /> Apply Crop</>
            )}
          </button>
          <button type="button" disabled={isProcessing} className="flex-1 py-3 px-4 bg-neutral-900 text-[var(--color-text)] border border-neutral-700 font-semibold rounded-sm font-sans uppercase tracking-wider text-xs flex justify-center items-center hover:bg-neutral-800 transition-colors" onClick={async () => {
            setIsProcessing(true);
            const compressed = await compressOriginalImage(imageSrc);
            if (compressed) {
              onCropDone(compressed, currentCopyright, currentCopyrightUrl);
            } else {
              onCropCancel();
            }
            setIsProcessing(false);
          }}>
            {isProcessing ? 'Processing...' : 'Upload Original'}
          </button>
        </div>
      </div>
    </div>
  );
}
