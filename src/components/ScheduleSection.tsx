import React from 'react';
import { Calendar, MapPin, Tag, Edit, Trash2 } from 'lucide-react';
import { ScheduleItem, Language } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';

interface ScheduleSectionProps {
  items: ScheduleItem[];
  currentLang: Language;
  user: User | null;
  onEditItem: (item: ScheduleItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function ScheduleSection({ items, currentLang, user, onEditItem, onDeleteItem }: ScheduleSectionProps) {
  const t = translations[currentLang];

  // Helper to format date elegantly
  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return { day: '', monthYear: dateStr };

    const day = dateObj.getDate().toString().padStart(2, '0');
    
    // Custom translation of month based on language
    let month = '';
    if (currentLang === 'KO') {
      month = `${dateObj.getMonth() + 1}월`;
    } else {
      const monthsEN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthsDE = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
      month = currentLang === 'DE' ? monthsDE[dateObj.getMonth()] : monthsEN[dateObj.getMonth()];
    }

    const year = dateObj.getFullYear();
    return {
      day,
      month,
      year,
      fullDisplay: `${month} ${day}, ${year}`
    };
  };

  const getTagColor = (category: string) => {
    switch (category) {
      case 'Opera': return 'border-amber-500/30 text-amber-400 bg-amber-500/5';
      case 'Concert': return 'border-blue-500/30 text-blue-400 bg-blue-500/5';
      case 'Recital': return 'border-purple-500/30 text-purple-400 bg-purple-500/5';
      default: return 'border-neutral-500/30 text-neutral-400 bg-neutral-500/5';
    }
  };

  return (
    <div id="schedule-section-root" className="w-full space-y-8">
      {items.length === 0 ? (
        <div className="text-center py-16 border border-neutral-900 bg-neutral-950/40 rounded-sm">
          <Calendar className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 tracking-wider">No scheduled performances found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const formattedDate = formatDate(item.date);
            return (
              <div
                key={item.id}
                id={`schedule-row-${item.id}`}
                className="group relative bg-neutral-950/60 hover:bg-neutral-900/40 border border-neutral-900 hover:border-white/20 rounded-sm p-6 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
              >
                {/* Date column (3 cols) */}
                <div className="md:col-span-3 flex md:flex-col items-center md:items-start space-x-4 md:space-x-0 md:space-y-1 md:border-r border-neutral-900 md:pr-4">
                  <div className="text-4xl md:text-5xl font-serif font-light text-white tracking-tight group-hover:text-white group-hover:font-medium transition-all">
                    {formattedDate.day}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm tracking-[0.2em] font-sans font-medium text-neutral-400 uppercase">
                      {formattedDate.month}
                    </span>
                    <span className="text-[10px] tracking-widest text-neutral-600 font-mono">
                      {formattedDate.year}
                    </span>
                  </div>
                </div>

                {/* Content details column (7 cols) */}
                <div className="md:col-span-7 space-y-2.5">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] tracking-widest border uppercase font-semibold font-sans ${getTagColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-base md:text-lg font-serif font-light text-white tracking-wide leading-tight group-hover:translate-x-1 transition-transform duration-300">
                    {item.title[currentLang] || item.title['EN']}
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-4 text-xs font-sans text-neutral-400">
                    <div className="flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        <strong className="text-neutral-500 font-normal">{t.roleLabel}:</strong> {item.role[currentLang] || item.role['EN']}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{item.location[currentLang] || item.location['EN']}</span>
                    </div>
                  </div>
                </div>

                {/* Link / Action column (2 cols) */}
                <div className="md:col-span-2 flex justify-end items-center space-x-3 mt-4 md:mt-0">
                  {/* Admin edit/delete tools */}
                  {user ? (
                    <div className="flex items-center space-x-2">
                      <button
                        id={`edit-schedule-btn-${item.id}`}
                        onClick={() => onEditItem(item)}
                        className="p-2 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:bg-blue-500/10 rounded transition-all cursor-pointer"
                        title={t.adminEdit}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        id={`delete-schedule-btn-${item.id}`}
                        onClick={() => onDeleteItem(item.id)}
                        className="p-2 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                        title={t.adminDelete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2 text-[10px] tracking-widest text-white hover:text-black border border-white/25 hover:bg-white transition-all duration-300 rounded-sm uppercase font-sans font-medium whitespace-nowrap"
                      >
                        Tickets
                      </a>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
