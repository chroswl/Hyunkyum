import { Production, Performance } from '../types';
import { normalizeProduction } from './scheduleUtils';

export interface ParsedScheduleResult {
  methodUsed: 'local-ai' | 'deterministic-fallback';
  production: Production;
  detectedPerformancesCount: number;
  confidenceNotes: string[];
}

/**
 * Main parser entry point: attempts browser-local AI first,
 * then gracefully falls back to the deterministic parser.
 */
export async function parseScheduleText(rawText: string): Promise<ParsedScheduleResult> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Input text is empty.');
  }

  // 1. Try Browser-Local AI if available
  try {
    const localAiResult = await tryBrowserLocalAi(trimmed);
    if (localAiResult && localAiResult.production.performances.length > 0) {
      return localAiResult;
    }
  } catch (err) {
    console.warn('Local browser AI unavailable or failed, falling back to deterministic parser:', err);
  }

  // 2. Deterministic Fallback Parser
  return parseDeterministic(trimmed);
}

/**
 * Attempts to use browser-local AI (such as Chrome's built-in window.ai / Prompt API).
 * Never makes external network requests or calls third-party APIs.
 */
async function tryBrowserLocalAi(text: string): Promise<ParsedScheduleResult | null> {
  if (typeof window === 'undefined') return null;

  const win = window as any;
  let session: any = null;

  try {
    if (win.ai?.languageModel?.create) {
      const capabilities = await win.ai.languageModel.capabilities?.();
      if (capabilities && capabilities.available === 'no') {
        return null;
      }
      session = await win.ai.languageModel.create({
        systemPrompt: 'You are a theatre schedule data parser. Return strictly raw valid JSON with no markdown and no backticks.'
      });
    } else if (win.ai?.createTextSession) {
      session = await win.ai.createTextSession();
    } else if (win.model?.generateText) {
      session = {
        prompt: async (p: string) => {
          const res = await win.model.generateText({ prompt: p });
          return typeof res === 'string' ? res : res.text;
        }
      };
    }

    if (!session || typeof session.prompt !== 'function') {
      return null;
    }

    const promptText = `Extract structured theatre production and performance schedule from this text:
"""
${text}
"""

Output JSON format strictly matching this structure:
{
  "title": "Title of the production or opera",
  "role": "Role performed (e.g., Erster Raben, Figaro, Don Giovanni)",
  "location": "Venue, Theatre or City (e.g., Pfalztheater, Kaiserslautern)",
  "category": "Opera" | "Concert" | "Recital" | "Gala",
  "generalLink": "URL if present, or empty string",
  "season": "e.g. 2026/27 if present, or empty string",
  "performances": [
    {
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM (24-hour format if available, store only start time)",
      "venue": "Specific stage or theatre name",
      "city": "City name",
      "ticketUrl": "Exact URL from text if available",
      "ticketStatus": "available" | "sold_out" | "few_tickets" | "no_ticket" | "free" | "cancelled",
      "isPremiere": boolean (true for the first performance or if marked as Premiere/UA),
      "notes": "any special notes (excluding Premiere)"
    }
  ]
}`;

    const response = await session.prompt(promptText);
    if (!response) return null;

    // Clean JSON response (strip markdown wrappers if any)
    const cleaned = response
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const titleStr = parsed.title || '';
    const roleStr = parsed.role || '';
    const locStr = parsed.location || '';

    const perfs: Performance[] = Array.isArray(parsed.performances)
      ? parsed.performances.map((p: any, idx: number) => ({
          id: `perf-ai-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
          date: p.date,
          startTime: p.startTime ? p.startTime.substring(0, 5) : '',
          venue: p.venue || '',
          city: p.city || '',
          ticketUrl: p.ticketUrl || '',
          ticketStatus: p.ticketStatus || (p.ticketUrl ? 'available' : 'no_ticket'),
          isPremiere: typeof p.isPremiere === 'boolean' ? p.isPremiere : idx === 0,
          notes: p.notes || ''
        }))
      : [];

    const production: Production = normalizeProduction({
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: { EN: titleStr, DE: titleStr, KO: titleStr },
      role: { EN: roleStr, DE: roleStr, KO: roleStr },
      location: { EN: locStr, DE: locStr, KO: locStr },
      category: parsed.category || 'Opera',
      generalLink: parsed.generalLink || '',
      season: parsed.season || '',
      performances: perfs
    });

    if (session.destroy) {
      session.destroy();
    }

    return {
      methodUsed: 'local-ai',
      production,
      detectedPerformancesCount: production.performances.length,
      confidenceNotes: ['Parsed using on-device Local AI']
    };
  } catch (e) {
    if (session?.destroy) {
      try { session.destroy(); } catch {}
    }
    return null;
  }
}

/**
 * Cleans Markdown formatting from a table cell or string.
 * e.g. "**19:00**" -> "19:00", "*Werkstattbühne*" -> "Werkstattbühne"
 */
function cleanMarkdownCell(cell: string): string {
  if (!cell) return '';
  return cell
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text**
    .replace(/__(.*?)__/g, '$1')     // Bold __text__
    .replace(/\*(.*?)\*/g, '$1')     // Italic *text*
    .replace(/_(.*?)_/g, '$1')       // Italic _text_
    .replace(/`([^`]+)`/g, '$1')     // Inline code `text`
    .trim();
}

const WEEKDAY_NAMES = [
  'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonnabend', 'sonntag',
  'mo', 'di', 'mi', 'do', 'fr', 'sa', 'so',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
];

/**
 * Checks whether a string is solely a weekday name or weekday abbreviation.
 */
function isWeekday(str: string): boolean {
  if (!str) return false;
  const clean = str.trim().toLowerCase().replace(/[,.:]+$/, '');
  return WEEKDAY_NAMES.includes(clean);
}

/**
 * Strips leading German/English weekday prefixes from a string.
 */
function stripWeekdayPrefix(str: string): string {
  if (!str) return '';
  return str.replace(/^(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sonntag|mo|di|mi|do|fr|sa|so|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[,.\s]+/i, '').trim();
}

/**
 * Builds a dictionary of venue -> city mappings from location reference lines in the source.
 */
function buildLocationMap(lines: string[]): { [key: string]: { venue: string; city: string } } {
  const map: { [key: string]: { venue: string; city: string } } = {};

  for (const line of lines) {
    if (!line) continue;
    const cleanLine = line.replace(/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:location|ort|spielort|theatre|theater|venue):\s*/i, '').trim();
    if (!cleanLine.includes(',')) continue;
    // Skip if contains date, time or URL
    if (/\d{1,2}\.\d{1,2}\.\d{2,4}/.test(cleanLine) || /\d{1,2}:\d{2}/.test(cleanLine) || /^https?:\/\//i.test(cleanLine)) continue;

    const parts = cleanLine.split(',').map(s => cleanMarkdownCell(s)).filter(Boolean);
    if (parts.length >= 2) {
      const v = parts[0].trim();
      const c = parts[1].trim();
      if (v && c && !isWeekday(v) && !isWeekday(c)) {
        map[v.toLowerCase()] = { venue: v, city: c };
        map[c.toLowerCase()] = { venue: v, city: c };
      }
    }
  }

  return map;
}

/**
 * Resolves the city for a venue based on document location mapping, known theatre rules, or fallback city.
 */
function resolveCityForVenue(venue: string, locationMap: { [key: string]: { venue: string; city: string } }, defaultCity: string): string {
  if (!venue) return defaultCity;
  const vLower = venue.toLowerCase();
  
  if (locationMap[vLower]) {
    return locationMap[vLower].city;
  }

  for (const [key, loc] of Object.entries(locationMap)) {
    if (vLower.includes(key) || key.includes(vLower)) {
      return loc.city;
    }
  }

  if (vLower.includes('pfalzbau')) return 'Ludwigshafen';
  if (vLower.includes('pfalztheater') || vLower.includes('werkstattbühne') || vLower.includes('werkstattbuehne')) return 'Kaiserslautern';

  return defaultCity;
}

/**
 * Normalizes venue and city so that the city name is not duplicated inside the venue string.
 * Example:
 *   venue = "Theater im Pfalzbau Ludwigshafen", city = "" -> venue: "Theater im Pfalzbau", city: "Ludwigshafen"
 *   venue = "Theater im Pfalzbau Ludwigshafen", city = "Ludwigshafen" -> venue: "Theater im Pfalzbau", city: "Ludwigshafen"
 *   venue = "Werkstattbühne", city = "Kaiserslautern" -> venue: "Werkstattbühne", city: "Kaiserslautern"
 */
function normalizeVenueAndCity(
  rawVenue: string,
  rawCity: string,
  locationMap: { [key: string]: { venue: string; city: string } },
  defaultCity: string
): { venue: string; city: string } {
  let v = (rawVenue || '').trim(); console.log("normalizeVenueAndCity start:", v);
  let c = (rawCity || '').trim();

  // 1. Initial resolution of city if empty
  if (!c) {
    c = resolveCityForVenue(v, locationMap, defaultCity);
  }

  // 2. If venue has separator (comma or pipe), split
  if (v.includes(',') || v.includes('|')) {
    const parts = v.split(/[,|]/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      v = parts[0];
      if (!c || c === defaultCity) c = parts[1];
    }
  }

  // 3. Build candidate cities from document location map, known cities, or current city
  const candidateCities = new Set<string>();
  if (c) candidateCities.add(c);
  if (defaultCity) candidateCities.add(defaultCity);
  for (const loc of Object.values(locationMap)) {
    if (loc.city) candidateCities.add(loc.city);
  }
  candidateCities.add('Ludwigshafen');
  candidateCities.add('Kaiserslautern');
  candidateCities.add('Berlin');
  candidateCities.add('München');
  candidateCities.add('Hamburg');
  candidateCities.add('Frankfurt');
  candidateCities.add('Köln');
  candidateCities.add('Stuttgart');
  candidateCities.add('Wien');
  candidateCities.add('Zürich');

  // Check if venue ends with any candidate city
  for (const cityName of candidateCities) {
    if (!cityName) continue;
    const endRegex = new RegExp(`[,\\s\\-–]+${cityName}\\s*$`, 'i');
    if (endRegex.test(v)) {
      v = v.replace(endRegex, '').trim();
      if (!c) c = cityName;
      break;
    }
  }

  // 4. If c is set and still contained inside v, remove it from v
  if (c && v) {
    const cityWordRegex = new RegExp(`\\b${c}\\b`, 'gi');
    const stripped = v.replace(cityWordRegex, '').replace(/[,\s\-–]+$/, '').trim();
    if (stripped.length > 0 && stripped !== v) {
      v = stripped;
    }
  }

  console.log("normalizeVenueAndCity end:", v); return { venue: v, city: c };
}

/**
 * Calculates start index accounting for preceding weekday on the same line.
 */
function getPrecedingWeekdayOffset(fullText: string, matchIndex: number): number {
  const textBefore = fullText.substring(0, matchIndex);
  const lastLine = textBefore.split(/\r?\n/).pop() || '';
  const weekdayMatch = lastLine.match(/(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sonntag|mo|di|mi|do|fr|sa|so|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[,.\s]*$/i);
  if (weekdayMatch) {
    return matchIndex - weekdayMatch[0].length;
  }
  return matchIndex;
}

/**
 * Strips metadata prefixes and formatting from production title.
 * Handles:
 * - "# Fliegen die Raben noch? (UA)" -> "Fliegen die Raben noch? (UA)"
 * - "Title: Fliegen die Raben noch? (UA)" -> "Fliegen die Raben noch? (UA)"
 * - "- Title: Fliegen die Raben noch? (UA)" -> "Fliegen die Raben noch? (UA)"
 * - "* Title: Fliegen die Raben noch? (UA)" -> "Fliegen die Raben noch? (UA)"
 * - "Production: Fliegen die Raben noch? (UA)" -> "Fliegen die Raben noch? (UA)"
 * - "- Production: Fliegen die Raben noch? (UA)" -> "Fliegen die Raben noch? (UA)"
 */
function cleanTitleString(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  // Strip Markdown header markers: #, ##, ###
  cleaned = cleaned.replace(/^#{1,6}\s+/, '');
  // Strip bullet markers: -, *, •
  cleaned = cleaned.replace(/^[-*•]\s+/, '');
  // Strip metadata key prefixes: "Title:", "Titel:", "Production:", "Produktion:", "Piece:", "Stück:", "Oper:", "Opera:", "Werk:"
  cleaned = cleaned.replace(/^(?:production|produktion|title|titel|piece|stück|oper|opera|werk):\s*/i, '');
  // Strip bold/italic markdown wrapping if surrounding entire title
  if ((cleaned.startsWith('**') && cleaned.endsWith('**')) || (cleaned.startsWith('__') && cleaned.endsWith('__'))) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if ((cleaned.startsWith('*') && cleaned.endsWith('*')) || (cleaned.startsWith('_') && cleaned.endsWith('_'))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.trim();
}

/**
 * Strips metadata prefixes and formatting from role string.
 * Handles:
 * - "Role: Erster Raben" -> "Erster Raben"
 * - "- Role: Erster Raben" -> "Erster Raben"
 * - "Rolle: Erster Raben" -> "Erster Raben"
 * - "- Rolle: Erster Raben" -> "Erster Raben"
 */
function cleanRoleString(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^#{1,6}\s+/, '');
  cleaned = cleaned.replace(/^[-*•]\s+/, '');
  cleaned = cleaned.replace(/^(?:role|rolle|part|partie|as|als|character):\s*/i, '');
  if ((cleaned.startsWith('**') && cleaned.endsWith('**')) || (cleaned.startsWith('__') && cleaned.endsWith('__'))) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if ((cleaned.startsWith('*') && cleaned.endsWith('*')) || (cleaned.startsWith('_') && cleaned.endsWith('_'))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.trim();
}

interface ExtractedTicketInfo {
  ticketUrl: string;
  ticketStatus: 'available' | 'sold_out' | 'few_tickets' | 'no_ticket' | 'free' | 'cancelled';
}

/**
 * Extracts ticket URL and status from cell/line/block text.
 * Preserves exact URL (including query parameters like ?event=6095).
 * Parses:
 * - [Ausverkauft](https://...) -> status = 'sold_out', url = 'https://...'
 * - [Tickets](https://...) -> status = 'available', url = 'https://...'
 * - Plain URLs -> status = 'available', url = 'https://...'
 * - Status keywords (Ausverkauft, Restkarten, Abgesagt, Kostenlos)
 */
function extractTicketInfo(source: string): ExtractedTicketInfo {
  if (!source) {
    return { ticketUrl: '', ticketStatus: 'no_ticket' };
  }

  let ticketUrl = '';
  let ticketLabel = '';

  // 1. Markdown link: [Label](URL)
  // Preserves full URL including ?, =, &, #, etc.
  const mdUrlMatch = source.match(/\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/i);
  if (mdUrlMatch) {
    ticketLabel = mdUrlMatch[1].trim();
    ticketUrl = mdUrlMatch[2].trim();
  } else {
    // 2. Plain URL
    const plainUrlMatch = source.match(/https?:\/\/[^\s\)\>\]]+/i);
    if (plainUrlMatch) {
      ticketUrl = plainUrlMatch[0].trim();
    }
  }

  // 3. Determine status from label or full text
  const textToScan = `${ticketLabel} ${source}`.toLowerCase();

  let ticketStatus: 'available' | 'sold_out' | 'few_tickets' | 'no_ticket' | 'free' | 'cancelled' = 'no_ticket';

  if (/ausverkauft|sold\s*out|sold_out/i.test(textToScan)) {
    ticketStatus = 'sold_out';
  } else if (/restkarten|few\s*tickets|limited/i.test(textToScan)) {
    ticketStatus = 'few_tickets';
  } else if (/abgesagt|cancelled|canceled/i.test(textToScan)) {
    ticketStatus = 'cancelled';
  } else if (/kostenlos|freier\s*eintritt|free\s*entry/i.test(textToScan)) {
    ticketStatus = 'free';
  } else if (ticketUrl || /tickets?|karten|vorverkauf|buchen/i.test(textToScan)) {
    ticketStatus = 'available';
  }

  return { ticketUrl, ticketStatus };
}

/**
 * Parses a date string into standard ISO YYYY-MM-DD.
 * Supports DD.MM.YYYY, YYYY-MM-DD, DD/MM/YYYY.
 */
function parseDateString(rawDate: string): string | null {
  const cleaned = cleanMarkdownCell(rawDate).replace(/[^\d.\/\-]/g, '').trim();

  // DD.MM.YYYY (e.g. 09.10.2026 or 9.10.2026)
  const dotMatch = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    const day = dotMatch[1].padStart(2, '0');
    const month = dotMatch[2].padStart(2, '0');
    const year = dotMatch[3];
    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // YYYY-MM-DD (e.g. 2026-10-09)
  const dashMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (dashMatch) {
    const year = dashMatch[1];
    const month = dashMatch[2].padStart(2, '0');
    const day = dashMatch[3].padStart(2, '0');
    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // DD/MM/YYYY (e.g. 09/10/2026)
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Extracts ONLY startTime (HH:MM) from raw text/cell.
 * e.g. "**19:00**" -> "19:00", "19:00 – 21:00 Uhr" -> "19:00", "18:00 Uhr" -> "18:00"
 */
function parseStartTime(rawTime: string): string {
  const cleaned = cleanMarkdownCell(rawTime);
  if (!cleaned) return '';

  // Match time range: "19:00 - 21:00" -> extract ONLY "19:00"
  const rangeMatch = cleaned.match(/(?:um\s*|at\s*)?(\d{1,2}):(\d{2})\s*(?:[–—\-]|bis|to)\s*(\d{1,2}):(\d{2})/i);
  if (rangeMatch) {
    const sh = rangeMatch[1].padStart(2, '0');
    const sm = rangeMatch[2];
    return `${sh}:${sm}`;
  }

  // Match single time with colon: "19:00" or "19:00 Uhr"
  const singleMatch = cleaned.match(/(?:um\s*|at\s*)?(\d{1,2}):(\d{2})\s*(?:uhr|h\b)?/i);
  if (singleMatch) {
    const sh = singleMatch[1].padStart(2, '0');
    const sm = singleMatch[2];
    return `${sh}:${sm}`;
  }

  // Match single time with dot: "19.00 Uhr"
  const dotTimeMatch = cleaned.match(/(?:um\s*|at\s*)?(\d{1,2})\.(\d{2})\s*(?:uhr|h\b)/i);
  if (dotTimeMatch) {
    const sh = dotTimeMatch[1].padStart(2, '0');
    const sm = dotTimeMatch[2];
    return `${sh}:${sm}`;
  }

  return '';
}

/**
 * Deterministic Parser:
 * Accurately parses German, English, and international theatre schedules.
 * Supports:
 * 1. Markdown table input (e.g. | 1 | 09.10.2026 | **19:00** | Werkstattbühne | Kaiserslautern |)
 * 2. Raw multi-line theatre text input
 * GUARANTEES:
 * - DD.MM.YYYY is NEVER interpreted as a time (e.g. 09.10.2026 is never 09:10).
 * - "19:00 - 21:00" produces startTime = "19:00" only. No endTime.
 * - Extracts date, startTime, venue, city, ticketUrl, ticketStatus, isPremiere, notes.
 * - Preserves Production title exactly as provided, including "(UA)" when present.
 */
export function parseDeterministic(text: string): ParsedScheduleResult {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map(l => l.trim());
  const confidenceNotes: string[] = [];

  let extractedTitle = '';
  let extractedRole = '';
  let extractedLocation = '';
  let extractedCategory: 'Opera' | 'Concert' | 'Recital' | 'Gala' = 'Opera';
  let extractedGeneralLink = '';
  let extractedSeason = '';

  const monthMap: { [key: string]: string } = {
    'jan': '01', 'januar': '01', 'january': '01', 'jänner': '01',
    'feb': '02', 'februar': '02', 'february': '02',
    'mär': '03', 'maer': '03', 'märz': '03', 'mar': '03', 'march': '03',
    'apr': '04', 'april': '04',
    'mai': '05', 'may': '05',
    'jun': '06', 'juni': '06', 'june': '06',
    'jul': '07', 'juli': '07', 'july': '07',
    'aug': '08', 'august': '08',
    'sep': '09', 'sept': '09', 'september': '09',
    'okt': '10', 'oct': '10', 'oktober': '10', 'october': '10',
    'nov': '11', 'november': '11',
    'dez': '12', 'dec': '12', 'dezember': '12', 'december': '12'
  };

  // 1. First pass: extract header/metadata fields
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Production / Title with explicit prefix
    if (/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:production|produktion|title|titel|piece|stück|oper|opera|werk):\s*(.+)$/i.test(line)) {
      extractedTitle = cleanTitleString(line);
      continue;
    }

    // Markdown H1/H2 header as Title (e.g. "# Fliegen die Raben noch? (UA)")
    const mdHeaderMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (mdHeaderMatch && mdHeaderMatch[1]) {
      const candidate = mdHeaderMatch[1].trim();
      // Skip section headers like "# Termine", "# Vorstellungen", "# Schedule", "# Dates", "# Cast"
      if (!/^(?:performances|termine|vorstellungen|dates|schedule|aufführungen|besetzung|cast)/i.test(candidate)) {
        if (!extractedTitle) {
          extractedTitle = cleanTitleString(candidate);
          continue;
        }
      }
    }

    // Role (e.g. "Role: Erster Raben", "- Role: Erster Raben", "Rolle: Erster Raben")
    if (/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:role|rolle|part|partie|as|als|character):\s*(.+)$/i.test(line)) {
      extractedRole = cleanRoleString(line);
      continue;
    }

    // Location / Venue
    const locMatch = line.match(/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:location|ort|theatre|theater|venue|spielort|haus|bühne|city|stadt):\s*(.+)$/i);
    if (locMatch && locMatch[1]) {
      extractedLocation = locMatch[1].trim();
      continue;
    }

    // Category
    const catMatch = line.match(/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:category|kategorie|genre):\s*(.+)$/i);
    if (catMatch && catMatch[1]) {
      const val = catMatch[1].toLowerCase();
      if (val.includes('concert') || val.includes('konzert')) extractedCategory = 'Concert';
      else if (val.includes('recital') || val.includes('liederabend')) extractedCategory = 'Recital';
      else if (val.includes('gala')) extractedCategory = 'Gala';
      else extractedCategory = 'Opera';
      continue;
    }

    // Season
    const seasonMatch = line.match(/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:season|spielzeit|saison):\s*(.+)$/i);
    if (seasonMatch && seasonMatch[1]) {
      extractedSeason = seasonMatch[1].trim();
      continue;
    }

    // General URL
    const genUrlMatch = line.match(/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:link|website|url):\s*(https?:\/\/[^\s]+)$/i);
    if (genUrlMatch && genUrlMatch[1]) {
      extractedGeneralLink = genUrlMatch[1].trim();
      continue;
    }

    // Multi-line header format (e.g. "Title:\nFliegen die Raben noch?")
    if (i < lines.length - 1 && lines[i + 1]) {
      const nextLine = lines[i + 1];
      if (/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:production|produktion|title|titel|oper|opera|stück|werk):?$/i.test(line)) {
        extractedTitle = cleanTitleString(nextLine);
        i++;
        continue;
      }
      if (/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:role|rolle|part|partie|character):?$/i.test(line)) {
        extractedRole = cleanRoleString(nextLine);
        i++;
        continue;
      }
      if (/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:location|ort|theatre|theater|venue|spielort|haus|stadt|city):?$/i.test(line)) {
        extractedLocation = nextLine.trim();
        i++;
        continue;
      }
      if (/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:season|spielzeit|saison):?$/i.test(line)) {
        extractedSeason = nextLine.trim();
        i++;
        continue;
      }
    }
  }

  // Default venue and city from production location if available
  let defaultVenue = '';
  let defaultCity = '';
  const locationMap = buildLocationMap(lines);

  if (extractedLocation) {
    if (extractedLocation.includes('|')) {
      const parts = extractedLocation.split('|').map(s => s.trim()).filter(Boolean);
      defaultVenue = parts[0] || '';
      defaultCity = parts[1] || '';
    } else if (extractedLocation.includes(',')) {
      const parts = extractedLocation.split(',').map(s => s.trim()).filter(Boolean);
      defaultVenue = parts[0] || '';
      defaultCity = parts[1] || '';
    } else {
      defaultVenue = extractedLocation;
      defaultCity = resolveCityForVenue(defaultVenue, locationMap, '');
    }
  }

  if (!defaultCity) {
    const firstLoc = Object.values(locationMap)[0];
    if (firstLoc) {
      if (!defaultVenue) defaultVenue = firstLoc.venue;
      defaultCity = firstLoc.city;
    }
  }

  let detectedPerformances: Performance[] = [];

  // 2. CHECK FOR MARKDOWN TABLE INPUT
  // A Markdown table contains lines with pipes `|` and date cells
  const potentialTableLines: string[] = [];
  for (const line of lines) {
    if (line.includes('|')) {
      // Exclude pure separator lines like |---|---|---|
      if (!/^\s*\|?[\s\-:|]+\|?\s*$/.test(line)) {
        potentialTableLines.push(line);
      }
    }
  }

  // Check if any table line contains a valid date
  const hasMarkdownTableDates = potentialTableLines.some(line => {
    const rawCells = line.split('|');
    return rawCells.some(c => parseDateString(c) !== null);
  });

  if (hasMarkdownTableDates) {
    // PARSE VIA MARKDOWN TABLE COLUMN MAPPING
    let headerDateCol = -1;
    let headerTimeCol = -1;
    let headerVenueCol = -1;
    let headerCityCol = -1;
    let headerTicketCol = -1;
    let headerNotesCol = -1;
    let headerRowNumCol = -1;

    for (let lineIdx = 0; lineIdx < potentialTableLines.length; lineIdx++) {
      const line = potentialTableLines[lineIdx];
      let rawCells = line.split('|').map(c => cleanMarkdownCell(c));
      
      // Remove leading and trailing empty cell if line had outer pipes
      if (line.trim().startsWith('|') && rawCells.length > 0 && rawCells[0] === '') {
        rawCells.shift();
      }
      if (line.trim().endsWith('|') && rawCells.length > 0 && rawCells[rawCells.length - 1] === '') {
        rawCells.pop();
      }

      if (rawCells.length === 0) continue;

      // Check if this is a header row
      const isHeader = rawCells.some(c => /^(?:#|nr\.?|no\.?|date|datum|termin|start\s*time|time|zeit|uhrzeit|beginn|venue|spielort|bühne|stage|theater|theatre|city|stadt|tickets?|karten|status)$/i.test(c));
      if (isHeader && !rawCells.some(c => parseDateString(c) !== null)) {
        // Record column mappings from header row
        rawCells.forEach((c, idx) => {
          const lc = c.toLowerCase();
          if (/^(?:#|nr\.?|no\.?|index)$/i.test(lc)) headerRowNumCol = idx;
          else if (/^(?:date|datum|termin)$/i.test(lc)) headerDateCol = idx;
          else if (/^(?:start\s*time|time|zeit|uhrzeit|beginn)$/i.test(lc)) headerTimeCol = idx;
          else if (/^(?:venue|spielort|bühne|stage|theater|theatre|haus|ort)$/i.test(lc)) headerVenueCol = idx;
          else if (/^(?:city|stadt)$/i.test(lc)) headerCityCol = idx;
          else if (/^(?:tickets?|karten|ticket\s*status|link)$/i.test(lc)) headerTicketCol = idx;
          else if (/^(?:notes?|hinweis|bemerkung)$/i.test(lc)) headerNotesCol = idx;
        });
        continue;
      }

      // Check if this row has a date
      let parsedDate: string | null = null;
      let dateCellIndex = -1;

      if (headerDateCol !== -1 && rawCells[headerDateCol]) {
        parsedDate = parseDateString(rawCells[headerDateCol]);
        if (parsedDate) dateCellIndex = headerDateCol;
      }

      if (!parsedDate) {
        // Search through all cells for a date
        for (let cIdx = 0; cIdx < rawCells.length; cIdx++) {
          const d = parseDateString(rawCells[cIdx]);
          if (d) {
            parsedDate = d;
            dateCellIndex = cIdx;
            break;
          }
        }
      }

      if (!parsedDate) continue; // Not a performance row

      // Determine columns
      let startTime = '';
      let venue = '';
      let city = '';
      let ticketUrl = '';
      let ticketStatus: 'available' | 'sold_out' | 'few_tickets' | 'no_ticket' | 'free' | 'cancelled' = 'no_ticket';
      let notes = '';

      if (headerTimeCol !== -1 && rawCells[headerTimeCol]) {
        startTime = parseStartTime(rawCells[headerTimeCol]);
      }
      if (headerVenueCol !== -1 && rawCells[headerVenueCol]) {
        const vCell = rawCells[headerVenueCol];
        if (!isWeekday(vCell)) venue = vCell;
      }
      if (headerCityCol !== -1 && rawCells[headerCityCol]) {
        const cCell = rawCells[headerCityCol];
        if (!isWeekday(cCell)) city = cCell;
      }
      if (headerTicketCol !== -1 && rawCells[headerTicketCol]) {
        const ticketInfo = extractTicketInfo(rawCells[headerTicketCol]);
        ticketUrl = ticketInfo.ticketUrl;
        ticketStatus = ticketInfo.ticketStatus;
      }
      if (headerNotesCol !== -1 && rawCells[headerNotesCol]) {
        notes = rawCells[headerNotesCol];
      }

      // If columns were not mapped via header, use standard positioning
      // Standard table layout: | # | Date | Start Time | Venue | City | [Tickets] |
      // Or: | Date | Start Time | Venue | City | [Tickets] |
      if (!startTime || !venue) {
        // Find if cell 0 is row number
        let rowCells = [...rawCells];
        if (rowCells.length >= 2 && /^\d{1,3}$/.test(rowCells[0].trim())) {
          // If cell 0 is a pure number and cell 1 is a date, cell 0 is row number -> ignore
          if (parseDateString(rowCells[1]) !== null) {
            rowCells.shift();
          }
        }

        // Now rowCells:
        // Index 0: Date
        // Index 1: Start Time
        // Index 2: Venue
        // Index 3: City
        // Index 4: Ticket / Status (optional)
        // Index 5: Notes (optional)
        if (rowCells.length >= 2 && !startTime) {
          startTime = parseStartTime(rowCells[1]);
        }
        if (rowCells.length >= 3 && !venue) {
          const v = rowCells[2];
          if (!isWeekday(v)) venue = v;
        }
        if (rowCells.length >= 4 && !city) {
          const c = rowCells[3];
          if (!isWeekday(c)) city = c;
        }
        if (rowCells.length >= 5 && (!ticketUrl || ticketStatus === 'no_ticket')) {
          const ticketInfo = extractTicketInfo(rowCells[4]);
          if (ticketInfo.ticketUrl) ticketUrl = ticketInfo.ticketUrl;
          if (ticketInfo.ticketStatus !== 'no_ticket') ticketStatus = ticketInfo.ticketStatus;
        }
        if (rowCells.length >= 6 && !notes) {
          notes = rowCells.slice(5).join(', ');
        }
      }

      // Check entire row for ticket link or status if still not found
      if (!ticketUrl || ticketStatus === 'no_ticket') {
        const rowTicketInfo = extractTicketInfo(line);
        if (!ticketUrl && rowTicketInfo.ticketUrl) {
          ticketUrl = rowTicketInfo.ticketUrl;
        }
        if (ticketStatus === 'no_ticket' && rowTicketInfo.ticketStatus !== 'no_ticket') {
          ticketStatus = rowTicketInfo.ticketStatus;
        }
      }

      if (!venue) venue = defaultVenue;
      if (!city) city = resolveCityForVenue(venue, locationMap, defaultCity);

      console.log("BEFORE NORMALIZE:", venue); const normalized = normalizeVenueAndCity(venue, city, locationMap, defaultCity);
      venue = normalized.venue;
      city = normalized.city;

      // First performance in the imported list is the Premiere
      const isPremiere = detectedPerformances.length === 0;

      detectedPerformances.push({
        id: `perf-imp-${Date.now()}-${detectedPerformances.length}-${Math.random().toString(36).substr(2, 6)}`,
        date: parsedDate,
        startTime: startTime || '',
        venue: venue || defaultVenue,
        city: city || defaultCity,
        ticketUrl: ticketUrl || '',
        ticketStatus,
        isPremiere,
        notes: notes || ''
      });
    }
  }

  // 3. FALLBACK: MULTI-LINE RAW THEATRE TEXT PARSER (if not parsed via markdown table)
  if (detectedPerformances.length === 0) {
    interface DateMatch {
      dateStr: string;
      rawMatch: string;
      index: number;
      endIndex: number;
    }

    const dateMatches: DateMatch[] = [];

    // Match DD.MM.YYYY (e.g. 09.10.2026 or Freitag, 09.10.2026)
    const ddmmyyyyRegex = /(?:\b|^)(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\b|$)/g;
    let match: RegExpExecArray | null;
    while ((match = ddmmyyyyRegex.exec(text)) !== null) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
        const startIndex = getPrecedingWeekdayOffset(text, match.index);
        dateMatches.push({
          dateStr: `${year}-${month}-${day}`,
          rawMatch: match[0],
          index: startIndex,
          endIndex: match.index + match[0].length
        });
      }
    }

    // Match YYYY-MM-DD (e.g. 2026-10-09)
    const yyyymmddRegex = /(?:\b|^)(\d{4})-(\d{1,2})-(\d{1,2})(?:\b|$)/g;
    while ((match = yyyymmddRegex.exec(text)) !== null) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
        const startIndex = getPrecedingWeekdayOffset(text, match.index);
        if (!dateMatches.some(dm => Math.abs(dm.index - startIndex) < 5)) {
          dateMatches.push({
            dateStr: `${year}-${month}-${day}`,
            rawMatch: match[0],
            index: startIndex,
            endIndex: match.index + match[0].length
          });
        }
      }
    }

    // Match DD/MM/YYYY (e.g. 09/10/2026)
    const slashRegex = /(?:\b|^)(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\b|$)/g;
    while ((match = slashRegex.exec(text)) !== null) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
        const startIndex = getPrecedingWeekdayOffset(text, match.index);
        if (!dateMatches.some(dm => Math.abs(dm.index - startIndex) < 5)) {
          dateMatches.push({
            dateStr: `${year}-${month}-${day}`,
            rawMatch: match[0],
            index: startIndex,
            endIndex: match.index + match[0].length
          });
        }
      }
    }

    // Match Verbal Dates (e.g. 9. Oktober 2026 or 9 October 2026)
    const verbalRegex = /(?:\b|^)(\d{1,2})\.?\s+([A-Za-zäöüÄÖÜß]+)[,.\s]+(\d{4})(?:\b|$)/g;
    while ((match = verbalRegex.exec(text)) !== null) {
      const day = match[1].padStart(2, '0');
      const monthKey = match[2].toLowerCase().substring(0, 3);
      const year = match[3];
      if (monthMap[monthKey]) {
        const startIndex = getPrecedingWeekdayOffset(text, match.index);
        if (!dateMatches.some(dm => Math.abs(dm.index - startIndex) < 5)) {
          dateMatches.push({
            dateStr: `${year}-${monthMap[monthKey]}-${day}`,
            rawMatch: match[0],
            index: startIndex,
            endIndex: match.index + match[0].length
          });
        }
      }
    }

    // Sort dates by position in text
    dateMatches.sort((a, b) => a.index - b.index);

    for (let i = 0; i < dateMatches.length; i++) {
      const current = dateMatches[i];
      const next = dateMatches[i + 1];
      
      const blockStart = current.index;
      const blockEnd = next ? next.index : text.length;
      const blockText = text.substring(blockStart, blockEnd);

      // Remove the date substring from blockText to guarantee date numbers are NEVER parsed as time
      const textWithoutDate = blockText.replace(current.rawMatch, ' ');

      // Time extraction (Store ONLY startTime)
      const startTime = parseStartTime(textWithoutDate);

      // Ticket URL and Status extraction
      const ticketInfo = extractTicketInfo(blockText);
      const ticketUrl = ticketInfo.ticketUrl;
      const ticketStatus = ticketInfo.ticketStatus;

      // Premiere detection: 1st performance in schedule is Premiere
      const isPremiere = i === 0;

      // Venue and City extraction from block lines
      let venue = '';
      let city = '';

      const blockLines = blockText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const rawBLine of blockLines) {
        const bLine = cleanMarkdownCell(rawBLine);
        if (!bLine) continue;

        // Skip metadata headers
        if (/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:production|produktion|title|titel|piece|stück|oper|opera|werk|role|rolle|category|season|spielzeit):/i.test(bLine)) continue;

        // Skip date lines (e.g. Freitag, 09.10.2026 or 09.10.2026)
        if (parseDateString(bLine) !== null || parseDateString(stripWeekdayPrefix(bLine)) !== null) continue;

        // Skip pure weekday lines (e.g. Freitag, Samstag, Samstag,)
        if (isWeekday(bLine) || isWeekday(bLine.replace(/[,.:]+$/, ''))) continue;

        // Skip pure time lines (e.g. 19:00 – 21:00 Uhr or 19:00)
        if (/^\d{1,2}:\d{2}(?:\s*[-–—]\s*\d{1,2}:\d{2})?(?:\s*uhr)?$/i.test(bLine)) continue;

        // Skip standalone ticket buttons/labels
        if (/^(?:ausverkauft|sold\s*out|tickets?|karten|vorverkauf|restkarten|abgesagt|kostenlos|freier\s*eintritt)$/i.test(bLine)) continue;

        // Skip URLs or markdown links
        if (/^https?:\/\//i.test(bLine) || /^\[.*\]\(https?:\/\/.*\)$/i.test(bLine)) continue;

        // Check if line has venue and city (e.g., "Werkstattbühne, Kaiserslautern" or "Werkstattbühne | Kaiserslautern")
        if (bLine.includes('|')) {
          const parts = bLine.split('|').map(s => cleanMarkdownCell(s)).filter(s => {
            if (parseDateString(s) !== null || parseDateString(stripWeekdayPrefix(s)) !== null) return false;
            if (isWeekday(s)) return false;
            if (/^\d{1,2}:\d{2}/.test(s)) return false;
            if (/^https?:\/\//i.test(s)) return false;
            if (/^(?:ausverkauft|sold out|tickets?)$/i.test(s)) return false;
            return s.length > 0;
          });

          if (parts.length >= 2) {
            console.log("VENUE PARTS:", parts); venue = parts[0];
            city = parts[1];
            break;
          } else if (parts.length === 1 && !venue) {
            console.log("VENUE PARTS:", parts); venue = parts[0];
            break;
          }
        } else if (bLine.includes(',')) {
          const parts = bLine.split(',').map(s => cleanMarkdownCell(s)).filter(s => {
            if (parseDateString(s) !== null || parseDateString(stripWeekdayPrefix(s)) !== null) return false;
            if (isWeekday(s)) return false;
            if (/^\d{1,2}:\d{2}/.test(s)) return false;
            if (/^https?:\/\//i.test(s)) return false;
            if (/^(?:ausverkauft|sold out|tickets?)$/i.test(s)) return false;
            return s.length > 0;
          });

          if (parts.length >= 2) {
            console.log("VENUE PARTS:", parts); venue = parts[0];
            city = parts[1];
            break;
          } else if (parts.length === 1 && !venue) {
            console.log("VENUE PARTS:", parts); venue = parts[0];
            break;
          }
        } else {
          // Single standalone line (e.g. "Werkstattbühne" or "Theater im Pfalzbau")
          if (!venue) {
            let candidate = stripWeekdayPrefix(bLine);
            candidate = candidate.replace(/^[-*•]\s+/, '').trim();
            if (candidate && !isWeekday(candidate) && parseDateString(candidate) === null && parseDateString(stripWeekdayPrefix(candidate)) === null) {
              venue = candidate;
              break; // Stop scanning to avoid capturing trailing reference lines
            }
          }
        }
      }

      if (!venue) venue = defaultVenue;
      if (!city) {
        city = resolveCityForVenue(venue, locationMap, defaultCity);
      }

      console.log("BEFORE NORMALIZE:", venue); const normalized = normalizeVenueAndCity(venue, city, locationMap, defaultCity);
      venue = normalized.venue;
      city = normalized.city;

      // Special notes
      let notes = '';
      const noteItems: string[] = [];
      if (/\(?\bWA\b\)?/i.test(blockText) || /wiederaufnahme/i.test(blockText)) noteItems.push('Wiederaufnahme');
      if (/\(?\bDerniere\b\)?/i.test(blockText)) noteItems.push('Derniere');
      if (/matinee/i.test(blockText)) noteItems.push('Matinee');
      if (/gastspiel/i.test(blockText)) noteItems.push('Gastspiel');
      if (noteItems.length > 0) {
        notes = noteItems.join(', ');
      }

      detectedPerformances.push({
        id: `perf-imp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
        date: current.dateStr,
        startTime: startTime || '',
        venue: venue || '',
        city: city || '',
        ticketUrl: ticketUrl || '',
        ticketStatus,
        isPremiere,
        notes
      });
    }
  }

  // 4. INFER TITLE FROM FIRST NON-HEADER LINE (if not explicitly labeled)
  // Preserves title EXACTLY as provided (including "(UA)")
  if (!extractedTitle) {
    for (const line of lines) {
      if (!line) continue;
      // Skip metadata headers
      if (/^(?:#{1,6}\s*)?(?:[-*•]\s*)?(?:production|produktion|title|titel|piece|stück|oper|opera|werk|role|rolle|location|ort|theatre|theater|venue|season|spielzeit|category|link|website|url):/i.test(line)) continue;
      // Skip table rows and separators
      if (line.includes('|') || /^[|\s\-:]+$/.test(line)) continue;
      // Skip lines containing dates or times
      if (/\d{1,2}\.\d{1,2}\.\d{2,4}/.test(line) || /\d{4}-\d{1,2}-\d{1,2}/.test(line) || /\d{1,2}:\d{2}/.test(line)) continue;
      // Skip section headers
      if (/^(?:#{1,6}\s*)?(?:performances|termine|vorstellungen|dates|schedule|aufführungen|besetzung|cast):?$/i.test(line)) continue;
      // Skip URLs
      if (/^https?:\/\//i.test(line)) continue;

      // Keep the exact title string (e.g. "Fliegen die Raben noch? (UA)")
      extractedTitle = cleanTitleString(line);
      if (extractedTitle) break;
    }
  }

  // If production location was not explicitly labeled, populate from first performance's venue/city
  if (!extractedLocation && detectedPerformances.length > 0) {
    const p0 = detectedPerformances[0];
    const locParts = [p0.venue, p0.city].filter(Boolean);
    if (locParts.length > 0) {
      extractedLocation = locParts.join(', ');
    }
  }

  // Detect category keywords in text if not explicitly set
  if (extractedCategory === 'Opera') {
    if (/konzert|concert|sinfonie|orchester/i.test(text)) extractedCategory = 'Concert';
    else if (/liederabend|recital|klavierabend/i.test(text)) extractedCategory = 'Recital';
    else if (/gala|festabend/i.test(text)) extractedCategory = 'Gala';
  }

  // Default date if none detected
  if (detectedPerformances.length === 0) {
    confidenceNotes.push('No explicit performance dates found in text. A default date has been initialized.');
    detectedPerformances.push({
      id: `perf-def-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      startTime: '19:30',
      venue: defaultVenue || '',
      city: defaultCity || '',
      ticketUrl: '',
      ticketStatus: 'no_ticket',
      isPremiere: true,
      notes: ''
    });
  } else {
    confidenceNotes.push(`Detected ${detectedPerformances.length} performance date${detectedPerformances.length > 1 ? 's' : ''}.`);
  }

  const production: Production = normalizeProduction({
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: { EN: extractedTitle, DE: extractedTitle, KO: extractedTitle },
    role: { EN: extractedRole, DE: extractedRole, KO: extractedRole },
    location: { EN: extractedLocation, DE: extractedLocation, KO: extractedLocation },
    category: extractedCategory,
    link: extractedGeneralLink,
    generalLink: extractedGeneralLink,
    season: extractedSeason,
    performances: detectedPerformances
  });

  return {
    methodUsed: 'deterministic-fallback',
    production,
    detectedPerformancesCount: detectedPerformances.length,
    confidenceNotes
  };
}

