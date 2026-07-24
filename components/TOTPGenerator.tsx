import React, { useState, useEffect, useRef, useMemo } from "react";
import { Key, RefreshCw, Check, Copy, ShieldCheck, ShieldAlert, Play, Clock, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Kbd } from "./ui/Kbd";
import { getSecureRandomInt } from "./ui/crypto";

// Compliant RFC 4226/6238 pure JS/TS SHA-1 implementation
function sha1(bytes: Uint8Array): Uint8Array {
  const l = bytes.length;
  const bitLen = l * 8;
  const paddedLen = ((l + 8 + 64) >>> 6) << 6;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[l] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 4, bitLen & 0xffffffff);
  if (bitLen > 0xffffffff) {
    view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000));
  }

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Uint32Array(80);

  for (let i = 0; i < paddedLen; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4);
    }
    for (let j = 16; j < 80; j++) {
      const val = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
      w[j] = (val << 1) | (val >>> 31);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let j = 0; j < 80; j++) {
      let f = 0;
      let k = 0;
      if (j < 20) {
        f = (b & c) | ((~b) & d);
        k = 0x5a827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) | 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0 >>> 0);
  outView.setUint32(4, h1 >>> 0);
  outView.setUint32(8, h2 >>> 0);
  outView.setUint32(12, h3 >>> 0);
  outView.setUint32(16, h4 >>> 0);
  return out;
}

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let hashedKey = key;
  if (key.length > blockSize) {
    hashedKey = sha1(key);
  }

  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(hashedKey);

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = paddedKey[i] ^ 0x5c;
    iKeyPad[i] = paddedKey[i] ^ 0x36;
  }

  const innerMsg = new Uint8Array(blockSize + message.length);
  innerMsg.set(iKeyPad);
  innerMsg.set(message, blockSize);
  const innerHash = sha1(innerMsg);

  const outerMsg = new Uint8Array(blockSize + innerHash.length);
  outerMsg.set(oKeyPad);
  outerMsg.set(innerHash, blockSize);
  return sha1(outerMsg);
}

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(str: string): Uint8Array {
  const cleanStr = str.toUpperCase().replace(/[\s-]/g, "").replace(/=/g, "");
  if (!cleanStr) return new Uint8Array(0);

  const bits: number[] = [];
  for (let i = 0; i < cleanStr.length; i++) {
    const val = BASE32_CHARS.indexOf(cleanStr[i]);
    if (val === -1) {
      throw new Error("Invalid Base32 character");
    }
    for (let shift = 4; shift >= 0; shift--) {
      bits.push((val >>> shift) & 1);
    }
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byteVal = 0;
    for (let bit = 0; bit < 8; bit++) {
      byteVal = (byteVal << 1) | bits[i * 8 + bit];
    }
    bytes[i] = byteVal;
  }
  return bytes;
}

function base32Encode(bytes: Uint8Array): string {
  let bits = "";
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, "0");
  }

  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, "0");
    const val = parseInt(chunk, 2);
    result += BASE32_CHARS[val];
  }

  const padLength = (8 - (result.length % 8)) % 8;
  result += "=".repeat(padLength);
  return result;
}

function generateTOTP(keyBytes: Uint8Array, timeIndex: number, digits: number): string {
  if (keyBytes.length === 0) return "";
  const msg = new Uint8Array(8);
  const view = new DataView(msg.buffer);

  // Represent time index as 64-bit integer
  const high = Math.floor(timeIndex / 0x100000000);
  const low = timeIndex & 0xffffffff;
  view.setUint32(0, high);
  view.setUint32(4, low);

  const hash = hmacSha1(keyBytes, msg);
  const offset = hash[19] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

export function TOTPGenerator() {
  const { t } = useTranslation();
  const [secret, setSecret] = useState("");
  const [accountName, setAccountName] = useState("User@Toolbox");
  const [issuer, setIssuer] = useState("Toolbox");
  const [digits, setDigits] = useState<6 | 8>(6);
  const [period, setPeriod] = useState<number>(30);

  // Validation States
  const [testToken, setTestToken] = useState("");
  const [validationResult, setValidationResult] = useState<"idle" | "success" | "fail">("idle");

  // Dynamic calculated tokens
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Generate safe cryptographically secure Base32 secret on mount
  useEffect(() => {
    handleGenerateSecret();
  }, []);

  const handleGenerateSecret = () => {
    try {
      const bytes = new Uint8Array(20);
      if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(bytes);
      } else {
        // Safe fallback
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = getSecureRandomInt(256);
        }
      }
      setSecret(base32Encode(bytes));
      setValidationResult("idle");
      setTestToken("");
    } catch (e) {
      console.error("Failed to generate secure secret", e);
    }
  };

  // Timer update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute values
  const step = useMemo(() => {
    return Math.floor(currentTime / 1000 / period);
  }, [currentTime, period]);

  const secondsRemaining = useMemo(() => {
    const elapsedSeconds = Math.floor(currentTime / 1000) % period;
    return period - elapsedSeconds;
  }, [currentTime, period]);

  const progressPercentage = useMemo(() => {
    return (secondsRemaining / period) * 100;
  }, [secondsRemaining, period]);

  // Decode secret & compute tokens safely
  const keyBytes = useMemo(() => {
    try {
      return base32Decode(secret);
    } catch (e) {
      return null;
    }
  }, [secret]);

  const currentToken = useMemo(() => {
    if (!keyBytes) return "";
    return generateTOTP(keyBytes, step, digits);
  }, [keyBytes, step, digits]);

  const previousToken = useMemo(() => {
    if (!keyBytes) return "";
    return generateTOTP(keyBytes, step - 1, digits);
  }, [keyBytes, step, digits]);

  const nextToken = useMemo(() => {
    if (!keyBytes) return "";
    return generateTOTP(keyBytes, step + 1, digits);
  }, [keyBytes, step, digits]);

  // QR pairing link
  const otpauthUri = useMemo(() => {
    const cleanIssuer = encodeURIComponent(issuer.trim());
    const cleanAccount = encodeURIComponent(accountName.trim());
    const cleanSecret = secret.trim().replace(/=/g, "");
    return `otpauth://totp/${cleanIssuer}:${cleanAccount}?secret=${cleanSecret}&issuer=${cleanIssuer}&digits=${digits}&period=${period}`;
  }, [issuer, accountName, secret, digits, period]);

  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(otpauthUri)}`;
  }, [otpauthUri]);

  // Copy helpers
  const handleCopyToken = () => {
    if (!currentToken) return;
    navigator.clipboard.writeText(currentToken);
    setCopiedToken(true);
    toast.success(t("totp.token_copied") || "Token copied to clipboard!");
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success(t("totp.secret_copied") || "Secret key copied to clipboard!");
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // Keyboard shortcut patterns (useRef backing safeguard)
  const handlersRef = useRef({
    onClear: () => {
      setSecret("");
      setTestToken("");
      setValidationResult("idle");
    },
    onCopy: handleCopyToken
  });

  useEffect(() => {
    handlersRef.current = {
      onClear: () => {
        setSecret("");
        setTestToken("");
        setValidationResult("idle");
      },
      onCopy: handleCopyToken
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcuts when user is actively writing in input elements
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Validate Token logic with clock drift support (current, previous, next steps)
  const handleValidateToken = () => {
    if (!keyBytes) {
      setValidationResult("fail");
      return;
    }
    const cleanToken = testToken.trim().replace(/\s/g, "");
    if (!cleanToken) {
      setValidationResult("idle");
      return;
    }

    const t1 = generateTOTP(keyBytes, step, digits);
    const t2 = generateTOTP(keyBytes, step - 1, digits);
    const t3 = generateTOTP(keyBytes, step + 1, digits);

    if (cleanToken === t1 || cleanToken === t2 || cleanToken === t3) {
      setValidationResult("success");
      toast.success(t("totp.validation_success") || "OTP code is valid!");
    } else {
      setValidationResult("fail");
      toast.error(t("totp.validation_fail") || "OTP code is invalid!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Input parameters */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" />
              {t("totp.parameters") || "TOTP Authenticator Settings"}
            </h3>

            {/* Secret Key Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="secret-input" className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t("totp.secret_label") || "Secret Key (Base32)"}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerateSecret}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    title={t("totp.generate_new_secret") || "Generate dynamic high-entropy Base32 secret"}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t("totp.random_secret") || "Generate Random"}
                  </button>
                  <button
                    onClick={handleCopySecret}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedSecret ? t("common.copied") : t("common.copy")}
                  </button>
                </div>
              </div>
              <input
                id="secret-input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value.replace(/[^A-Za-z2-7=\s-]/g, ""));
                  setValidationResult("idle");
                }}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-base outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                placeholder="MZXW6YTBOI======"
              />
              {!keyBytes && secret && (
                <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {t("totp.invalid_base32") || "Invalid Base32 format. Use letters A-Z and digits 2-7."}
                </p>
              )}
            </div>

            {/* Account & Issuer Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="account-input" className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t("totp.account_name") || "Account Name"}
                </label>
                <input
                  id="account-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                  placeholder="e.g. user@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="issuer-input" className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t("totp.issuer") || "Issuer / Service"}
                </label>
                <input
                  id="issuer-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                  placeholder="e.g. Google"
                />
              </div>
            </div>

            {/* Options (Digits and period) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 block">
                  {t("totp.digits_count") || "Token Digits"}
                </span>
                <div className="flex gap-2">
                  {[6, 8].map((num) => (
                    <button
                      key={num}
                      onClick={() => setDigits(num as 6 | 8)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        digits === num
                          ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-slate-950 dark:border-white shadow-md"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {num} {t("totp.digits") || "digits"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="period-input" className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {t("totp.period_label") || "Time Step (seconds)"}
                </label>
                <select
                  id="period-input"
                  value={period}
                  onChange={(e) => setPeriod(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                >
                  <option value={15}>15 s</option>
                  <option value={30}>30 s ({t("totp.default") || "Default"})</option>
                  <option value={60}>60 s</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Main Token Dashboard */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">

            {/* Visual timer countdown */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Circular progress bar SVG */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="6"
                  stroke="currentColor"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
                <circle
                  className={`${secondsRemaining < 6 ? "text-rose-500" : "text-indigo-600"} transition-all duration-1000`}
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - progressPercentage / 100)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${secondsRemaining < 6 ? "text-rose-500 animate-pulse" : "text-slate-900 dark:text-white"}`}>
                  {secondsRemaining}s
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {t("totp.remaining") || "Remaining"}
                </span>
              </div>
            </div>

            {/* Generated token display */}
            <div className="space-y-2 w-full">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                {t("totp.current_code") || "Current OTP Token"}
              </span>
              <div className="flex items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900/60 py-4 px-6 rounded-2xl border border-slate-100 dark:border-slate-800 relative group/token">
                <span className="text-3xl md:text-4xl font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 font-mono">
                  {keyBytes ? (
                    <>
                      {currentToken.substring(0, digits / 2)}
                      <span className="mx-1 text-slate-300 dark:text-slate-600">-</span>
                      {currentToken.substring(digits / 2)}
                    </>
                  ) : (
                    "------"
                  )}
                </span>
                {keyBytes && (
                  <button
                    onClick={handleCopyToken}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label={t("totp.copy_token") || "Copy current token"}
                    title={t("totp.copy_token_hint") || "Copy token (C)"}
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Keyboard shortcuts hints */}
            <div className="flex gap-4 text-xs font-bold text-slate-400 items-center justify-center">
              <span className="flex items-center gap-1">
                <Kbd modifier={null} className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">Esc</Kbd>
                {t("common.reset") || "Reset"}
              </span>
              <span className="flex items-center gap-1">
                <Kbd modifier={null} className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
                {t("common.copy") || "Copy"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced & Validator Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Validator */}
        <div className="bg-white dark:bg-slate-900/40 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            {t("totp.validator_title") || "OTP Token Validator"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("totp.validator_desc") || "Verify your generated tokens with full clock-drift support (allows adjacent time intervals)."}
          </p>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={testToken}
                onChange={(e) => {
                  setTestToken(e.target.value.replace(/\D/g, ""));
                  setValidationResult("idle");
                }}
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-base outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
                placeholder="123456"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValidateToken();
                }}
              />
              <button
                onClick={handleValidateToken}
                className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {t("totp.verify") || "Verify"}
              </button>
            </div>

            {/* Validation Outcome Banner */}
            {validationResult !== "idle" && (
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                  validationResult === "success"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-400"
                }`}
              >
                {validationResult === "success" ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold">
                      {t("totp.success_msg") || "Perfect match! The code is authenticated and valid."}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <span className="text-sm font-bold">
                      {t("totp.fail_msg") || "Verification failed! The code is expired or incorrect."}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* QR Pairing */}
        <div className="bg-white dark:bg-slate-900/40 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center">
          <div className="space-y-4 flex-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              {t("totp.qr_pairing") || "Mobile App Pairing"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t("totp.qr_pairing_desc") || "Scan this QR code with authentication apps like Google Authenticator, Authy, or Bitwarden to pair instantly."}
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] font-mono select-all break-all text-slate-500 dark:text-slate-400">
              {otpauthUri}
            </div>
          </div>

          <div className="w-36 h-36 bg-white p-2 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
            {keyBytes ? (
              <img
                src={qrCodeUrl}
                alt={t("totp.qr_alt") || "Scan to pair with authenticator app"}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 text-center">
                <Clock className="w-8 h-8 mb-1 animate-pulse" />
                <span className="text-[10px] font-black">{t("totp.awaiting") || "Awaiting Secret"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational info / Footer standard */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          {t("totp.about_title") || "How TOTP (RFC 6238) Works?"}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t("totp.about_text") || "Time-based One-Time Password (TOTP) is an extension of the HMAC-based One-Time Password (HOTP) algorithm, supporting a time-based moving factor. The secret is shared securely during pairing, then both the app and the server generate identical tokens in sync. By enforcing standard clock validation drift windows, our validator accommodates network delays or minor timing offsets."}
        </p>
      </div>
    </div>
  );
}
