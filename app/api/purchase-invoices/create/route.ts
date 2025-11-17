import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json(
        { message: { message: "Not authenticated", status: 401 } },
        { status: 401 }
      )
    }

    const credentials = JSON.parse(credentialsCookie)
    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const apiUrl = `${credentials.baseUrl}/api/method/dukaplus.services.rest.create_purchase_invoice`

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[DukaPlus] Create purchase invoice error:", error)
    return NextResponse.json(
      { message: { message: "Internal server error", status: 500 } },
      { status: 500 }
    )
  }
}
