with open('src/App.tsx', 'r') as f:
    content = f.read()

def get_youtube_id(url):
    import re
    match = re.search(r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})', url)
    return match.group(1) if match else None

# I'll just write React logic directly in the file

new_bg_logic = """        {/* Background opera stage image or video */}
        {theme.homeBgType === 'video' ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover animate-kenburns pointer-events-none"
            src={theme.homeBg}
          />
        ) : theme.homeBgType === 'youtube' ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <iframe
              className="absolute top-1/2 left-1/2 w-[300vw] h-[300vh] min-w-[100vw] min-h-[100vh] -translate-x-1/2 -translate-y-1/2 opacity-70"
              src={`https://www.youtube.com/embed/${(() => {
                const match = theme.homeBg?.match(/(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([^"&?\\/\\s]{11})/);
                return match ? match[1] : '';
              })()}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${(() => {
                const match = theme.homeBg?.match(/(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([^"&?\\/\\s]{11})/);
                return match ? match[1] : '';
              })()}`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : (
          <div 
            id="hero-bg"
            className="absolute inset-0 bg-cover bg-center animate-kenburns"
            style={{ 
              backgroundImage: `url('${theme.homeBg || '/src/assets/images/opera_stage_1783548365279.jpg'}')` 
            }}
          />
        )}"""

content = content.replace("""        {/* Background opera stage image or video */}
        {theme.homeBgType === 'video' ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover animate-kenburns"
            src={theme.homeBg}
          />
        ) : (
          <div 
            id="hero-bg"
            className="absolute inset-0 bg-cover bg-center animate-kenburns"
            style={{ 
              backgroundImage: `url('${theme.homeBg || '/src/assets/images/opera_stage_1783548365279.jpg'}')` 
            }}
          />
        )}""", new_bg_logic)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Done")
