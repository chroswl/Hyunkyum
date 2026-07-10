import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropDone: (croppedImageBase64: string) => void;
  onCropCancel: () => void;
  aspect?: number;
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
    return resizeCanvas.toDataURL('image/jpeg', 0.8);
  }

  return croppedCanvas.toDataURL('image/jpeg', 0.8);
}

export default function ImageCropperModal({ imageSrc, onCropDone, onCropCancel, aspect: initialAspect }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(initialAspect || 1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedImage) {
        onCropDone(croppedImage);
      } else {
        onCropCancel();
      }
    } catch (e) {
      console.error(e);
      onCropCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-bg)]">
      <div className="flex-1 relative w-full h-full">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          classes={{
            containerClassName: 'bg-[var(--color-bg)]',
          }}
        />
      </div>
      <div className="bg-[var(--color-bg)] p-4 pb-8 flex flex-col space-y-4">
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
                className={`px-3 py-1.5 text-[10px] uppercase font-sans border rounded-sm transition-colors ${aspect === a.value ? 'bg-[#C9A227] text-black border-[#C9A227] font-bold' : 'text-neutral-400 border-neutral-700 hover:text-[var(--color-text)]'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex flex-col space-y-3 px-4">
          <div className="flex items-center space-x-4">
            <span className="text-[var(--color-text)] text-xs w-12">Zoom</span>
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
              className="w-full accent-[#C9A227]"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-[var(--color-text)] text-xs w-12">Rotate</span>
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
              className="w-full accent-[#C9A227]"
            />
          </div>
        </div>

        <div className="flex justify-between space-x-4 mt-2">
          <button
            type="button"
            onClick={onCropCancel}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 border border-neutral-700 rounded-sm text-neutral-300 font-sans uppercase tracking-wider text-xs flex justify-center items-center hover:bg-[var(--color-bg)] transition-colors"
          >
            <X className="w-4 h-4 mr-2" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-[#C9A227] text-black font-semibold rounded-sm font-sans uppercase tracking-wider text-xs flex justify-center items-center hover:bg-[#b08d22] transition-colors"
          >
            {isProcessing ? 'Processing...' : (
              <><Check className="w-4 h-4 mr-2" /> Apply Crop</>
            )}
          </button>
          <button type="button" className="flex-1 py-3 px-4 bg-[var(--color-bg)] text-[var(--color-text)] font-semibold rounded-sm font-sans uppercase tracking-wider text-xs flex justify-center items-center" onClick={() => onCropDone(imageSrc)}>Upload Original</button>
        </div>
      </div>
    </div>
  );
}
