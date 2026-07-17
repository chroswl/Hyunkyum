const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

// Find the return statement
const returnIndex = code.indexOf('return (');
const afterReturn = code.substring(returnIndex);

// I will just use regex to replace everything from the Admin Panel Header & Trigger up to the Category Tabs
let newCode = code.substring(0, returnIndex);

const newReturn = `return (
    <div id="portfolio-gallery-root" className="w-full relative transition-all duration-500 pb-4" style={{ backgroundColor: theme?.bg, color: theme?.text }}>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={\`absolute -top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 border rounded-full text-xs tracking-wider uppercase font-sans flex items-center space-x-2 shadow-lg \${
              notification.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-400 backdrop-blur-sm'
                : 'border-rose-500/30 bg-rose-950/80 text-rose-400 backdrop-blur-sm'
            }\`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full">
        {/* Category Tabs */}
        <div 
          id="portfolio-tabs" 
          className="flex flex-wrap justify-center gap-2 sm:gap-4 transition-all duration-500 mb-8 px-4"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              id={\`portfolio-tab-\${cat.toLowerCase()}\`}
              onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
              className={\`px-3 sm:px-5 py-2 text-[10px] sm:text-xs tracking-wider sm:tracking-[0.2em] uppercase transition-all border rounded-full duration-300 whitespace-nowrap \${
                activeCategory === cat ? 'font-semibold shadow-sm' : 'font-normal'
              }\`}
              style={{
                backgroundColor: activeCategory === cat 
                  ? ('rgba(var(--color-text-rgb), 0.15)') 
                  : 'transparent',
                borderColor: activeCategory === cat 
                  ? (theme?.text || 'var(--color-text)') 
                  : (theme?.text ? \`\${theme.text}40\` : 'var(--color-text)'),
                color: activeCategory === cat 
                  ? (theme?.text || 'var(--color-text)') 
                  : (theme?.text || 'var(--color-text)')
              }}
            >
              {cat === 'Portrait' ? t.portraitCat : cat === 'Stage' ? t.stageCat : t.backstageCat}
            </button>
          ))}
        </div>

        {/* Grid Container */}
        <div className="w-full">
          <SortableCollection
            items={filteredItems}
            onReorder={async (newItems) => {
              // Wait, SortableCollection handles drag end, but we need to update Firestore.
              // We'll write the drag end logic here if we didn't pass handleDragEnd
              const updatedList = newItems.map((item, idx) => ({ ...item, order: idx }));
              onItemsUpdated(updatedList);
              try {
                const batchUpdates = updatedList.map((item) => {
                  return updateDoc(doc(db, "portfolio", item.id), { order: item.order });
                });
                await Promise.all(batchUpdates);
                showNotification("Order updated successfully");
                onRefreshData();
              } catch (err) {
                console.error("Error saving order:", err);
                showNotification("Failed to update order", "error");
              }
            }}
            onAdd={user ? () => window.dispatchEvent(new CustomEvent('add-portfolio-item')) : undefined}
            isAdmin={!!user}
            gridClassName={\`grid gap-2 sm:gap-4 md:gap-6 pb-6 pt-1 w-full \${
              activeCategory === null 
                ? 'grid-cols-3' 
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }\`}
            renderItem={(item, index) => (
              <CollectionItem
                id={item.id}
                className="relative group overflow-hidden cursor-pointer bg-transparent/5 rounded-sm border border-black/10/60 aspect-square"
              >
                <div 
                  className="relative overflow-hidden w-full h-full"
                  onClick={() => setSelectedItemIndex(index)}
                >
                  <img
                    src={item.url}
                    alt={getTranslatedTitle(item) || item.category}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
                {user && (
                  <HoverOverlay
                    onEdit={() => {
                      window.dispatchEvent(new CustomEvent('edit-portfolio-item', { detail: item.id }));
                      window.dispatchEvent(new CustomEvent('open-admin-panel', { detail: 'portfolio' }));
                    }}
                    onDelete={() => handleDeletePhoto(item.id)}
                  />
                )}
              </CollectionItem>
            )}
          />
        </div>

        {/* Lightbox / Modal */}
        <AnimatePresence>
          {selectedItemIndex !== null && (
            <motion.div
              id="portfolio-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8"
              onClick={() => setSelectedItemIndex(null)}
            >
              <button
                className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-white/50 hover:text-white transition-colors z-50 bg-black/20 hover:bg-black/40 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemIndex(null);
                }}
              >
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              
              {filteredItems.length > 1 && (
                <>
                  <button
                    className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white transition-colors z-50 bg-black/20 hover:bg-black/40 rounded-full"
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                  <button
                    className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white transition-colors z-50 bg-black/20 hover:bg-black/40 rounded-full"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                </>
              )}

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={filteredItems[selectedItemIndex].url}
                  alt="Stage photography of Opera Singer Hyunkyum Kim performing"
                  className="max-w-full max-h-[75vh] object-contain rounded-sm border border-black/10 shadow-2xl cursor-pointer"
                  referrerPolicy="no-referrer"
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => setSelectedItemIndex(null)}
                />
                
                <div className="mt-4 text-center max-w-2xl px-4">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">
                    {filteredItems[selectedItemIndex].category === 'Portrait' 
                      ? t.portraitCat 
                      : filteredItems[selectedItemIndex].category === 'Stage' 
                      ? t.stageCat 
                      : t.backstageCat}
                  </span>
                  <h3 className="text-lg md:text-xl font-serif font-light tracking-wide mt-1">
                    {getTranslatedTitle(filteredItems[selectedItemIndex])}
                  </h3>
                  {filteredItems[selectedItemIndex].copyright && (
                    <div className="mt-2 text-[11px] font-sans tracking-[0.15em] uppercase" style={{ color: theme?.text ? \`\${theme.text}B3\` : undefined }}>
                      {filteredItems[selectedItemIndex].copyrightUrl ? (
                        <a href={filteredItems[selectedItemIndex].copyrightUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A227] transition-colors" onClick={(e) => e.stopPropagation()}>
                          {filteredItems[selectedItemIndex].copyright.startsWith('©') ? filteredItems[selectedItemIndex].copyright : \`© \${filteredItems[selectedItemIndex].copyright}\`}
                        </a>
                      ) : (
                        <span>{filteredItems[selectedItemIndex].copyright.startsWith('©') ? filteredItems[selectedItemIndex].copyright : \`© \${filteredItems[selectedItemIndex].copyright}\`}</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {cropTarget && (
        <ImageCropperModal
          imageSrc={cropTarget.src}
          aspect={cropTarget.aspect}
          copyright={(cropTarget.copyright || '').trim().startsWith('©') ? (cropTarget.copyright || '') : \`© \${(cropTarget.copyright || '').trim()}\`}
          copyrightUrl={cropTarget.copyrightUrl}
          onCropDone={(base64, copyright, copyrightUrl) => cropTarget.onCrop(base64, copyright, copyrightUrl)}
          onCropCancel={() => setCropTarget(null)}
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/PortfolioGallery.tsx', newCode + newReturn);
