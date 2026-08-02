import { useState, useEffect, useRef, useCallback } from "react";
import { Key, Copy, Check, Trash2, Info, ArrowLeftRight, Download, Play, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";

const MAX_LENGTH = 100000;

export function JWKGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const primaryInputRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [keyType, setKeyType] = useState<"RSA" | "EC" | "oct">(initialData?.keyType || "RSA");
  const [keySize, setKeySize] = useState<"2048" | "4096">(initialData?.keySize || "2048");
  const [ecCurve, setEcCurve] = useState<"P-256" | "P-384" | "P-521">(initialData?.ecCurve || "P-256");
  const [octLength, setOctLength] = useState<"128" | "256" | "512">(initialData?.octLength || "256");
  const [pemInput, setPemInput] = useState<string>(initialData?.pemInput || "");
  const [jwkOutput, setJwkOutput] = useState<string>(initialData?.jwkOutput || "");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Sync state
  useEffect(() => {
    onStateChange?.({ keyType, keySize, ecCurve, octLength, pemInput, jwkOutput });
  }, [keyType, keySize, ecCurve, octLength, pemInput, jwkOutput, onStateChange]);

  // Generate JWK function
  const handleGenerate = async () => {
    try {
      setError("");
      setIsGenerating(true);
      setJwkOutput("");

      let keyPair: CryptoKeyPair | CryptoKey;
      let jwk: JsonWebKey;

      if (keyType === "RSA") {
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: parseInt(keySize, 10),
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
          },
          true,
          ["sign", "verify"]
        );
        jwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
      } else if (keyType === "EC") {
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: "ECDSA",
            namedCurve: ecCurve,
          },
          true,
          ["sign", "verify"]
        );
        jwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
      } else {
        // oct / Symmetric
        const len = parseInt(octLength, 10);
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: "HMAC",
            hash: "SHA-256",
            length: len,
          },
          true,
          ["sign", "verify"]
        );
        jwk = await window.crypto.subtle.exportKey("jwk", keyPair);
      }

      setJwkOutput(JSON.stringify(jwk, null, 2));
      toast.success(t("jwk.generate_success", "JWK generated successfully!"));
    } catch (err: any) {
      setError(err.message || "Failed to generate JWK");
      toast.error(t("jwk.generate_error", "Failed to generate JWK"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper helper to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Convert PEM to JWK
  const handleConvertPemToJwk = async () => {
    try {
      setError("");
      if (!pemInput.trim()) {
        setError(t("jwk.error_empty_pem", "Please enter a PEM formatted key"));
        return;
      }

      if (pemInput.length > MAX_LENGTH) {
        setError(t("error.max_length", { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      // Remove PEM headers and whitespace
      const cleanPem = pemInput
        .replace(/-----BEGIN[^-]+-----/g, "")
        .replace(/-----END[^-]+-----/g, "")
        .replace(/\s/g, "");

      const binaryDer = Uint8Array.from(window.atob(cleanPem), (c) => c.charCodeAt(0));

      let importedKey: CryptoKey;
      let jwk: JsonWebKey;

      if (pemInput.includes("PRIVATE KEY")) {
        // Try importing as PKCS#8 private key
        try {
          importedKey = await window.crypto.subtle.importKey(
            "pkcs8",
            binaryDer.buffer,
            {
              name: "RSASSA-PKCS1-v1_5",
              hash: "SHA-256",
            },
            true,
            ["sign"]
          );
          jwk = await window.crypto.subtle.exportKey("jwk", importedKey);
        } catch {
          // If RSA fails, try EC
          importedKey = await window.crypto.subtle.importKey(
            "pkcs8",
            binaryDer.buffer,
            {
              name: "ECDSA",
              namedCurve: "P-256",
            },
            true,
            ["sign"]
          );
          jwk = await window.crypto.subtle.exportKey("jwk", importedKey);
        }
      } else {
        // Try importing as SPKI public key
        try {
          importedKey = await window.crypto.subtle.importKey(
            "spki",
            binaryDer.buffer,
            {
              name: "RSASSA-PKCS1-v1_5",
              hash: "SHA-256",
            },
            true,
            ["verify"]
          );
          jwk = await window.crypto.subtle.exportKey("jwk", importedKey);
        } catch {
          // If RSA public fails, try EC public
          importedKey = await window.crypto.subtle.importKey(
            "spki",
            binaryDer.buffer,
            {
              name: "ECDSA",
              namedCurve: "P-256",
            },
            true,
            ["verify"]
          );
          jwk = await window.crypto.subtle.exportKey("jwk", importedKey);
        }
      }

      setJwkOutput(JSON.stringify(jwk, null, 2));
      toast.success(t("jwk.convert_success", "PEM key converted to JWK successfully!"));
    } catch (err: any) {
      setError(t("jwk.convert_error", "Failed to parse PEM key. Please ensure it is a valid RSA or EC key in PKCS#8 or SPKI DER format."));
    }
  };

  // Convert JWK to PEM
  const handleConvertJwkToPem = async () => {
    try {
      setError("");
      if (!jwkOutput.trim()) {
        setError(t("jwk.error_empty_jwk", "Please generate or paste a JWK first"));
        return;
      }

      const jwk = JSON.parse(jwkOutput);
      const isPrivate = jwk.d !== undefined;

      let key: CryptoKey;
      let format: "pkcs8" | "spki";

      if (jwk.kty === "RSA") {
        format = isPrivate ? "pkcs8" : "spki";
        key = await window.crypto.subtle.importKey(
          "jwk",
          jwk,
          {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
          },
          true,
          isPrivate ? ["sign"] : ["verify"]
        );
      } else if (jwk.kty === "EC") {
        format = isPrivate ? "pkcs8" : "spki";
        key = await window.crypto.subtle.importKey(
          "jwk",
          jwk,
          {
            name: "ECDSA",
            namedCurve: jwk.crv || "P-256",
          },
          true,
          isPrivate ? ["sign"] : ["verify"]
        );
      } else {
        throw new Error("Symmetric keys (oct) do not support PEM translation.");
      }

      const exported = await window.crypto.subtle.exportKey(format, key);
      const base64 = arrayBufferToBase64(exported);
      const header = isPrivate ? "PRIVATE KEY" : "PUBLIC KEY";

      // Format PEM with 64-character line wraps
      const lines = [];
      for (let i = 0; i < base64.length; i += 64) {
        lines.push(base64.slice(i, i + 64));
      }

      const pem = `-----BEGIN ${header}-----\n${lines.join("\n")}\n-----END ${header}-----`;
      setPemInput(pem);
      toast.success(t("jwk.pem_convert_success", "JWK converted to PEM successfully!"));
    } catch (err: any) {
      setError(err.message || "Failed to convert JWK to PEM");
    }
  };

  const handleClear = () => {
    setPemInput("");
    setJwkOutput("");
    setError("");
    primaryInputRef.current?.focus();
    toast.success(t("jwk.cleared", "Cleared all fields"));
  };

  const handleCopy = () => {
    if (!jwkOutput) return;
    navigator.clipboard.writeText(jwkOutput);
    setCopied(true);
    toast.success(t("common.copied", "Copied!"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!jwkOutput) return;
    const blob = new Blob([jwkOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jwk.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcut patterns
  const handlersRef = useRef({
    handleClear,
    handleCopy,
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear,
      handleCopy,
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.getAttribute("contenteditable") === "true"
      );

      if (isEditable) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <Info className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" aria-hidden="true" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("jwk.config_title", "JWK Generator Settings")}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Kbd modifier={null} className="text-slate-400">Esc</Kbd>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t("common.clear", "Clear")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Key Type Selector */}
          <div className="space-y-2">
            <label htmlFor="key-type-select" className="text-xs font-bold text-slate-500">
              {t("jwk.key_type", "Key Type (kty)")}
            </label>
            <select
              id="key-type-select"
              value={keyType}
              onChange={(e) => setKeyType(e.target.value as any)}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="RSA">RSA</option>
              <option value="EC">Elliptic Curve (EC)</option>
              <option value="oct">Octet / Symmetric (oct)</option>
            </select>
          </div>

          {/* RSA Modulus Length */}
          {keyType === "RSA" && (
            <div className="space-y-2">
              <label htmlFor="key-size-select" className="text-xs font-bold text-slate-500">
                {t("jwk.modulus_length", "Modulus Length")}
              </label>
              <select
                id="key-size-select"
                value={keySize}
                onChange={(e) => setKeySize(e.target.value as any)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="2048">2048 bit</option>
                <option value="4096">4096 bit</option>
              </select>
            </div>
          )}

          {/* EC Curve Parameter */}
          {keyType === "EC" && (
            <div className="space-y-2">
              <label htmlFor="ec-curve-select" className="text-xs font-bold text-slate-500">
                {t("jwk.curve", "Curve Parameter (crv)")}
              </label>
              <select
                id="ec-curve-select"
                value={ecCurve}
                onChange={(e) => setEcCurve(e.target.value as any)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="P-256">P-256</option>
                <option value="P-384">P-384</option>
                <option value="P-521">P-521</option>
              </select>
            </div>
          )}

          {/* Symmetric Key Size */}
          {keyType === "oct" && (
            <div className="space-y-2">
              <label htmlFor="oct-length-select" className="text-xs font-bold text-slate-500">
                {t("jwk.key_length", "Key Length (bits)")}
              </label>
              <select
                id="oct-length-select"
                value={octLength}
                onChange={(e) => setOctLength(e.target.value as any)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="128">128 bit</option>
                <option value="256">256 bit</option>
                <option value="512">512 bit</option>
              </select>
            </div>
          )}

          {/* Action Trigger */}
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>{isGenerating ? t("jwk.generating", "Generating...") : t("jwk.generate_btn", "Generate JWK")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* PEM Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="pem-input-field" className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t("jwk.pem_key", "PEM Key Format (PKCS#8 / SPKI)")}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConvertPemToJwk}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title="Convert PEM to JWK"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" /> {t("jwk.convert_to_jwk", "To JWK")}
              </button>
            </div>
          </div>
          <textarea
            id="pem-input-field"
            ref={primaryInputRef}
            value={pemInput}
            onChange={(e) => setPemInput(e.target.value)}
            placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8u..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* JWK Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <label htmlFor="jwk-output-field" className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t("jwk.jwk_key", "JWK JSON Format")}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConvertJwkToPem}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title="Convert JWK to PEM"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" /> {t("jwk.convert_to_pem", "To PEM")}
              </button>
              <button
                onClick={handleDownload}
                disabled={!jwkOutput}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title="Download JWK"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!jwkOutput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                    : "text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200"
                } disabled:opacity-50`}
                title="Copy JWK (C)"
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}</span>
                <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
              </button>
            </div>
          </div>
          <textarea
            id="jwk-output-field"
            value={jwkOutput}
            onChange={(e) => setJwkOutput(e.target.value)}
            placeholder='{\n  "kty": "RSA",\n  "n": "vXv...",\n  "e": "AQAB"\n}'
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      {/* Security and Explanatory Block */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t("jwk.info_title", "About JSON Web Keys (RFC 7517)")}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("jwk.info_desc_1", "A JSON Web Key (JWK) is a JavaScript Object Notation (JSON) data structure that represents a cryptographic key. This tool allows secure generator of custom keys or offline parsing of standard PEM-encoded private or public key definitions. The entire computation is executed locally in your browser sandbox using the window.crypto API.")}
          </p>
          <p className="text-xs text-rose-500 font-bold">
            {t("jwk.security_warning", "Warning: All keys are computed locally and are never sent to external servers. However, always exercise extreme caution when handling sensitive production-level private keys on any web interface.")}
          </p>
        </div>
      </div>
    </div>
  );
}
