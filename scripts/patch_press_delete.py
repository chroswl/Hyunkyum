import re

with open("src/components/PressSection.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_action = """                        {/* Article link */}
                        {currentItem.link && (
                          <div className="pt-4">
                            <a
                              href={currentItem.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-xs text-neutral-300 hover:text-[#C9A227] transition-colors uppercase tracking-[0.15em] font-sans accent-hover-text"
                            >
                              <span>{t.readArticle}</span>
                              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </a>
                          </div>
                        )}"""

new_action = """                        {/* Article link */}
                        <div className="pt-4 flex items-center justify-between">
                          {currentItem.link ? (
                            <a
                              href={currentItem.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-xs text-neutral-300 hover:text-[#C9A227] transition-colors uppercase tracking-[0.15em] font-sans accent-hover-text"
                            >
                              <span>{t.readArticle}</span>
                              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </a>
                          ) : <div />}
                          {user && (
                            <button
                              onClick={() => handleDeletePress(currentItem.id)}
                              className="p-2 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer ml-4"
                              title="Delete from main page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>"""

if old_action in content:
    content = content.replace(old_action, new_action)
    with open("src/components/PressSection.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added delete button to press main page")
else:
    print("Could not find press block")
