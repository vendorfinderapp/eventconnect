'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '../../src/utils/supabase/client'
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

const STATE_OPTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

export default function AddEventPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
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
  const [allowed, setAllowed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const eventTypeDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const checkUserRole = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        setMessage('You must be logged in as a host to add events.')
        setLoading(false)
        return
      }

      const user = authData.user
      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        setMessage('Profile not found.')
        setLoading(false)
        return
      }

      if (profile.role !== 'host') {
        setMessage('Only hosts can create events.')
        setLoading(false)
        return
      }

      setAllowed(true)
      setLoading(false)
    }

    checkUserRole()
  }, [])

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

  const handleSubmit = async () => {
    const supabase = createClient()

    setMessage('')

    if (
      !title ||
      !description ||
      !streetAddress ||
      !city ||
      !state ||
      !eventDate ||
      !websiteLink ||
      !userId
    ) {
      setMessage('Please fill out all required fields.')
      return
    }

    setSaving(true)

    let finalImageUrl = imageUrl

    if (imageFile) {
      setUploadingImage(true)

      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`

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

    const formattedLocation = `${streetAddress.trim()}, ${city.trim()}, ${state}`

    const { error } = await supabase.from('events').insert([
      {
        title,
        description,
        location: formattedLocation,
        event_date: eventDate,
        image_url: imageUrl,
        website_link: formattedWebsiteLink,
        apply_link: formattedApplyLink,
        event_status: eventStatus,
        application_deadline: applicationDeadline || null,
        event_type: eventTypes.length > 0 ? eventTypes : null,
        host_user_id: userId,
      },
    ])

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Event created successfully.')
    setTitle('')
    setDescription('')
    setStreetAddress('')
    setCity('')
    setState('')
    setEventDate('')
    setImageUrl('')
    setWebsiteLink('')
    setApplyLink('')
    setEventStatus('open')
    setApplicationDeadline('')
    setEventTypes([])
    setShowEventTypeDropdown(false)
    setSaving(false)
  }

  if (loading) {
    return <main className="p-10">Loading...</main>
  }

  if (!allowed) {
    return (
      <main className="max-w-3xl mx-auto p-10 bg-background min-h-screen">
        <div className="border border-border rounded-2xl bg-card shadow-sm p-6">
          <p className="text-foreground">{message}</p>
          <Link href="/" className="underline mt-4 inline-block">
            Go to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Event Listing</h1>
        <p className="text-muted-foreground mt-2">
          Add your event so vendors can discover it and apply.
        </p>
      </div>

      <div className="border border-border rounded-2xl bg-card shadow-sm p-6 md:p-8 space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Title</label>
              <input
                className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                type="text"
                placeholder="Enter event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="border border-border bg-background p-3 w-full rounded-lg min-h-[140px] text-foreground"
                placeholder="Describe the event, audience, vendor setup, dates, or anything vendors should know."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If the event has multiple dates, list the full schedule in the description.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Street Address</label>
              <input
                className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                type="text"
                placeholder="Enter street address"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                  type="text"
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <div className="relative">
                  <select
                    className="border border-border h-[50px] px-3 w-full rounded-lg bg-background appearance-none pr-10 text-foreground"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  >
                    <option value="">Select state</option>
                    {STATE_OPTIONS.map((stateOption) => (
                      <option key={stateOption} value={stateOption}>
                        {stateOption}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg
                      className="w-4 h-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Event Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Date</label>
              <input
                className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use the main date or first date for multi-day events.
              </p>
            </div>

            <div ref={eventTypeDropdownRef} className="relative">
              <label className="block text-sm font-medium mb-1">Event Type</label>

              <button
                type="button"
                onClick={() => setShowEventTypeDropdown((prev) => !prev)}
                className="border border-border p-3 w-full rounded-lg bg-background flex items-center justify-between text-foreground"
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
                <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow max-h-64 overflow-y-auto">
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-secondary cursor-pointer"
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
              <div className="relative">
                <select
                  className="border border-border h-[50px] px-3 w-full rounded-lg bg-background appearance-none pr-10 text-foreground"
                  value={eventStatus}
                  onChange={(e) => setEventStatus(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave this as open unless you know vendors can no longer apply.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Application Deadline</label>
              <input
                className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
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
                className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload from your device, or use an image URL below.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input
                className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                type="text"
                placeholder="Optional image link for the event"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Event Website</label>
              <input
                className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                type="text"
                placeholder="Enter website link"
                value={websiteLink}
                onChange={(e) => setWebsiteLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Vendors will be sent here if no separate apply link is provided.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Apply Link</label>
              <input
                className="border border-border bg-background p-3 w-full rounded-lg text-foreground"
                type="text"
                placeholder="Optional direct apply link"
                value={applyLink}
                onChange={(e) => setApplyLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If provided, vendors will go directly to this application link.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-primary text-primary-foreground px-5 py-3 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Creating Event...' : 'Create Event'}
          </button>

          {message && <p className="text-sm text-foreground">{message}</p>}
        </div>
      </div>
    </main>
  )
}