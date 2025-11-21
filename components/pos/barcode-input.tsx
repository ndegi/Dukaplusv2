"use client";

import type React from "react";
import { useState, useRef } from "react";
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && barcodeValue.trim()) {
      e.preventDefault();
      onScan(barcodeValue.trim());
      setBarcodeValue("");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setShowCamera(true);
        // Start scanning for barcodes
        scanBarcodeFromCamera();
      }
    } catch (error) {
      console.error("[DukaPlus] Failed to access camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    setShowCamera(false);
  };

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
            disabled={isLoading}
            title={cameraActive ? "Stop camera" : "Start camera scan"}
          >
            <Camera
              className={`w-4 h-4 ${cameraActive ? "text-green-500" : ""}`}
            />
          </button>
        </div>
      </div>

      {showCamera && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 border-2 border-dashed border-accent/50 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-sm font-semibold">
                Point camera at barcode
              </p>
              <button
                onClick={stopCamera}
                className="mt-2 px-3 py-1 bg-red-600 rounded text-white text-sm hover:bg-red-700"
              >
                Close Camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
