import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Replace moveItemOrder
old_move = """  const moveItemOrder = async (
    collectionName: string,
    itemsList: any[],
    currentIndex: number,
    direction: 'up' | 'down',
    refreshFunc: () => void,
    setLocalList?: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === itemsList.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    setLoadingAction(true);

    try {
      // Ensure all items have an explicit order index
      const updatedList = itemsList.map((item, idx) => ({
        ...item,
        order: item.order !== undefined ? item.order : idx
      }));

      // Swap the order value of current item and target item
      const tempOrder = updatedList[currentIndex].order;
      updatedList[currentIndex].order = updatedList[targetIndex].order;
      updatedList[targetIndex].order = tempOrder;

      // Optimistic UI update if setLocalList is provided
      if (setLocalList) {
        const sortedLocalList = [...updatedList].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setLocalList(sortedLocalList);
      }

      // Update both documents in Firestore
      const itemA = updatedList[currentIndex];
      const itemB = updatedList[targetIndex];

      await Promise.all([
        setDoc(doc(db, collectionName, itemA.id), itemA),
        setDoc(doc(db, collectionName, itemB.id), itemB)
      ]);

      triggerAlert('success', 'Order updated successfully!');
      refreshFunc();
    } catch (err) {
      console.error("Error updating item order:", err);
      triggerAlert('error', 'Failed to save new order.');
      refreshFunc();
    } finally {
      setLoadingAction(false);
    }
  };"""

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
  };"""

content = content.replace(old_move, new_move)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Replaced moveItemOrder with handleDragEnd")
