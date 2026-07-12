const fs = require('fs');
const path = require('path');

const components = [
  'AdminSchedule',
  'AdminPortfolio',
  'AdminVideos',
  'AdminPress',
  'AdminContact',
  'AdminSettings',
  'AdminSlides'
];

components.forEach(comp => {
  const code = `import React from 'react';
import type { Language } from '../../types';

export default function ${comp}({ currentLang }: { currentLang: Language }) {
  return (
    <div className="bg-[#111] border border-neutral-900 p-8 rounded text-center">
      <h3 className="font-serif text-[#C9A227] tracking-widest uppercase">${comp.replace('Admin', '')} Editor</h3>
      <p className="text-neutral-500 mt-2 text-sm">Modular component ready for implementation.</p>
    </div>
  );
}
`;
  fs.writeFileSync(path.join('src', 'components', 'admin', comp + '.tsx'), code);
});
console.log("Stubs generated");
