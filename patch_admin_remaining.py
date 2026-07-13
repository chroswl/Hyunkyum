import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Press
press_pattern = re.compile(r'<div className="divide-y divide-neutral-900 border border-neutral-900 bg-\[var\(--color-bg\)\] rounded-sm">\s*\{pressItems\.length === 0 \? \([\s\S]*?</div>\s*\)\}\s*</div>', re.MULTILINE)

new_press = """<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'press', pressItems, setPressItems)}>
                          <div className="divide-y divide-neutral-900 border border-neutral-900 bg-[var(--color-bg)] rounded-sm">
                            {pressItems.length === 0 ? (
                              <div className="p-8 text-center text-neutral-500 text-xs font-sans">No reviews created yet. Seeded defaults will show.</div>
                            ) : (
                              <SortableContext items={pressItems.map(i => i.id || '')} strategy={verticalListSortingStrategy}>
                                {pressItems.map((item, index) => (
                                  <SortableItem key={item.id || `press-${index}`} id={item.id || ''} className="bg-[var(--color-bg)] transition-all pl-10" handleClassName="absolute left-2 top-1/2 -translate-y-1/2 p-2">
                                    <div className="p-4 flex justify-between items-center hover:bg-white/5">
                                      <div className="space-y-1">
                                        <span className="text-[10px] font-mono tracking-wider text-[#C9A227] block accent-color">
                                          {item.source} • {item.date} • {item.type}
                                        </span>
                                        <h4 className="text-xs font-sans font-medium text-neutral-300 italic max-w-xl line-clamp-2">
                                          "{item.quote[currentLang] || item.quote['EN']}"
                                        </h4>
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          id={`admin-edit-press-${item.id}`}
                                          onClick={() => setEditingPress(item)}
                                          className="p-1.5 border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-[var(--color-text)] rounded transition-colors cursor-pointer"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          id={`admin-delete-press-${item.id}`}
                                          onClick={() => deletePress(item.id || '')}
                                          className="p-1.5 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-500/5 rounded transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </SortableItem>
                                ))}
                              </SortableContext>
                            )}
                          </div>
                        </DndContext>"""

content = press_pattern.sub(new_press, content)


# Videos
video_pattern = re.compile(r'<div className="divide-y divide-neutral-900 border border-neutral-900 bg-\[var\(--color-bg\)\] rounded-sm">\s*\{videos\.length === 0 \? \([\s\S]*?</div>\s*\)\}\s*</div>', re.MULTILINE)

new_video = """<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'video', videos, setVideos)}>
                          <div className="divide-y divide-neutral-900 border border-neutral-900 bg-[var(--color-bg)] rounded-sm">
                            {videos.length === 0 ? (
                              <div className="p-8 text-center text-neutral-500 text-xs font-sans">No videos created yet. Seeded defaults will show.</div>
                            ) : (
                              <SortableContext items={videos.map(i => i.id || '')} strategy={verticalListSortingStrategy}>
                                {videos.map((item, index) => (
                                  <SortableItem key={item.id || `video-${index}`} id={item.id || ''} className="bg-[var(--color-bg)] transition-all pl-10" handleClassName="absolute left-2 top-1/2 -translate-y-1/2 p-2">
                                    <div className="p-4 flex justify-between items-center hover:bg-white/5">
                                      <div className="space-y-1">
                                        <span className="text-[10px] font-mono tracking-wider text-[#C9A227] block accent-color">
                                          YouTube ID: {item.youtubeId}
                                        </span>
                                        <h4 className="text-xs font-sans font-medium text-[var(--color-text)]">
                                          {item.title[currentLang] || item.title['EN']}
                                        </h4>
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          id={`admin-edit-video-${item.id}`}
                                          onClick={() => setEditingVideo(item)}
                                          className="p-1.5 border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-[var(--color-text)] rounded transition-colors cursor-pointer"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          id={`admin-delete-video-${item.id}`}
                                          onClick={() => deleteVideo(item.id || '')}
                                          className="p-1.5 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-500/5 rounded transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </SortableItem>
                                ))}
                              </SortableContext>
                            )}
                          </div>
                        </DndContext>"""

content = video_pattern.sub(new_video, content)


# Slides
slides_pattern = re.compile(r'<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\s*\{slides\.map\(\(s, index\) => \([\s\S]*?</button>\s*</div>\s*</div>\s*</div>\s*\)\)}\s*</div>', re.MULTILINE)

new_slides = """<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'selected_performances', slides, setSlides)}>
                          <SortableContext items={slides.map(i => i.id || '')} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {slides.map((s, index) => (
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
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>"""

content = slides_pattern.sub(new_slides, content)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Regex replace completed")
