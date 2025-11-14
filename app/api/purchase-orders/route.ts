import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const warehouseId = searchParams.get("warehouse_id")

    if (!warehouseId) {
      return NextResponse.json({ message: { message: "Warehouse ID is required", status: 400 } }, { status: 400 })
    }

    const authCookie = request.cookies.get("auth_token")
    if (!authCookie) {
      return NextResponse.json({ message: { message: "Not authenticated", status: 401 } }, { status: 401 })
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/method/dukaplus.services.rest.get_all_purchase_orders?warehouse_id=${encodeURIComponent(warehouseId)}`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Cookie: `sid=${authCookie.value}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[API] Purchase orders error:", error)
    return NextResponse.json({ message: { message: "Internal server error", status: 500 } }, { status: 500 })
  }
}
