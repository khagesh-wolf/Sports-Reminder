const SHEETDB_API_URL = process.env.SHEETDB_API_URL || ''

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
  if (!SHEETDB_API_URL) {
    console.warn('SHEETDB_API_URL not configured')
    return []
  }

  try {
    const res = await fetch(`${SHEETDB_API_URL}?sheet=Matches`)
    if (!res.ok) throw new Error(`SheetDB responded ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch sheet matches:', err)
    return []
  }
}

export async function getSheetStreams(): Promise<SheetStream[]> {
  if (!SHEETDB_API_URL) {
    console.warn('SHEETDB_API_URL not configured')
    return []
  }

  try {
    const res = await fetch(`${SHEETDB_API_URL}?sheet=Streams`)
    if (!res.ok) throw new Error(`SheetDB responded ${res.status}`)
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
  if (!SHEETDB_API_URL) return []

  try {
    const res = await fetch(`${SHEETDB_API_URL}/search?Match_ID=${encodeURIComponent(matchId)}&sheet=Streams`)
    if (!res.ok) throw new Error(`SheetDB responded ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch sheet streams for match:', err)
    return []
  }
}
