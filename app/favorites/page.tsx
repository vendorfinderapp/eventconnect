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
  image_url: string
  website_link: string
  apply_link?: string
  event_status: string
  application_deadline?: string
  event_type?: string
}

export default function FavoritesPage() {
  const supabase = createClient()

  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: favoriteRows, error: favoriteError } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', user.id)

      if (favoriteError || !favoriteRows || favoriteRows.length === 0) {
        setEvents([])
        setLoading(false)
        return
      }

      const eventIds = favoriteRows.map((row) => row.event_id)

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('event_date', { ascending: true })

      if (!eventError && eventData) {
        setEvents(eventData)
      }

      setLoading(false)
    }

    fetchFavorites()
  }, [supabase])

  const removeFavorite = async (eventId: string) => {
    if (!userId) return

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId)

    if (!error) {
      setEvents((prev) => prev.filter((event) => event.id !== eventId))
    }
  }

  if (loading) {
    return <main className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-10 bg-background min-h-screen">Loading...</main>
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-10 bg-background min-h-screen">
      <div className="mb-8 border border-border rounded-2xl bg-secondary shadow-md p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Favorites</h1>
            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Your saved vendor events
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground border border-border rounded-2xl bg-card shadow-sm">
          <p className="text-lg font-medium">No saved events yet</p>
          <p className="text-sm mt-1">
            Save events from the homepage or event page to keep track of the ones you like.
          </p>

          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-2xl font-semibold">Saved Events</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Quickly revisit the events you want to keep an eye on
              </p>
            </div>

            <span className="text-sm text-foreground bg-card border border-border rounded-full px-3 py-1">
              {events.length} saved
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

                <button
                  onClick={() => removeFavorite(event.id)}
                  className="shrink-0 self-start px-3 py-2 rounded-lg text-sm bg-secondary text-secondary-foreground hover:opacity-90"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}