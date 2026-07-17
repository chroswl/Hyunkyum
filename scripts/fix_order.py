import re

with open("src/components/AdminPanel.tsx", "r") as f:
    text = f.read()

def insert_buttons(text, prefix, array_name, state_setter, refresh_fn):
    # We look for:
    # id={`admin-edit-PREFIX-${item.id}`}
    # and insert the up/down buttons BEFORE it.
    
    # Actually, the button is: <button id={`admin-edit-PREFIX-${item.id}`} ...>
    # We want to insert the two buttons right before this <button.
    
    # We have to be careful if it's already there.
    
    search_str = f"id={{`admin-edit-{prefix}-${{item.id}}`}}"
    if search_str not in text:
        search_str = f"id={{`admin-edit-{prefix}-${{slide.id}}`}}"
        
    button_html = f"""<button
                                disabled={{index === 0}}
                                onClick={{() => moveItemOrder('{prefix if prefix != 'slide' else 'selected_performances'}', {array_name}, index, 'up', {refresh_fn}, {state_setter})}}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={{index === {array_name}.length - 1}}
                                onClick={{() => moveItemOrder('{prefix if prefix != 'slide' else 'selected_performances'}', {array_name}, index, 'down', {refresh_fn}, {state_setter})}}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              """
    
    # Regex to find the <button id={`admin-edit-...`}> and insert before it
    # We only want to do this if ChevronUp is not already right before it
    
    parts = text.split(search_str)
    if len(parts) > 1:
        # Reconstruct with the buttons
        new_text = parts[0]
        # check if already inserted
        if "ChevronUp" not in new_text[-300:]:
            # The split removes search_str, so we must add it back
            # Wait, the part[0] ends with '<button\n                                ' usually
            # Let's replace by finding the exact button opening
            
            find_str = f"<button\n                                id={{`admin-edit-{prefix}-"
            replace_str = button_html + f"<button\n                                id={{`admin-edit-{prefix}-"
            text = text.replace(find_str, replace_str)
            
    return text

text = insert_buttons(text, "schedule", "localScheduleItems", "setLocalScheduleItems", "refreshData")
text = insert_buttons(text, "portfolio", "localPortfolioItems", "setLocalPortfolioItems", "refreshData")
text = insert_buttons(text, "press", "pressItems", "setPressItems", "fetchPressList")
text = insert_buttons(text, "video", "videos", "setVideos", "fetchVideosList")
text = insert_buttons(text, "slide", "slides", "setSlides", "fetchSlidesList")

with open("src/components/AdminPanel.tsx", "w") as f:
    f.write(text)

