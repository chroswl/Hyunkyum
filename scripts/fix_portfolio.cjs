const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminPortfolio.tsx', 'utf-8');

content = content.replace("import { fetchPortfolio, savePortfolioItems } from '../../firebase';", 
"import { fetchPortfolio, deletePortfolioItem } from '../../firebase';\nimport { writeBatch, doc } from 'firebase/firestore';\nimport { db } from '../../firebase';");

const newHandleSave = `  const handleSave = async () => {
    setIsSaving(true);
    const batch = writeBatch(db);
    items.forEach((item, index) => {
       const ref = doc(db, 'portfolio', item.id);
       batch.set(ref, { ...item, order: index });
    });
    await batch.commit();
    setInitialItems(items);
    setIsSaving(false);
  };`;

content = content.replace(/  const handleSave = async \(\) => \{[\s\S]*?setIsSaving\(false\);\n  \};/, newHandleSave);

fs.writeFileSync('src/components/admin/AdminPortfolio.tsx', content);
console.log("Fixed AdminPortfolio");
