import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

settings_pattern = re.compile(r"\{\/\* TAB 5: SYSTEM GENERAL SETTINGS \*\/\}\s*\{activeTab === 'settings' && \([\s\S]*?\}\s*</>\s*\)\}\s*</div>\s*\)\}", re.MULTILINE)

new_settings = """{/* TAB 5: SYSTEM GENERAL SETTINGS */}
              {activeTab === 'settings' && (
                <div id="admin-settings-tab" className="space-y-4 pb-24 relative">
                  {loadingSettings ? (
                    <div className="text-center py-10 text-neutral-500 text-xs">Loading application config...</div>
                  ) : (
                    <>
                      {/* Sticky Save Bar */}
                      <div className="sticky top-0 z-40 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-neutral-900 pb-4 pt-2 mb-6 flex justify-between items-center">
                        <div>
                          <h3 className="font-serif text-lg tracking-widest text-[#C9A227] uppercase">Settings</h3>
                          <p className="text-[10px] text-neutral-500 font-sans tracking-wider uppercase mt-1">Manage appearance, text, and contact</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            setLoadingAction(true);
                            try {
                              await saveThemeSettingsAction();
                              await saveContactSettingsAction();
                            } finally {
                              setLoadingAction(false);
                            }
                          }}
                          disabled={loadingAction}
                          className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#ebd04e] text-black text-xs font-bold tracking-wider uppercase rounded shadow-lg flex items-center space-x-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <Save className="w-4 h-4" />
                          <span>{loadingAction ? 'Saving...' : 'Save All Settings'}</span>
                        </button>
                      </div>

                      {/* APPEARANCE GROUP */}
                      <div className="border border-neutral-900 bg-[var(--color-bg)] rounded overflow-hidden">
                        <button 
                          type="button" 
                          onClick={() => setSettingsGroup(settingsGroup === 'appearance' ? '' as any : 'appearance')}
                          className="w-full flex items-center justify-between p-4 bg-neutral-950/50 hover:bg-neutral-900/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <Palette className="w-4 h-4 text-[#C9A227]" />
                            <h3 className="font-serif text-sm tracking-widest text-[var(--color-text)] uppercase">Appearance</h3>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${settingsGroup === 'appearance' ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {settingsGroup === 'appearance' && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 border-t border-neutral-900 space-y-6">
                                {/* Presets Grid */}
                                <div className="space-y-3">
                                  <span className="text-[10px] tracking-wider text-neutral-500 font-sans uppercase font-semibold">Quick Color Presets</span>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <button
                                      type="button"
                                      onClick={() => selectThemePreset({ bg: '#000000', text: '#ffffff', accent: '#C9A227' })}
                                      className="px-3 py-2 text-left border border-neutral-800 rounded bg-[var(--color-bg)] hover:border-neutral-600 transition-colors flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--color-text)] cursor-pointer"
                                    >
                                      <span>Gold</span>
                                      <div className="w-3 h-3 rounded-full bg-[#C9A227] shadow-sm" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => selectThemePreset({ bg: '#0B0B0B', text: '#f3f4f6', accent: '#A1A1AA' })}
                                      className="px-3 py-2 text-left border border-neutral-800 rounded bg-zinc-950 hover:border-neutral-600 transition-colors flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--color-text)] cursor-pointer"
                                    >
                                      <span>Silver</span>
                                      <div className="w-3 h-3 rounded-full bg-[#A1A1AA] shadow-sm" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => selectThemePreset({ bg: '#0A0103', text: '#fafafa', accent: '#800020' })}
                                      className="px-3 py-2 text-left border border-neutral-800 rounded bg-red-950/20 hover:border-neutral-600 transition-colors flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--color-text)] cursor-pointer"
                                    >
                                      <span>Burgundy</span>
                                      <div className="w-3 h-3 rounded-full bg-[#800020] shadow-sm" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => selectThemePreset({ bg: '#020617', text: '#f8fafc', accent: '#1E3A8A' })}
                                      className="px-3 py-2 text-left border border-neutral-800 rounded bg-blue-950/20 hover:border-neutral-600 transition-colors flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--color-text)] cursor-pointer"
                                    >
                                      <span>Dark Blue</span>
                                      <div className="w-3 h-3 rounded-full bg-[#1E3A8A] shadow-sm" />
                                    </button>
                                  </div>
                                </div>

                                {/* Custom Color Pickers */}
                                <div className="space-y-3 pt-4 border-t border-neutral-900/50">
                                  <span className="text-[10px] tracking-wider text-neutral-500 font-sans uppercase font-semibold">Custom Colors</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] text-neutral-400 block font-sans">Background</span>
                                      <div className="flex items-center space-x-3 bg-neutral-900/30 p-2 rounded border border-neutral-800">
                                        <div className="relative w-6 h-6 rounded-sm border border-neutral-700 overflow-hidden shrink-0">
                                          <input type="color" value={themeSettings.bg} onChange={(e) => setThemeSettings({ ...themeSettings, bg: e.target.value })} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" />
                                        </div>
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 flex-1">{themeSettings.bg}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] text-neutral-400 block font-sans">Text Content</span>
                                      <div className="flex items-center space-x-3 bg-neutral-900/30 p-2 rounded border border-neutral-800">
                                        <div className="relative w-6 h-6 rounded-sm border border-neutral-700 overflow-hidden shrink-0">
                                          <input type="color" value={themeSettings.text} onChange={(e) => setThemeSettings({ ...themeSettings, text: e.target.value })} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" />
                                        </div>
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 flex-1">{themeSettings.text}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] text-neutral-400 block font-sans">Accent Highlight</span>
                                      <div className="flex items-center space-x-3 bg-neutral-900/30 p-2 rounded border border-neutral-800">
                                        <div className="relative w-6 h-6 rounded-sm border border-neutral-700 overflow-hidden shrink-0">
                                          <input type="color" value={themeSettings.accent} onChange={(e) => setThemeSettings({ ...themeSettings, accent: e.target.value })} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" />
                                        </div>
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 flex-1">{themeSettings.accent}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] text-neutral-400 block font-sans">Contact Form Bg</span>
                                      <div className="flex items-center space-x-3 bg-neutral-900/30 p-2 rounded border border-neutral-800">
                                        <div className="relative w-6 h-6 rounded-sm border border-neutral-700 overflow-hidden shrink-0">
                                          <input type="color" value={themeSettings.contactFormBg || '#0a0a0a'} onChange={(e) => setThemeSettings({ ...themeSettings, contactFormBg: e.target.value })} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" />
                                        </div>
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 flex-1">{themeSettings.contactFormBg || '#0a0a0a'}</span>
                                      </div>
                                    </div>
                                    
                                    {/* Section specific colors */}
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] text-neutral-400 block font-sans">Performances Section Bg</span>
                                      <div className="flex items-center space-x-3 bg-neutral-900/30 p-2 rounded border border-neutral-800">
                                        <div className="relative w-6 h-6 rounded-sm border border-neutral-700 overflow-hidden shrink-0">
                                          <input type="color" value={themeSettings.colorPerformancesBg || themeSettings.bg} onChange={(e) => setThemeSettings({ ...themeSettings, colorPerformancesBg: e.target.value })} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" />
                                        </div>
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 flex-1">{themeSettings.colorPerformancesBg || 'Default'}</span>
                                        {themeSettings.colorPerformancesBg && (
                                          <button type="button" onClick={() => setThemeSettings({ ...themeSettings, colorPerformancesBg: undefined })} className="p-1 hover:bg-white/10 rounded cursor-pointer"><X className="w-3 h-3 text-red-400"/></button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] text-neutral-400 block font-sans">Performances Text</span>
                                      <div className="flex items-center space-x-3 bg-neutral-900/30 p-2 rounded border border-neutral-800">
                                        <div className="relative w-6 h-6 rounded-sm border border-neutral-700 overflow-hidden shrink-0">
                                          <input type="color" value={themeSettings.colorPerformancesText || themeSettings.text} onChange={(e) => setThemeSettings({ ...themeSettings, colorPerformancesText: e.target.value })} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" />
                                        </div>
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 flex-1">{themeSettings.colorPerformancesText || 'Default'}</span>
                                        {themeSettings.colorPerformancesText && (
                                          <button type="button" onClick={() => setThemeSettings({ ...themeSettings, colorPerformancesText: undefined })} className="p-1 hover:bg-white/10 rounded cursor-pointer"><X className="w-3 h-3 text-red-400"/></button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] text-neutral-400 block font-sans">Contact Section Text</span>
                                      <div className="flex items-center space-x-3 bg-neutral-900/30 p-2 rounded border border-neutral-800">
                                        <div className="relative w-6 h-6 rounded-sm border border-neutral-700 overflow-hidden shrink-0">
                                          <input type="color" value={themeSettings.colorContactText || themeSettings.text} onChange={(e) => setThemeSettings({ ...themeSettings, colorContactText: e.target.value })} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" />
                                        </div>
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 flex-1">{themeSettings.colorContactText || 'Default'}</span>
                                        {themeSettings.colorContactText && (
                                          <button type="button" onClick={() => setThemeSettings({ ...themeSettings, colorContactText: undefined })} className="p-1 hover:bg-white/10 rounded cursor-pointer"><X className="w-3 h-3 text-red-400"/></button>
                                        )}
                                      </div>
                                    </div>

                                  </div>
                                </div>
                                
                                <div className="flex justify-end pt-2 border-t border-neutral-900/50">
                                  <button type="button" onClick={saveThemeSettingsAction} disabled={loadingAction} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-[var(--color-text)] text-xs tracking-wider uppercase rounded transition-colors cursor-pointer">
                                    Save Appearance
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* TYPOGRAPHY GROUP */}
                      <div className="border border-neutral-900 bg-[var(--color-bg)] rounded overflow-hidden">
                        <button 
                          type="button" 
                          onClick={() => setSettingsGroup(settingsGroup === 'typography' ? '' as any : 'typography')}
                          className="w-full flex items-center justify-between p-4 bg-neutral-950/50 hover:bg-neutral-900/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-4 h-4 text-[#C9A227]" />
                            <h3 className="font-serif text-sm tracking-widest text-[var(--color-text)] uppercase">Typography</h3>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${settingsGroup === 'typography' ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {settingsGroup === 'typography' && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 border-t border-neutral-900 space-y-4">
                                <div className="space-y-1.5 max-w-xl">
                                  <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">
                                    Global Font Choice (홈페이지 통합 글꼴 선택)
                                  </label>
                                  <select
                                    value={themeSettings.fontSans || 'Inter'}
                                    onChange={(e) => {
                                      const selectedFont = e.target.value;
                                      setThemeSettings({ 
                                        ...themeSettings, 
                                        fontSans: selectedFont,
                                        fontSerif: selectedFont,
                                        fontNavbar: selectedFont,
                                        fontMono: selectedFont
                                      });
                                    }}
                                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-3 text-sm text-neutral-200 font-sans cursor-pointer"
                                  >
                                    <option value="Inter">Inter (Clean Sans, Elegant Standard)</option>
                                    <option value="Space Grotesk">Space Grotesk (Modern Tech-Forward)</option>
                                    <option value="Outfit">Outfit (Minimalist Geometric)</option>
                                    <option value="Montserrat">Montserrat (Classic Proportional Sans)</option>
                                    <option value="Playfair Display">Playfair Display (Graceful Classic Serif)</option>
                                    <option value="Cormorant Garamond">Cormorant Garamond (Premium Editorial Serif)</option>
                                    <option value="Cinzel">Cinzel (Cinematic Classical Roman)</option>
                                    <option value="Georgia">Georgia (Warm Academic Serif)</option>
                                    <option value="JetBrains Mono">JetBrains Mono (Sleek Technical Monospace)</option>
                                  </select>
                                  <p className="text-[10px] text-neutral-500 font-sans mt-2">
                                    * 선택한 글꼴이 홈페이지의 네비게이션, 본문, 대제목, 소제목 등 모든 텍스트에 일괄 적용되어 일관성 있고 깔끔한 레이아웃을 제공합니다.
                                  </p>
                                </div>
                                <div className="flex justify-end pt-2 border-t border-neutral-900/50">
                                  <button type="button" onClick={saveThemeSettingsAction} disabled={loadingAction} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-[var(--color-text)] text-xs tracking-wider uppercase rounded transition-colors cursor-pointer">
                                    Save Typography
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* HERO SECTION GROUP */}
                      <div className="border border-neutral-900 bg-[var(--color-bg)] rounded overflow-hidden">
                        <button 
                          type="button" 
                          onClick={() => setSettingsGroup(settingsGroup === 'hero' ? '' as any : 'hero')}
                          className="w-full flex items-center justify-between p-4 bg-neutral-950/50 hover:bg-neutral-900/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <Image className="w-4 h-4 text-[#C9A227]" />
                            <h3 className="font-serif text-sm tracking-widest text-[var(--color-text)] uppercase">Hero Section</h3>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${settingsGroup === 'hero' ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {settingsGroup === 'hero' && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 border-t border-neutral-900 space-y-8">
                                
                                {/* Home Main Screen Text Customization */}
                                <div className="space-y-4">
                                  <span className="text-[11px] font-sans text-neutral-400 uppercase tracking-wider block font-medium">
                                    Home Main Screen Text Customization (메인 홈 첫화면 글씨 수정)
                                  </span>
                                  
                                  <div className="bg-neutral-900/20 border border-neutral-800 rounded overflow-hidden">
                                    {/* Language Tabs */}
                                    <div className="flex border-b border-neutral-800">
                                      <button type="button" onClick={() => setHeroLangTab('EN')} className={`flex-1 py-2.5 text-[10px] uppercase tracking-wider font-semibold transition-colors ${heroLangTab === 'EN' ? 'bg-neutral-800 text-[#C9A227]' : 'text-neutral-500 hover:bg-neutral-800/50'}`}>English</button>
                                      <button type="button" onClick={() => setHeroLangTab('DE')} className={`flex-1 py-2.5 text-[10px] uppercase tracking-wider font-semibold transition-colors border-l border-neutral-800 ${heroLangTab === 'DE' ? 'bg-neutral-800 text-[#C9A227]' : 'text-neutral-500 hover:bg-neutral-800/50'}`}>German (DE)</button>
                                      <button type="button" onClick={() => setHeroLangTab('KO')} className={`flex-1 py-2.5 text-[10px] uppercase tracking-wider font-semibold transition-colors border-l border-neutral-800 ${heroLangTab === 'KO' ? 'bg-neutral-800 text-[#C9A227]' : 'text-neutral-500 hover:bg-neutral-800/50'}`}>Korean (KO)</button>
                                    </div>
                                    
                                    <div className="p-4">
                                      {heroLangTab === 'EN' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Main Title</span>
                                            <input type="text" placeholder="HYUNKYUM KIM" value={themeSettings.heroTitle || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroTitle: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Subtitle</span>
                                            <input type="text" placeholder="BARITONE" value={themeSettings.heroSubtitle || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroSubtitle: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                          <div className="md:col-span-2 space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Description</span>
                                            <input type="text" placeholder="Opera Singer based in Germany" value={themeSettings.heroDescription || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroDescription: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                          <div className="md:col-span-2 space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Discover Button</span>
                                            <input type="text" placeholder="Discover" value={themeSettings.heroDiscover || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroDiscover: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                        </div>
                                      )}
                                      
                                      {heroLangTab === 'DE' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Main Title</span>
                                            <input type="text" placeholder="HYUNKYUM KIM" value={themeSettings.heroTitleDE || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroTitleDE: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Subtitle</span>
                                            <input type="text" placeholder="BARITON" value={themeSettings.heroSubtitleDE || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroSubtitleDE: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                          <div className="md:col-span-2 space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Description</span>
                                            <input type="text" placeholder="Opernsänger ansässig in Deutschland" value={themeSettings.heroDescriptionDE || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroDescriptionDE: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                          <div className="md:col-span-2 space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Discover Button</span>
                                            <input type="text" placeholder="Entdecken" value={themeSettings.heroDiscoverDE || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroDiscoverDE: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                        </div>
                                      )}

                                      {heroLangTab === 'KO' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Main Title</span>
                                            <input type="text" placeholder="바리톤 김현겸" value={themeSettings.heroTitleKO || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroTitleKO: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Subtitle</span>
                                            <input type="text" placeholder="바리톤" value={themeSettings.heroSubtitleKO || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroSubtitleKO: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                          <div className="md:col-span-2 space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Description</span>
                                            <input type="text" placeholder="독일 오페라 가수" value={themeSettings.heroDescriptionKO || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroDescriptionKO: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                          <div className="md:col-span-2 space-y-1.5">
                                            <span className="text-[10px] text-neutral-500 uppercase block font-sans">Discover Button</span>
                                            <input type="text" placeholder="살펴보기" value={themeSettings.heroDiscoverKO || ''} onChange={(e) => setThemeSettings({ ...themeSettings, heroDiscoverKO: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)] font-sans" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

new_settings += """
                                {/* Background Media */}
                                <div className="space-y-4 pt-4 border-t border-neutral-900/50">
                                  <span className="text-[11px] font-sans text-neutral-400 uppercase tracking-wider block font-medium">
                                    Background Media
                                  </span>

                                  <div className="bg-neutral-900/20 border border-neutral-800 rounded overflow-hidden">
                                    {/* Media Tabs */}
                                    <div className="flex border-b border-neutral-800">
                                      <button type="button" onClick={() => { setHeroBgTab('image'); setThemeSettings({ ...themeSettings, homeBgType: 'image' }); }} className={`flex-1 py-2.5 text-[10px] uppercase tracking-wider font-semibold transition-colors ${heroBgTab === 'image' ? 'bg-neutral-800 text-[#C9A227]' : 'text-neutral-500 hover:bg-neutral-800/50'}`}>Image</button>
                                      <button type="button" onClick={() => { setHeroBgTab('video'); setThemeSettings({ ...themeSettings, homeBgType: 'video' }); }} className={`flex-1 py-2.5 text-[10px] uppercase tracking-wider font-semibold transition-colors border-l border-neutral-800 ${heroBgTab === 'video' ? 'bg-neutral-800 text-[#C9A227]' : 'text-neutral-500 hover:bg-neutral-800/50'}`}>Video (MP4)</button>
                                      <button type="button" onClick={() => { setHeroBgTab('youtube'); setThemeSettings({ ...themeSettings, homeBgType: 'youtube' }); }} className={`flex-1 py-2.5 text-[10px] uppercase tracking-wider font-semibold transition-colors border-l border-neutral-800 ${heroBgTab === 'youtube' ? 'bg-neutral-800 text-[#C9A227]' : 'text-neutral-500 hover:bg-neutral-800/50'}`}>YouTube</button>
                                    </div>

                                    <div className="p-4 space-y-4">
                                      {/* Upload or URL input based on tab */}
                                      {heroBgTab !== 'youtube' && (
                                        <div className="border-2 border-dashed border-neutral-800 rounded bg-[var(--color-bg)] hover:bg-[var(--color-bg)] transition-colors flex flex-col items-center justify-center space-y-2 relative group text-center min-h-[110px]">
                                          <input
                                            type="file"
                                            accept={heroBgTab === 'image' ? "image/*" : "video/*"}
                                            disabled={isUploadingFile}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              if (file.type.startsWith('video/')) {
                                                if (file.size > 800 * 1024) {
                                                  triggerAlert('error', 'Video file is too large! Maximum 800KB allowed. Use a URL instead.');
                                                  return;
                                                }
                                                const reader = new FileReader();
                                                reader.onload = (re) => {
                                                  if (typeof re.target?.result === 'string') {
                                                    setThemeSettings({ ...themeSettings, homeBg: re.target.result, homeBgType: 'video' });
                                                    triggerAlert('success', 'Video processed successfully!');
                                                  }
                                                };
                                                reader.readAsDataURL(file);
                                              } else {
                                                handleImageCropUpload(file, (base64) => {
                                                  setThemeSettings({ ...themeSettings, homeBg: base64, homeBgType: 'image' });
                                                });
                                              }
                                              e.target.value = '';
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                          />
                                          <Upload className={`w-5 h-5 ${isUploadingFile ? 'animate-bounce text-[#C9A227]' : 'text-neutral-500 group-hover:text-[#C9A227]'} transition-colors`} />
                                          <div className="space-y-0.5">
                                            <p className="text-[11px] text-neutral-300 font-sans font-medium">
                                              {isUploadingFile ? 'Processing...' : `Upload new ${heroBgTab}`}
                                            </p>
                                            <p className="text-[9px] text-neutral-500 font-sans">
                                              Click or drag any {heroBgTab} file
                                            </p>
                                          </div>
                                        </div>
                                      )}

                                      <div className="space-y-1.5">
                                        <span className="text-[10px] text-neutral-500 uppercase block font-sans">Or Enter {heroBgTab === 'youtube' ? 'YouTube URL' : 'Image/Video URL'}</span>
                                        <input
                                          type="text"
                                          placeholder={heroBgTab === 'youtube' ? "https://youtube.com/watch?v=..." : `https://example.com/file.${heroBgTab === 'image' ? 'jpg' : 'mp4'}`}
                                          value={themeSettings.homeBg || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            let type: 'image' | 'video' | 'youtube' = heroBgTab;
                                            if (val.includes('youtube.com') || val.includes('youtu.be')) type = 'youtube';
                                            else if (val.match(/\.(mp4|webm|ogg)$/i)) type = 'video';
                                            setThemeSettings({ ...themeSettings, homeBg: val, homeBgType: type });
                                          }}
                                          className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-[var(--color-text)]"
                                        />
                                      </div>
                                      
                                      {/* Preview Block */}
                                      <div className="space-y-1.5 flex flex-col pt-2">
                                        <span className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Background Preview</span>
                                        <div className="flex-1 min-h-[150px] bg-[var(--color-bg)] border border-neutral-800 rounded flex items-center justify-center overflow-hidden p-2 relative">
                                          {themeSettings.homeBg ? (
                                            <>
                                              {themeSettings.homeBgType === 'video' ? (
                                                <video src={themeSettings.homeBg} autoPlay loop muted playsInline className="max-h-[160px] max-w-full object-contain rounded" />
                                              ) : themeSettings.homeBgType === 'youtube' ? (
                                                <div className="text-center text-neutral-500 text-[10px]"><Tv className="w-6 h-6 mx-auto mb-2 text-[#C9A227]" />YouTube Video Configured</div>
                                              ) : (
                                                <img src={themeSettings.homeBg} alt="Preview" className="max-h-[160px] max-w-full object-contain rounded" referrerPolicy="no-referrer" />
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => setThemeSettings({ ...themeSettings, homeBg: '/src/assets/images/opera_stage_1783548365279.jpg', homeBgType: 'image' })}
                                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/90 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
                                                title="Reset to Default"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </>
                                          ) : (
                                            <div className="text-center text-neutral-600 space-y-2 p-4">
                                              <Image className="w-8 h-8 mx-auto stroke-1" />
                                              <p className="text-[10px] font-sans">No custom background selected.</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-end pt-2 border-t border-neutral-900/50">
                                  <button type="button" onClick={saveThemeSettingsAction} disabled={loadingAction} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-[var(--color-text)] text-xs tracking-wider uppercase rounded transition-colors cursor-pointer">
                                    Save Hero Section
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* CONTACT GROUP */}
                      <div className="border border-neutral-900 bg-[var(--color-bg)] rounded overflow-hidden">
                        <button 
                          type="button" 
                          onClick={() => setSettingsGroup(settingsGroup === 'contact' ? '' as any : 'contact')}
                          className="w-full flex items-center justify-between p-4 bg-neutral-950/50 hover:bg-neutral-900/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <Info className="w-4 h-4 text-[#C9A227]" />
                            <h3 className="font-serif text-sm tracking-widest text-[var(--color-text)] uppercase">Contact Details & Management</h3>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${settingsGroup === 'contact' ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {settingsGroup === 'contact' && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 border-t border-neutral-900 space-y-4">
                                <div className="space-y-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Official Artist Email</label>
                                    <input type="email" value={contactSettings.email} onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-[var(--color-text)]" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Management Office Phone</label>
                                    <input type="text" value={contactSettings.phone} onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-[var(--color-text)]" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Agency / Management Label Name</label>
                                    <input type="text" value={contactSettings.management} onChange={(e) => setContactSettings({ ...contactSettings, management: e.target.value })} className="w-full bg-[var(--color-bg)] border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-[var(--color-text)]" />
                                  </div>
                                </div>
                                <div className="flex justify-end pt-2 border-t border-neutral-900/50">
                                  <button type="button" onClick={saveContactSettingsAction} disabled={loadingAction} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-[var(--color-text)] text-xs tracking-wider uppercase rounded transition-colors cursor-pointer">
                                    Save Contact Details
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                    </>
                  )}
                </div>
              )}"""

content = settings_pattern.sub(new_settings, content)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Settings tab rewritten")
