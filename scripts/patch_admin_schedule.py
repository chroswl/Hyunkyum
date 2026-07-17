import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_list = """                      <div className="divide-y divide-neutral-900 border border-neutral-900 bg-[var(--color-bg)] rounded-sm">
                        {localScheduleItems.length === 0 ? (
                          <div className="p-8 text-center text-neutral-500 text-xs font-sans">No scheduled performances found.</div>
                        ) : localScheduleItems.map((item, index) => (
                          <div key={`schedule-item-${item.id || 'new'}-${index}`} className="p-4 flex justify-between items-center hover:bg-[var(--color-bg)] transition-all">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono tracking-wider text-neutral-500 block">
                                {item.date} • {item.category}
                              </span>
                              <h4 className="text-sm font-sans font-medium text-[var(--color-text)]">
                                {item.title[currentLang] || item.title['EN']}
                              </h4>
                              <p className="text-xs text-neutral-400">
                                {item.role[currentLang] || item.role['EN']} @ {item.location[currentLang] || item.location['EN']}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                disabled={index === 0}
                                onClick={() => moveItemOrder('schedule', localScheduleItems, index, 'up', refreshData, setLocalScheduleItems)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-[var(--color-text)] rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={index === localScheduleItems.length - 1}
                                onClick={() => moveItemOrder('schedule', localScheduleItems, index, 'down', refreshData, setLocalScheduleItems)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-[var(--color-text)] rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`admin-edit-schedule-${item.id}`}
                                onClick={() => setEditingSchedule(item)}
                                className="p-1.5 border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-[var(--color-text)] rounded transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`admin-delete-schedule-${item.id}`}
                                onClick={() => deleteSchedule(item.id)}
                                className="p-1.5 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-500/5 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>"""

new_list = """                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'schedule', localScheduleItems, setLocalScheduleItems)}>
                        <div className="divide-y divide-neutral-900 border border-neutral-900 bg-[var(--color-bg)] rounded-sm">
                          {localScheduleItems.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 text-xs font-sans">No scheduled performances found.</div>
                          ) : (
                            <SortableContext items={localScheduleItems.map(i => i.id || '')} strategy={verticalListSortingStrategy}>
                              {localScheduleItems.map((item, index) => (
                                <SortableItem key={item.id || `schedule-${index}`} id={item.id || ''} className="bg-[var(--color-bg)] transition-all pl-10" handleClassName="absolute left-2 top-1/2 -translate-y-1/2 p-2">
                                  <div className="p-4 flex justify-between items-center hover:bg-white/5">
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-mono tracking-wider text-neutral-500 block">
                                        {item.date} • {item.category}
                                      </span>
                                      <h4 className="text-sm font-sans font-medium text-[var(--color-text)]">
                                        {item.title[currentLang] || item.title['EN']}
                                      </h4>
                                      <p className="text-xs text-neutral-400">
                                        {item.role[currentLang] || item.role['EN']} @ {item.location[currentLang] || item.location['EN']}
                                      </p>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        id={`admin-edit-schedule-${item.id}`}
                                        onClick={() => setEditingSchedule(item)}
                                        className="p-1.5 border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-[var(--color-text)] rounded transition-colors cursor-pointer"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        id={`admin-delete-schedule-${item.id}`}
                                        onClick={() => deleteSchedule(item.id)}
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

content = content.replace(old_list, new_list)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Replaced schedule map with Sortable")
