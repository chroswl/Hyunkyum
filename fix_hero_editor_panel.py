import re

with open("src/components/HeroEditorPanel.tsx", "r") as f:
    content = f.read()

# Replace Overall Y-Offset block with Content Position block
old_overall = r"""            {/* Overall Vertical Offset */}
            <div className="pt-3 border-t border-neutral-900">
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#C9A227] font-sans uppercase tracking-widest font-semibold">Content Base Y-Offset</span>
                  <span 
                    onClick={() => setTheme(prev => ({ ...prev, heroOffsetY: 0 }))}
                    className="text-[9px] text-[#C9A227] hover:underline uppercase tracking-wider cursor-pointer font-semibold"
                  >
                    Reset
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="range" min="-300" max="300" 
                    value={theme.heroOffsetY ?? 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroOffsetY: parseInt(e.target.value) ?? 0 }))} 
                    className="w-full accent-\[var\(--color-text\)\] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer"
                  />
                  <input 
                    type="number"
                    value={theme.heroOffsetY ?? 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroOffsetY: parseInt(e.target.value) ?? 0 }))} 
                    className="w-12 bg-neutral-900 border border-neutral-800 text-white text-\[10px\] px-1.5 py-0.5 rounded text-center focus:outline-none focus:border-\[#C9A227\] font-mono h-6"
                  />
                </div>
              </div>
            </div>"""

new_content_position = """            {/* Content Position */}
            <div className="pt-3 border-t border-neutral-900">
              <div className="flex flex-col space-y-3">
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
              </div>
            </div>"""

content = re.sub(old_overall, new_content_position, content, flags=re.DOTALL)

# Replace Elements Array
old_elements_arr = r"""              \{\[
                \{ id: 'Subtitle', keySize: 'heroSubtitleSize', keyX: 'heroSubtitleOffsetX', keyY: 'heroSubtitleOffsetY', defaultSize: 14, label: 'Subtitle \(소제목\)' \},
                \{ id: 'Title', keySize: 'heroTitleSize', keyX: 'heroTitleOffsetX', keyY: 'heroTitleOffsetY', defaultSize: 64, label: 'Main Title \(대제목\)' \},
                \{ id: 'Desc', keySize: 'heroDescSize', keyX: 'heroDescOffsetX', keyY: 'heroDescOffsetY', defaultSize: 16, label: 'Description \(설명\)' \},
                \{ id: 'Button', keySize: 'heroButtonSize', keyX: 'heroButtonOffsetX', keyY: 'heroButtonOffsetY', defaultSize: 12, label: 'Button \(버튼\)' \},
              \]\.map\(elem => \("""

new_elements_arr = """              {[
                { id: 'Subtitle', keySize: 'heroSubtitleSize', defaultSize: 14, label: 'Subtitle (소제목)' },
                { id: 'Title', keySize: 'heroTitleSize', defaultSize: 64, label: 'Main Title (대제목)' },
                { id: 'Desc', keySize: 'heroDescSize', defaultSize: 16, label: 'Description (설명)' },
                { id: 'Button', keySize: 'heroButtonSize', defaultSize: 11, label: 'Button (버튼)' },
              ].map(elem => ("""

content = re.sub(old_elements_arr, new_elements_arr, content)

# Remove keyX and keyY from reset logic
content = re.sub(
    r"\[elem\.keyX\]: 0,\s*\[elem\.keyY\]: 0",
    r"",
    content
)

# Remove X-Offset and Y-Offset sliders
offset_sliders = r"""                                            <div className="grid grid-cols-\[55px_1fr_45px\] gap-2 items-center">
                        <span className="text-\[9px\] text-neutral-400 font-sans uppercase tracking-widest font-semibold">X-Offset</span>
                        <input 
                          type="range" min="-300" max="300" 
                          value=\{theme\[elem\.keyX as keyof ThemeSettings\] as number \?\? 0\} 
                          onChange=\{\(e\) => setTheme\(prev => \(\{ \.\.\.prev, \[elem\.keyX\]: parseInt\(e\.target\.value\) \?\? 0 \}\)\)\} 
                          className="w-full accent-\[var\(--color-text\)\] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                        />
                        <input 
                          type="number"
                          value=\{theme\[elem\.keyX as keyof ThemeSettings\] as number \?\? 0\} 
                          onChange=\{\(e\) => setTheme\(prev => \(\{ \.\.\.prev, \[elem\.keyX\]: parseInt\(e\.target\.value\) \?\? 0 \}\)\)\} 
                          className="w-full bg-neutral-900 border border-neutral-800 text-white text-\[10px\] px-1 py-0\.5 rounded text-center focus:outline-none focus:border-\[#C9A227\] font-mono h-5"
                        />
                      </div>
                      <div className="grid grid-cols-\[55px_1fr_45px\] gap-2 items-center">
                        <span className="text-\[9px\] text-neutral-400 font-sans uppercase tracking-widest font-semibold">Y-Offset</span>
                        <input 
                          type="range" min="-300" max="300" 
                          value=\{theme\[elem\.keyY as keyof ThemeSettings\] as number \?\? 0\} 
                          onChange=\{\(e\) => setTheme\(prev => \(\{ \.\.\.prev, \[elem\.keyY\]: parseInt\(e\.target\.value\) \?\? 0 \}\)\)\} 
                          className="w-full accent-\[var\(--color-text\)\] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                        />
                        <input 
                          type="number"
                          value=\{theme\[elem\.keyY as keyof ThemeSettings\] as number \?\? 0\} 
                          onChange=\{\(e\) => setTheme\(prev => \(\{ \.\.\.prev, \[elem\.keyY\]: parseInt\(e\.target\.value\) \?\? 0 \}\)\)\} 
                          className="w-full bg-neutral-900 border border-neutral-800 text-white text-\[10px\] px-1 py-0\.5 rounded text-center focus:outline-none focus:border-\[#C9A227\] font-mono h-5"
                        />
                      </div>"""

content = re.sub(offset_sliders, "", content)

with open("src/components/HeroEditorPanel.tsx", "w") as f:
    f.write(content)
