import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    text = f.read()

def insert_buttons(text, prefix, array_name, state_setter, refresh_fn, index_var='index', item_var='item'):
    # Look for `<button id={`admin-edit-{prefix}-${item_var}.id`}`
    
    search_str = f'id={{`admin-edit-{prefix}-${{{item_var}.id}}`}}'
    
    button_html = f"""<button
                                  disabled={{{index_var} === 0}}
                                  onClick={{() => moveItemOrder('{prefix if prefix != 'slide' else 'selected_performances'}', {array_name}, {index_var}, 'up', {refresh_fn}, {state_setter})}}
                                  className="p-1 border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white rounded hover:border-neutral-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  disabled={{{index_var} === {array_name}.length - 1}}
                                  onClick={{() => moveItemOrder('{prefix if prefix != 'slide' else 'selected_performances'}', {array_name}, {index_var}, 'down', {refresh_fn}, {state_setter})}}
                                  className="p-1 border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white rounded hover:border-neutral-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                """

    # Find where to insert: right before `<button id=...`
    # We need to make sure we don't insert multiple times.
    parts = text.split(search_str)
    if len(parts) > 1:
        if "ChevronUp" not in parts[0][-300:]:
            # Find the '<button' right before the split
            idx = parts[0].rfind('<button')
            if idx != -1:
                parts[0] = parts[0][:idx] + button_html + parts[0][idx:]
                text = search_str.join(parts)
    return text

# portfolio
text = insert_buttons(text, "portfolio", "localPortfolioItems", "setLocalPortfolioItems", "refreshData")
# press
text = insert_buttons(text, "press", "pressItems", "setPressItems", "fetchPressList")
# video
text = insert_buttons(text, "video", "videos", "setVideos", "fetchVideosList")
# slide
text = insert_buttons(text, "slide", "slides", "setSlides", "fetchSlidesList", item_var='slide')

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(text)

