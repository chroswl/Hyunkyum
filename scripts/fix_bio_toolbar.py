import re

with open('src/components/BiographySection.tsx', 'r') as f:
    content = f.read()

# Define the old block to match exactly
old_block = """      {/* Edit Mode Toolbar */}
      {isEditMode && (
        <div className="fixed top-0 left-0 right-0 bg-black/90 border-b border-neutral-800 p-3 flex flex-wrap items-center justify-center gap-4 z-50 shadow-2xl backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <span className="text-white text-sm font-bold tracking-wider">BIOGRAPHY EDIT MODE</span>
            <div className="flex items-center space-x-1 bg-neutral-900 rounded p-1">
              {['EN', 'DE', 'KO'].map(lang => (
                <button
                  key={lang}
                  onClick={() => setLang(lang as any)}
                  className={`px-3 py-1 rounded text-xs font-bold tracking-wider transition-colors ${currentLang === lang ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-white text-sm font-bold tracking-wider">BIOGRAPHY EDIT MODE</span>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#C9A227] hover:bg-[#ebd04e] text-black px-4 py-1.5 rounded text-xs font-bold tracking-widest uppercase transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
            </button>
            <button 
              onClick={handleCancelEditMode}
              className="bg-transparent border border-neutral-600 hover:border-white text-white px-4 py-1.5 rounded text-xs font-bold tracking-widest uppercase transition-colors"
            >
              CANCEL
            </button>
            <button 
              onClick={handleCancelEditMode}
              className="bg-red-900/50 hover:bg-red-900 text-white px-4 py-1.5 rounded text-xs font-bold tracking-widest uppercase transition-colors"
            >
              EXIT EDIT MODE
            </button>
            {successMsg && <span className="text-green-400 text-xs">{successMsg}</span>}
          </div>
        </div>
      )}

      {/* Admin Edit Button */}
      {user && !isEditMode && activeEditSection === 'none' && (
        <div className="absolute top-4 right-4 z-40">
          <button 
            onClick={handleEnterEditMode}
            className="flex items-center space-x-2 bg-black/50 hover:bg-black/80 text-white px-4 py-2 rounded border border-neutral-800 transition-colors backdrop-blur-sm text-xs font-medium tracking-wider uppercase"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Biography</span>
          </button>
        </div>
      )}"""

new_block = """      <div className={`max-w-7xl mx-auto px-6 pt-10 pb-4 ${isEditMode ? '' : 'hidden'}`}></div>
      <div className={`max-w-7xl mx-auto w-full px-6 md:px-12 pt-12 space-y-8 md:space-y-10`}>
        {/* Admin Header & Edit Trigger */}
        {user && (activeEditSection === 'none' || activeEditSection === 'biography') && (
          <div className="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-white/5 gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-[9px] font-mono tracking-widest text-[#C9A227] uppercase bg-white/5 px-2 py-1 rounded">
                ADMIN ACCESS
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {!isEditMode ? (
                <button
                  type="button"
                  onClick={handleEnterEditMode}
                  className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest px-4 py-2 bg-white/5 border border-white/10 hover:border-[#C9A227] hover:bg-white/10 rounded-sm text-neutral-300 transition-all cursor-pointer font-sans font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Edit Biography</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <div className="flex items-center space-x-1 bg-white/5 px-1.5 py-1 rounded-sm border border-white/10">
                    {(['EN', 'DE', 'KO'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLang(lang as any)}
                        className={`px-2.5 py-0.5 text-[10px] font-sans font-bold tracking-wider rounded-sm transition-all ${
                          currentLang === lang
                            ? 'bg-[#C9A227] text-black font-extrabold shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 bg-[#C9A227]/10 hover:bg-[#C9A227]/20 border border-[#C9A227]/30 text-[#C9A227] rounded-sm transition-all cursor-pointer font-sans"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEditMode}
                    className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white transition-all cursor-pointer font-sans"
                  >
                    <X className="w-3 h-3" />
                    <span>Exit Edit Mode</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}"""

content = content.replace(old_block, new_block)

# Remove the old <div className={`max-w-7xl mx-auto space-y-8 md:space-y-10 ${isEditMode ? 'pt-16' : ''}`}>
content = content.replace("<div className={`max-w-7xl mx-auto space-y-8 md:space-y-10 ${isEditMode ? 'pt-16' : ''}`}>", "")
# And we need to add the closing div at the end? Actually `max-w-7xl` was already opened in new_block.

with open('src/components/BiographySection.tsx', 'w') as f:
    f.write(content)

print("Updated Biography section toolbar")
