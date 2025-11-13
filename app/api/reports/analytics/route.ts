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

    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    // Fetch sales data from DukaPlus API
    const response = await fetch(`${DUKAPLUS_API}/api/method/dukaplus.services.rest.get_sales_analytics`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to fetch analytics" }, { status: response.status })
    }

    const data = await response.json()

    // Process analytics data
    const transactions = data.message || []
    const totalSales = transactions.reduce((sum: number, t: any) => sum + (t.total || 0), 0)
    const totalTransactions = transactions.length
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0

    // Calculate period-specific sales
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const todaySales = transactions
      .filter((t: any) => new Date(t.creation || 0) >= today)
      .reduce((sum: number, t: any) => sum + (t.total || 0), 0)

    const thisWeekSales = transactions
      .filter((t: any) => new Date(t.creation || 0) >= weekAgo)
      .reduce((sum: number, t: any) => sum + (t.total || 0), 0)

    const thisMonthSales = transactions
      .filter((t: any) => new Date(t.creation || 0) >= monthAgo)
      .reduce((sum: number, t: any) => sum + (t.total || 0), 0)

    return NextResponse.json({
      totalSales,
      totalTransactions,
      averageTransaction,
      todaySales,
      thisWeekSales,
      thisMonthSales,
    })
  } catch (error) {
    console.error("Analytics fetch error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
