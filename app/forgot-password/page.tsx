"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [mobileNumber, setMobileNumber] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/generate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      })

      const data = await response.json()

      if (response.ok && data.message?.status === 200) {
        sessionStorage.setItem("reset_mobile", mobileNumber)
        router.push("/reset-password")
      } else {
        setError(data.message?.message || "Failed to send OTP")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-base p-8 shadow-2xl">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image src="/images/icon.png" alt="DukaPlus" width={40} height={40} className="rounded-lg" />
              <h1 className="text-2xl font-bold text-foreground">DukaPlus</h1>
            </div>
            <h2 className="text-xl font-semibold mb-2">Forgot Password</h2>
            <p className="text-muted-foreground text-sm">Enter your mobile number to receive an OTP</p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="alert-error">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="form-label">Mobile Number</label>
              <Input
                type="tel"
                placeholder="+254XXXXXXXXX"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                disabled={isLoading}
                className="input-base"
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="btn-create w-full h-11 justify-center">
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>

            <div className="text-center space-y-2">
              <Link href="/login" className="text-sm text-primary hover:underline block">
                Back to login
              </Link>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-semibold">
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
