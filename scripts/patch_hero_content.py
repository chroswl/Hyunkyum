import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

start_marker = 'id="hero-content"'
end_marker = '{/* Scroll helper */}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found")
    exit(1)

start_idx = content.rfind('<div', 0, start_idx)

hero_content = """<div 
   id="hero-content" 
   className={`relative z-10 px-6 max-w-4xl space-y-6 flex flex-col transition-all duration-300 ${
     theme.heroAlign === 'left' ? 'text-left items-start mr-auto' :
     theme.heroAlign === 'right' ? 'text-right items-end ml-auto' :
     'text-center items-center mx-auto'
   }`}
   style={{ 
     transform: `translateY(${theme.heroOffsetY || 0}px)`
   }}
 >
   {/* Subtitle */}
   <motion.div
     drag={isEditingHeroText}
     dragMomentum={false}
     onDragEnd={(e, info) => {
       setTheme(prev => ({
         ...prev,
         heroSubtitleOffsetX: (prev.heroSubtitleOffsetX || 0) + info.offset.x,
         heroSubtitleOffsetY: (prev.heroSubtitleOffsetY || 0) + info.offset.y
       }));
     }}
     initial={{ opacity: 0, y: 15 + (theme.heroSubtitleOffsetY || 0), x: theme.heroSubtitleOffsetX || 0 }}
     animate={{ opacity: 1, y: theme.heroSubtitleOffsetY || 0, x: theme.heroSubtitleOffsetX || 0 }}
     transition={isEditingHeroText ? { duration: 0 } : { duration: 1 }}
     className={`font-sans text-xs md:text-sm tracking-[0.4em] uppercase font-semibold ${isEditingHeroText ? 'cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center justify-center' : ''}`}
     style={{ fontSize: theme.heroSubtitleSize ? `${theme.heroSubtitleSize}px` : undefined }}
   >
     {isEditingHeroText && <span className="absolute -top-4 left-0 text-[8px] text-[#C9A227] tracking-widest uppercase">Subtitle</span>}
     {isEditingHeroText ? (
       <input
         type="text"
         className="bg-transparent border-none w-full focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50 rounded cursor-text"
         style={{ textAlign: theme.heroAlign || 'center' }}
         value={currentLang === 'KO' ? (theme.heroSubtitleKO ?? '') : currentLang === 'DE' ? (theme.heroSubtitleDE ?? '') : (theme.heroSubtitle ?? '')}
         onPointerDownCapture={(e) => e.stopPropagation()}
         onChange={(e) => {
           const val = e.target.value;
           setTheme(prev => ({
             ...prev,
             [currentLang === 'KO' ? 'heroSubtitleKO' : currentLang === 'DE' ? 'heroSubtitleDE' : 'heroSubtitle']: val
           }));
         }}
       />
     ) : (
       getHeroSubtitle()
     )}
   </motion.div>

   {/* Main Title */}
   <motion.div
     drag={isEditingHeroText}
     dragMomentum={false}
     onDragEnd={(e, info) => {
       setTheme(prev => ({
         ...prev,
         heroTitleOffsetX: (prev.heroTitleOffsetX || 0) + info.offset.x,
         heroTitleOffsetY: (prev.heroTitleOffsetY || 0) + info.offset.y
       }));
     }}
     initial={{ opacity: 0, scale: 0.98, y: theme.heroTitleOffsetY || 0, x: theme.heroTitleOffsetX || 0 }}
     animate={{ opacity: 1, scale: 1, y: theme.heroTitleOffsetY || 0, x: theme.heroTitleOffsetX || 0 }}
     transition={isEditingHeroText ? { duration: 0 } : { duration: 1.2, delay: 0.2 }}
     className={`text-4xl sm:text-6xl md:text-8xl font-serif font-light tracking-[0.1em] uppercase leading-none ${isEditingHeroText ? 'cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center justify-center' : ''}`}
     style={{ fontSize: theme.heroTitleSize ? `${theme.heroTitleSize}px` : undefined }}
   >
     {isEditingHeroText && <span className="absolute -top-4 left-0 text-[8px] text-[#C9A227] tracking-widest uppercase font-sans">Main Title</span>}
     {isEditingHeroText ? (
       <input
         type="text"
         className="bg-transparent border-none w-full focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50 rounded cursor-text"
         style={{ textAlign: theme.heroAlign || 'center' }}
         value={currentLang === 'KO' ? (theme.heroTitleKO ?? '') : currentLang === 'DE' ? (theme.heroTitleDE ?? '') : (theme.heroTitle ?? '')}
         onPointerDownCapture={(e) => e.stopPropagation()}
         onChange={(e) => {
           const val = e.target.value;
           setTheme(prev => ({
             ...prev,
             [currentLang === 'KO' ? 'heroTitleKO' : currentLang === 'DE' ? 'heroTitleDE' : 'heroTitle']: val
           }));
         }}
       />
     ) : (
       getHeroTitle()
     )}
   </motion.div>

   {/* Description */}
   <motion.div
     drag={isEditingHeroText}
     dragMomentum={false}
     onDragEnd={(e, info) => {
       setTheme(prev => ({
         ...prev,
         heroDescOffsetX: (prev.heroDescOffsetX || 0) + info.offset.x,
         heroDescOffsetY: (prev.heroDescOffsetY || 0) + info.offset.y
       }));
     }}
     initial={{ opacity: 0, y: 15 + (theme.heroDescOffsetY || 0), x: theme.heroDescOffsetX || 0 }}
     animate={{ opacity: 1, y: theme.heroDescOffsetY || 0, x: theme.heroDescOffsetX || 0 }}
     transition={isEditingHeroText ? { duration: 0 } : { duration: 1, delay: 0.4 }}
     className={`font-sans text-xs sm:text-sm md:text-base tracking-[0.2em] font-light max-w-xl uppercase pt-6 ${isEditingHeroText ? 'cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center justify-center' : ''}`}
     style={{ 
       fontSize: theme.heroDescSize ? `${theme.heroDescSize}px` : undefined,
       marginLeft: theme.heroAlign === 'right' ? 'auto' : theme.heroAlign === 'left' ? '0' : 'auto',
       marginRight: theme.heroAlign === 'left' ? 'auto' : theme.heroAlign === 'right' ? '0' : 'auto'
     }}
   >
     {isEditingHeroText && <span className="absolute -top-4 left-0 text-[8px] text-[#C9A227] tracking-widest uppercase">Description</span>}
     {isEditingHeroText ? (
       <textarea
         rows={2}
         className="bg-transparent border-none w-full focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50 rounded cursor-text resize-none"
         style={{ textAlign: theme.heroAlign || 'center' }}
         value={currentLang === 'KO' ? (theme.heroDescriptionKO ?? '') : currentLang === 'DE' ? (theme.heroDescriptionDE ?? '') : (theme.heroDescription ?? '')}
         onPointerDownCapture={(e) => e.stopPropagation()}
         onChange={(e) => {
           const val = e.target.value;
           setTheme(prev => ({
             ...prev,
             [currentLang === 'KO' ? 'heroDescriptionKO' : currentLang === 'DE' ? 'heroDescriptionDE' : 'heroDescription']: val
           }));
         }}
       />
     ) : (
       getHeroDescription()
     )}
   </motion.div>

   {/* Button */}
   <motion.div
     drag={isEditingHeroText}
     dragMomentum={false}
     onDragEnd={(e, info) => {
       setTheme(prev => ({
         ...prev,
         heroButtonOffsetX: (prev.heroButtonOffsetX || 0) + info.offset.x,
         heroButtonOffsetY: (prev.heroButtonOffsetY || 0) + info.offset.y
       }));
     }}
     initial={{ opacity: 0, y: 20 + (theme.heroButtonOffsetY || 0), x: theme.heroButtonOffsetX || 0 }}
     animate={{ opacity: 1, y: theme.heroButtonOffsetY || 0, x: theme.heroButtonOffsetX || 0 }}
     transition={isEditingHeroText ? { duration: 0 } : { duration: 1, delay: 0.6 }}
     className={`pt-8 ${isEditingHeroText ? 'cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex flex-col items-center justify-center' : ''}`}
   >
     {isEditingHeroText && <span className="absolute -top-4 left-0 text-[8px] text-[#C9A227] tracking-widest uppercase font-sans">Button</span>}
     {isEditingHeroText ? (
       <input
         type="text"
         className="bg-transparent border border-black/10 px-8 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50 rounded cursor-text text-center text-xs tracking-[0.25em] uppercase w-full max-w-[200px] block"
         style={{ fontSize: theme.heroButtonSize ? `${theme.heroButtonSize}px` : undefined }}
         value={currentLang === 'KO' ? (theme.heroDiscoverKO ?? '') : currentLang === 'DE' ? (theme.heroDiscoverDE ?? '') : (theme.heroDiscover ?? '')}
         onPointerDownCapture={(e) => e.stopPropagation()}
         onChange={(e) => {
           const val = e.target.value;
           setTheme(prev => ({
             ...prev,
             [currentLang === 'KO' ? 'heroDiscoverKO' : currentLang === 'DE' ? 'heroDiscoverDE' : 'heroDiscover']: val
           }));
         }}
       />
     ) : (
       <button
         id="discover-button"
         onClick={() => scrollToSection('biography')}
         className="group px-8 py-3.5 border border-black/10 hover:text-black hover:bg-white font-sans text-xs tracking-[0.25em] uppercase rounded-sm transition-all duration-500 flex items-center space-x-2 mx-auto cursor-pointer"
         style={{ fontSize: theme.heroButtonSize ? `${theme.heroButtonSize}px` : undefined }}
       >
         <span>{getHeroDiscover()}</span>
         <ChevronDown className="w-4 h-4 transform group-hover:translate-y-1 transition-transform group-hover:text-black" />
       </button>
     )}
   </motion.div>
 </div>
 """

new_content = content[:start_idx] + hero_content + content[end_idx:]
with open('src/App.tsx', 'w') as f:
    f.write(new_content)
print("Replaced successfully!")
