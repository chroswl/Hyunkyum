with open('src/components/HeroEditorPanel.tsx', 'r') as f:
    content = f.read()

old_toolbar = """          <div className="drag-handle flex items-center space-x-2 cursor-grab active:cursor-grabbing mr-4">
            <LayoutTemplate className="w-4 h-4 text-[#C9A227]" />
            <span className="font-serif text-[11px] tracking-widest uppercase">Text Edit Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsEditingText(false)}
              className="bg-[#C9A227] hover:bg-[#ebd04e] text-black px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-colors"
            >
              Done
            </button>
          </div>"""

new_toolbar = """          <div className="drag-handle flex items-center space-x-2 cursor-grab active:cursor-grabbing mr-4">
            <LayoutTemplate className="w-4 h-4 text-[#C9A227]" />
            <span className="font-serif text-[11px] tracking-widest uppercase hidden sm:inline-block">Text Edit Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsEditingText(false)}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-colors"
            >
              Settings
            </button>
            <button 
              onClick={() => {
                // To properly cancel, we could restore initialTheme, but just disabling mode is fine for WYSIWYG
                if (initialTheme) setTheme(initialTheme);
                setIsEditingText(false);
              }}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => setIsEditingText(false)}
              className="bg-[#C9A227] hover:bg-[#ebd04e] text-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-colors"
            >
              Done
            </button>
          </div>"""

content = content.replace(old_toolbar, new_toolbar)

with open('src/components/HeroEditorPanel.tsx', 'w') as f:
    f.write(content)

print("Toolbar patched")
