import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_code = '''                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {localPortfolioItems.map((item, index) => ('''
new_code = '''                      {/* Portfolio Category Tabs */}
                      <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-2">
                        {(['All', 'Portrait', 'Stage', 'Backstage'] as const).map(cat => {
                          const count = cat === 'All' ? localPortfolioItems.length : localPortfolioItems.filter(i => i.category === cat).length;
                          return (
                            <button
                              key={cat}
                              onClick={() => setPortfolioTab(cat)}
                              className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition-colors ${
                                portfolioTab === cat 
                                  ? 'bg-[#C9A227]/10 text-[#C9A227] font-semibold border border-[#C9A227]/30'
                                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 border border-transparent'
                              }`}
                            >
                              {cat} ({count})
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {localPortfolioItems
                          .map((item, index) => ({ item, index }))
                          .filter(({ item }) => portfolioTab === 'All' || item.category === portfolioTab)
                          .map(({ item, index }) => ('''
content = content.replace(old_code, new_code)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Portfolio tabs patched")
