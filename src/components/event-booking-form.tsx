"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormData {
  name: string
  email: string
  userId?: number
  eventType: string
  guests: number
  preferredDate: string
  preferredTime: string
  venueArea: string
}

interface User {
  id: number
  name: string
  email: string
}

interface EventBookingFormProps {
  onSuccess?: () => void
  user?: User | null
}

export default function EventBookingForm({ onSuccess, user: initialUser }: EventBookingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    userId: undefined,
    eventType: "",
    guests: 1,
    preferredDate: "",
    preferredTime: "",
    venueArea: "",
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [user, setUser] = useState<User | null>(initialUser || null)

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser)
      return
    }

    const userData = localStorage.getItem("user_data")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        console.log("[v0] User loaded from localStorage:", parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("[v0] Error parsing user data:", error)
      }
    }
  }, [initialUser])

  // Auto-fill name, email, and userId when user is logged in
  useEffect(() => {
    if (user) {
      console.log("[v0] User data received:", user)
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        userId: user.id,
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guests" ? Number.parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      console.log("[v0] Form data before submit:", formData)
      console.log("[v0] User ID being sent:", formData.userId)

      const token = localStorage.getItem("auth_token")
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
        console.log("[v0] Authorization header added")
      } else {
        console.warn("[v0] No auth token found - booking as guest")
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to book event")
      }

      const data = await response.json()
      console.log("[v0] Event booked successfully:", data)
      setMessage("Event booked successfully!")

      // Reset only event-specific fields, keep user info
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        userId: user?.id,
        eventType: "",
        guests: 1,
        preferredDate: "",
        preferredTime: "",
        venueArea: "",
      })

      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (error) {
      setMessage("Error booking event. Please try again.")
      console.error("[v0] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Check if user is logged in
  const isLoggedIn = !!user

  return (
    <div className="w-full">
      <Card className="bg-white border-3 border-orange-500 shadow-lg">
        <div className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b border-orange-200 pb-2">
              <h2 className="text-lg font-bold text-black">Contact Information</h2>
              {isLoggedIn && (
                <p className="text-xs text-gray-600 mt-1">
                  Booking as: <span className="font-semibold">{user.name}</span>
                </p>
              )}
              {!isLoggedIn && <p className="text-xs text-gray-500 mt-1">Not logged in - booking as guest</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-black font-semibold text-sm">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  disabled={isLoggedIn}
                  className={`border-2 border-orange-500 focus:ring-2 focus:ring-yellow-400 focus:border-orange-500 py-2 px-3 font-semibold text-sm rounded-lg hover:border-orange-600 transition-all ${
                    isLoggedIn ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black font-semibold text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  disabled={isLoggedIn}
                  className={`border-2 border-orange-500 focus:ring-2 focus:ring-yellow-400 focus:border-orange-500 py-2 px-3 font-semibold text-sm rounded-lg hover:border-orange-600 transition-all ${
                    isLoggedIn ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>

            <div className="border-b border-orange-200 pb-2 pt-2">
              <h2 className="text-lg font-bold text-black">Event Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="eventType" className="text-black font-semibold text-sm">
                  Event Type
                </Label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border-2 border-orange-500 rounded-lg bg-white text-black text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-orange-500 transition-all hover:border-orange-600"
                >
                  <option value="">Select an event type</option>
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="conference">Conference</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Number of Guests */}
              <div className="space-y-2">
                <Label htmlFor="guests" className="text-black font-semibold text-sm">
                  Number of Guests
                </Label>
                <Input
                  id="guests"
                  name="guests"
                  type="number"
                  min="1"
                  value={formData.guests}
                  onChange={handleChange}
                  required
                  className="border-2 border-orange-500 focus:ring-2 focus:ring-yellow-400 focus:border-orange-500 py-2 px-3 font-semibold text-sm rounded-lg hover:border-orange-600 transition-all"
                />
              </div>
            </div>

            <div className="border-b border-orange-200 pb-2 pt-2">
              <h2 className="text-lg font-bold text-black">Date & Time</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preferred Date */}
              <div className="space-y-2">
                <Label htmlFor="preferredDate" className="text-black font-semibold text-sm">
                  Preferred Date
                </Label>
                <Input
                  id="preferredDate"
                  name="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="border-2 border-orange-500 focus:ring-2 focus:ring-yellow-400 focus:border-orange-500 py-2 px-3 font-semibold text-sm rounded-lg hover:border-orange-600 transition-all"
                />
              </div>

              {/* Preferred Time */}
              <div className="space-y-2">
                <Label htmlFor="preferredTime" className="text-black font-semibold text-sm">
                  Preferred Time
                </Label>
                <Input
                  id="preferredTime"
                  name="preferredTime"
                  type="time"
                  value={formData.preferredTime}
                  onChange={handleChange}
                  required
                  className="border-2 border-orange-500 focus:ring-2 focus:ring-yellow-400 focus:border-orange-500 py-2 px-3 font-semibold text-sm rounded-lg hover:border-orange-600 transition-all"
                />
              </div>
            </div>

            <div className="border-b border-orange-200 pb-2 pt-2">
              <h2 className="text-lg font-bold text-black">Venue</h2>
            </div>

            {/* Venue Area */}
            <div className="space-y-2">
              <Label htmlFor="venueArea" className="text-black font-semibold text-sm">
                Venue Area (Inside Restaurant)
              </Label>
              <select
                id="venueArea"
                name="venueArea"
                value={formData.venueArea}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border-2 border-orange-500 rounded-lg bg-white text-black text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-orange-500 transition-all hover:border-orange-600"
              >
                <option value="">Select a venue area</option>
                <option value="vip_area">VIP AREA</option>
                <option value="main_hall">Main Hall</option>
                <option value="private_room">Private Room</option>
             
              </select>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`p-3 rounded-lg text-center font-bold text-sm border-2 ${
                  message.includes("successfully")
                    ? "bg-yellow-400 text-black border-yellow-500"
                    : "bg-red-200 text-black border-red-600"
                }`}
              >
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg border-2 border-orange-600 text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              {loading ? "Booking..." : "Book Event"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
