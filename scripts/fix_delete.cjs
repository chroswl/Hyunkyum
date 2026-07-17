const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

const deleteFunc = `  const handleDeletePhoto = async (id: string) => {
    try {
      await deletePortfolioItem(id);
      const newItems = items.filter(item => item.id !== id);
      onItemsUpdated(newItems);
      showNotification("Photo deleted successfully");
    } catch (err: any) {
      console.error("Error deleting portfolio photo:", err);
      showNotification(\`Failed to delete photo: \${err.message || 'Unknown error'}\`, "error");
    }
  };
`;

code = code.replace(/const t = translations\[currentLang\];/, deleteFunc + "\n  const t = translations[currentLang];");

fs.writeFileSync('src/components/PortfolioGallery.tsx', code);
