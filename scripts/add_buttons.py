import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    text = f.read()

buttons = """                                <div className="flex justify-end space-x-2 border-t border-neutral-900 pt-3">
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
                                  </button>"""
text = text.replace('slides.map((s) => (', 'slides.map((s, index) => (')

# We only want to replace the first occurrence of this div INSIDE the slides map!
idx = text.find('slides.map((s, index) => (')
if idx != -1:
    idx2 = text.find('<div className="flex justify-end space-x-2 border-t border-neutral-900 pt-3">', idx)
    if idx2 != -1:
        text = text[:idx2] + buttons + text[idx2 + len('<div className="flex justify-end space-x-2 border-t border-neutral-900 pt-3">'):]

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(text)
