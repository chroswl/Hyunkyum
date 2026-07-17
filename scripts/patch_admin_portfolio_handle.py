import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_portfolio = """                              {localPortfolioItems.map((item, index) => (
                                <SortableItem key={item.id || `portfolio-${index}`} id={item.id || ''} handleType="full" className="relative group rounded-sm overflow-hidden border border-neutral-900 bg-[var(--color-bg)] aspect-square">
                                  <img 
                                    src={item.url} 
                                    alt="Portfolio small thumb" 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 pointer-events-none">
                                    <div className="flex justify-between items-start w-full">
                                      <div className="bg-black/50 p-1.5 rounded-sm pointer-events-auto cursor-grab active:cursor-grabbing text-neutral-400 hover:text-white">
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                      <span className="text-[9px] tracking-widest text-[#C9A227] font-sans uppercase font-bold accent-color">
                                        {item.category}
                                      </span>
                                    </div>
                                    <div className="flex justify-end space-x-1.5 pointer-events-auto">
                                      <button
                                        id={`admin-edit-portfolio-${item.id}`}
                                        onClick={(e) => { e.stopPropagation(); setEditingPortfolio(item); }}
                                        className="p-1 border border-neutral-700 bg-[var(--color-bg)] text-neutral-400 hover:text-[var(--color-text)] rounded hover:border-neutral-500 cursor-pointer"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        id={`admin-delete-portfolio-${item.id}`}
                                        onClick={(e) => { e.stopPropagation(); deletePortfolio(item.id || ''); }}
                                        className="p-1 border border-rose-500/30 bg-[var(--color-bg)] text-rose-400 hover:text-rose-300 rounded hover:border-rose-500 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}"""

new_portfolio = """                              {localPortfolioItems.map((item, index) => (
                                <SortableItem key={item.id || `portfolio-${index}`} id={item.id || ''} handleType="icon" handleClassName="absolute top-2 left-2 z-20 bg-black/50 p-1.5 rounded-sm" className="relative group rounded-sm overflow-hidden border border-neutral-900 bg-[var(--color-bg)] aspect-square">
                                  <img 
                                    src={item.url} 
                                    alt="Portfolio small thumb" 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 pointer-events-none">
                                    <div className="flex justify-end items-start w-full">
                                      <span className="text-[9px] tracking-widest text-[#C9A227] font-sans uppercase font-bold accent-color">
                                        {item.category}
                                      </span>
                                    </div>
                                    <div className="flex justify-end space-x-1.5 pointer-events-auto">
                                      <button
                                        id={`admin-edit-portfolio-${item.id}`}
                                        onClick={(e) => { e.stopPropagation(); setEditingPortfolio(item); }}
                                        className="p-1 border border-neutral-700 bg-[var(--color-bg)] text-neutral-400 hover:text-[var(--color-text)] rounded hover:border-neutral-500 cursor-pointer"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        id={`admin-delete-portfolio-${item.id}`}
                                        onClick={(e) => { e.stopPropagation(); deletePortfolio(item.id || ''); }}
                                        className="p-1 border border-rose-500/30 bg-[var(--color-bg)] text-rose-400 hover:text-rose-300 rounded hover:border-rose-500 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </SortableItem>
                              ))}"""

content = content.replace(old_portfolio, new_portfolio)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Fixed portfolio handle")
