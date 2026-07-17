#!/bin/bash
# Keep everything up to line 356. Then add the <WebsiteContent> tag, then keep the AdminPanel and LegalModal.
sed -n '1,356p' src/App.tsx > tmp_app.tsx

cat << 'INNER' >> tmp_app.tsx
    <>
      <WebsiteContent
        currentLang={currentLang} setLang={setLang} user={user} setIsAdminOpen={setIsAdminOpen}
        scheduleItems={scheduleItems} setScheduleItems={setScheduleItems} portfolioItems={portfolioItems} setPortfolioItems={setPortfolioItems}
        videoItems={videoItems} setVideoItems={setVideoItems} pressItems={pressItems} setPressItems={setPressItems}
        theme={theme} setTheme={setTheme} bio={bio} setBio={setBio} contact={contact} setContact={setContact} slides={slides} setSlides={setSlides}
        activeEditSection={activeEditSection} setActiveEditSection={setActiveEditSection}
        isEditingHeroText={isEditingHeroText} setIsEditingHeroText={setIsEditingHeroText}
        initialThemeRef={initialThemeRef} loadAllData={loadAllData} legalModal={legalModal} setLegalModal={setLegalModal} t={t}
        isHeroVideoPlaying={isHeroVideoPlaying} setIsHeroVideoPlaying={setIsHeroVideoPlaying} heroVideoRef={heroVideoRef}
      />

      {/* 9. FIREBASE DRAWER ADMIN MANAGEMENT PANEL */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel
            key="admin-panel"
            currentLang={currentLang}
            setLang={setLang}
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            user={user}
            scheduleItems={scheduleItems}
            portfolioItems={portfolioItems}
            refreshData={() => loadAllData(false)}
          />
        )}
        {legalModal.isOpen && (
          <LegalModal
            key="legal-modal"
            isOpen={legalModal.isOpen}
            type={legalModal.type}
            currentLang={currentLang}
            theme={theme}
            onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
          />
        )}
      </AnimatePresence>
    </>
  );
}
INNER

mv tmp_app.tsx src/App.tsx
