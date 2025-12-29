"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface IdleScreensaverProps {
  idleTimeout?: number
}

export function IdleScreensaver({ idleTimeout = 300000 }: IdleScreensaverProps) {
  const [isIdle, setIsIdle] = useState(false)
  const [floatingIcons, setFloatingIcons] = useState<Array<{ id: number; x: number; y: number; rotation: number }>>([])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timeoutId)
      setIsIdle(false)
      timeoutId = setTimeout(() => setIsIdle(true), idleTimeout)
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach((event) => document.addEventListener(event, resetTimer))

    resetTimer()

    return () => {
      clearTimeout(timeoutId)
      events.forEach((event) => document.removeEventListener(event, resetTimer))
    }
  }, [idleTimeout])

  useEffect(() => {
    if (isIdle) {
      const icons = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        rotation: Math.random() * 360,
      }))
      setFloatingIcons(icons)
    }
  }, [isIdle])

  if (!isIdle) return null

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-orange-900/20 to-green-900/20 flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        {floatingIcons.map((icon) => (
          <div
            key={icon.id}
            className="absolute animate-float"
            style={{
              left: `${icon.x}%`,
              top: `${icon.y}%`,
              animationDelay: `${icon.id * 0.5}s`,
              animationDuration: `${8 + icon.id}s`,
            }}
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icon-NndiODhsBBuGpUskyVyVyJsWcnJr1k.png"
              alt="DukaPlus"
              width={80}
              height={80}
              className="opacity-20"
              style={{ transform: `rotate(${icon.rotation}deg)` }}
            />
          </div>
        ))}
      </div>

      <div className="text-center z-10 space-y-6 animate-pulse-slow">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/splash-My3EmnXltB1CxEo4W9ZhA0ykpoK6SJ.png"
          alt="DukaPlus"
          width={400}
          height={120}
          className="mx-auto"
        />
        <p className="text-slate-400 text-xl">Touch screen to continue</p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-50px) rotate(180deg);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
