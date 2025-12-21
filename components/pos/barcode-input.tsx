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
      console.error("[DukaPlus] Failed to access camera:", error);
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

    setTimeout(scanBarcodeFromCamera, 500);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Barcode className="w-3 h-3 sm:w-4 sm:h-4" />
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
            className={`pl-8 sm:pl-10 pr-16 sm:pr-20 h-8 sm:h-9 rounded-lg text-xs sm:text-sm ${
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
              className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={cameraActive ? stopCamera : startCamera}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isLoading || cameraLoading}
            title={cameraActive ? "Stop camera" : "Start camera scan"}
          >
            <Camera
              className={`w-3 h-3 sm:w-4 sm:h-4 ${
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
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="bg-black/80 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-between z-10">
            <h3 className="text-white font-semibold text-base sm:text-lg">
              Scan Barcode
            </h3>
            <button
              onClick={stopCamera}
              className="text-white hover:text-gray-300 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-white/10"
              title="Close camera"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Camera Feed Container */}
          <div className="flex-1 relative overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0">
              {/* Dark semi-transparent backdrop with blur */}
              <div
                className="absolute inset-0 bg-black/70"
                style={{
                  background:
                    "radial-gradient(ellipse 400px 350px at center, transparent 0%, rgba(0,0,0,0.85) 70%)",
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                  className="relative w-full max-w-sm"
                  style={{ aspectRatio: "5/4" }}
                >
                  {/* Bright green glowing border */}
                  <div
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl"
                    style={{
                      border: "4px solid rgb(34, 197, 94)",
                      boxShadow:
                        "0 0 30px rgba(34, 197, 94, 0.8), inset 0 0 20px rgba(34, 197, 94, 0.2)",
                    }}
                  />

                  {/* Corner brackets - responsive sizing */}
                  <div
                    className="absolute rounded-tl-2xl sm:rounded-tl-3xl"
                    style={{
                      top: "-2px",
                      left: "-2px",
                      width: "60px",
                      height: "60px",
                      borderTop: "6px solid rgb(74, 222, 128)",
                      borderLeft: "6px solid rgb(74, 222, 128)",
                      boxShadow: "0 0 15px rgba(74, 222, 128, 0.8)",
                    }}
                  />
                  <div
                    className="absolute rounded-tr-2xl sm:rounded-tr-3xl"
                    style={{
                      top: "-2px",
                      right: "-2px",
                      width: "60px",
                      height: "60px",
                      borderTop: "6px solid rgb(74, 222, 128)",
                      borderRight: "6px solid rgb(74, 222, 128)",
                      boxShadow: "0 0 15px rgba(74, 222, 128, 0.8)",
                    }}
                  />
                  <div
                    className="absolute rounded-bl-2xl sm:rounded-bl-3xl"
                    style={{
                      bottom: "-2px",
                      left: "-2px",
                      width: "60px",
                      height: "60px",
                      borderBottom: "6px solid rgb(74, 222, 128)",
                      borderLeft: "6px solid rgb(74, 222, 128)",
                      boxShadow: "0 0 15px rgba(74, 222, 128, 0.8)",
                    }}
                  />
                  <div
                    className="absolute rounded-br-2xl sm:rounded-br-3xl"
                    style={{
                      bottom: "-2px",
                      right: "-2px",
                      width: "60px",
                      height: "60px",
                      borderBottom: "6px solid rgb(74, 222, 128)",
                      borderRight: "6px solid rgb(74, 222, 128)",
                      boxShadow: "0 0 15px rgba(74, 222, 128, 0.8)",
                    }}
                  />

                  {/* Animated laser scanning line */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
                    <div
                      className="absolute left-0 right-0 animate-scan-line"
                      style={{
                        height: "3px",
                        background:
                          "linear-gradient(90deg, transparent, rgb(34, 197, 94), transparent)",
                        boxShadow:
                          "0 0 15px rgba(34, 197, 94, 1), 0 0 30px rgba(34, 197, 94, 0.6)",
                      }}
                    />
                  </div>

                  {/* Center guide lines */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20">
                    <div
                      className="absolute top-1/2 left-0 right-0 -translate-y-1/2"
                      style={{
                        height: "2px",
                        background: "rgba(34, 197, 94, 0.6)",
                        boxShadow: "0 0 8px rgba(34, 197, 94, 0.8)",
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
                      style={{
                        width: "2px",
                        background: "rgba(34, 197, 94, 0.6)",
                        boxShadow: "0 0 8px rgba(34, 197, 94, 0.8)",
                      }}
                    />
                  </div>

                  {/* Pulsing glow effect */}
                  <div
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl animate-pulse"
                    style={{
                      boxShadow: "inset 0 0 40px rgba(34, 197, 94, 0.15)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-center z-20"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 70%, transparent 100%)",
              }}
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3 max-w-md mx-auto">
                <div className="p-2 sm:p-3 bg-green-500/20 rounded-full">
                  <Barcode className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-green-400" />
                </div>
                <p className="text-white text-lg sm:text-xl md:text-2xl font-bold drop-shadow-lg">
                  {cameraLoading
                    ? "Loading camera..."
                    : "Place Barcode in Green Frame"}
                </p>
                <p className="text-gray-200 text-sm sm:text-base md:text-lg drop-shadow-md px-4">
                  Position your barcode inside the bright green rectangle and
                  hold steady
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
          Camera error: {cameraError}
        </div>
      )}
    </div>
  );
}
