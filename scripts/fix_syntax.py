import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Fix press
content = content.replace("                        </DndContext>\n                  ) : (", "                        </DndContext>\n                      )}\n                    </div>\n                  ) : (")

# Fix videos
content = content.replace("                        </DndContext>\n                  ) : (\n                    /* Video Editor Form */", "                        </DndContext>\n                      )}\n                    </div>\n                  ) : (\n                    /* Video Editor Form */")

# Fix slides
content = content.replace("                        </DndContext>\n                  ) : (\n                    /* Slide Editor Form */", "                        </DndContext>\n                      )}\n                    </div>\n                  ) : (\n                    /* Slide Editor Form */")

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Syntax fixed")
