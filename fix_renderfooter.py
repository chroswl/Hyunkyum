import re

with open('src/components/admin/appearance/AppearanceControlCenter.tsx', 'r') as f:
    content = f.read()

new_footer = """  const renderFooter = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1">
        <button 
          onClick={handleUndo} 
          disabled={historyIndex <= 0}
          className="text-neutral-400 hover:text-white p-1 disabled:opacity-30 transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button 
          onClick={handleRedo} 
          disabled={historyIndex >= history.length - 1}
          className="text-neutral-400 hover:text-white p-1 disabled:opacity-30 transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={handleReset}
          className="text-[10px] text-neutral-400 hover:text-white px-2 py-1 uppercase tracking-widest transition-colors flex items-center space-x-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
        <button
          onClick={() => { setIsPublishModalOpen(true); setPublishNote(''); }}
          disabled={!hasChanges}
          className="bg-accent hover:bg-[#ebd04e] text-black px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center space-x-1"
        >
          <span>{t('appPublish')}</span>
        </button>
      </div>
    </div>
  );"""

content = re.sub(r'const renderFooter = \(\) => \([\s\S]*?\n  \);', new_footer, content)

with open('src/components/admin/appearance/AppearanceControlCenter.tsx', 'w') as f:
    f.write(content)
