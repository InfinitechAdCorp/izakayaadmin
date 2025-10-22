import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    // Get token from Authorization header (sent from frontend)
    const authHeader = request.headers.get("authorization")

    console.log("GET Reservations - Auth Header:", authHeader ? "Present" : "Missing")

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const response = await fetch(`${apiUrl}/api/reservations`, {
      method: "GET",
      headers,
    })

    console.log("Laravel Response Status:", response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Laravel Error:", errorData)
      throw new Error(`Failed to fetch reservations: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Reservations GET API Error:", error)
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    // Get auth token from Authorization header (sent from frontend)
    const authHeader = request.headers.get("authorization")

    console.log("=== POST Reservation to Laravel ===")
    console.log("Auth Header:", authHeader ? "Present" : "Missing")
    console.log("Body:", body)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    if (authHeader) {
      headers["Authorization"] = authHeader
      console.log("Authorization header forwarded to Laravel")
    } else {
      console.warn("⚠️ No authorization header - reservation will be created as guest")
    }

    console.log("Sending to:", `${apiUrl}/api/reservations`)

    const response = await fetch(`${apiUrl}/api/reservations`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    console.log("Laravel Response Status:", response.status)

    const responseText = await response.text()
    console.log("Laravel Response Text:", responseText)

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse response as JSON:", responseText)
      throw new Error("Invalid response from server")
    }

    if (!response.ok) {
      console.error("Laravel Error Response:", data)
      throw new Error(data.message || "Failed to create reservation")
    }

    console.log("✅ Success Response:", data)

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("❌ Reservation POST API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create reservation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
