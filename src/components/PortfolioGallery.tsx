import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PortfolioItem, Language } from '../types';
import { translations } from '../translations';

interface PortfolioGalleryProps {
 items: PortfolioItem[];
 currentLang: Language;
}

export default function PortfolioGallery({ items, currentLang }: PortfolioGalleryProps) {
 const [activeCategory, setActiveCategory] = useState<'All' | 'Portrait' | 'Stage' | 'Backstage'>('All');
 const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
 
 const t = translations[currentLang];

 const categories: ('All' | 'Portrait' | 'Stage' | 'Backstage')[] = ['All', 'Portrait', 'Stage', 'Backstage'];

 const filteredItems = activeCategory === 'All' 
 ? items 
 : items.filter(item => item.category === activeCategory);

 const getTranslatedTitle = (item: PortfolioItem) => {
 if (item.title) {
 return item.title[currentLang] || item.title['EN'];
 }
 return '';
 };

 const handleNext = (e: React.MouseEvent) => {
 e.stopPropagation();
 if (selectedItemIndex !== null) {
 setSelectedItemIndex((selectedItemIndex + 1) % filteredItems.length);
 }
 };

 const handlePrev = (e: React.MouseEvent) => {
 e.stopPropagation();
 if (selectedItemIndex !== null) {
 setSelectedItemIndex((selectedItemIndex - 1 + filteredItems.length) % filteredItems.length);
 }
 };

 return (
 <div id="portfolio-gallery-root" className="w-full">
 {/* Category Tabs */}
 <div id="portfolio-tabs" className="flex justify-center space-x-2 md:space-x-4 mb-10 overflow-x-auto pb-2">
 {categories.map((cat) => (
 <button
 key={cat}
 id={`portfolio-tab-${cat.toLowerCase()}`}
 onClick={() => setActiveCategory(cat)}
 className={`px-5 py-2 text-xs tracking-[0.2em] uppercase transition-all border rounded-full duration-300 whitespace-nowrap ${
 activeCategory === cat
 ? 'bg-white/10 border-white font-semibold shadow-sm'
 : 'bg-transparent border-black/10 hover: hover:border-black/20 font-normal'
 }`}
 >
 {cat === 'All' ? t.allCat : cat === 'Portrait' ? t.portraitCat : cat === 'Stage' ? t.stageCat : t.backstageCat}
 </button>
 ))}
 </div>

 {/* Grid Layout (Columns approach for standard elegant masonry feel) */}
 <motion.div 
 id="portfolio-grid"
 layout 
 className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
 >
 <AnimatePresence mode="popLayout">
 {filteredItems.map((item, index) => (
 <motion.div
 key={item.id}
 layout
 id={`portfolio-item-${item.id}`}
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.4 }}
 className="break-inside-avoid relative group overflow-hidden cursor-pointer bg-transparent/5 rounded-sm border border-black/10/60"
 onClick={() => setSelectedItemIndex(index)}
 >
 {/* Premium image wrapper */}
 <div className="relative overflow-hidden w-full h-full">
 <img
 src={item.url}
 alt={getTranslatedTitle(item) || item.category}
 className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
 referrerPolicy="no-referrer"
 loading="lazy"
 onContextMenu={(e) => e.preventDefault()}
 />
 
 {/* Luxury gradient overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
 <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
 <span className="text-[10px] tracking-widest uppercase font-sans font-semibold">
 {item.category === 'Portrait' ? t.portraitCat : item.category === 'Stage' ? t.stageCat : item.category === 'Backstage' ? t.backstageCat : ''}
 </span>
 <h4 className="text-sm font-serif font-light tracking-wide mt-1">
 {getTranslatedTitle(item)}
 </h4>
 <div className="mt-3 flex items-center space-x-1.5 text-[10px] ">
 <Maximize2 className="w-3 h-3 " />
 <span className="tracking-wider">{t.clickZoom}</span>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </motion.div>

 {/* Lightbox / Modal */}
 <AnimatePresence>
 {selectedItemIndex !== null && (
 <motion.div
 id="portfolio-lightbox"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-100 bg-transparent/98 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
 onClick={() => setSelectedItemIndex(null)}
 >
 {/* Close Button */}
 <button
 id="lightbox-close"
 onClick={() => setSelectedItemIndex(null)}
 className="absolute top-6 right-6 hover: transition-colors p-2 bg-transparent/5/40 rounded-full border border-black/10"
 aria-label="Close Lightbox"
 >
 <X className="w-5 h-5" />
 </button>

 {/* Navigation Buttons */}
 {filteredItems.length > 1 && (
 <>
 <button
 id="lightbox-prev"
 onClick={handlePrev}
 className="absolute left-4 md:left-8 hover: transition-colors p-3 bg-transparent/5/40 hover:bg-transparent/5/60 border border-black/10 rounded-full"
 aria-label="Previous Image"
 >
 <ChevronLeft className="w-6 h-6" />
 </button>
 <button
 id="lightbox-next"
 onClick={handleNext}
 className="absolute right-4 md:right-8 hover: transition-colors p-3 bg-transparent/5/40 hover:bg-transparent/5/60 border border-black/10 rounded-full"
 aria-label="Next Image"
 >
 <ChevronRight className="w-6 h-6" />
 </button>
 </>
 )}

 {/* Main Content Area */}
 <motion.div
 id="lightbox-content"
 initial={{ scale: 0.95, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.95, y: 20 }}
 transition={{ type: 'spring', duration: 0.5 }}
 className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center relative"
 onClick={(e) => e.stopPropagation()}
 >
 <img
 src={filteredItems[selectedItemIndex].url}
 alt="Enlarged stage photography"
 className="max-w-full max-h-[75vh] object-contain rounded-sm border border-black/10 shadow-2xl"
 referrerPolicy="no-referrer"
 onContextMenu={(e) => e.preventDefault()}
 />
 
 {/* Image Description Block */}
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
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
