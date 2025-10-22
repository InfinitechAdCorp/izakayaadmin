"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

interface Reservation {
  id: number
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  special_requests?: string
  status: "pending" | "confirmed" | "cancelled"
  created_at: string
}

type ReservationStatus = "pending" | "confirmed" | "cancelled"

export default function ReservationsAdmin() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isAddingReservation, setIsAddingReservation] = useState(false)
  const isMobile = useIsMobile()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: 1,
    special_requests: "",
    status: "pending" as ReservationStatus,
  })

  useEffect(() => {
    fetchReservations()
  }, [])

  useEffect(() => {
    if (reservations.length > 0) {
      console.log("✅ Loaded reservations:", reservations.length)
      console.log("Sample reservation:", reservations[0])
    }
  }, [reservations])

  function getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }

  async function fetchReservations() {
    try {
      setLoading(true)
      const response = await fetch("/api/reservations", {
        headers: getAuthHeaders()
      })
      
      console.log("Response status:", response.status)
      
      if (!response.ok) throw new Error("Failed to fetch")
      
      const data = await response.json()
      console.log("Raw API Response:", data)
      
      let reservationList = []
      
      if (data.success && data.data && Array.isArray(data.data)) {
        reservationList = data.data
      } else if (Array.isArray(data)) {
        reservationList = data
      } else if (data.data && Array.isArray(data.data)) {
        reservationList = data.data
      }
      
      console.log("✅ Loaded reservations:", reservationList.length)
      if (reservationList.length > 0) {
        console.log("Sample reservation:", reservationList[0])
      }
      
      setReservations(reservationList)
    } catch (error) {
      console.error("Error fetching reservations:", error)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  function getReservationsForDate(date: Date | null) {
    if (!date) return []
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const found = reservations.filter(res => {
      const resDate = res.date.substring(0, 10)
      return resDate === dateStr
    })
    
    return found
  }

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  function formatMonthYear(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  function isToday(date: Date | null) {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  function formatTime(timeString: string) {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const minute = minutes || '00'
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute}${period}`
  }

  async function handleCreateReservation() {
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to create reservation")

      setFormData({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        guests: 1,
        special_requests: "",
        status: "pending",
      })
      setIsAddingReservation(false)
      fetchReservations()
    } catch (error) {
      console.error("Error creating reservation:", error)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this reservation?")) return

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!response.ok) throw new Error("Failed to delete")

      setSelectedReservation(null)
      fetchReservations()
    } catch (error) {
      console.error("Error deleting reservation:", error)
    }
  }

  async function handleStatusChange(id: number, newStatus: ReservationStatus) {
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update")

      fetchReservations()
      if (selectedReservation?.id === id) {
        setSelectedReservation({ ...selectedReservation, status: newStatus })
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <AppSidebar />
      <div className="flex-1">
        <div className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Reservations Calendar</h1>
        </div>
        
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-2 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">{formatMonthYear(currentDate)}</h2>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button onClick={() => setIsAddingReservation(true)} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New Reservation</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map(day => (
              <div key={day} className="p-1 sm:p-2 text-center font-semibold text-xs sm:text-sm text-gray-600">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.substring(0, 1)}</span>
              </div>
            ))}

            {days.map((date, index) => {
              const dayReservations = getReservationsForDate(date)
              
              return (
                <Card
                  key={index}
                  className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] ${!date ? 'invisible' : ''} ${
                    isToday(date) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <CardContent className="p-1 sm:p-2">
                    {date && (
                      <>
                        <div className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">
                          {date.getDate()}
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                          {dayReservations.map(reservation => (
                            <button
                              key={reservation.id}
                              onClick={() => setSelectedReservation(reservation)}
                              className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs truncate transition-colors bg-green-100 hover:bg-green-200 text-green-800 font-medium"
                            >
                              <span className="hidden sm:inline">{reservation.time.substring(0, 5)} - </span>
                              {reservation.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reservation Details</DialogTitle>
              </DialogHeader>
              {selectedReservation && (
                <div className="space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-gray-600">Name</label>
                    <p className="text-base sm:text-lg">{selectedReservation.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-gray-600">Email</label>
                    <p className="text-sm sm:text-base break-all">{selectedReservation.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-gray-600">Phone</label>
                    <p className="text-sm sm:text-base">{selectedReservation.phone}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-gray-600">Date</label>
                      <p className="text-sm sm:text-base">{formatDate(selectedReservation.date)}</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-gray-600">Time</label>
                      <p className="text-sm sm:text-base">{formatTime(selectedReservation.time)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-gray-600">Guests</label>
                    <p className="text-sm sm:text-base">{selectedReservation.guests} people</p>
                  </div>
                  
                  {selectedReservation.special_requests && (
                    <div>
                      <label className="text-xs sm:text-sm font-semibold text-gray-600">Special Requests</label>
                      <p className="text-xs sm:text-sm">{selectedReservation.special_requests}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs sm:text-sm font-semibold text-gray-600 block mb-2">Status</label>
                    <Select
                      value={selectedReservation.status}
                      onValueChange={(value: ReservationStatus) =>
                        handleStatusChange(selectedReservation.id, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDelete(selectedReservation.id)}
                  >
                    Delete Reservation
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isAddingReservation} onOpenChange={setIsAddingReservation}>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Reservation</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <Input
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Number of Guests"
                  min="1"
                  max="20"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                />
                <Textarea
                  placeholder="Special Requests (Optional)"
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  rows={3}
                />
                <Select
                  value={formData.status}
                  onValueChange={(value: ReservationStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateReservation} className="w-full">
                  Create Reservation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarProvider>
  )
}