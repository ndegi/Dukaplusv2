"use client"
import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
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
            <p className="text-muted-foreground text-sm">Point of Sale System</p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-muted-foreground text-xs text-center">Secure login powered by DukaPlus</p>
          </div>
        </div>
      </div>
    </div>
  )
}
