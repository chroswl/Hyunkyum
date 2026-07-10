with open('src/components/AdminPanel.tsx', 'r') as f:
    text = f.read()

target = """                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {cropTarget && ("""

replacement = """                </div>
              )}
            </div>
          </div>
        )}
        {cropTarget && ("""

text = text.replace(target, replacement)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(text)
