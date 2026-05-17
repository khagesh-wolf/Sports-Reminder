const SHEETDB_API_URL = process.env.SHEETDB_API_URL || ''
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '1RthMctHFdKX7yEznC25Va8weBKwjchXCvXS4f4QCl6U'
const OPENSHEET_BASE = 'https://opensheet.elk.sh'

export interface SheetMatch {
  Tournament: string
  Team1_Name: string
  Team1_Logo: string
  Team2_Name: string
  Team2_Logo: string
  Start_Time: string
  End_Time: string
  BG_Image: string
  Category: string
  Match_ID: string
}

export interface SheetStream {
  id: string
  url: string
  type: string
  Server_Name: string
  Match_ID: string
  kid: string
  key: string
}

export async function getSheetMatches(): Promise<SheetMatch[]> {
  try {
    const res = await fetch(`${OPENSHEET_BASE}/${GOOGLE_SHEETS_ID}/Matches`)
    if (!res.ok) throw new Error(`opensheet responded ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch sheet matches:', err)
    return []
  }
}

export async function getSheetStreams(): Promise<SheetStream[]> {
  try {
    const res = await fetch(`${OPENSHEET_BASE}/${GOOGLE_SHEETS_ID}/Streams`)
    if (!res.ok) throw new Error(`opensheet responded ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch sheet streams:', err)
    return []
  }
}

export async function addMatchToSheet(match: SheetMatch): Promise<boolean> {
  if (!SHEETDB_API_URL) {
    throw new Error('SHEETDB_API_URL not configured')
  }

  const res = await fetch(`${SHEETDB_API_URL}?sheet=Matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [match] }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SheetDB error: ${text}`)
  }

  return true
}

export async function getSheetStreamsByMatchId(matchId: string): Promise<SheetStream[]> {
  try {
    const all = await getSheetStreams()
    return all.filter(s => s.Match_ID === matchId)
  } catch (err) {
    console.error('Failed to fetch sheet streams for match:', err)
    return []
  }
}
