import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.submit_material_transfer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      },
    )

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Stock transfer submitted successfully",
        data: data.message,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.message?.message || "Failed to submit stock transfer",
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Error submitting stock transfer:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
