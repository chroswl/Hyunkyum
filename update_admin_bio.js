const fs = require('fs');

let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// 1. Add state variable for the main bio groups
code = code.replace(
  "const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null);",
  "const [expandedTimeline, setExpandedTimeline] = useState<string | null>(null);\n  const [activeBioGroup, setActiveBioGroup] = useState<'image' | 'narratives' | 'sections' | null>('image');"
);

// We need to replace the entire biography tab content
// Search for: {/* Sub-section 2: Biography Text Editor */} to the end of the biography tab
// It ends where {/* Sub-section 3: Contact Settings */} or contact tab starts? Wait, the bio tab ends at:
// <div className="flex justify-end pt-2">
//   <button ... Save Biography Settings ... </button>
// </div>
// </div> 
// )}
// {activeTab === 'contact' && (

// Let's use regex to find the bounds.
