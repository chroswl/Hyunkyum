const fs = require('fs');
const path = require('path');

const generateScheduleEditor = () => {
  return `import React, { useState, useEffect } from 'react';
import type { Language, ScheduleItem } from '../../types';
import { fetchSchedule, saveScheduleItem, deleteScheduleItem } from '../../firebase';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function AdminSchedule({ currentLang }: { currentLang: Language }) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    fetchSchedule().then(setItems);
  }, []);

  const handleSave = async () => {
    if (editingItem) {
      await saveScheduleItem(editingItem);
      const newItems = await fetchSchedule();
      setItems(newItems);
      setEditingItem(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this item?")) {
      await deleteScheduleItem(id);
      setItems(await fetchSchedule());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-serif text-[#C9A227] tracking-widest uppercase text-sm">Schedule Management</h3>
        <button onClick={() => setEditingItem({ id: '', date: '', title: {EN:'',DE:'',KO:''}, location: {EN:'',DE:'',KO:''}, role: {EN:'',DE:'',KO:''}, category: 'Opera' })} className="bg-[#C9A227] text-black px-4 py-2 rounded text-xs flex items-center space-x-2">
          <Plus className="w-3 h-3" /> <span>Add Performance</span>
        </button>
      </div>

      {editingItem && (
        <div className="bg-[#111] border border-neutral-900 p-6 rounded space-y-4">
          <h4 className="text-sm text-white border-b border-neutral-800 pb-2">Content</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase text-neutral-500">Date (YYYY-MM-DD)</label>
              <input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} className="w-full bg-black border border-neutral-800 p-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-neutral-500">Category</label>
              <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value as any})} className="w-full bg-black border border-neutral-800 p-2 text-sm text-white">
                <option value="Opera">Opera</option>
                <option value="Concert">Concert</option>
                <option value="Recital">Recital</option>
                <option value="Gala">Gala</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase text-neutral-500">Title (EN)</label>
              <input type="text" value={editingItem.title.EN} onChange={e => setEditingItem({...editingItem, title: {...editingItem.title, EN: e.target.value}})} className="w-full bg-black border border-neutral-800 p-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-neutral-500">Role (EN)</label>
              <input type="text" value={editingItem.role.EN} onChange={e => setEditingItem({...editingItem, role: {...editingItem.role, EN: e.target.value}})} className="w-full bg-black border border-neutral-800 p-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-neutral-500">Location (EN)</label>
              <input type="text" value={editingItem.location.EN} onChange={e => setEditingItem({...editingItem, location: {...editingItem.location, EN: e.target.value}})} className="w-full bg-black border border-neutral-800 p-2 text-sm text-white" />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-xs text-neutral-400">Cancel</button>
            <button onClick={handleSave} className="flex items-center space-x-2 bg-[#C9A227] text-black px-6 py-2 rounded text-xs font-semibold">
              <Save className="w-3 h-3" />
              <span>Save Schedule</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#111] border border-neutral-900 rounded">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 border-b border-neutral-900 last:border-0">
            <div>
              <div className="text-sm text-white">{item.title[currentLang] || item.title.EN}</div>
              <div className="text-xs text-neutral-500">{item.date} • {item.location[currentLang] || item.location.EN}</div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setEditingItem(item)} className="text-xs text-[#C9A227]">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
}

fs.writeFileSync('src/components/admin/AdminSchedule.tsx', generateScheduleEditor());
console.log("Generated AdminSchedule");
