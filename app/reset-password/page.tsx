"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    mobileNumber: "",
    otp: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const storedMobile = sessionStorage.getItem("reset_mobile")
    if (storedMobile) {
      setFormData((prev) => ({ ...prev, mobileNumber: storedMobile }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usr: formData.mobileNumber,
          otp: formData.otp,
          new_password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok && data.message?.status === 200) {
        alert("Password reset successful! Please login with your new password.")
        sessionStorage.removeItem("reset_mobile")
        router.push("/login")
      } else {
        setError(data.message?.message || "Password reset failed. Invalid OTP or mobile number.")
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
            <h2 className="text-xl font-semibold mb-2">Reset Password</h2>
            <p className="text-muted-foreground text-sm">Enter the OTP and create a new password</p>
          </div>

          {/* Reset Password Form */}
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
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                disabled={isLoading}
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="form-label">OTP Code</label>
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                disabled={isLoading}
                className="input-base"
                maxLength={6}
                required
              />
            </div>

            <div>
              <label className="form-label">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  className="input-base pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={isLoading}
                  className="input-base pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="btn-create w-full h-11 justify-center">
              {isLoading ? "Resetting Password..." : "Reset Password"}
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
