"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  mobile: string
  warehouse: string
  role: string
}

export function UserProfile({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    mobile: user.mobile,
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully" })
        setIsEditing(false)
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: data.message || "Failed to update profile" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while updating profile" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-base p-4 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="dialog-title mb-2">{user.name}</h2>
            <p className="dialog-description text-sm">{user.email}</p>
          </div>
          <div className="badge-warning">{user.role.replace("_", " ")}</div>
        </div>

        {message && (
          <div className={message.type === "success" ? "alert-success mb-6" : "alert-error mb-6"}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === "success" ? "text-success text-sm" : "text-danger text-sm"}>
              {message.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Info */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Account Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name</label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input-base disabled:opacity-50"
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input-base disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Mobile Number</label>
              <Input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                disabled={!isEditing}
                className="input-base disabled:opacity-50"
              />
            </div>
          </div>

          {/* Organization Info */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Organization</h3>

            <div>
              <label className="form-label">Warehouse</label>
              <Input type="text" value={user.warehouse} disabled className="input-base opacity-50" />
            </div>

            <div>
              <label className="form-label">Role</label>
              <Input
                type="text"
                value={user.role.replace("_", " ").toUpperCase()}
                disabled
                className="input-base opacity-50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {isEditing ? (
              <>
                <Button type="submit" disabled={isLoading} className="btn-create">
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: user.name,
                      email: user.email,
                      mobile: user.mobile,
                    })
                  }}
                  className="btn-cancel"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="btn-secondary">
                Edit Profile
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
