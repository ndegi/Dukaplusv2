import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const CENTRAL_API = "https://central.duka.plus/api/method/dukaplus.services.rest.login"

export async function POST(request: NextRequest) {
  try {
    const { mobile, password } = await request.json()

    const response = await fetch(CENTRAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usr: mobile, pwd: password }),
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const data = await response.json()
    const authData = data.message.message

    const tenantCredentials = {
      apiKey: authData.api_key,
      apiSecret: authData.api_secret,
      baseUrl: authData.base_url,
      sid: authData.sid,
      username: authData.username,
      email: authData.email,
      fullName: data.message.full_name,
      warehouses: authData.warehouses || [],
    }

    const isProduction = process.env.NODE_ENV === "production"

    const cookieStore = await cookies()
    cookieStore.set("tenant_credentials", JSON.stringify(tenantCredentials), {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    })

    cookieStore.set("session_id", authData.sid, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    })

    return NextResponse.json({
      success: true,
      credentials: tenantCredentials,
      user: {
        id: mobile,
        name: data.message.full_name || "User",
        email: authData.email,
        mobile,
        warehouse: authData.warehouse || "Main Store",
        role: authData.role || "sales_person",
      },
      warehouses: authData.warehouses || [],
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
