export async function loginUser(mobile: string, password: string) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, message: error.message || "Login failed" }
    }

    const data = await response.json()
    return { success: true, user: data.user, credentials: data.credentials }
  } catch (err) {
    console.error("Login error:", err)
    return { success: false, message: "Network error" }
  }
}

export async function validateToken(token: string) {
  try {
    const response = await fetch("/api/auth/validate", {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.ok
  } catch {
    return false
  }
}
