'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../../src/utils/supabase/client'
import Link from 'next/link'

type EventItem = {
  id: string
  title: string
  description: string
  location: string
  event_date: string
  image_url?: string
  apply_link?: string
  website_link?: string
  event_status: string
  application_deadline?: string
  event_type?: string
  host_user_id?: string
}

type ApplicantItem = {
  vendor_user_id: string
  vendor_email: string
  status: string
}

export default function EventDetailsPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [event, setEvent] = useState<EventItem | null>(null)
  const [message, setMessage] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [applicationCount, setApplicationCount] = useState(0)
  const [applicants, setApplicants] = useState<ApplicantItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setEvent(data)
      }

      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id)

      setApplicationCount(count || 0)

      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (user) {
        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          setRole(profile.role)
        }

        const { data: favoriteData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', id)
          .maybeSingle()

        setIsFavorited(!!favoriteData)

        const { data: eventData } = await supabase
          .from('events')
          .select('host_user_id')
          .eq('id', id)
          .single()

        if (eventData?.host_user_id === user.id) {
          const { data: applicantData } = await supabase
            .from('applications')
            .select('vendor_user_id, vendor_email, status')
            .eq('event_id', id)

          setApplicants(applicantData || [])
        }
      }
    }

    if (id) {
      fetchData()
    }
  }, [supabase, id])

  const toggleFavorite = async () => {
    if (!userId) return

    if (isFavorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', id)

      if (!error) {
        setIsFavorited(false)
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, event_id: id }])

      if (!error) {
        setIsFavorited(true)
      }
    }
  }

  const handleDelete = async () => {
    if (!event) return

    const confirmed = window.confirm(
      `Delete "${event.title}"? This cannot be undone.`
    )

    if (!confirmed) return

    setDeleting(true)
    setMessage('')

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      setDeleting(false)
      return
    }

    router.push('/')
  }

  if (!event) {
    return <main className="p-6 md:p-10 bg-background min-h-screen">Loading...</main>
  }

  const isOwner = userId && event.host_user_id === userId

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-10 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <a href="/" className="underline inline-block w-fit">
          ← Back to Home
        </a>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {userId && (
            <button
              onClick={toggleFavorite}
              className={`px-4 py-2 rounded-lg w-full sm:w-auto ${isFavorited
                ? 'bg-secondary text-primary'
                : 'bg-secondary text-secondary-foreground'
                }`}
            >
              {isFavorited ? 'Saved' : 'Save Event'}
            </button>
          )}

          {isOwner && (
            <>
              <Link
                href={`/events/${event.id}/edit`}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-center w-full sm:w-auto"
              >
                Edit Event
              </Link>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 w-full sm:w-auto"
              >
                {deleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="border border-border rounded-2xl shadow-sm bg-card p-4 md:p-6">
        <img
          src={event.image_url || 'https://placehold.co/800x300?text=No+Image'}
          alt={event.title}
          className="w-full h-56 md:h-72 object-cover rounded-xl mb-5 md:mb-6"
        />

        <h1 className="text-2xl md:text-3xl font-bold mb-3">{event.title}</h1>

        <p className="text-muted-foreground mb-4 md:mb-5">{event.description}</p>

        <div className="flex gap-2 flex-wrap mb-5 md:mb-6">
          <span className="text-xs bg-card border border-border text-secondary-foreground px-2.5 py-1 rounded-full">
            {event.location}
          </span>

          <span className="text-xs bg-secondary text-primary px-2.5 py-1 rounded-full">
            {new Date(event.event_date).toLocaleDateString()}
          </span>

          <span
            className={`text-xs px-2.5 py-1 rounded-full ${event.event_status === 'open'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
              }`}
          >
            {event.event_status === 'open' ? 'Open' : 'Closed'}
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

          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
            {applicationCount} {applicationCount === 1 ? 'applicant' : 'applicants'}
          </span>
        </div>

        <div className="mb-4">
          {event.event_status === 'open' ? (
            event.apply_link ? (
              <a
                href={event.apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg w-full sm:w-auto text-center"
              >
                Apply to Event
              </a>
            ) : event.website_link ? (
              <a
                href={event.website_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-secondary text-secondary-foreground px-4 py-2 rounded-lg w-full sm:w-auto text-center"
              >
                Go to Event Website
              </a>
            ) : null
          ) : (
            <span className="inline-block bg-secondary text-muted-foreground px-4 py-2 rounded-lg w-full sm:w-auto text-center">
              Applications Closed
            </span>
          )}
        </div>

        {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}

        {role === 'host' && applicants.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Applicants</h2>

            <ul className="text-sm text-muted-foreground space-y-2">
              {applicants.map((app, index) => (
                <li
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-xl p-3 bg-card"
                >
                  <span className="break-all">
                    {app.vendor_email || app.vendor_user_id} — {app.status}
                  </span>

                  {app.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={async () => {
                          const { error } = await supabase
                            .from('applications')
                            .update({ status: 'approved' })
                            .eq('event_id', id)
                            .eq('vendor_user_id', app.vendor_user_id)

                          if (!error) {
                            window.location.reload()
                          }
                        }}
                        className="bg-green-500 text-white px-3 py-2 rounded text-sm"
                      >
                        Approve
                      </button>

                      <button
                        onClick={async () => {
                          const { error } = await supabase
                            .from('applications')
                            .update({ status: 'rejected' })
                            .eq('event_id', id)
                            .eq('vendor_user_id', app.vendor_user_id)

                          if (!error) {
                            window.location.reload()
                          }
                        }}
                        className="bg-red-500 text-white px-3 py-2 rounded text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}