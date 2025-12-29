import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const apiKey = process.env.DUKAPLUS_API_KEY || ""
    const apiSecret = process.env.DUKAPLUS_API_SECRET || ""

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/method/dukaplus.services.rest.cancel_material_transfer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${apiKey}:${apiSecret}`,
        },
        body: JSON.stringify(body),
      },
    )

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Stock transfer cancelled successfully",
        data: data.message,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.message?.message || "Failed to cancel stock transfer",
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Error cancelling stock transfer:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
