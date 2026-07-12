with open("src/components/BiographySection.tsx", "r") as f:
    content = f.read()

content = content.replace("const [successMsg, setSuccessMsg] = useState('');", """const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };""")

content = content.replace("""    try {
      await saveBiographySettings(editedBio);
      onBioUpdated(editedBio);
      setSuccessMsg('Biography updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsEditMode(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save biography.');
    }""", """    try {
      await saveBiographySettings(editedBio);
      onBioUpdated(editedBio);
      showNotification('Biography updated successfully');
      setTimeout(() => setIsEditMode(false), 800);
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to save biography: ${err.message || 'Unknown error'}`, 'error');
    }""")

content = content.replace("{/* Admin Header & Edit Trigger */}", """{/* Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 border rounded-full text-xs tracking-wider uppercase font-sans flex items-center space-x-2 shadow-lg ${
              notification.type === 'success' ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-400' : 'border-rose-500/30 bg-rose-950/80 text-rose-400'
            }`}
          >
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Admin Header & Edit Trigger */}""")

with open("src/components/BiographySection.tsx", "w") as f:
    f.write(content)
