'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../../../src/utils/supabase/client'
import Link from 'next/link'

const EVENT_TYPE_OPTIONS = [
  'Vendor Market',
  'Makers Market',
  'Craft Fair',
  'Flea Market',
  'Farmers Market',
  'Expo',
  'Festival',
  'Holiday Market',
  'Night Market',
  'Pop-Up',
  'Art Fair',
  'Trade Show',
  'Convention',
  'Community Event',
  'Other',
]

export default function EditEventPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [websiteLink, setWebsiteLink] = useState('')
  const [applyLink, setApplyLink] = useState('')
  const [eventStatus, setEventStatus] = useState('open')
  const [applicationDeadline, setApplicationDeadline] = useState('')
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const eventTypeDropdownRef = useRef<HTMLDivElement | null>(null)

  const normalizeEventTypes = (eventType?: string | string[]) => {
    if (!eventType) return []
    if (Array.isArray(eventType)) return eventType
    return [eventType]
  }

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setMessage('Event not found.')
        setLoading(false)
        return
      }

      setTitle(data.title || '')
      setDescription(data.description || '')
      setLocation(data.location || '')
      setEventDate(data.event_date || '')
      setImageUrl(data.image_url || '')
      setWebsiteLink(data.website_link || '')
      setApplyLink(data.apply_link || '')
      setEventStatus(data.event_status || 'open')
      setApplicationDeadline(data.application_deadline || '')
      setEventTypes(normalizeEventTypes(data.event_type))

      setLoading(false)
    }

    if (id) {
      fetchEvent()
    }
  }, [id, supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        eventTypeDropdownRef.current &&
        !eventTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowEventTypeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleEventTypeToggle = (type: string) => {
    setEventTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    )
  }

  const handleUpdate = async () => {
    setMessage('')

    if (!title || !description || !location || !eventDate || !websiteLink) {
      setMessage('Please fill out all required fields.')
      return
    }

    setSaving(true)

    let finalImageUrl = imageUrl

    if (imageFile) {
      setUploadingImage(true)

      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, imageFile)

      if (uploadError) {
        setMessage(uploadError.message)
        setUploadingImage(false)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName)

      finalImageUrl = publicUrlData.publicUrl
      setUploadingImage(false)
    }

    let formattedWebsiteLink = websiteLink
    if (formattedWebsiteLink && !formattedWebsiteLink.startsWith('http')) {
      formattedWebsiteLink = 'https://' + formattedWebsiteLink
    }

    let formattedApplyLink = applyLink
    if (formattedApplyLink && !formattedApplyLink.startsWith('http')) {
      formattedApplyLink = 'https://' + formattedApplyLink
    }

    const { error } = await supabase
      .from('events')
      .update({
        title,
        description,
        location,
        event_date: eventDate,
        image_url: finalImageUrl,
        website_link: formattedWebsiteLink,
        apply_link: formattedApplyLink,
        event_status: eventStatus,
        application_deadline: applicationDeadline || null,
        event_type: eventTypes.length > 0 ? eventTypes : null,
      })
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setSaving(false)
    router.push(`/events/${id}`)
  }

  if (loading) {
    return <main className="p-10">Loading...</main>
  }

  return (
    <main className="max-w-3xl mx-auto p-10">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <a href={`/events/${id}`} className="underline text-sm inline-block">
            ← Back to Event
          </a>

          <Link href="/" className="underline text-sm">
            Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mt-3">Edit Event</h1>
        <p className="text-gray-600 mt-2">
          Update your event details and keep your listing accurate.
        </p>
      </div>

      <div className="border rounded-2xl bg-white shadow-sm p-6 md:p-8 space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Title</label>
              <input
                className="border p-3 w-full rounded-lg"
                type="text"
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="border p-3 w-full rounded-lg min-h-[140px]"
                placeholder="Update event description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                If the event has multiple dates, list the full schedule in the description.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                className="border p-3 w-full rounded-lg"
                type="text"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Event Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Date</label>
              <input
                className="border p-3 w-full rounded-lg"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use the main date or first date for multi-day events.
              </p>
            </div>

            <div ref={eventTypeDropdownRef} className="relative">
              <label className="block text-sm font-medium mb-1">Event Type</label>

              <button
                type="button"
                onClick={() => setShowEventTypeDropdown((prev) => !prev)}
                className="border p-3 w-full rounded-lg bg-white flex items-center justify-between"
              >
                <span>
                  {eventTypes.length === 0
                    ? 'Select event types'
                    : `${eventTypes.length} event type${eventTypes.length > 1 ? 's' : ''} selected`}
                </span>

                <svg
                  className={`w-4 h-4 transition-transform ${showEventTypeDropdown ? 'rotate-180' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showEventTypeDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow max-h-64 overflow-y-auto">
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={eventTypes.includes(option)}
                        onChange={() => handleEventTypeToggle(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Event Status</label>
              <select
                className="border p-3 w-full rounded-lg"
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value)}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Leave this as open unless you know vendors can no longer apply.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Application Deadline</label>
              <input
                className="border p-3 w-full rounded-lg"
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional. Leave blank if you do not know the deadline.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Links & Media</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Upload Image</label>
              <input
                className="border p-3 w-full rounded-lg bg-white"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input
                className="border p-3 w-full rounded-lg"
                type="text"
                placeholder="Optional image link"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Event Website</label>
              <input
                className="border p-3 w-full rounded-lg"
                type="text"
                placeholder="Enter website link"
                value={websiteLink}
                onChange={(e) => setWebsiteLink(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Apply Link</label>
              <input
                className="border p-3 w-full rounded-lg"
                type="text"
                placeholder="Optional apply link"
                value={applyLink}
                onChange={(e) => setApplyLink(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-black text-white px-5 py-3 rounded-lg disabled:opacity-50"
          >
            {saving ? (uploadingImage ? 'Uploading Image...' : 'Saving Changes...') : 'Save Changes'}
          </button>

          {message && <p className="text-sm text-gray-700">{message}</p>}
        </div>
      </div>
    </main>
  )
}