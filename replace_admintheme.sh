#!/bin/bash
# Replace from lines 228 to 476 in AdminTheme.tsx with <WebsiteContent ... />

sed -n '1,227p' src/components/admin/AdminTheme.tsx > tmp_admintheme.tsx

cat << 'INNER' >> tmp_admintheme.tsx
              <div className="relative min-h-screen">
                <WebsiteContent
                  currentLang={currentLang}
                  setLang={() => {}}
                  user={null}
                  setIsAdminOpen={() => {}}
                  scheduleItems={scheduleItems}
                  setScheduleItems={() => {}}
                  portfolioItems={portfolioItems}
                  setPortfolioItems={() => {}}
                  videoItems={videoItems}
                  setVideoItems={() => {}}
                  pressItems={pressItems}
                  setPressItems={() => {}}
                  theme={theme}
                  setTheme={setTheme}
                  bio={bio}
                  setBio={() => {}}
                  contact={contact}
                  setContact={() => {}}
                  slides={slides}
                  setSlides={() => {}}
                  activeEditSection="none"
                  setActiveEditSection={() => {}}
                  isEditingHeroText={false}
                  setIsEditingHeroText={() => {}}
                  initialThemeRef={{ current: initialTheme }}
                  loadAllData={() => {}}
                  legalModal={{ isOpen: false, type: 'impressum' }}
                  setLegalModal={() => {}}
                  t={translations[currentLang]}
                  isHeroVideoPlaying={false}
                  setIsHeroVideoPlaying={() => {}}
                  heroVideoRef={null}
                />
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
INNER

mv tmp_admintheme.tsx src/components/admin/AdminTheme.tsx
