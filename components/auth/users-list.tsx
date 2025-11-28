"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Search, UserPlus } from "lucide-react"
import { TableActionButtons } from "@/components/ui/table-action-buttons"

interface User {
  id: string
  name: string
  email: string
  mobile: string
  role: string
  warehouse: string
  status: "active" | "inactive"
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile.includes(searchTerm),
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/users")

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setError(null)
      } else {
        setError("Failed to fetch users")
      }
    } catch (err) {
      setError("An error occurred while fetching users")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="alert-error">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-base"
          />
        </div>
        {searchTerm && (
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </Button>
        )}
        <Button className="btn-create">
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="card-base overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Mobile</th>
                  <th className="table-header-cell">Role</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell font-medium">{user.name}</td>
                    <td className="table-cell-secondary">{user.email}</td>
                    <td className="table-cell-secondary">{user.mobile}</td>
                    <td className="table-cell">
                      <span className="badge-info">{user.role.replace("_", " ")}</span>
                    </td>
                    <td className="table-cell">
                      <span className={user.status === "active" ? "badge-success" : "badge-danger"}>{user.status}</span>
                    </td>
                    <td className="table-cell space-x-2">
                      <TableActionButtons
                        showEdit={true}
                        showDelete={true}
                        onEdit={() => {
                          /* TODO: Add edit functionality */
                        }}
                        onDelete={() => {
                          /* TODO: Add deactivate functionality */
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
