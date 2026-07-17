import re

with open("src/components/HeroEditorPanel.tsx", "r") as f:
    content = f.read()

old_global_y = r"""              <div className="space-y-1">
                <div className="flex justify-between text-\[10px\] text-neutral-400 font-sans uppercase tracking-widest font-semibold">
                  <span>Global Y-Offset</span>
                </div>
                <div className="flex items-center space-x-1\.5">
                  <input 
                    type="range" min="-300" max="300" 
                    value=\{theme\.heroOffsetY \?\? 0\} 
                    onChange=\{\(e\) => setTheme\(prev => \(\{ \.\.\.prev, heroOffsetY: parseInt\(e\.target\.value\) \?\? 0 \}\)\)\} 
                    className="w-full accent-\[var\(--color-text\)\] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                  />
                  <input 
                    type="number"
                    value=\{theme\.heroOffsetY \?\? 0\} 
                    onChange=\{\(e\) => setTheme\(prev => \(\{ \.\.\.prev, heroOffsetY: parseInt\(e\.target\.value\) \?\? 0 \}\)\)\} 
                    className="w-12 bg-neutral-900 border border-neutral-800 text-white text-\[10px\] px-1\.5 py-0\.5 rounded text-center focus:outline-none focus:border-\[#C9A227\] font-mono h-6"
                  />
                </div>
              </div>"""

new_content_position = """              {/* Content Position */}
              <div className="pt-3 border-t border-neutral-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#C9A227] font-sans uppercase tracking-widest font-semibold">Content Position</span>
                  <span 
                    onClick={() => setTheme(prev => ({ ...prev, heroContentOffsetX: 0, heroContentOffsetY: 0, heroOffsetY: 0 }))}
                    className="text-[9px] text-[#C9A227] hover:underline uppercase tracking-wider cursor-pointer font-semibold"
                  >
                    Reset All
                  </span>
                </div>
                <div className="grid grid-cols-[55px_1fr_45px] gap-2 items-center">
                  <span className="text-[9px] text-neutral-400 font-sans uppercase tracking-widest font-semibold">X-Offset</span>
                  <input 
                    type="range" min="-300" max="300" 
                    value={theme.heroContentOffsetX ?? 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroContentOffsetX: parseInt(e.target.value) ?? 0 }))} 
                    className="w-full accent-[var(--color-text)] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer"
                  />
                  <input 
                    type="number"
                    value={theme.heroContentOffsetX ?? 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroContentOffsetX: parseInt(e.target.value) ?? 0 }))} 
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-[#C9A227] font-mono h-5"
                  />
                </div>
                <div className="grid grid-cols-[55px_1fr_45px] gap-2 items-center">
                  <span className="text-[9px] text-neutral-400 font-sans uppercase tracking-widest font-semibold">Y-Offset</span>
                  <input 
                    type="range" min="-300" max="300" 
                    value={theme.heroContentOffsetY ?? theme.heroOffsetY ?? 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroContentOffsetY: parseInt(e.target.value) ?? 0 }))} 
                    className="w-full accent-[var(--color-text)] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer"
                  />
                  <input 
                    type="number"
                    value={theme.heroContentOffsetY ?? theme.heroOffsetY ?? 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroContentOffsetY: parseInt(e.target.value) ?? 0 }))} 
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-[#C9A227] font-mono h-5"
                  />
                </div>
              </div>"""

content = re.sub(old_global_y, new_content_position, content)

with open("src/components/HeroEditorPanel.tsx", "w") as f:
    f.write(content)
