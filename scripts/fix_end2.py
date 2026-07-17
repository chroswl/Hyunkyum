with open('src/components/AdminPanel.tsx', 'r') as f:
    text = f.read()

target = """                </div>
              )}

            </div>
          </div>
        {cropTarget && ("""

replacement = """                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {cropTarget && ("""

text = text.replace(target, replacement)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(text)
