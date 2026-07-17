const fs = require('fs');
let hero = fs.readFileSync('src/components/admin/AdminHero.tsx', 'utf-8');

hero = hero.replace(/<PropertyAccordion title="Background Settings">[\s\S]*?<\/PropertyAccordion>/,
`<PropertyAccordion title="Background Settings">
        <PropertySelect label="Background Type" value={theme.homeBgType || 'image'} options={[{label: 'Image', value: 'image'}, {label: 'Video', value: 'video'}, {label: 'YouTube', value: 'youtube'}]} onChange={(v) => updateField('homeBgType', v as any)} />
        <PropertyInput label="Background URL / Youtube ID" value={theme.homeBg || ''} onChange={(v) => updateField('homeBg', v)} />
      </PropertyAccordion>`);
fs.writeFileSync('src/components/admin/AdminHero.tsx', hero);
console.log("Fixed AdminHero.tsx background properties");
