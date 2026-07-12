const fs = require('fs');
const file = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const lines = file.split('\n');

const dashboardCode = `              {/* TAB 0: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div id="admin-dashboard-tab" className="space-y-6 max-w-5xl mx-auto">
                  <div className="flex items-center space-x-3 mb-6">
                    <LayoutDashboard className="w-5 h-5 text-[#C9A227]" />
                    <h2 className="text-lg font-serif tracking-widest text-[var(--color-text)] uppercase">System Dashboard</h2>
                  </div>

                  {/* System Status Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border border-emerald-500/20 bg-emerald-500/5 p-3 rounded flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <div className="text-[10px] font-sans text-neutral-400 uppercase tracking-wider">Database</div>
                        <div className="text-xs text-emerald-400 font-medium">Firestore Connected</div>
                      </div>
                    </div>
                    <div className="border border-emerald-500/20 bg-emerald-500/5 p-3 rounded flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <div className="text-[10px] font-sans text-neutral-400 uppercase tracking-wider">Storage</div>
                        <div className="text-xs text-emerald-400 font-medium">Cloudflare R2 Active</div>
                      </div>
                    </div>
                    <div className="border border-emerald-500/20 bg-emerald-500/5 p-3 rounded flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <div className="text-[10px] font-sans text-neutral-400 uppercase tracking-wider">Authentication</div>
                        <div className="text-xs text-emerald-400 font-medium">Firebase Auth Secure</div>
                      </div>
                    </div>
                    <div className="border border-[#C9A227]/20 bg-[#C9A227]/5 p-3 rounded flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-[#C9A227]" />
                      <div>
                        <div className="text-[10px] font-sans text-neutral-400 uppercase tracking-wider">Environment</div>
                        <div className="text-xs text-[#C9A227] font-medium">Production</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Website Overview */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-sans tracking-widest text-neutral-500 uppercase border-b border-neutral-900 pb-2">Content Overview</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-neutral-900 bg-neutral-950 p-4 rounded flex flex-col items-center justify-center space-y-2 group hover:border-neutral-700 transition-colors">
                          <Image className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                          <span className="text-2xl font-serif text-[var(--color-text)]">{localPortfolioItems.length}</span>
                          <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-sans">Gallery Images</span>
                        </div>
                        <div className="border border-neutral-900 bg-neutral-950 p-4 rounded flex flex-col items-center justify-center space-y-2 group hover:border-neutral-700 transition-colors">
                          <Calendar className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                          <span className="text-2xl font-serif text-[var(--color-text)]">{localScheduleItems.length}</span>
                          <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-sans">Schedule Entries</span>
                        </div>
                        <div className="border border-neutral-900 bg-neutral-950 p-4 rounded flex flex-col items-center justify-center space-y-2 group hover:border-neutral-700 transition-colors">
                          <Tv className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                          <span className="text-2xl font-serif text-[var(--color-text)]">{videos.length}</span>
                          <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-sans">Videos</span>
                        </div>
                        <div className="border border-neutral-900 bg-neutral-950 p-4 rounded flex flex-col items-center justify-center space-y-2 group hover:border-neutral-700 transition-colors">
                          <Award className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                          <span className="text-2xl font-serif text-[var(--color-text)]">{pressItems.length}</span>
                          <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-sans">Press Articles</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions (Content Editors) */}
                    <div className="space-y-4 md:col-span-2">
                      <h3 className="text-xs font-sans tracking-widest text-neutral-500 uppercase border-b border-neutral-900 pb-2">Quick Editor Actions</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <button onClick={() => setActiveTab('hero')} className="flex flex-col items-center justify-center space-y-3 border border-neutral-900 bg-neutral-950 p-5 rounded hover:border-[#C9A227]/50 hover:bg-[#C9A227]/5 transition-all cursor-pointer group">
                          <Monitor className="w-6 h-6 text-[#C9A227]" />
                          <span className="text-[10px] text-neutral-400 group-hover:text-white uppercase tracking-widest font-sans font-medium">Hero Design</span>
                        </button>
                        <button onClick={() => setActiveTab('slides')} className="flex flex-col items-center justify-center space-y-3 border border-neutral-900 bg-neutral-950 p-5 rounded hover:border-[#C9A227]/50 hover:bg-[#C9A227]/5 transition-all cursor-pointer group">
                          <Image className="w-6 h-6 text-[#C9A227]" />
                          <span className="text-[10px] text-neutral-400 group-hover:text-white uppercase tracking-widest font-sans font-medium">Hero Slides</span>
                        </button>
                        <button onClick={() => setActiveTab('biography')} className="flex flex-col items-center justify-center space-y-3 border border-neutral-900 bg-neutral-950 p-5 rounded hover:border-[#C9A227]/50 hover:bg-[#C9A227]/5 transition-all cursor-pointer group">
                          <FileText className="w-6 h-6 text-[#C9A227]" />
                          <span className="text-[10px] text-neutral-400 group-hover:text-white uppercase tracking-widest font-sans font-medium">Biography</span>
                        </button>
                        <button onClick={() => setActiveTab('portfolio')} className="flex flex-col items-center justify-center space-y-3 border border-neutral-900 bg-neutral-950 p-5 rounded hover:border-neutral-500 hover:bg-neutral-900 transition-all cursor-pointer group">
                          <Image className="w-6 h-6 text-neutral-500 group-hover:text-white" />
                          <span className="text-[10px] text-neutral-400 group-hover:text-white uppercase tracking-widest font-sans font-medium">Gallery</span>
                        </button>
                        <button onClick={() => setActiveTab('videos')} className="flex flex-col items-center justify-center space-y-3 border border-neutral-900 bg-neutral-950 p-5 rounded hover:border-neutral-500 hover:bg-neutral-900 transition-all cursor-pointer group">
                          <Tv className="w-6 h-6 text-neutral-500 group-hover:text-white" />
                          <span className="text-[10px] text-neutral-400 group-hover:text-white uppercase tracking-widest font-sans font-medium">Videos</span>
                        </button>
                        <button onClick={() => setActiveTab('press')} className="flex flex-col items-center justify-center space-y-3 border border-neutral-900 bg-neutral-950 p-5 rounded hover:border-neutral-500 hover:bg-neutral-900 transition-all cursor-pointer group">
                          <Award className="w-6 h-6 text-neutral-500 group-hover:text-white" />
                          <span className="text-[10px] text-neutral-400 group-hover:text-white uppercase tracking-widest font-sans font-medium">Press</span>
                        </button>
                        <button onClick={() => setActiveTab('schedule')} className="flex flex-col items-center justify-center space-y-3 border border-neutral-900 bg-neutral-950 p-5 rounded hover:border-neutral-500 hover:bg-neutral-900 transition-all cursor-pointer group">
                          <Calendar className="w-6 h-6 text-neutral-500 group-hover:text-white" />
                          <span className="text-[10px] text-neutral-400 group-hover:text-white uppercase tracking-widest font-sans font-medium">Schedule</span>
                        </button>
                        <button onClick={() => setActiveTab('contact')} className="flex flex-col items-center justify-center space-y-3 border border-neutral-900 bg-neutral-950 p-5 rounded hover:border-neutral-500 hover:bg-neutral-900 transition-all cursor-pointer group">
                          <MessageSquare className="w-6 h-6 text-neutral-500 group-hover:text-white" />
                          <span className="text-[10px] text-neutral-400 group-hover:text-white uppercase tracking-widest font-sans font-medium">Contact</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure / Storage details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="border border-neutral-900 bg-[var(--color-bg)] p-5 rounded">
                      <div className="flex items-center space-x-2 mb-4">
                        <HardDrive className="w-4 h-4 text-neutral-500" />
                        <h4 className="text-xs font-sans tracking-widest text-neutral-300 uppercase">Storage Configuration</h4>
                      </div>
                      <div className="space-y-3 text-xs font-sans">
                        <div className="flex justify-between border-b border-neutral-900 pb-2">
                          <span className="text-neutral-500">Primary Storage</span>
                          <span className="text-white font-medium">Cloudflare R2 (Global)</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-900 pb-2">
                          <span className="text-neutral-500">Secondary Sync</span>
                          <span className="text-white font-medium">Google Drive {getGoogleAccessToken() ? '(Active)' : '(Inactive)'}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span className="text-neutral-500">Database</span>
                          <span className="text-white font-medium">Firestore</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-neutral-900 bg-[var(--color-bg)] p-5 rounded">
                      <div className="flex items-center space-x-2 mb-4">
                        <Activity className="w-4 h-4 text-neutral-500" />
                        <h4 className="text-xs font-sans tracking-widest text-neutral-300 uppercase">Recent Activity</h4>
                      </div>
                      <div className="space-y-3 text-xs font-sans text-neutral-500">
                        <div className="flex items-center space-x-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                          <span>System accessed by {user?.email}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                          <span>Last login session authorized via Google Auth</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                          <span>Data synchronized with Firestore</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}
`;

const index = lines.findIndex(l => l.includes('TAB 1: SCHEDULE MANAGEMENT'));
lines.splice(index - 1, 0, dashboardCode);
fs.writeFileSync('src/components/AdminPanel.tsx', lines.join('\n'));
