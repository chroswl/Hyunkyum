const fs = require('fs');
let pressTsx = fs.readFileSync('src/components/PressSection.tsx', 'utf-8');
pressTsx = pressTsx.replace('theme: any;', 'theme?: any;');
pressTsx = pressTsx.replace('onThemeUpdated: (newTheme: any) => void;', 'onThemeUpdated?: (newTheme: any) => void;');
pressTsx = pressTsx.replace('onThemeUpdated, items: propItems }: PressSectionProps) {', 'onThemeUpdated = () => {}, items: propItems }: PressSectionProps) {');
fs.writeFileSync('src/components/PressSection.tsx', pressTsx);

let adminHeroTsx = fs.readFileSync('src/components/admin/AdminHero.tsx', 'utf-8');
adminHeroTsx = adminHeroTsx.replace("import HeroPreview from './HeroPreview';", "import HeroSection from '../HeroSection';\nimport { translations } from '../../translations';");
adminHeroTsx = adminHeroTsx.replace(/<HeroPreview theme=\{theme\} currentLang=\{currentLang\} \/>/, `<div className="w-full h-full overflow-y-auto bg-black custom-scrollbar">
          <HeroSection 
            theme={theme}
            setTheme={setTheme}
            currentLang={currentLang}
            t={translations[currentLang]}
            user={null}
            isAdminOpen={true}
            activeEditSection="none"
            setActiveEditSection={() => {}}
            isEditingHeroText={false}
            setIsEditingHeroText={() => {}}
            scrollToSection={() => {}}
          />
        </div>`);
fs.writeFileSync('src/components/admin/AdminHero.tsx', adminHeroTsx);

console.log('Fixed PressSection and AdminHero');
