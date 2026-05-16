import { supabase } from '../main.js'
import { sendTelegramMessage, logNotification } from './telegram.js'

interface ApiMatch {
  externalId: string
  sport: 'football' | 'cricket'
  league: string
  team1: string
  team2: string
  team1Logo?: string
  team2Logo?: string
  matchTime: string
  venue?: string
  status: string
}

async function getFavoriteTeams(): Promise<string[]> {
  const { data } = await supabase.from('favorite_teams').select('team_name')
  return (data || []).map(t => t.team_name.toLowerCase())
}

function matchesFavorite(match: ApiMatch, favorites: string[]): boolean {
  const t1 = match.team1.toLowerCase()
  const t2 = match.team2.toLowerCase()
  return favorites.some(fav => t1.includes(fav) || t2.includes(fav) || fav.includes(t1) || fav.includes(t2))
}

async function fetchFootballMatches(apiKey: string): Promise<ApiMatch[]> {
  if (!apiKey) return []

  const matches: ApiMatch[] = []

  try {
    const res = await fetch('https://www.thesportsdb.com/api/v1/json/3/eventsround.php?id=4328&r=38&s=2024-2025', {
      headers: { 'User-Agent': 'SportsReminder/1.0' },
    })

    if (!res.ok) return []

    const data = await res.json()
    if (!data.events) return []

    for (const event of data.events) {
      matches.push({
        externalId: `football-${event.idEvent}`,
        sport: 'football',
        league: event.strLeague || 'Unknown League',
        team1: event.strHomeTeam || 'TBD',
        team2: event.strAwayTeam || 'TBD',
        team1Logo: event.strHomeTeamBadge || undefined,
        team2Logo: event.strAwayTeamBadge || undefined,
        matchTime: event.strTimestamp || new Date().toISOString(),
        venue: event.strVenue || undefined,
        status: event.strStatus === 'Match Finished' ? 'finished' : event.strStatus === 'Not Started' ? 'upcoming' : 'live',
      })
    }
  } catch (err) {
    console.error('Football API error:', err)
  }

  return matches
}

async function fetchCricketMatches(apiKey: string): Promise<ApiMatch[]> {
  if (!apiKey) return []

  const matches: ApiMatch[] = []

  try {
    const res = await fetch(`https://api.cricapi.com/v1/matches?apikey=${apiKey}&offset=0`, {
      headers: { 'User-Agent': 'SportsReminder/1.0' },
    })

    if (!res.ok) return []

    const data = await res.json()
    if (!data.data) return []

    for (const match of data.data) {
      if (!match.teams || match.teams.length < 2) continue

      matches.push({
        externalId: `cricket-${match.id}`,
        sport: 'cricket',
        league: match.series || 'Cricket',
        team1: match.teams[0] || 'TBD',
        team2: match.teams[1] || 'TBD',
        team1Logo: match.teamInfo?.[0]?.img || undefined,
        team2Logo: match.teamInfo?.[1]?.img || undefined,
        matchTime: match.dateTimeGMT || new Date().toISOString(),
        venue: match.venue || undefined,
        status: match.matchStarted && !match.matchEnded ? 'live' : match.matchEnded ? 'finished' : 'upcoming',
      })
    }
  } catch (err) {
    console.error('Cricket API error:', err)
  }

  return matches
}

export async function fetchAndSaveMatches(): Promise<{ fetched: number; saved: number }> {
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['football_api_key', 'cricket_api_key'])

  const config: Record<string, string> = {}
  for (const s of settings || []) config[s.key] = s.value || ''

  const footballKey = process.env.FOOTBALL_API_KEY || config.football_api_key || ''
  const cricketKey = process.env.CRICKET_API_KEY || config.cricket_api_key || ''

  const [footballMatches, cricketMatches] = await Promise.all([
    fetchFootballMatches(footballKey),
    fetchCricketMatches(cricketKey),
  ])

  const allMatches = [...footballMatches, ...cricketMatches]
  const favorites = await getFavoriteTeams()
  const filtered = favorites.length > 0 ? allMatches.filter(m => matchesFavorite(m, favorites)) : allMatches

  let saved = 0

  for (const match of filtered) {
    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .eq('external_id', match.externalId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('matches')
        .update({ status: match.status })
        .eq('id', existing.id)
      continue
    }

    const { error } = await supabase.from('matches').insert({
      sport: match.sport,
      league: match.league,
      team1: match.team1,
      team2: match.team2,
      team1_logo: match.team1Logo || null,
      team2_logo: match.team2Logo || null,
      match_time: match.matchTime,
      venue: match.venue || null,
      status: match.status,
      external_id: match.externalId,
      published: false,
    })

    if (!error) {
      saved++
      console.log(`Saved: ${match.team1} vs ${match.team2} (${match.league})`)
    }
  }

  if (saved > 0) {
    const msg = `📋 <b>Match Fetch Complete</b>\n\nFetched: ${allMatches.length}\nFiltered: ${filtered.length}\nNew saved: ${saved}`
    const sent = await sendTelegramMessage(msg)
    await logNotification('general', `Fetched ${allMatches.length} matches, saved ${saved} new`, undefined, sent)
  }

  console.log(`Match fetch: ${allMatches.length} fetched, ${filtered.length} filtered, ${saved} saved`)
  return { fetched: allMatches.length, saved }
}
