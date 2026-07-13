import re

with open("src/components/PortfolioGallery.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add a delete button to the grid item overlay when user is logged in
old_overlay = """                        <span className="text-[10px] tracking-widest uppercase font-sans font-semibold">
                          {item.category === 'Portrait' ? t.portraitCat : item.category === 'Stage' ? t.stageCat : item.category === 'Backstage' ? t.backstageCat : ''}
                        </span>"""

new_overlay = """                        <div className="flex justify-between items-start">
                          <span className="text-[10px] tracking-widest uppercase font-sans font-semibold">
                            {item.category === 'Portrait' ? t.portraitCat : item.category === 'Stage' ? t.stageCat : item.category === 'Backstage' ? t.backstageCat : ''}
                          </span>
                          {user && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(item.id);
                              }}
                              className="p-2 bg-rose-500/80 hover:bg-rose-600 text-white rounded transition-colors"
                              title="Delete Photo directly from Main Page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>"""

if old_overlay in content:
    content = content.replace(old_overlay, new_overlay)
    with open("src/components/PortfolioGallery.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added delete button to portfolio grid")
else:
    print("Could not find overlay block")
