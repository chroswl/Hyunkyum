const fs = require('fs');

let file = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// 1. Extract Hero Section Group
const heroStartIdx = file.indexOf('{/* HERO SECTION GROUP */}');
const heroEndString = '</AnimatePresence>\n                      </div>';
const heroEndIdx = file.indexOf(heroEndString, heroStartIdx) + heroEndString.length;
const heroSectionCode = file.substring(heroStartIdx, heroEndIdx);

// Extract the inner content of Hero Section (inside the <motion.div>)
const heroInnerStart = heroSectionCode.indexOf('<div className="p-5 border-t border-neutral-900 space-y-8">');
const heroInnerEnd = heroSectionCode.lastIndexOf('</motion.div>');
const heroInnerCode = heroSectionCode.substring(heroInnerStart, heroInnerEnd)
  .replace(/className="p-5 border-t border-neutral-900 space-y-8"/, 'className="space-y-8"'); // unwrap border

// 2. Extract Contact Group
const contactStartIdx = file.indexOf('{/* CONTACT GROUP */}');
const contactEndIdx = file.indexOf(heroEndString, contactStartIdx) + heroEndString.length;
const contactSectionCode = file.substring(contactStartIdx, contactEndIdx);

const contactInnerStart = contactSectionCode.indexOf('<div className="p-5 border-t border-neutral-900 space-y-4">');
const contactInnerEnd = contactSectionCode.lastIndexOf('</motion.div>');
const contactInnerCode = contactSectionCode.substring(contactInnerStart, contactInnerEnd)
  .replace(/className="p-5 border-t border-neutral-900 space-y-4"/, 'className="space-y-4 border border-neutral-900 bg-[var(--color-bg)] p-5 rounded"');

// 3. Remove them from settings
file = file.substring(0, heroStartIdx) + file.substring(heroEndIdx, contactStartIdx) + file.substring(contactEndIdx);

// 4. Create Hero Tab
const heroTabCode = `
              {/* TAB: HERO DESIGN */}
              {activeTab === 'hero' && (
                <div id="admin-hero-tab" className="space-y-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Monitor className="w-5 h-5 text-[#C9A227]" />
                    <h2 className="text-lg font-serif tracking-widest text-[var(--color-text)] uppercase">Hero Design</h2>
                  </div>
                  ${heroInnerCode}
                </div>
              )}
`;

// Insert Hero Tab before Settings tab
const settingsTabIdx = file.indexOf('{/* TAB 5: SYSTEM GENERAL SETTINGS */}');
file = file.substring(0, settingsTabIdx) + heroTabCode + file.substring(settingsTabIdx);


// 5. Transform Messages Tab into Contact Tab
const messagesTabIdx = file.indexOf('{activeTab === \'messages\' && (');
file = file.replace("{activeTab === 'messages' && (", "{activeTab === 'contact' && (");

const messagesHeaderIdx = file.indexOf('Inquiries & Correspondence logs', messagesTabIdx);
const insertContactIdx = file.lastIndexOf('<div className="flex justify-between items-center mb-2">', messagesHeaderIdx);

const contactTabHeader = `
                  <div className="flex items-center space-x-3 mb-6">
                    <MessageSquare className="w-5 h-5 text-[#C9A227]" />
                    <h2 className="text-lg font-serif tracking-widest text-[var(--color-text)] uppercase">Contact Management</h2>
                  </div>
                  
                  <div className="mb-10">
                    <h3 className="text-sm font-serif tracking-wider text-neutral-300 mb-4">Contact Details</h3>
                    ${contactInnerCode}
                  </div>
                  
                  <hr className="border-neutral-900 my-8" />
`;

file = file.substring(0, insertContactIdx) + contactTabHeader + file.substring(insertContactIdx);


fs.writeFileSync('src/components/AdminPanel.tsx', file);
console.log("Transformed successfully");
