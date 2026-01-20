import { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function ImageCompressor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(event.target?.result as string);
        compressImage(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCompressedSize(blob.size);
          const url = URL.createObjectURL(blob);
          setCompressedImage(url);
        }
      },
      'image/jpeg',
      quality / 100
    );
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (originalImage) {
      const img = new Image();
      img.onload = () => compressImage(img);
      img.src = originalImage;
    }
  };

  const downloadImage = () => {
    if (!compressedImage) return;
    const link = document.createElement('a');
    link.href = compressedImage;
    link.download = 'compressed-image.jpg';
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const compressionRate = originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <AdPlaceholder size="banner" className="mb-6" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {!originalImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl font-semibold text-gray-700 mb-2">
            Cliquez pour uploader une image
          </p>
          <p className="text-gray-500">JPG, PNG, WEBP, GIF</p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Qualité: {quality}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Image originale</h3>
              <img src={originalImage} alt="Original" className="w-full rounded mb-2" />
              <p className="text-sm text-gray-600">{formatFileSize(originalSize)}</p>
            </div>

            {compressedImage && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Image compressée</h3>
                <img src={compressedImage} alt="Compressed" className="w-full rounded mb-2" />
                <p className="text-sm text-gray-600">{formatFileSize(compressedSize)}</p>
              </div>
            )}
          </div>

          {compressedImage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-700 font-semibold">
                Compression: {compressionRate}% de réduction
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              Nouvelle image
            </button>
            {compressedImage && (
              <button
                onClick={downloadImage}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Télécharger
              </button>
            )}
          </div>
        </div>
      )}

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
