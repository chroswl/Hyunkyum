import re

with open("src/components/admin/AdminHero.tsx", "r") as f:
    content = f.read()

replacement = """      <PropertyAccordion title="Typography & Position">
        <PropertySelect label="Alignment" value={theme.heroAlign || 'center'} options={[{label: 'Left', value: 'left'}, {label: 'Center', value: 'center'}, {label: 'Right', value: 'right'}]} onChange={(v) => updateField('heroAlign', v)} />
        
        <div className="pt-4 border-t border-neutral-800/50 space-y-4">
           <h4 className="text-[10px] uppercase text-[#C9A227] tracking-widest font-semibold">Content Position</h4>
           <PropertySlider label="X Offset" value={theme.heroContentOffsetX ?? 0} min={-200} max={200} onChange={(v) => updateField('heroContentOffsetX', v)} />
           <PropertySlider label="Y Offset" value={theme.heroContentOffsetY ?? 0} min={-200} max={200} onChange={(v) => updateField('heroContentOffsetY', v)} />
        </div>

        <div className="pt-4 border-t border-neutral-800/50 space-y-4">
           <h4 className="text-[10px] uppercase text-[#C9A227] tracking-widest font-semibold">Typography Sizes</h4>
           <PropertySlider label="Title" value={theme.heroTitleSize ?? 64} min={10} max={120} onChange={(v) => updateField('heroTitleSize', v)} />
           <PropertySlider label="Subtitle" value={theme.heroSubtitleSize ?? 14} min={8} max={40} onChange={(v) => updateField('heroSubtitleSize', v)} />
           <PropertySlider label="Description" value={theme.heroDescSize ?? 16} min={8} max={40} onChange={(v) => updateField('heroDescSize', v)} />
           <PropertySlider label="Button Text" value={theme.heroButtonSize ?? 11} min={8} max={30} onChange={(v) => updateField('heroButtonSize', v)} />
        </div>
      </PropertyAccordion>"""

pattern = re.compile(r'      <PropertyAccordion title="Typography & Position">.*?      </PropertyAccordion>', re.DOTALL)
content = pattern.sub(replacement, content)

with open("src/components/admin/AdminHero.tsx", "w") as f:
    f.write(content)
