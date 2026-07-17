const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

content = content.replace(
  '<div className="w-full h-full overflow-y-auto">',
  '<div className="w-full h-full overflow-hidden">'
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);

let dash = fs.readFileSync('src/components/admin/AdminDashboard.tsx', 'utf-8');
dash = dash.replace('className="space-y-8 animate-in fade-in duration-500"', 'className="space-y-8 animate-in fade-in duration-500 p-6 lg:p-10 max-w-5xl mx-auto overflow-y-auto h-full"');
fs.writeFileSync('src/components/admin/AdminDashboard.tsx', dash);

let set = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');
set = set.replace('className="space-y-6"', 'className="space-y-6 p-6 lg:p-10 max-w-5xl mx-auto overflow-y-auto h-full"');
fs.writeFileSync('src/components/admin/AdminSettings.tsx', set);
console.log("Fixed AdminPanel");
