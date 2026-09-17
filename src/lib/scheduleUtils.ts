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
