import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_state = '''  const [activeTab, setActiveTab] = useState<AdminTab>('settings');'''
new_state = '''  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const saved = sessionStorage.getItem('adminActiveTab');
    return (saved as AdminTab) || 'settings';
  });
  const [portfolioTab, setPortfolioTab] = useState<'All' | 'Portrait' | 'Stage' | 'Backstage'>(() => {
    const saved = sessionStorage.getItem('adminPortfolioTab');
    return (saved as any) || 'All';
  });

  useEffect(() => {
    sessionStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('adminPortfolioTab', portfolioTab);
  }, [portfolioTab]);'''

content = content.replace(old_state, new_state)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("AdminPanel patched state")
