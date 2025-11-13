"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserProfile } from "@/components/auth/user-profile"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="page-title">User Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>

        <UserProfile user={user} />
      </div>
    </DashboardLayout>
  )
}
