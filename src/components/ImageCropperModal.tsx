import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropDone: (croppedImageBase64: string) => void;
  onCropCancel: () => void;
  aspect?: number;
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
  maxWidth = 1200
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  if (canvas.width > maxWidth || canvas.height > maxWidth) {
    const resizeCanvas = document.createElement('canvas');
    const resizeCtx = resizeCanvas.getContext('2d');
    let width = canvas.width;
    let height = canvas.height;
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else if (height > maxWidth) {
      width = Math.round((width * maxWidth) / height);
      height = maxWidth;
    }
    resizeCanvas.width = width;
    resizeCanvas.height = height;
    resizeCtx?.drawImage(canvas, 0, 0, width, height);
    return resizeCanvas.toDataURL('image/jpeg', 0.8);
  }

  return canvas.toDataURL('image/jpeg', 0.8);
}

export default function ImageCropperModal({ imageSrc, onCropDone, onCropCancel, aspect = 16 / 9 }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex-1 relative w-full h-full">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          classes={{
            containerClassName: 'bg-black',
          }}
        />
      </div>
      <div className="bg-neutral-900 p-4 pb-8 flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-white text-xs">Zoom</span>
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
        <div className="flex justify-between space-x-4">
          <button
            type="button"
            onClick={onCropCancel}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 border border-neutral-700 rounded-sm text-neutral-300 font-sans uppercase tracking-wider text-xs flex justify-center items-center"
          >
            <X className="w-4 h-4 mr-2" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-[#C9A227] text-black font-semibold rounded-sm font-sans uppercase tracking-wider text-xs flex justify-center items-center"
          >
            {isProcessing ? 'Processing...' : (
              <><Check className="w-4 h-4 mr-2" /> Apply Crop</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
