import re
with open('src/components/HeroEditorPanel.tsx', 'r') as f:
    content = f.read()

# We can insert the Global Settings right after the "General Actions" div ends.
# Find: {/* Elements */}
global_settings = """
            {/* Global Settings */}
            <div className="space-y-4 pt-2 border-t border-neutral-900">
              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-400 font-sans block uppercase tracking-widest font-semibold">Global Alignment</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setTheme(prev => ({ ...prev, heroAlign: align }))}
                      className={`py-1.5 rounded border text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1 transition-all ${
                        (theme.heroAlign || 'center') === align 
                          ? 'border-[#C9A227] bg-[#C9A227]/10 text-[#C9A227] font-semibold' 
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <LayoutTemplate className="w-3 h-3" />
                      <span>{align}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-neutral-400 font-sans uppercase tracking-widest font-semibold">
                  <span>Global Vertical Offset</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="range" min="-300" max="300" 
                    value={theme.heroOffsetY || 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroOffsetY: parseInt(e.target.value) || 0 }))} 
                    className="w-full accent-[#C9A227] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                  />
                  <input 
                    type="number"
                    value={theme.heroOffsetY || 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroOffsetY: parseInt(e.target.value) || 0 }))} 
                    className="w-16 bg-neutral-900 border border-neutral-800 text-white text-[10px] px-2 py-1 rounded text-center focus:outline-none focus:border-[#C9A227] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Elements */}
"""

content = content.replace("{/* Elements */}", global_settings)

with open('src/components/HeroEditorPanel.tsx', 'w') as f:
    f.write(content)

print("Global settings added!")
