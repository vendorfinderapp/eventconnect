'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../src/utils/supabase/client'
import Link from 'next/link'

type EventItem = {
  id: string
  title: string
  description: string
  location: string
  event_date: string
  image_url?: string
  event_status: string
  application_deadline?: string
  event_type?: string
}

export default function MyEventsPage() {
  const supabase = createClient()

  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchMyEvents = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        setMessage('You must be logged in.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!profile || profile.role !== 'host') {
        setMessage('Only hosts can view this page.')
        setLoading(false)
        return
      }

      setAllowed(true)

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_user_id', user.id)
        .order('event_date', { ascending: true })

      if (error) {
        setMessage(error.message)
      } else {
        setEvents(data || [])
      }

      setLoading(false)
    }

    fetchMyEvents()
  }, [supabase])

  if (loading) {
    return <main className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-10 bg-background min-h-screen">Loading...</main>
  }

  if (!allowed) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-10 bg-background min-h-screen">
        <div className="border border-border rounded-2xl bg-card shadow-sm p-8">
          <p>{message}</p>
          <Link href="/" className="underline mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-10 bg-background min-h-screen">
      <div className="mb-8 border border-border rounded-2xl bg-secondary shadow-md p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">My Events</h1>
            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Manage the events you’ve created
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link href="/" className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90">
              Home
            </Link>

            <Link href="/add-event" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
              Add Event
            </Link>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground border border-border rounded-2xl bg-card shadow-sm">
          <p className="text-lg font-medium">You haven’t created any events yet</p>
          <p className="text-sm mt-1">Add your first event to get started</p>

          <Link
            href="/add-event"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Create Event
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-2xl font-semibold">Your Listings</h2>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage all your posted events
              </p>
            </div>

            <span className="text-sm text-foreground bg-card border border-border rounded-full px-3 py-1">
              {events.length} events
            </span>
          </div>

          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className={`border border-border rounded-2xl p-4 md:p-5 flex gap-4 transition duration-200 shadow-sm ${event.event_status === 'closed'
                  ? 'bg-secondary opacity-80'
                  : 'bg-card'
                  }`}
              >
                <Link href={`/events/${event.id}`} className="flex gap-4 flex-1 min-w-0">
                  <img
                    src={event.image_url || 'https://placehold.co/112x112?text=No+Image'}
                    alt={event.title}
                    className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg md:text-xl font-semibold leading-tight">
                        {event.title}
                      </h2>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${event.event_status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}
                      >
                        {event.event_status === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mt-2 mb-3 line-clamp-3">
                      {event.description}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs bg-card border border-border text-secondary-foreground px-2.5 py-1 rounded-full">
                        {event.location}
                      </span>

                      <span className="text-xs bg-secondary text-primary px-2.5 py-1 rounded-full">
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>

                      {event.event_type && (
                        <span className="text-xs bg-secondary text-primary px-2.5 py-1 rounded-full capitalize">
                          {event.event_type}
                        </span>
                      )}

                      {event.application_deadline && (
                        <span className="text-xs bg-secondary text-primary px-2.5 py-1 rounded-full">
                          Apply by {new Date(event.application_deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="shrink-0 self-start flex flex-col gap-2">
                  <Link
                    href={`/events/${event.id}`}
                    className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm text-center hover:opacity-90"
                  >
                    View
                  </Link>

                  <Link
                    href={`/events/${event.id}/edit`}
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm text-center hover:opacity-90"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}