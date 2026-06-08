"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, Loader2, ScanLine, X } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type RepairCodeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onScan: (value: string) => void;
  placeholder?: string;
  label?: string;
  showLabel?: boolean;
  className?: string;
  text?: Partial<{
    scanButtonLabel: string;
    modalTitle: string;
    modalSubtitle: string;
    closeScannerLabel: string;
    cameraUnsupported: string;
    previewUnavailable: string;
    couldNotStartCamera: string;
    couldNotScanImage: string;
    noQrDetected: string;
    imageReadError: string;
    imageLoadError: string;
    prepareImageError: string;
    openingCamera: string;
    hint: string;
  }>;
};

export function RepairCodeField({
  value,
  onChange,
  onScan,
  placeholder = "Enter repair code",
  label = "Repair code",
  showLabel = true,
  className,
  text,
}: RepairCodeFieldProps) {
  const { language } = useLocale();
  const copy = {
    scanButtonLabel: translations[language].scanRepairCode,
    modalTitle: translations[language].scanRepairCode,
    modalSubtitle: translations[language].scanRepairCodeHint,
    closeScannerLabel: translations[language].closingScanner,
    cameraUnsupported: translations[language].scannerCameraUnsupported,
    previewUnavailable: translations[language].scannerPreviewUnavailable,
    couldNotStartCamera: translations[language].scannerCouldNotStart,
    couldNotScanImage: translations[language].scannerCouldNotScanImage,
    noQrDetected: translations[language].scannerNoQrDetected,
    imageReadError: translations[language].scannerImageReadError,
    imageLoadError: translations[language].scannerImageLoadError,
    prepareImageError: translations[language].scannerPrepareImageError,
    openingCamera: translations[language].scannerOpening,
    hint: translations[language].scannerHint,
    ...text,
  };
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isScannerOpen) {
      return;
    }

    let cancelled = false;

    async function startScanner() {
      setIsStarting(true);
      setScannerError("");

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(copy.cameraUnsupported);
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        activeRef.current = true;

        const video = videoRef.current;
        if (!video) {
          throw new Error(copy.previewUnavailable);
        }

        video.srcObject = stream;
        await video.play();

        const scanFrame = () => {
          if (!activeRef.current || cancelled) {
            return;
          }

          const activeVideo = videoRef.current;
          const canvas = canvasRef.current;
          if (!activeVideo || !canvas) {
            rafRef.current = window.requestAnimationFrame(scanFrame);
            return;
          }

          if (activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const context = canvas.getContext("2d");
            if (context && activeVideo.videoWidth > 0 && activeVideo.videoHeight > 0) {
              canvas.width = activeVideo.videoWidth;
              canvas.height = activeVideo.videoHeight;
              context.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              const result = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });

              if (result?.data) {
                handleDetected(result.data);
                return;
              }
            }
          }

          rafRef.current = window.requestAnimationFrame(scanFrame);
        };

        rafRef.current = window.requestAnimationFrame(scanFrame);
      } catch (error) {
        setScannerError(error instanceof Error ? error.message : copy.couldNotStartCamera);
      } finally {
        setIsStarting(false);
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
    };
  }, [isScannerOpen]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  function stopScanner() {
    activeRef.current = false;
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }

function handleDetected(rawValue: string) {
    const normalized = normalizeScannedCode(rawValue);
    if (!normalized) {
      return;
    }

    onChange(normalized);
    onScan(normalized);
    setIsScannerOpen(false);
    stopScanner();
  }

  function canUseLiveCamera() {
    return typeof window !== "undefined" && window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);
  }

  async function decodeFile(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error(copy.imageReadError));
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(copy.imageLoadError));
      img.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(copy.prepareImageError);
    }

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (!result?.data) {
      throw new Error(copy.noQrDetected);
    }

    handleDetected(result.data);
  }

  function normalizeScannedCode(rawValue: string): string {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return "";
    }

    try {
      const url = new URL(trimmed);
      const codeParam = url.searchParams.get("code")?.trim();
      if (codeParam) {
        return codeParam.toUpperCase();
      }

      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        return segments[segments.length - 1].toUpperCase();
      }
    } catch {
      // Not a URL, fall through to raw code handling.
    }

    return trimmed.toUpperCase();
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel ? (
        <label htmlFor="repair-code" className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          id="repair-code"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 pr-16 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
        />

        <button
          type="button"
          onClick={() => {
            if (canUseLiveCamera()) {
              setIsScannerOpen(true);
              return;
            }

            fileInputRef.current?.click();
          }}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-sky-500/15 p-3 text-sky-100 transition hover:bg-sky-500/25"
          aria-label={copy.scanButtonLabel}
        >
          <ScanLine className="h-4 w-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) {
              return;
            }

            setScannerError("");
            try {
              await decodeFile(file);
            } catch (error) {
              setScannerError(error instanceof Error ? error.message : copy.couldNotScanImage);
            }
          }}
        />
      </div>

      {isScannerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_24px_120px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-100">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{copy.modalTitle}</p>
                    <p className="text-xs text-slate-400">{copy.modalSubtitle}</p>
                  </div>
                </div>

              <button
                type="button"
                onClick={() => {
                  setIsScannerOpen(false);
                  stopScanner();
                }}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label={copy.closeScannerLabel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                <video ref={videoRef} className="h-[320px] w-full object-cover" playsInline muted autoPlay />
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {scannerError ? (
                <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                  {scannerError}
                </div>
              ) : null}

              {isStarting ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {copy.openingCamera}
                </div>
              ) : null}

              <p className="mt-4 text-sm leading-6 text-slate-300">
                {copy.hint}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
