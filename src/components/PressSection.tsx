import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, ExternalLink, FileText, ArrowRight } from 'lucide-react';
import { PressItem, Language } from '../types';
import { translations } from '../translations';
import { fetchPress } from '../firebase';

interface PressSectionProps {
 currentLang: Language;
}

export default function PressSection({ currentLang }: PressSectionProps) {
 const [pressItems, setPressItems] = useState<PressItem[]>([]);
 const [loading, setLoading] = useState(true);
 const t = translations[currentLang];

 useEffect(() => {
 const loadPress = async () => {
 try {
 const data = await fetchPress();
 setPressItems(data);
 } catch (err) {
 console.error("Error loading press reviews:", err);
 } finally {
 setLoading(false);
 }
 };

 loadPress();

 // Listen for press changes from admin panel
 const handlePressChange = () => {
 loadPress();
 };
 window.addEventListener('pressChanged', handlePressChange);
 return () => window.removeEventListener('pressChanged', handlePressChange);
 }, []);

 if (loading) {
 return (
 <div className="flex justify-center items-center py-24">
 <div className="animate-pulse flex flex-col items-center space-y-4">
 <div className="w-12 h-[1px] bg-transparent/10" />
 <span className="text-[10px] tracking-[0.3em] uppercase font-sans">Loading Reviews</span>
 </div>
 </div>
 );
 }

 return (
 <div id="press-section-root" className="w-full">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
 {pressItems.map((item, index) => {
 const rating = item.rating || 5;
 const translatedQuote = item.quote[currentLang] || item.quote['EN'];
 
 return (
 <motion.div
 key={item.id}
 id={`press-item-card-${item.id}`}
 initial={{ opacity: 0, y: 30 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6, delay: index * 0.15 }}
 className="group relative bg-transparent/5/40 hover:bg-transparent/5 border border-black/10 hover:border-black/10 p-8 md:p-10 rounded-sm flex flex-col justify-between min-h-[280px] transition-all duration-500 overflow-hidden"
 >
 {/* Corner accent line */}
 <div className="absolute top-0 left-0 w-[1px] h-0 group-hover:h-full bg-gradient-to-b from-white to-transparent transition-all duration-700" />

 <div className="space-y-6">
 {/* Stars and Type Tag */}
 <div className="flex justify-between items-center">
 <div className="flex space-x-1">
 {Array.from({ length: 5 }).map((_, i) => (
 <Star 
 key={i} 
 className={`w-3.5 h-3.5 ${
 i < rating 
 ? ' fill-neutral-300/20' 
 : ''
 }`} 
 />
 ))}
 </div>
 <span className="text-[9px] font-mono tracking-widest uppercase">
 {item.type || 'Review'}
 </span>
 </div>

 {/* Big Quote */}
 <p className="font-serif text-lg md:text-xl lg:text-2xl font-light group-hover: leading-relaxed tracking-wide transition-colors duration-300">
 “{translatedQuote}”
 </p>
 </div>

 {/* Source & Read Action button */}
 <div className="border-t border-black/10/60 pt-6 mt-8 flex justify-between items-end">
 <div className="space-y-1">
 <h4 className="font-serif text-sm tracking-widest uppercase font-normal">
 {item.source}
 </h4>
 {item.author && (
 <p className="text-[10px] font-sans tracking-wide">
 {item.author}
 </p>
 )}
 <p className="text-[9px] font-mono">
 {new Date(item.date).toLocaleDateString(currentLang === 'KO' ? 'ko-KR' : currentLang === 'DE' ? 'de-DE' : 'en-US', {
 year: 'numeric',
 month: 'long'
 })}
 </p>
 </div>

 {/* Link Trigger Button - slide up/fade on hover */}
 {item.link && (
 <a
 href={item.link}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center space-x-1.5 text-[10px] tracking-widest group-hover: uppercase transition-all duration-300 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
 >
 <span>{t.readArticle}</span>
 <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
 </a>
 )}
 </div>
 </motion.div>
 );
 })}
 </div>
 </div>
 );
}
