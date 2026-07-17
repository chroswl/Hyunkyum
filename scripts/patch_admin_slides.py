import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_code = """                      ) : slides.length === 0 ? (
                        <div className="text-center py-12 border border-neutral-900 bg-[var(--color-bg)] rounded-sm">
                          <Image className="w-10 h-10 text-neutral-600 mx-auto mb-3 animate-none" />
                          <p className="text-sm text-neutral-500 tracking-wider font-sans">No custom performances. Using fallback defaults.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {slides.map((s, index) => (
                            <div key={`admin-slide-${s.id || 'new'}-${index}`} className="bg-[var(--color-bg)] border border-neutral-900 rounded overflow-hidden flex flex-col relative group">
                              <div className="h-32 w-full bg-[var(--color-bg)] relative">
                                <img
                                  src={s.image}
                                  alt={s.production[currentLang]}
                                  className="w-full h-full object-cover opacity-60"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3">
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

                                                                <div className="flex justify-end space-x-2 border-t border-neutral-900 pt-3">
                                  <button
                                    disabled={index === 0}
                                    onClick={() => moveItemOrder('selected_performances', slides, index, 'up', fetchSlidesList, setSlides)}
                                    className="p-1.5 text-neutral-400 hover:text-[var(--color-text)] transition-all cursor-pointer hover:bg-[var(--color-bg)] rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    disabled={index === slides.length - 1}
                                    onClick={() => moveItemOrder('selected_performances', slides, index, 'down', fetchSlidesList, setSlides)}
                                    className="p-1.5 text-neutral-400 hover:text-[var(--color-text)] transition-all cursor-pointer hover:bg-[var(--color-bg)] rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    id={`edit-slide-btn-${s.id}`}
                                    onClick={() => setEditingSlide(s)}
                                    className="p-1.5 text-neutral-400 hover:text-[#C9A227] transition-all cursor-pointer hover:bg-[var(--color-bg)] rounded"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    id={`delete-slide-btn-${s.id}`}
                                    onClick={() => deleteSlide(s.id || '')}
                                    className="p-1.5 text-neutral-400 hover:text-rose-400 transition-all cursor-pointer hover:bg-rose-500/10 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}"""

new_code = """                      ) : slides.length === 0 ? (
                        <div className="text-center py-12 border border-neutral-900 bg-[var(--color-bg)] rounded-sm">
                          <Image className="w-10 h-10 text-neutral-600 mx-auto mb-3 animate-none" />
                          <p className="text-sm text-neutral-500 tracking-wider font-sans">No custom performances. Using fallback defaults.</p>
                        </div>
                      ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'selected_performances', slides, setSlides)}>
                          <SortableContext items={slides.map(i => i.id || '')} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {slides.map((s, index) => (
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
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}"""

content = content.replace(old_code, new_code)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Replaced slides map with Sortable")
