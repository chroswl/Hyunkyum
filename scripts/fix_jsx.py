with open('src/App.tsx', 'r') as f:
    content = f.read()

bad_jsx = """{user && (
   {isAdminOpen ? null : (
     <HeroEditorPanel """
     
good_jsx = """{user && !isAdminOpen && (
     <HeroEditorPanel """

content = content.replace("{user && (\n   {isAdminOpen ? null : (", "{user && !isAdminOpen && (")

with open('src/App.tsx', 'w') as f:
    f.write(content)
