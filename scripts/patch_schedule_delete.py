import re

with open("src/components/ScheduleSection.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_action = """                  {/* Link / Action column (2 cols) */}
                  <div className="md:col-span-2 flex justify-end items-center space-x-3 mt-4 md:mt-0">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2 text-[10px] tracking-widest hover:text-black border border-white/25 hover:bg-white transition-all duration-300 rounded-sm uppercase font-sans font-medium whitespace-nowrap cursor-pointer"
                      >
                        Tickets
                      </a>
                    )}
                  </div>"""

new_action = """                  {/* Link / Action column (2 cols) */}
                  <div className="md:col-span-2 flex justify-end items-center space-x-3 mt-4 md:mt-0">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2 text-[10px] tracking-widest hover:text-black border border-white/25 hover:bg-white transition-all duration-300 rounded-sm uppercase font-sans font-medium whitespace-nowrap cursor-pointer"
                      >
                        Tickets
                      </a>
                    )}
                    {user && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeletePerformance(item.id);
                        }}
                        className="p-2 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                        title="Delete from main page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>"""

if old_action in content:
    content = content.replace(old_action, new_action)
    with open("src/components/ScheduleSection.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added delete button to schedule main page")
else:
    print("Could not find schedule block")
