import { useState } from 'react';

export function NumberConverter() {
  const [decimal, setDecimal] = useState('42');
  const [binary, setBinary] = useState('101010');
  const [octal, setOctal] = useState('52');
  const [hexadecimal, setHexadecimal] = useState('2A');

  const isValidNumber = (value: string, base: number): boolean => {
    if (!value) return false;
    try {
      parseInt(value, base);
      return true;
    } catch {
      return false;
    }
  };

  const updateFromDecimal = (value: string) => {
    setDecimal(value);
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setBinary(num.toString(2));
      setOctal(num.toString(8));
      setHexadecimal(num.toString(16).toUpperCase());
    }
  };

  const updateFromBinary = (value: string) => {
    setBinary(value);
    if (isValidNumber(value, 2)) {
      const num = parseInt(value, 2);
      setDecimal(num.toString(10));
      setOctal(num.toString(8));
      setHexadecimal(num.toString(16).toUpperCase());
    }
  };

  const updateFromOctal = (value: string) => {
    setOctal(value);
    if (isValidNumber(value, 8)) {
      const num = parseInt(value, 8);
      setDecimal(num.toString(10));
      setBinary(num.toString(2));
      setHexadecimal(num.toString(16).toUpperCase());
    }
  };

  const updateFromHexadecimal = (value: string) => {
    setHexadecimal(value);
    if (isValidNumber(value, 16)) {
      const num = parseInt(value, 16);
      setDecimal(num.toString(10));
      setBinary(num.toString(2));
      setOctal(num.toString(8));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Decimal */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
        <label className="block text-sm opacity-90 mb-2">Décimal (Base 10)</label>
        <input
          type="text"
          value={decimal}
          onChange={(e) => updateFromDecimal(e.target.value)}
          className="w-full p-3 bg-white text-gray-900 rounded-lg font-mono text-lg"
          placeholder="0-9"
        />
      </div>

      {/* Binary */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
        <label className="block text-sm opacity-90 mb-2">Binaire (Base 2)</label>
        <input
          type="text"
          value={binary}
          onChange={(e) => updateFromBinary(e.target.value)}
          className="w-full p-3 bg-white text-gray-900 rounded-lg font-mono text-lg"
          placeholder="0-1"
        />
      </div>

      {/* Octal */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
        <label className="block text-sm opacity-90 mb-2">Octal (Base 8)</label>
        <input
          type="text"
          value={octal}
          onChange={(e) => updateFromOctal(e.target.value)}
          className="w-full p-3 bg-white text-gray-900 rounded-lg font-mono text-lg"
          placeholder="0-7"
        />
      </div>

      {/* Hexadecimal */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg">
        <label className="block text-sm opacity-90 mb-2">Hexadécimal (Base 16)</label>
        <input
          type="text"
          value={hexadecimal}
          onChange={(e) => updateFromHexadecimal(e.target.value.toUpperCase())}
          className="w-full p-3 bg-white text-gray-900 rounded-lg font-mono text-lg"
          placeholder="0-9, A-F"
        />
      </div>

      {/* Info */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
        <p className="mb-2">ℹ️ Informations :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Binaire : utilise uniquement 0 et 1</li>
          <li>Octal : utilise les chiffres de 0 à 7</li>
          <li>Décimal : utilise les chiffres de 0 à 9</li>
          <li>Hexadécimal : utilise 0-9 et A-F</li>
        </ul>
      </div>
    </div>
  );
}
