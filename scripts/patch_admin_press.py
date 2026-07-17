import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_code = """                        <div className="divide-y divide-neutral-900 border border-neutral-900 bg-[var(--color-bg)] rounded-sm">
                          {pressItems.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 text-xs font-sans">No reviews created yet. Seeded defaults will show.</div>
                          ) : pressItems.map((item, index) => (
                            <div key={`press-item-${item.id || 'new'}-${index}`} className="p-4 flex justify-between items-center hover:bg-[var(--color-bg)] transition-all">
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
                                  disabled={index === 0}
                                  onClick={() => moveItemOrder('press', pressItems, index, 'up', fetchPressList, setPressItems)}
                                  className="p-1 border border-neutral-700 bg-[var(--color-bg)] text-neutral-400 hover:text-[var(--color-text)] rounded hover:border-neutral-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  disabled={index === pressItems.length - 1}
                                  onClick={() => moveItemOrder('press', pressItems, index, 'down', fetchPressList, setPressItems)}
                                  className="p-1 border border-neutral-700 bg-[var(--color-bg)] text-neutral-400 hover:text-[var(--color-text)] rounded hover:border-neutral-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
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
                          ))}
                        </div>"""

new_code = """                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'press', pressItems, setPressItems)}>
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

content = content.replace(old_code, new_code)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Replaced press map with Sortable")
