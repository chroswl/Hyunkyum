import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add state
state_str = ''' const [isHeroEditorExpanded, setIsHeroEditorExpanded] = useState(() => {
   const saved = sessionStorage.getItem('heroEditorExpanded');
   return saved ? JSON.parse(saved) : true;
 });
 useEffect(() => {
   sessionStorage.setItem('heroEditorExpanded', JSON.stringify(isHeroEditorExpanded));
 }, [isHeroEditorExpanded]);'''

new_state_str = ''' const [isHeroEditorExpanded, setIsHeroEditorExpanded] = useState(() => {
   const saved = sessionStorage.getItem('heroEditorExpanded');
   return saved ? JSON.parse(saved) : true;
 });
 useEffect(() => {
   sessionStorage.setItem('heroEditorExpanded', JSON.stringify(isHeroEditorExpanded));
 }, [isHeroEditorExpanded]);

 const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
   const saved = sessionStorage.getItem('heroEditorSections');
   return saved ? JSON.parse(saved) : {};
 });
 const toggleSection = (id: string) => {
   setExpandedSections(prev => {
     const next = { ...prev, [id]: !prev[id] };
     sessionStorage.setItem('heroEditorSections', JSON.stringify(next));
     return next;
   });
 };'''

content = content.replace(state_str, new_state_str)

# Replace the specific block
# From {isHeroEditorExpanded && (  down to Action buttons
start_marker = '{isHeroEditorExpanded && ('
end_marker = '{/* Action buttons */}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    old_block = content[start_idx:end_idx]
    
    new_block = '''{isHeroEditorExpanded && (
     <>
     {heroEditorMessage && (
       <div className={`p-2 rounded text-[10px] text-center font-sans ${
         heroEditorMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
       }`}>
         {heroEditorMessage.text}
       </div>
     )}
     <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">

     {/* Vertical Position Global */}
     <div className="space-y-1">
       <div className="flex justify-between text-[10px] text-neutral-400 font-sans">
         <span>Global Vertical Offset</span>
       </div>
       <div className="flex items-center space-x-2">
         <input 
           type="range" min="-200" max="200" 
           value={theme.heroOffsetY || 0} 
           onChange={(e) => setTheme(prev => ({ ...prev, heroOffsetY: parseInt(e.target.value) || 0 }))} 
           className="w-full accent-[#C9A227] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
         />
         <input 
           type="number"
           value={theme.heroOffsetY || 0}
           onChange={(e) => setTheme(prev => ({ ...prev, heroOffsetY: parseInt(e.target.value) || 0 }))}
           className="w-14 bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-[#C9A227]"
         />
       </div>
     </div>

     {/* Text Alignment Global */}
     <div className="space-y-1.5">
       <span className="text-[10px] text-neutral-400 font-sans block">Global Alignment</span>
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
             {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
             {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
             {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
             <span>{align}</span>
           </button>
         ))}
       </div>
     </div>

     {/* Elements Specific Settings */}
     <div className="space-y-2 pt-2 border-t border-neutral-900">
       {[
         { id: 'Subtitle', keySize: 'heroSubtitleSize', keyX: 'heroSubtitleOffsetX', keyY: 'heroSubtitleOffsetY', defaultSize: 14, minSize: 8, maxSize: 48, label: 'Subtitle (소제목)' },
         { id: 'Title', keySize: 'heroTitleSize', keyX: 'heroTitleOffsetX', keyY: 'heroTitleOffsetY', defaultSize: 64, minSize: 24, maxSize: 120, label: 'Main Title (대제목)' },
         { id: 'Desc', keySize: 'heroDescSize', keyX: 'heroDescOffsetX', keyY: 'heroDescOffsetY', defaultSize: 16, minSize: 10, maxSize: 32, label: 'Description (설명)' },
         { id: 'Button', keySize: 'heroButtonSize', keyX: 'heroButtonOffsetX', keyY: 'heroButtonOffsetY', defaultSize: 12, minSize: 8, maxSize: 24, label: 'Button (버튼)' },
       ].map(elem => (
         <div key={elem.id} className="border border-neutral-800 rounded bg-neutral-950 overflow-hidden">
           <button
             onClick={() => toggleSection(elem.id)}
             className="w-full flex items-center justify-between p-2.5 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
           >
             <span className="text-[10px] text-neutral-300 font-sans tracking-wider uppercase">{elem.label}</span>
             <div className="flex items-center space-x-3">
               <span 
                 onClick={(e) => {
                   e.stopPropagation();
                   setTheme(prev => ({ 
                     ...prev, 
                     [elem.keySize]: elem.defaultSize,
                     [elem.keyX]: 0,
                     [elem.keyY]: 0
                   }));
                 }}
                 className="text-[9px] text-neutral-500 hover:text-[#C9A227] tracking-wider uppercase flex items-center space-x-1"
               >
                 <span>Reset</span>
               </span>
               {expandedSections[elem.id] ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
             </div>
           </button>
           
           {expandedSections[elem.id] && (
             <div className="p-3 space-y-4 border-t border-neutral-800">
               {/* Typography */}
               <div className="space-y-2">
                 <span className="text-[9px] text-neutral-500 font-sans uppercase tracking-widest border-b border-neutral-800 pb-1 block">Typography</span>
                 <div className="space-y-1">
                   <div className="flex justify-between text-[9px] text-neutral-400 font-sans">
                     <span>Font Size</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <input 
                       type="range" min={elem.minSize} max={elem.maxSize} 
                       value={Number(theme[elem.keySize as keyof ThemeSettings]) || elem.defaultSize} 
                       onChange={(e) => setTheme(prev => ({ ...prev, [elem.keySize]: parseInt(e.target.value) || elem.defaultSize }))} 
                       className="w-full accent-[#C9A227] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                     />
                     <input 
                       type="number"
                       value={Number(theme[elem.keySize as keyof ThemeSettings]) || elem.defaultSize}
                       onChange={(e) => setTheme(prev => ({ ...prev, [elem.keySize]: parseInt(e.target.value) || elem.defaultSize }))}
                       className="w-12 bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-[#C9A227]"
                     />
                   </div>
                 </div>
               </div>
               
               {/* Position */}
               <div className="space-y-2">
                 <span className="text-[9px] text-neutral-500 font-sans uppercase tracking-widest border-b border-neutral-800 pb-1 block">Position</span>
                 
                 {/* Pos X */}
                 <div className="space-y-1">
                   <div className="flex justify-between text-[9px] text-neutral-400 font-sans">
                     <span>Horizontal (X)</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <input 
                       type="range" min="-300" max="300" 
                       value={Number(theme[elem.keyX as keyof ThemeSettings]) || 0} 
                       onChange={(e) => setTheme(prev => ({ ...prev, [elem.keyX]: parseInt(e.target.value) || 0 }))} 
                       className="w-full accent-[#C9A227] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                     />
                     <input 
                       type="number"
                       value={Number(theme[elem.keyX as keyof ThemeSettings]) || 0}
                       onChange={(e) => setTheme(prev => ({ ...prev, [elem.keyX]: parseInt(e.target.value) || 0 }))}
                       className="w-12 bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-[#C9A227]"
                     />
                   </div>
                 </div>

                 {/* Pos Y */}
                 <div className="space-y-1">
                   <div className="flex justify-between text-[9px] text-neutral-400 font-sans">
                     <span>Vertical (Y)</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <input 
                       type="range" min="-300" max="300" 
                       value={Number(theme[elem.keyY as keyof ThemeSettings]) || 0} 
                       onChange={(e) => setTheme(prev => ({ ...prev, [elem.keyY]: parseInt(e.target.value) || 0 }))} 
                       className="w-full accent-[#C9A227] bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                     />
                     <input 
                       type="number"
                       value={Number(theme[elem.keyY as keyof ThemeSettings]) || 0}
                       onChange={(e) => setTheme(prev => ({ ...prev, [elem.keyY]: parseInt(e.target.value) || 0 }))}
                       className="w-12 bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-[#C9A227]"
                     />
                   </div>
                 </div>
               </div>
             </div>
           )}
         </div>
       ))}
     </div>

     <div className="pt-4 flex justify-center">
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to reset all hero settings to defaults?")) {
              setTheme(prev => ({
                ...prev,
                heroSubtitleSize: 14, heroSubtitleOffsetX: 0, heroSubtitleOffsetY: 0,
                heroTitleSize: 64, heroTitleOffsetX: 0, heroTitleOffsetY: 0,
                heroDescSize: 16, heroDescOffsetX: 0, heroDescOffsetY: 0,
                heroButtonSize: 12, heroButtonOffsetX: 0, heroButtonOffsetY: 0,
                heroOffsetY: 0, heroAlign: 'center'
              }));
            }
          }}
          className="text-[9px] text-neutral-500 hover:text-rose-400 tracking-wider uppercase transition-colors"
        >
          Reset All Hero Settings
        </button>
     </div>
     </div>
     '''
    
    content = content.replace(old_block, new_block)
    
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Replaced content successfully")
else:
    print("Could not find start or end markers")
