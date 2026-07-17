with open('src/components/AdminPanel.tsx', 'r') as f:
    text = f.read()

# I added `\n        </div>` after every `          </div>`. Let's remove them.
text = text.replace("          </div>\n        </div>", "          </div>")

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(text)
