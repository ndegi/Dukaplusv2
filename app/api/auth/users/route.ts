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

    // Fetch users list from DukaPlus API
    const response = await fetch(`${DUKAPLUS_API}/api/method/dukaplus.services.rest.get_users_list`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to fetch users" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ users: data.message || [] })
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
