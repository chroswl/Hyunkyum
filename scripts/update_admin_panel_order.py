import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# 1. Schedule
content = content.replace(
    "localScheduleItems.map((item) => (",
    "localScheduleItems.map((item, index) => ("
)
schedule_buttons = """<button
                                disabled={index === 0}
                                onClick={() => moveItemOrder('schedule', localScheduleItems, index, 'up', refreshData, setLocalScheduleItems)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={index === localScheduleItems.length - 1}
                                onClick={() => moveItemOrder('schedule', localScheduleItems, index, 'down', refreshData, setLocalScheduleItems)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button"""
content = content.replace(
    """<div className="flex space-x-2">
                              <button
                                id={`admin-edit-schedule-${item.id}`""",
    """<div className="flex space-x-2">\n                              """ + schedule_buttons.replace('<button', '<button\n                                id={`admin-edit-schedule-${item.id}`', 1)
)

# 2. Portfolio
content = content.replace(
    "localPortfolioItems.map((item) => (",
    "localPortfolioItems.map((item, index) => ("
)
portfolio_buttons = """<button
                                disabled={index === 0}
                                onClick={() => moveItemOrder('portfolio', localPortfolioItems, index, 'up', refreshData, setLocalPortfolioItems)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={index === localPortfolioItems.length - 1}
                                onClick={() => moveItemOrder('portfolio', localPortfolioItems, index, 'down', refreshData, setLocalPortfolioItems)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button"""
content = content.replace(
    """<div className="flex space-x-2">
                              <button
                                id={`admin-edit-portfolio-${item.id}`""",
    """<div className="flex space-x-2">\n                              """ + portfolio_buttons.replace('<button', '<button\n                                id={`admin-edit-portfolio-${item.id}`', 1)
)

# 3. Press
content = content.replace(
    "pressItems.map((item) => (",
    "pressItems.map((item, index) => ("
)
press_buttons = """<button
                                disabled={index === 0}
                                onClick={() => moveItemOrder('press', pressItems, index, 'up', fetchPressList, setPressItems)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={index === pressItems.length - 1}
                                onClick={() => moveItemOrder('press', pressItems, index, 'down', fetchPressList, setPressItems)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button"""
content = content.replace(
    """<div className="flex space-x-2">
                              <button
                                id={`admin-edit-press-${item.id}`""",
    """<div className="flex space-x-2">\n                              """ + press_buttons.replace('<button', '<button\n                                id={`admin-edit-press-${item.id}`', 1)
)

# 4. Videos
content = content.replace(
    "videos.map((item) => (",
    "videos.map((item, index) => ("
)
videos_buttons = """<button
                                disabled={index === 0}
                                onClick={() => moveItemOrder('videos', videos, index, 'up', fetchVideosList, setVideos)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={index === videos.length - 1}
                                onClick={() => moveItemOrder('videos', videos, index, 'down', fetchVideosList, setVideos)}
                                className="p-1.5 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button"""
content = content.replace(
    """<div className="flex space-x-2 mt-4">
                              <button
                                id={`admin-edit-video-${item.id}`""",
    """<div className="flex space-x-2 mt-4">\n                              """ + videos_buttons.replace('<button', '<button\n                                id={`admin-edit-video-${item.id}`', 1)
)

# 5. Hero Slides
content = content.replace(
    "slides.map((slide) => (",
    "slides.map((slide, index) => ("
)
slides_buttons = """<button
                                  disabled={index === 0}
                                  onClick={() => moveItemOrder('selected_performances', slides, index, 'up', fetchSlidesList, setSlides)}
                                  className="p-1 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={index === slides.length - 1}
                                  onClick={() => moveItemOrder('selected_performances', slides, index, 'down', fetchSlidesList, setSlides)}
                                  className="p-1 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-colors disabled:opacity-30"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button"""
content = content.replace(
    """<div className="flex space-x-1">
                                <button
                                  id={`admin-edit-slide-${slide.id}`""",
    """<div className="flex space-x-1">\n                                """ + slides_buttons.replace('<button', '<button\n                                  id={`admin-edit-slide-${slide.id}`', 1)
)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Done")
