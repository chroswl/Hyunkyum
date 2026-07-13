import re

with open('src/components/admin/appearance/AppearanceControlCenter.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [initialAppearance] = useState(appearance);", "const [initialAppearance, setInitialAppearance] = useState(appearance);")

publish_code = """  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await saveAppearanceSettings(localState, publishNote, 'Admin');
      setHasChanges(false);
      setIsPublishModalOpen(false);
      setInitialAppearance(localState);
    } catch (e) {"""

content = re.sub(r'const handlePublish = async \(\) => \{[\s\S]*?\} catch \(e\) \{', publish_code, content)

with open('src/components/admin/appearance/AppearanceControlCenter.tsx', 'w') as f:
    f.write(content)

