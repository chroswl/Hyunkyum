import re

with open("src/components/VideoPlayer.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_action = """                        <p className="text-[11px] text-neutral-500 tracking-wider">
                          {video.role[currentLang] || video.role['EN']}
                        </p>
                      )}
                    </div>
                  </button>"""

new_action = """                        <p className="text-[11px] text-neutral-500 tracking-wider">
                          {video.role[currentLang] || video.role['EN']}
                        </p>
                      )}
                    </div>
                    {user && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVideo(video.id);
                        }}
                        className="ml-auto p-1.5 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                        title="Delete from main page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>"""

if old_action in content:
    content = content.replace(old_action, new_action)
    with open("src/components/VideoPlayer.tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added delete button to video main page")
else:
    print("Could not find video block")
