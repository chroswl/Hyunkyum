const fs = require('fs');

let heroTsx = fs.readFileSync('src/components/HeroSection.tsx', 'utf-8');
heroTsx = heroTsx.replace('setIsEditingHeroText: (val: boolean) => void;', 'setIsEditingHeroText: (val: boolean) => void;\n  scrollToSection?: (id: string) => void;');
heroTsx = heroTsx.replace('setIsEditingHeroText,', 'setIsEditingHeroText,\n  scrollToSection = () => {},');
fs.writeFileSync('src/components/HeroSection.tsx', heroTsx);

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
appTsx = appTsx.replace('setIsEditingHeroText={setIsEditingHeroText}', 'setIsEditingHeroText={setIsEditingHeroText}\n  scrollToSection={scrollToSection}');
fs.writeFileSync('src/App.tsx', appTsx);
console.log('Fixed HeroSection.tsx and App.tsx');
