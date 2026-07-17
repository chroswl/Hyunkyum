import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_code = '''  const startNewPortfolio = () => {
    setEditingPortfolio({
      url: '',
      category: 'Portrait',
      title: { EN: '', DE: '', KO: ''}
    });
  };'''

new_code = '''  const startNewPortfolio = () => {
    setEditingPortfolio({
      url: '',
      category: portfolioTab !== 'All' ? portfolioTab : 'Portrait',
      title: { EN: '', DE: '', KO: ''}
    });
  };'''

content = content.replace(old_code, new_code)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Portfolio new default category patched")
