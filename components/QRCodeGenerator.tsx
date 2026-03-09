import { useState } from 'react';
import { Download } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);

  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
    : '';

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;
    
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link if fetch fails
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = 'qrcode.png';
      link.click();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <label htmlFor="qr-text" className="block text-sm font-semibold text-gray-700 mb-2">
          Texte ou URL à encoder
        </label>
        <textarea
          id="qr-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez du texte, une URL, un numéro de téléphone..."
          className="w-full p-4 border border-gray-300 rounded-lg resize-none h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="qr-size" className="block text-sm font-semibold text-gray-700 mb-2">
          Taille: {size}x{size} px
        </label>
        <input
          id="qr-size"
          type="range"
          min="100"
          max="500"
          step="50"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {qrCodeUrl && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="mx-auto mb-4 border-4 border-white shadow-lg"
          />
          <button
            onClick={downloadQRCode}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <Download className="w-5 h-5" />
            Télécharger le QR Code
          </button>
        </div>
      )}

      {!text && (
        <div className="bg-gray-100 p-12 rounded-lg text-center text-gray-500">
          Entrez du texte pour générer un QR Code
        </div>
      )}
    </div>
  );
}
