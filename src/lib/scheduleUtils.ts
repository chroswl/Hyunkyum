import { Production, Performance } from '../types';

/**
 * Normalizes any production or legacy schedule item into a valid Production object with performances[].
 */
export function normalizeProduction(item: any): Production {
  if (!item) {
    return createEmptyProduction();
  }

  let performances: Performance[] = [];

  if (Array.isArray(item.performances) && item.performances.length > 0) {
    performances = item.performances.map((p: any, idx: number) => {
      // Normalize ticket status
      let ticketStatus = p.ticketStatus || '';
      if (!ticketStatus) {
        ticketStatus = (p.ticketUrl || p.link) ? 'available' : 'no_ticket';
      } else if (ticketStatus === 'Available') {
        ticketStatus = 'available';
      } else if (ticketStatus === 'Sold Out') {
        ticketStatus = 'sold_out';
      } else if (ticketStatus === 'Few Tickets') {
        ticketStatus = 'few_tickets';
      } else if (ticketStatus === 'Cancelled') {
        ticketStatus = 'cancelled';
      } else if (ticketStatus === 'Free') {
        ticketStatus = 'free';
      }

      let venue = p.venue || '';
      
      // Recover truncated venues caused by a previous regex parser bug
      // that stripped trailing characters. If the truncated venue is a prefix 
      // of the full production location, we restore it dynamically.
      if (venue.length > 0 && item.location) {
        for (const locStr of [item.location.EN, item.location.DE]) {
          if (locStr) {
            const fullVenue = locStr.split(/[,|]/)[0].trim();
            if (fullVenue.length > venue.length && fullVenue.startsWith(venue)) {
              venue = fullVenue;
              break;
            }
          }
        }
      }

      return {
        id: p.id || `perf-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
        date: p.date || (item.date ? String(item.date) : new Date().toISOString().split('T')[0]),
        startTime: p.startTime || '',
        venue: venue,
        city: p.city || '',
        ticketUrl: p.ticketUrl || p.link || '',
        ticketStatus,
        isPremiere: typeof p.isPremiere === 'boolean' ? p.isPremiere : idx === 0,
        notes: p.notes || ''
      };
    });
  } else if (item.date) {
    // Legacy single performance document
    const ticketUrl = item.link || '';
    performances = [{
      id: `perf-legacy-${item.id || Date.now()}`,
      date: String(item.date),
      startTime: item.startTime || '',
      venue: '',
      city: '',
      ticketUrl,
      ticketStatus: item.ticketStatus || (ticketUrl ? 'available' : 'no_ticket'),
      isPremiere: true,
      notes: ''
    }];
  }

  // Ensure title, role, location are localized objects
  const normalizeLangObj = (val: any) => {
    if (!val) return { EN: '', DE: '', KO: '' };
    if (typeof val === 'string') {
      return { EN: val, DE: val, KO: val };
    }
    return {
      EN: val.EN || '',
      DE: val.DE || '',
      KO: val.KO || ''
    };
  };

  const validCategories: Array<'Opera' | 'Concert' | 'Recital' | 'Gala'> = ['Opera', 'Concert', 'Recital', 'Gala'];
  const category = validCategories.includes(item.category) ? item.category : 'Opera';

  // Sort performances chronologically
  performances.sort((a, b) => {
    const timeA = a.date + (a.startTime ? `T${a.startTime}` : 'T00:00');
    const timeB = b.date + (b.startTime ? `T${b.startTime}` : 'T00:00');
    return timeA.localeCompare(timeB);
  });

  return {
    id: item.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    order: typeof item.order === 'number' ? item.order : 0,
    title: normalizeLangObj(item.title),
    role: normalizeLangObj(item.role),
    location: normalizeLangObj(item.location),
    category,
    link: item.link || item.generalLink || '',
    generalLink: item.generalLink || item.link || '',
    season: item.season || '',
    performances,
    date: performances[0]?.date || item.date || new Date().toISOString().split('T')[0]
  };
}

export function createEmptyProduction(): Production {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    order: 0,
    title: { EN: '', DE: '', KO: '' },
    role: { EN: '', DE: '', KO: '' },
    location: { EN: '', DE: '', KO: '' },
    category: 'Opera',
    link: '',
    generalLink: '',
    season: '',
    performances: [
      {
        id: `perf-${Date.now()}-0`,
        date: today,
        startTime: '19:30',
        venue: '',
        city: '',
        ticketUrl: '',
        ticketStatus: 'available',
        isPremiere: true,
        notes: ''
      }
    ],
    date: today
  };
}

/**
 * Returns the nearest upcoming performance for a production,
 * prioritizing a future Premiere if one exists.
 * If all performances are in the past, returns the most recent past performance.
 */
export function getNearestUpcomingPerformance(production: Production, referenceDate: Date = new Date()): {
  performance: Performance | null;
  isUpcoming: boolean;
} {
  if (!production.performances || production.performances.length === 0) {
    return { performance: null, isUpcoming: false };
  }

  const todayStr = referenceDate.toISOString().split('T')[0];
  
  // Find all performances on or after today
  const upcoming = production.performances.filter(p => p.date >= todayStr);
  
  if (upcoming.length > 0) {
    // 1. If there's a Premiere in the future, it should be the main performance
    const futurePremiere = upcoming.find(p => p.isPremiere);
    if (futurePremiere) {
      return { performance: futurePremiere, isUpcoming: true };
    }
    // 2. Otherwise, use the nearest future performance (already sorted chronologically)
    return { performance: upcoming[0], isUpcoming: true };
  }

  // If all are in the past, return the latest past performance
  const lastPerformance = production.performances[production.performances.length - 1];
  return { performance: lastPerformance, isUpcoming: false };
}

/**
 * Determines whether a production has any upcoming performances.
 */
export function isProductionUpcoming(production: Production, referenceDate: Date = new Date()): boolean {
  if (!production.performances || production.performances.length === 0) {
    return false;
  }
  const todayStr = referenceDate.toISOString().split('T')[0];
  return production.performances.some(p => p.date >= todayStr);
}

/**
 * Merge new performances into an existing production, skipping duplicates.
 */
export function mergePerformancesIntoProduction(
  existing: Production,
  incoming: Production
): { production: Production; addedCount: number } {
  const merged = { ...existing };
  const existingPerfs = [...(existing.performances || [])];

  let addedCount = 0;
  for (const newPerf of incoming.performances) {
    // Check if this date (and start time) already exists
    const isDuplicate = existingPerfs.some(ep => {
      const sameDate = ep.date === newPerf.date;
      const sameStart = !ep.startTime || !newPerf.startTime || ep.startTime === newPerf.startTime;
      return sameDate && sameStart;
    });

    if (!isDuplicate) {
      existingPerfs.push({
        ...newPerf,
        id: newPerf.id || `perf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      });
      addedCount++;
    }
  }

  // Update other empty metadata if incoming has better values
  if (!merged.title.EN && incoming.title.EN) merged.title = { ...incoming.title };
  if (!merged.role.EN && incoming.role.EN) merged.role = { ...incoming.role };
  if (!merged.location.EN && incoming.location.EN) merged.location = { ...incoming.location };
  if (!merged.generalLink && incoming.generalLink) {
    merged.generalLink = incoming.generalLink;
    merged.link = incoming.generalLink;
  }
  if (!merged.season && incoming.season) merged.season = incoming.season;

  // Sort performances chronologically
  existingPerfs.sort((a, b) => {
    const timeA = a.date + (a.startTime ? `T${a.startTime}` : 'T00:00');
    const timeB = b.date + (b.startTime ? `T${b.startTime}` : 'T00:00');
    return timeA.localeCompare(timeB);
  });

  merged.performances = existingPerfs;
  merged.date = existingPerfs[0]?.date || merged.date;

  return { production: merged, addedCount };
}

/**
 * Detects the IANA timezone for a venue based on venue name, city, and location strings.
 */
function getVenueTimeZone(venueStr: string, cityStr: string, locObj?: { EN?: string; DE?: string; KO?: string }): string {
  const combined = `${venueStr} ${cityStr} ${locObj?.EN || ''} ${locObj?.DE || ''} ${locObj?.KO || ''}`.toLowerCase();
  if (combined.includes('korea') || combined.includes('seoul') || combined.includes('한국') || combined.includes('서울') || combined.includes('daegu') || combined.includes('busan')) {
    return 'Asia/Seoul';
  }
  if (combined.includes('wien') || combined.includes('vienna') || combined.includes('austria') || combined.includes('österreich') || combined.includes('salzburg')) {
    return 'Europe/Vienna';
  }
  if (combined.includes('zürich') || combined.includes('zurich') || combined.includes('switzerland') || combined.includes('schweiz') || combined.includes('basel') || combined.includes('geneva') || combined.includes('genf')) {
    return 'Europe/Zurich';
  }
  if (combined.includes('london') || combined.includes('uk') || combined.includes('united kingdom')) {
    return 'Europe/London';
  }
  if (combined.includes('paris') || combined.includes('france')) {
    return 'Europe/Paris';
  }
  if (combined.includes('italy') || combined.includes('italia') || combined.includes('roma') || combined.includes('milano')) {
    return 'Europe/Rome';
  }
  // Default for Hyunkyum Kim (Ensemble member at Pfalztheater Kaiserslautern, Germany)
  return 'Europe/Berlin';
}

/**
 * Calculates the exact ISO 8601 UTC offset (e.g. "+02:00" or "+01:00") for a specific date and time in the given IANA timezone.
 */
function getTimeZoneOffset(year: string, month: string, day: string, hh: string, mm: string, timeZone: string): string {
  try {
    const dt = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hh), Number(mm)));
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset'
    });
    const parts = formatter.formatToParts(dt);
    const tz = parts.find(p => p.type === 'timeZoneName')?.value || '';
    const match = tz.match(/GMT([+-]\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  } catch (e) {
    // fallback
  }
  return '+01:00';
}

/**
 * Formats a performance start date in ISO 8601 without shifting the calendar day.
 * If startTime is provided, returns "YYYY-MM-DDTHH:MM:00+TZ:00".
 * If startTime is not available, returns "YYYY-MM-DD" (date-only) to prevent any timezone shifts.
 */
function formatPerformanceStartDate(dateStr: string, startTimeStr?: string, timeZone: string = 'Europe/Berlin'): string {
  let cleanDate = (dateStr || '').trim();
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleanDate)) {
    const [d, m, y] = cleanDate.split('.');
    cleanDate = `${y}-${m}-${d}`;
  }
  const dateMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) {
    return cleanDate;
  }
  const [_, year, month, day] = dateMatch;

  const timeMatch = startTimeStr ? startTimeStr.match(/(\d{1,2}):(\d{2})/) : null;
  if (!timeMatch) {
    // When no start time is specified, date-only string is valid ISO 8601 and avoids timezone shift
    return `${year}-${month}-${day}`;
  }

  const hh = timeMatch[1].padStart(2, '0');
  const mm = timeMatch[2];
  const offset = getTimeZoneOffset(year, month, day, hh, mm, timeZone);
  return `${year}-${month}-${day}T${hh}:${mm}:00${offset}`;
}

/**
 * Generates accurate Schema.org Event/MusicEvent/TheaterEvent structured data (JSON-LD)
 * for each individual performance in the schedule, handling eventStatus, offers,
 * venue, city, and correct local timezones.
 */
export function generateScheduleJsonLd(items: Production[]): object[] {
  if (!items || items.length === 0) return [];

  const events: object[] = [];

  for (const item of items) {
    if (!item) continue;

    // Use specific Schema.org Event subtype based on production category
    const eventType = item.category === 'Opera' ? 'TheaterEvent' : 'MusicEvent';
    const prodTitle = item.title?.EN || item.title?.DE || item.title?.KO || 'Performance';

    const performances: Performance[] = (Array.isArray(item.performances) && item.performances.length > 0)
      ? item.performances
      : (item.date ? [{
          id: `perf-${item.id}`,
          date: item.date,
          startTime: (item as any).startTime || '',
          venue: '',
          city: '',
          ticketUrl: item.link || '',
          ticketStatus: (item as any).ticketStatus || '',
          isPremiere: true,
          notes: ''
        }] : []);

    for (const perf of performances) {
      if (!perf || !perf.date) continue;

      const timeZone = getVenueTimeZone(perf.venue || '', perf.city || '', item.location);
      const formattedStartDate = formatPerformanceStartDate(perf.date, perf.startTime, timeZone);

      const venueName = perf.venue?.trim() || item.location?.EN?.trim() || item.location?.DE?.trim() || 'Pfalztheater Kaiserslautern';
      const cityAddress = perf.city?.trim() || item.location?.DE?.trim() || item.location?.EN?.trim() || 'Kaiserslautern, Germany';

      // Schema.org EventStatus
      // Sold-out is NOT cancelled (sold-out is reflected in offers.availability)
      const eventStatus = perf.ticketStatus === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled';

      // Description
      const descParts: string[] = [];
      if (item.category) descParts.push(item.category);
      if (item.role?.EN) descParts.push(`Role: ${item.role.EN}`);
      else if (item.role?.DE) descParts.push(`Rolle: ${item.role.DE}`);
      else if (item.role?.KO) descParts.push(`역할: ${item.role.KO}`);
      if (perf.isPremiere) descParts.push('(Premiere)');
      if (perf.notes?.trim()) descParts.push(perf.notes.trim());
      const description = descParts.join(' - ');

      const eventObj: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': eventType,
        'name': prodTitle,
        'startDate': formattedStartDate,
        'eventStatus': eventStatus,
        'location': {
          '@type': 'Place',
          'name': venueName,
          'address': cityAddress
        },
        'performer': {
          '@type': 'Person',
          'name': 'Hyunkyum Kim',
          'jobTitle': 'Baritone',
          'url': 'https://hyunkyumkim.com/'
        },
        'description': description || prodTitle
      };

      // 1. image: only if reliably available on perf or item
      const imageUrl = (perf as any).image || (item as any).image || (item as any).imageUrl;
      if (typeof imageUrl === 'string' && imageUrl.trim().startsWith('http')) {
        eventObj.image = imageUrl.trim();
      }

      // 2. organizer: only if reliably available from data
      const organizer = (perf as any).organizer || (item as any).organizer;
      if (organizer) {
        if (typeof organizer === 'string' && organizer.trim()) {
          eventObj.organizer = {
            '@type': 'Organization',
            'name': organizer.trim()
          };
        } else if (typeof organizer === 'object' && organizer.name) {
          eventObj.organizer = {
            '@type': 'Organization',
            ...organizer
          };
        }
      }

      // 3. offers: use real ticket URL when available
      const ticketUrl = perf.ticketUrl?.trim() || item.link?.trim() || item.generalLink?.trim();
      if (ticketUrl && (ticketUrl.startsWith('http://') || ticketUrl.startsWith('https://'))) {
        const offer: Record<string, any> = {
          '@type': 'Offer',
          'url': ticketUrl
        };
        if (perf.ticketStatus === 'sold_out') {
          offer.availability = 'https://schema.org/SoldOut';
        } else if (perf.ticketStatus === 'available') {
          offer.availability = 'https://schema.org/InStock';
        } else if (perf.ticketStatus === 'few_tickets') {
          offer.availability = 'https://schema.org/LimitedAvailability';
        } else if (perf.ticketStatus === 'free') {
          offer.price = '0';
          offer.priceCurrency = 'EUR';
          offer.availability = 'https://schema.org/InStock';
        }
        if ((perf as any).price !== undefined && (perf as any).price !== null) {
          offer.price = String((perf as any).price);
          if ((perf as any).priceCurrency || (perf as any).currency) {
            offer.priceCurrency = (perf as any).priceCurrency || (perf as any).currency;
          }
        }
        eventObj.offers = offer;
      }

      // 4. endDate: only if reliably available from data
      const endDate = (perf as any).endDate || (perf as any).endTime;
      if (endDate) {
        eventObj.endDate = endDate;
      }

      events.push(eventObj);
    }
  }

  return events;
}
