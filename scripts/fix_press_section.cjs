const fs = require('fs');
let text = fs.readFileSync('src/components/PressSection.tsx', 'utf-8');

text = text.replace('interface PressSectionProps {', 'interface PressSectionProps {\n  items?: PressItem[];\n  t?: any;\n  onItemsUpdated?: (items: PressItem[]) => void;\n  onRefreshData?: () => void;');
text = text.replace('onThemeUpdated }: PressSectionProps) {', 'onThemeUpdated, items: propItems }: PressSectionProps) {');
text = text.replace('const [pressItems, setPressItems] = useState<PressItem[]>([]);', 'const [pressItems, setPressItems] = useState<PressItem[]>(propItems || []);\n  useEffect(() => {\n    if (propItems) setPressItems(propItems);\n  }, [propItems]);');
fs.writeFileSync('src/components/PressSection.tsx', text);
console.log('Fixed PressSection.tsx');
