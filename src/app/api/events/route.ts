import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    const url = new URL(request.url)
    const userId = url.searchParams.get("user_id")
    const status = url.searchParams.get("status")
    const eventType = url.searchParams.get("eventType")
    const search = url.searchParams.get("search")

    let apiEndpoint = `${apiUrl}/api/events`

    // Build query parameters
    const params = new URLSearchParams()
    if (userId) params.append("user_id", userId)
    if (status) params.append("status", status)
    if (eventType) params.append("eventType", eventType)
    if (search) params.append("search", search)

    if (params.toString()) {
      apiEndpoint += `?${params.toString()}`
    }

    const token = request.headers.get("authorization")
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = token
    }

    const response = await fetch(apiEndpoint, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")

    const convertedBody = {
      name: body.name,
      email: body.email,
      userId: body.userId || body.user_id || null,
      eventType: body.eventType,
      guests: body.guests,
      preferredDate: body.preferredDate,
      preferredTime: body.preferredTime,
      venueArea: body.venueArea,
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const response = await fetch(`${apiUrl}/api/events`, {
      method: "POST",
      headers,
      body: JSON.stringify(convertedBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.message || "Failed to create event" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const body = await request.json()

    const url = new URL(request.url)
    const eventId = url.searchParams.get("id") || body.id

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const convertedBody = {
      ...(body.name && { name: body.name }),
      ...(body.email && { email: body.email }),
      ...((body.userId || body.user_id) && { userId: body.userId || body.user_id }),
      ...(body.eventType && { eventType: body.eventType }),
      ...(body.guests && { guests: body.guests }),
      ...(body.preferredDate && { preferredDate: body.preferredDate }),
      ...(body.preferredTime && { preferredTime: body.preferredTime }),
      ...(body.venueArea && { venueArea: body.venueArea }),
      ...(body.status && { status: body.status }),
    }

    const response = await fetch(`${apiUrl}/api/events/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(convertedBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.message || "Failed to update event" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    const url = new URL(request.url)
    const eventId = url.searchParams.get("id")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const response = await fetch(`${apiUrl}/api/events/${eventId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ error: errorData.message || "Failed to delete event" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
