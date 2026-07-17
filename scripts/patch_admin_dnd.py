import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

new_imports = """
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
"""

content = content.replace("import { getMediaSource }", new_imports + "import { getMediaSource }")

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Added imports")
