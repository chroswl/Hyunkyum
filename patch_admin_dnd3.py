import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(r"  const moveItemOrder = async \([\s\S]*?\n  };\n", re.MULTILINE)

new_move = """  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (
    event: DragEndEvent, 
    collectionName: string, 
    itemsList: any[], 
    setLocalList: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemsList.findIndex((item) => item.id === active.id);
    const newIndex = itemsList.findIndex((item) => item.id === over.id);

    const newOrder = arrayMove(itemsList, oldIndex, newIndex);
    
    // Update order field
    const updatedList = newOrder.map((item, index) => ({
      ...item,
      order: index
    }));

    // Optimistic update
    setLocalList(updatedList);

    // Save to firestore
    try {
      setLoadingAction(true);
      const batchUpdates = updatedList.map((item, index) => {
        // Only update items that actually changed their order index
        if (itemsList[index]?.id !== item.id || itemsList[index]?.order !== item.order) {
          return updateDoc(doc(db, collectionName, item.id), { order: item.order });
        }
        return Promise.resolve();
      });
      await Promise.all(batchUpdates);
      triggerAlert('success', 'Order updated successfully!');
      refreshData();
    } catch (err) {
      console.error("Error saving new order:", err);
      triggerAlert('error', 'Failed to save new order.');
      refreshData();
    } finally {
      setLoadingAction(false);
    }
  };
"""

content = pattern.sub(new_move, content)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Replaced moveItemOrder with handleDragEnd using regex")
