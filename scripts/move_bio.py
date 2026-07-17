import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# find the bio block
# It starts at:
start_marker = "                      {/* Sub-section 2: Biography Text Editor */}"
end_marker = "                      {/* Sub-section 3: Contact & Management Details */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

bio_block = content[start_idx:end_idx]

# remove it from its original place
content = content[:start_idx] + content[end_idx:]

# now insert it after the end of settings tab
# The settings tab ends at:
settings_end_marker = """                    </>
                  )}
                </div>
              )}"""

settings_end_idx = content.find(settings_end_marker) + len(settings_end_marker)

new_tab = """

              {/* TAB: BIOGRAPHY */}
              {activeTab === 'biography' && (
                <div id="admin-biography-tab" className="space-y-8 pb-10">
                  {loadingSettings ? (
                    <div className="text-center py-10 text-neutral-500 text-xs">Loading application config...</div>
                  ) : (
                    <>
""" + bio_block + """                    </>
                  )}
                </div>
              )}"""

content = content[:settings_end_idx] + new_tab + content[settings_end_idx:]

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)

print("Done")
