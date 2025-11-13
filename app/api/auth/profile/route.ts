import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const DUKAPLUS_API = process.env.NEXT_PUBLIC_DUKAPLUS_API || "https://demo.duka.plus"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Fetch user profile from DukaPlus API
    const response = await fetch(`${DUKAPLUS_API}/api/method/dukaplus.services.rest.get_user_profile`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to fetch profile" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name, email, mobile } = await request.json()

    // Update profile on DukaPlus API
    const response = await fetch(`${DUKAPLUS_API}/api/method/dukaplus.services.rest.update_user_profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, mobile }),
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to update profile" }, { status: response.status })
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully" })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
