import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      console.log("[DukaPlus] No tenant_credentials cookie found")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)
    console.log("[DukaPlus] Found credentials, username:", credentials.username)

    // The credentials were already validated during login
    return NextResponse.json({
      user: {
        id: credentials.username || "user",
        name: credentials.fullName || "User",
        email: credentials.email || "user@example.com",
        mobile: credentials.mobile || "07XXXXXXXXX",
        warehouse: credentials.warehouse || "Main Store",
        role: credentials.role || "sales_person",
      },
    })
  } catch (error) {
    console.error("[DukaPlus] Auth me error:", error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
