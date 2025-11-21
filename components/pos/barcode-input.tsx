"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Barcode, X, Camera } from "lucide-react";

interface BarcodeInputProps {
  onScan: (barcode: string) => void;
  isLoading?: boolean;
}

export function BarcodeInput({ onScan, isLoading }: BarcodeInputProps) {
  const [barcodeValue, setBarcodeValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && barcodeValue.trim()) {
      e.preventDefault();
      onScan(barcodeValue.trim());
      setBarcodeValue("");
    }
  };

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
          setCameraLoading(false);
          scanBarcodeFromCamera();
        };
      }
    } catch (error) {
      console.error("[v0] Failed to access camera:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to access camera. Please check permissions.";
      setCameraError(errorMsg);
      setCameraLoading(false);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setShowCamera(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      if (cameraActive && videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  const scanBarcodeFromCamera = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    // In a real implementation, you would use a barcode scanning library here
    // For now, we'll just continue polling
    setTimeout(scanBarcodeFromCamera, 500);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Barcode className="w-4 h-4" />
          </div>
          <Input
            type="text"
            placeholder="Scan barcode or enter product code..."
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading || cameraActive}
            className={`pl-10 h-10 rounded-lg ${
              isFocused ? "ring-2 ring-primary" : ""
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {barcodeValue && (
            <button
              type="button"
              onClick={() => setBarcodeValue("")}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={cameraActive ? stopCamera : startCamera}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isLoading || cameraLoading}
            title={cameraActive ? "Stop camera" : "Start camera scan"}
          >
            <Camera
              className={`w-4 h-4 ${
                cameraActive
                  ? "text-green-500"
                  : cameraLoading
                  ? "text-yellow-500 animate-spin"
                  : ""
              }`}
            />
          </button>
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between">
            <h3 className="text-white font-semibold">Scan Barcode</h3>
            <button
              onClick={stopCamera}
              className="text-white hover:text-gray-300 transition-colors"
              title="Close camera"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Camera Feed */}
          <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-80 h-80">
                {/* Main scan box */}
                <div className="absolute inset-0 border-4 border-accent rounded-2xl shadow-2xl" />

                {/* Corner highlights */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl" />

                {/* Animated scanning line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-pulse" />
              </div>

              {/* Dimmed areas outside scan box */}
              <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
              <p className="text-white text-lg font-semibold">
                {cameraLoading
                  ? "Loading camera..."
                  : "Position barcode in frame"}
              </p>
              <p className="text-gray-300 text-sm mt-2">
                Keep the barcode steady and within the highlighted area
              </p>
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          Camera error: {cameraError}
        </div>
      )}
    </div>
  );
}
