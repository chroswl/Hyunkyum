import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_slides = """                              {slides.map((s, index) => (
                                <SortableItem key={s.id || `admin-slide-${index}`} id={s.id || ''} handleType="full" className="bg-[var(--color-bg)] border border-neutral-900 rounded overflow-hidden flex flex-col relative group">
                                  <div className="h-32 w-full bg-[var(--color-bg)] relative">
                                    <img
                                      src={s.image}
                                      alt={s.production[currentLang]}
                                      className="w-full h-full object-cover opacity-60"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
                                    <div className="absolute top-2 left-2 z-10 bg-black/50 p-1.5 rounded-sm pointer-events-auto cursor-grab active:cursor-grabbing text-neutral-400 hover:text-white">
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                                      <span className="text-[9px] text-[#C9A227] bg-[var(--color-bg)]/50 px-1.5 py-0.5 rounded font-sans tracking-widest uppercase">
                                        {s.role[currentLang]}
                                      </span>
                                      <h4 className="text-sm font-serif text-[var(--color-text)] tracking-wide mt-1 line-clamp-1">
                                        {s.production[currentLang]}
                                      </h4>
                                    </div>
                                  </div>

                                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                                    <p className="text-[10px] text-neutral-400 font-sans uppercase tracking-wider mb-3">
                                      {s.house[currentLang]}
                                    </p>

                                    <div className="flex justify-end space-x-2 border-t border-neutral-900 pt-3 pointer-events-auto">
                                      <button
                                        id={`edit-slide-btn-${s.id}`}
                                        onClick={(e) => { e.stopPropagation(); setEditingSlide(s); }}
                                        className="p-1.5 text-neutral-400 hover:text-[#C9A227] transition-all cursor-pointer hover:bg-[var(--color-bg)] rounded"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        id={`delete-slide-btn-${s.id}`}
                                        onClick={(e) => { e.stopPropagation(); deleteSlide(s.id || ''); }}
                                        className="p-1.5 text-neutral-400 hover:text-rose-400 transition-all cursor-pointer hover:bg-rose-500/10 rounded"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}"""

new_slides = """                              {slides.map((s, index) => (
                                <SortableItem key={s.id || `admin-slide-${index}`} id={s.id || ''} handleType="icon" handleClassName="absolute top-2 left-2 z-20 bg-black/50 p-1.5 rounded-sm" className="bg-[var(--color-bg)] border border-neutral-900 rounded overflow-hidden flex flex-col relative group">
                                  <div className="h-32 w-full bg-[var(--color-bg)] relative">
                                    <img
                                      src={s.image}
                                      alt={s.production[currentLang]}
                                      className="w-full h-full object-cover opacity-60"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
                                    <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                                      <span className="text-[9px] text-[#C9A227] bg-[var(--color-bg)]/50 px-1.5 py-0.5 rounded font-sans tracking-widest uppercase">
                                        {s.role[currentLang]}
                                      </span>
                                      <h4 className="text-sm font-serif text-[var(--color-text)] tracking-wide mt-1 line-clamp-1">
                                        {s.production[currentLang]}
                                      </h4>
                                    </div>
                                  </div>

                                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                                    <p className="text-[10px] text-neutral-400 font-sans uppercase tracking-wider mb-3">
                                      {s.house[currentLang]}
                                    </p>

                                    <div className="flex justify-end space-x-2 border-t border-neutral-900 pt-3 pointer-events-auto">
                                      <button
                                        id={`edit-slide-btn-${s.id}`}
                                        onClick={(e) => { e.stopPropagation(); setEditingSlide(s); }}
                                        className="p-1.5 text-neutral-400 hover:text-[#C9A227] transition-all cursor-pointer hover:bg-[var(--color-bg)] rounded"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        id={`delete-slide-btn-${s.id}`}
                                        onClick={(e) => { e.stopPropagation(); deleteSlide(s.id || ''); }}
                                        className="p-1.5 text-neutral-400 hover:text-rose-400 transition-all cursor-pointer hover:bg-rose-500/10 rounded"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}"""

content = content.replace(old_slides, new_slides)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Fixed slides handle")
