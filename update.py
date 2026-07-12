with open('src/App.tsx', 'r') as f:
    content = f.read()

# Subtitle Edit Block
sub_edit_old = '''     <div className="w-full flex flex-col space-y-1 items-stretch admin-panel-exclude">
       <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-sans">Edit Subtitle (소제목 수정):</span>
       <input 
         type="text"
         className="bg-white/5 border border-[#C9A227]/40 px-3 py-1.5 rounded text-xs md:text-sm tracking-[0.4em] uppercase font-semibold text-white focus:outline-none focus:border-[#C9A227] w-full font-sans"
         style={{ textAlign: theme.heroAlign || 'center' }}'''

sub_edit_new = '''     <div className="w-full flex flex-col space-y-1 items-stretch admin-panel-exclude" style={{ transform: `translate(${theme.heroSubtitleOffsetX || 0}px, ${theme.heroSubtitleOffsetY || 0}px)` }}>
       <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-sans">Edit Subtitle (소제목 수정):</span>
       <input 
         type="text"
         className="bg-white/5 border border-[#C9A227]/40 px-3 py-1.5 rounded text-xs md:text-sm tracking-[0.4em] uppercase font-semibold text-white focus:outline-none focus:border-[#C9A227] w-full font-sans"
         style={{ textAlign: theme.heroAlign || 'center', fontSize: theme.heroSubtitleSize ? `${theme.heroSubtitleSize}px` : undefined }}'''

content = content.replace(sub_edit_old, sub_edit_new)

# Subtitle View Block
sub_view_old = '''     <motion.p 
       initial={{ opacity: 0, y: 15 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 1 }}
       className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase font-semibold"
     >'''

sub_view_new = '''     <motion.p 
       initial={{ opacity: 0, y: 15 + (theme.heroSubtitleOffsetY || 0), x: theme.heroSubtitleOffsetX || 0 }}
       animate={{ opacity: 1, y: theme.heroSubtitleOffsetY || 0, x: theme.heroSubtitleOffsetX || 0 }}
       transition={{ duration: 1 }}
       className="font-sans text-xs md:text-sm tracking-[0.4em] uppercase font-semibold"
       style={{ fontSize: theme.heroSubtitleSize ? `${theme.heroSubtitleSize}px` : undefined }}
     >'''

content = content.replace(sub_view_old, sub_view_new)

# Title Edit Block
title_edit_old = '''     <div className="w-full flex flex-col space-y-1 items-stretch admin-panel-exclude">
       <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-sans">Edit Main Title (대제목 수정):</span>'''

title_edit_new = '''     <div className="w-full flex flex-col space-y-1 items-stretch admin-panel-exclude" style={{ transform: `translate(${theme.heroTitleOffsetX || 0}px, ${theme.heroTitleOffsetY || 0}px)` }}>
       <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-sans">Edit Main Title (대제목 수정):</span>'''

content = content.replace(title_edit_old, title_edit_new)

# Title View Block
title_view_old = '''     <motion.h1 
       initial={{ opacity: 0, scale: 0.98 }}
       animate={{ opacity: 1, scale: 1 }}
       transition={{ duration: 1.2, delay: 0.2 }}
       className="text-4xl sm:text-6xl md:text-8xl font-serif font-light tracking-[0.1em] uppercase leading-none"
       style={{ 
         fontSize: theme.heroTitleSize ? `${theme.heroTitleSize}px` : undefined
       }}
     >'''

title_view_new = '''     <motion.h1 
       initial={{ opacity: 0, scale: 0.98, y: theme.heroTitleOffsetY || 0, x: theme.heroTitleOffsetX || 0 }}
       animate={{ opacity: 1, scale: 1, y: theme.heroTitleOffsetY || 0, x: theme.heroTitleOffsetX || 0 }}
       transition={{ duration: 1.2, delay: 0.2 }}
       className="text-4xl sm:text-6xl md:text-8xl font-serif font-light tracking-[0.1em] uppercase leading-none"
       style={{ 
         fontSize: theme.heroTitleSize ? `${theme.heroTitleSize}px` : undefined
       }}
     >'''

content = content.replace(title_view_old, title_view_new)


# Desc Edit Block
desc_edit_old = '''     <div className="w-full flex flex-col space-y-1 items-stretch admin-panel-exclude">
       <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-sans">Edit Description (설명글 수정):</span>'''

desc_edit_new = '''     <div className="w-full flex flex-col space-y-1 items-stretch admin-panel-exclude" style={{ transform: `translate(${theme.heroDescOffsetX || 0}px, ${theme.heroDescOffsetY || 0}px)` }}>
       <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-sans">Edit Description (설명글 수정):</span>'''

content = content.replace(desc_edit_old, desc_edit_new)

# Desc View Block
desc_view_old = '''     <motion.p 
       initial={{ opacity: 0, y: 15 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 1, delay: 0.4 }}
       className="font-sans text-xs sm:text-sm md:text-base tracking-[0.2em] font-light max-w-xl uppercase pt-6"
       style={{ 
         fontSize: theme.heroDescSize ? `${theme.heroDescSize}px` : undefined,
         marginLeft: theme.heroAlign === 'right' ? 'auto' : theme.heroAlign === 'left' ? '0' : 'auto',
         marginRight: theme.heroAlign === 'left' ? 'auto' : theme.heroAlign === 'right' ? '0' : 'auto'
       }}
     >'''

desc_view_new = '''     <motion.p 
       initial={{ opacity: 0, y: 15 + (theme.heroDescOffsetY || 0), x: theme.heroDescOffsetX || 0 }}
       animate={{ opacity: 1, y: theme.heroDescOffsetY || 0, x: theme.heroDescOffsetX || 0 }}
       transition={{ duration: 1, delay: 0.4 }}
       className="font-sans text-xs sm:text-sm md:text-base tracking-[0.2em] font-light max-w-xl uppercase pt-6"
       style={{ 
         fontSize: theme.heroDescSize ? `${theme.heroDescSize}px` : undefined,
         marginLeft: theme.heroAlign === 'right' ? 'auto' : theme.heroAlign === 'left' ? '0' : 'auto',
         marginRight: theme.heroAlign === 'left' ? 'auto' : theme.heroAlign === 'right' ? '0' : 'auto'
       }}
     >'''

content = content.replace(desc_view_old, desc_view_new)

# Button Edit Block
btn_edit_old = '''     <div className="w-full flex items-center space-x-2 justify-center admin-panel-exclude pt-4">
       <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-sans">Button Text:</span>
       <input 
         type="text"
         className="bg-white/5 border border-[#C9A227]/40 px-3 py-1 rounded text-xs tracking-[0.25em] uppercase text-white focus:outline-none focus:border-[#C9A227] text-center"'''

btn_edit_new = '''     <div className="w-full flex items-center space-x-2 justify-center admin-panel-exclude pt-4" style={{ transform: `translate(${theme.heroButtonOffsetX || 0}px, ${theme.heroButtonOffsetY || 0}px)` }}>
       <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-sans">Button Text:</span>
       <input 
         type="text"
         className="bg-white/5 border border-[#C9A227]/40 px-3 py-1 rounded text-xs tracking-[0.25em] uppercase text-white focus:outline-none focus:border-[#C9A227] text-center"
         style={{ fontSize: theme.heroButtonSize ? `${theme.heroButtonSize}px` : undefined }}'''

content = content.replace(btn_edit_old, btn_edit_new)

# Button View Block
btn_view_old = '''     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 1, delay: 0.6 }}
       className="pt-8"
     >
       <button
         id="discover-button"
         onClick={() => scrollToSection('biography')}
         className="group px-8 py-3.5 border border-black/10 hover:text-black hover:bg-white font-sans text-xs tracking-[0.25em] uppercase rounded-sm transition-all duration-500 flex items-center space-x-2 mx-auto cursor-pointer"
       >'''

btn_view_new = '''     <motion.div
       initial={{ opacity: 0, y: 20 + (theme.heroButtonOffsetY || 0), x: theme.heroButtonOffsetX || 0 }}
       animate={{ opacity: 1, y: theme.heroButtonOffsetY || 0, x: theme.heroButtonOffsetX || 0 }}
       transition={{ duration: 1, delay: 0.6 }}
       className="pt-8"
     >
       <button
         id="discover-button"
         onClick={() => scrollToSection('biography')}
         className="group px-8 py-3.5 border border-black/10 hover:text-black hover:bg-white font-sans text-xs tracking-[0.25em] uppercase rounded-sm transition-all duration-500 flex items-center space-x-2 mx-auto cursor-pointer"
         style={{ fontSize: theme.heroButtonSize ? `${theme.heroButtonSize}px` : undefined }}
       >'''

content = content.replace(btn_view_old, btn_view_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print('Success!')
