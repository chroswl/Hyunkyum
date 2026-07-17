import React, { useState } from 'react';
import { InlineEditor } from '../../../lib/editing/InlineEditor';
import { RichTextEditor } from '../../../lib/editing/RichTextEditor';
import { UniversalDeleteDialog } from '../../../lib/editing/UniversalDeleteDialog';
import { useEditable, useEditing } from '../../../contexts/EditingContext';
import { GripVertical, Edit, Trash2, Plus } from 'lucide-react';
import { motion } from 'motion/react';

// A simple sandbox to validate the editing engine lifecycle
export default function EditingEngineSandbox() {
  const { status } = useEditing();
  const [items, setItems, dirty] = useEditable<{ id: string, title: string }[]>('sandbox.collection', [
    { id: '1', title: 'First Item' },
    { id: '2', title: 'Second Item' }
  ]);
  
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAdd = () => {
    const newItem = { id: Date.now().toString(), title: `New Item ${items.length + 1}` };
    setItems([...items, newItem]);
  };

  return (
    <div className="max-w-4xl mx-auto p-12 mt-20 mb-20 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl">
      <div className="mb-12 border-b border-neutral-800 pb-8">
        <h1 className="text-3xl font-light text-white mb-2">Editing Engine Sandbox</h1>
        <p className="text-neutral-400">
          This is an isolated environment to validate the Editing Engine lifecycle. 
          Current Global Status: <span className="font-mono text-[#C9A227]">{status}</span>
        </p>
      </div>

      <div className="space-y-16">
        {/* Inline Text Test */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-4">1. Inline Text</h2>
          <div className="text-4xl font-light text-white">
            <InlineEditor 
              id="sandbox.heading" 
              initialValue="Click to edit this heading" 
              as="h1"
            />
          </div>
          <div className="mt-2 text-neutral-400">
            <InlineEditor 
              id="sandbox.subtitle" 
              initialValue="This is a simple subtitle. Try editing it and clicking away." 
              as="p"
            />
          </div>
        </section>

        {/* Rich Text Test */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-4">2. Rich Text Paragraph</h2>
          <div className="text-neutral-300 leading-relaxed text-lg max-w-2xl">
            <RichTextEditor 
              id="sandbox.paragraph" 
              initialValue="This is a rich text block. Click to focus. A formatting toolbar should appear. Pressing Enter will create new lines. Blur will commit the dirty state." 
            />
          </div>
        </section>

        {/* Simple Collection Test */}
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-4">3. Simple Collection</h2>
          <div className="relative">
             {/* Collection Dirty Indicator */}
            {dirty && (
              <div className="absolute -top-2 -right-2 w-2 h-2 bg-[#C9A227] rounded-full shadow-sm shadow-black z-10" title="Unsaved collection changes" />
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="group relative bg-neutral-800/50 border border-neutral-800 p-6 rounded-xl hover:border-neutral-700 transition-colors"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-neutral-900 border border-neutral-700 rounded-lg p-1 shadow-lg z-10">
                    <button className="p-1.5 text-neutral-400 hover:text-white cursor-grab">
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-neutral-400 hover:text-[#C9A227]">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setDeleteTarget(item.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-white font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-neutral-500">Collection Item #{idx + 1}</p>
                </div>
              ))}
              
              <button 
                onClick={handleAdd}
                className="flex items-center justify-center border border-dashed border-neutral-700 hover:border-neutral-500 rounded-xl p-6 transition-colors text-neutral-500 hover:text-white group"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-2 bg-neutral-800 group-hover:bg-neutral-700 rounded-full transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Add New Item</span>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>

      <UniversalDeleteDialog 
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
        }}
        itemName={items.find(i => i.id === deleteTarget)?.title}
      />
    </div>
  );
}
