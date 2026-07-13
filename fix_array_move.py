with open("src/components/SelectedPerformances.tsx", "r") as f:
    content = f.read()

content = content.replace("const newOrder = arrayMove(slides, oldIndex, newIndex);", "const newOrder = arrayMove(slides, oldIndex, newIndex) as PerformanceSlide[];")

with open("src/components/SelectedPerformances.tsx", "w") as f:
    f.write(content)
