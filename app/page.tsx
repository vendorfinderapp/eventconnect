'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '../src/utils/supabase/client'
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
  event_type?: string | string[]
}

export default function HomePage() {
  const supabase = createClient()

  const [events, setEvents] = useState<EventItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState('')

  const [role, setRole] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [favoriteEventIds, setFavoriteEventIds] = useState<string[]>([])

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
  const typeDropdownRef = useRef<HTMLDivElement | null>(null)

  const normalizeEventTypes = (eventType?: string | string[]) => {
    if (!eventType) return []
    if (Array.isArray(eventType)) return eventType
    return [eventType]
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (user) {
        setLoggedIn(true)
        setUserId(user.id)
        setUserEmail(user.email ?? null)

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        setRole(profile?.role ?? null)

        const { data: favoritesData } = await supabase
          .from('favorites')
          .select('event_id')
          .eq('user_id', user.id)

        setFavoriteEventIds(favoritesData ? favoritesData.map((item) => item.event_id) : [])
      } else {
        setLoggedIn(false)
        setUserId(null)
        setUserEmail(null)
        setRole(null)
        setFavoriteEventIds([])
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })

      if (!error && data) {
        setEvents(data)
      }
    }

    fetchData()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTypeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleEventType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    )
  }

  const getTypeFilterLabel = () => {
    if (selectedTypes.length === 0) return 'All Event Types'
    if (selectedTypes.length === 1) return selectedTypes[0]
    if (selectedTypes.length === 2) return selectedTypes.join(', ')
    return `${selectedTypes.length} event types selected`
  }

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const eventTypes = normalizeEventTypes(event.event_type)

        const matchesSearch =
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.location.toLowerCase().includes(search.toLowerCase())

        const matchesDate =
          selectedDate === '' || event.event_date === selectedDate

        const matchesType =
          selectedTypes.length === 0 ||
          eventTypes.some((type) => selectedTypes.includes(type))

        const matchesLocation =
          locationFilter === '' ||
          event.location.toLowerCase().includes(locationFilter.toLowerCase())

        return matchesSearch && matchesDate && matchesType && matchesLocation
      })
      .sort((a, b) =>
        sortOrder === 'asc'
          ? new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
          : new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      )
  }, [events, search, selectedDate, sortOrder, selectedTypes, locationFilter])

  const toggleFavorite = async (eventId: string) => {
    if (!userId) return

    const isFavorited = favoriteEventIds.includes(eventId)

    if (isFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId)

      if (!error) {
        setFavoriteEventIds((prev) => prev.filter((id) => id !== eventId))
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, event_id: eventId }])

      if (!error) {
        setFavoriteEventIds((prev) => [...prev, eventId])
      }
    }
  }

  const handleTypeBadgeClick = (type: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedTypes([type])
    setSelectedDate('')
    setLocationFilter('')
    setSearch('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-10 bg-background text-foreground min-h-screen">
      <div className="mb-6 md:mb-8 border border-border rounded-2xl bg-secondary shadow-md p-5 md:p-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Next<span className="text-primary font-extrabold">Faire</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-lg max-w-2xl">
              Discover events, find places to vend, and explore what’s happening around you.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {!loggedIn && (
                <>
                  <Link
                    href="#events"
                    className="px-5 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium hover:opacity-90"
                  >
                    Browse Events
                  </Link>

                  <Link
                    href="/auth"
                    className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
                  >
                    Get Started
                  </Link>
                </>
              )}

              {role === 'vendor' && (
                <Link
                  href="#events"
                  className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Find Events
                </Link>
              )}

              {role === 'host' && (
                <Link
                  href="/add-event"
                  className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
                >
                  Post Event
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">


            {loggedIn && (
              <span className="text-xs md:text-sm text-muted-foreground break-all">
                {userEmail} ({role})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 md:mb-8 border border-border rounded-2xl bg-secondary shadow-md p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border p-3 rounded-lg min-w-0 text-foreground placeholder:text-muted-foreground bg-card"
          />

          <input
            type="text"
            placeholder="Filter by city/state..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="border border-border p-3 rounded-lg min-w-0 text-foreground placeholder:text-muted-foreground bg-card"
          />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-border p-3 rounded-lg min-w-0 text-foreground placeholder:text-muted-foreground bg-card"
          />

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-border p-3 rounded-lg min-w-0 text-foreground placeholder:text-muted-foreground bg-card"
          >
            <option value="asc">Date: Soonest First</option>
            <option value="desc">Date: Farthest Out</option>
          </select>
        </div>

        <div className="mt-4" ref={typeDropdownRef}>
          <p className="text-sm font-medium mb-2 text-foreground">Browse by Event Type</p>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
              className="w-full md:w-auto min-w-[260px] border border-border rounded-lg px-4 py-3 bg-card text-left flex items-center justify-between gap-4"
            >
              <span className="text-sm text-foreground truncate">
                {getTypeFilterLabel()}
              </span>
              <span className="text-sm text-muted-foreground">
                {isTypeDropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute z-20 mt-2 w-full md:w-[320px] max-h-72 overflow-y-auto border border-border rounded-xl bg-card shadow-lg p-3">
                <div className="space-y-2">
                  {EVENT_TYPE_OPTIONS.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-3 text-sm text-foreground cursor-pointer px-2 py-2 rounded hover:bg-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleEventType(type)}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-3 mt-3 border-t flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTypes([])}
                    className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 text-sm"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTypeDropdownOpen(false)}
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => {
              setSearch('')
              setSelectedDate('')
              setSortOrder('asc')
              setSelectedTypes([])
              setLocationFilter('')
            }}
            className="bg-secondary text-secondary-foreground px-4 py-3 rounded-lg hover:opacity-90 w-full md:w-auto"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 md:py-14 text-muted-foreground border border-border rounded-2xl bg-secondary shadow-md">
          <p className="text-lg font-medium">No events found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 px-1">
            <div id="events">
              <h2 className="text-xl md:text-2xl font-semibold">Upcoming Events</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Browse current opportunities for vendors
              </p>
            </div>

            <span className="text-sm text-foreground bg-card border border-border rounded-full px-3 py-1 w-fit">
              {filteredEvents.length} results
            </span>
          </div>

          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const isFavorited = favoriteEventIds.includes(event.id)
              const eventTypes = normalizeEventTypes(event.event_type)
              const visibleTypes = eventTypes.slice(0, 2)
              const extraTypeCount = eventTypes.length - visibleTypes.length

              return (
                <div
                  key={event.id}
                  className={`border border-border rounded-2xl p-4 md:p-5 transition duration-200 shadow-sm ${event.event_status === 'closed'
                    ? 'bg-secondary opacity-80'
                    : 'bg-card hover:shadow-md'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href={`/events/${event.id}`} className="flex flex-col sm:flex-row gap-4 flex-1 min-w-0">
                      <img
                        src={event.image_url || 'https://placehold.co/112x112?text=No+Image'}
                        alt={event.title}
                        className="w-full sm:w-24 sm:h-24 md:w-28 md:h-28 h-44 object-cover rounded-xl shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                          <h2 className="text-lg md:text-xl font-semibold leading-tight text-foreground">
                            {event.title}
                          </h2>

                          <span
                            className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap w-fit ${event.event_status === 'open'
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

                          {visibleTypes.map((type, index) => {
                            const cleanType = Array.isArray(type) ? type.join(', ') : String(type)
                              .replace(/^\[+|\]+$/g, '')
                              .replace(/\\"/g, '"')
                              .replace(/"/g, '')
                              .trim()

                            return (
                              <button
                                key={`${cleanType}-${index}`}
                                type="button"
                                onClick={(e) => handleTypeBadgeClick(cleanType, e)}
                                className="text-xs bg-secondary text-primary px-2.5 py-1 rounded-full hover:opacity-90 transition"
                              >
                                {cleanType}
                              </button>
                            )
                          })}

                          {extraTypeCount > 0 && (
                            <span className="text-xs bg-secondary text-primary px-2.5 py-1 rounded-full">
                              +{extraTypeCount} more
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

                    {loggedIn && (
                      <button
                        onClick={() => toggleFavorite(event.id)}
                        className={`shrink-0 self-start sm:self-start px-3 py-2 rounded-lg text-sm w-full sm:w-auto ${isFavorited
                          ? 'bg-accent/15 text-accent'
                          : 'bg-secondary text-secondary-foreground'
                          }`}
                      >
                        {isFavorited ? 'Saved' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}