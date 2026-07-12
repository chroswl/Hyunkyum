const fs = require('fs');
let prev = fs.readFileSync('src/components/admin/HeroPreview.tsx', 'utf-8');

const regex = /  const renderBackground = \(\) => \{[\s\S]*?  \};/g;

const newFn = `  const renderBackground = () => {
    if (theme.homeBgType === 'youtube' && theme.homeBg) {
       const videoId = getYoutubeId(theme.homeBg);
       return videoId ? (
         <iframe
           src={\`https://www.youtube.com/embed/\${videoId}?autoplay=1&mute=1&loop=1&playlist=\${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1\`}
           className="w-[300%] h-[300%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover opacity-80 pointer-events-none"
           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
           title="Background Video"
         />
       ) : null;
    }
    
    if (theme.homeBgType === 'video' && theme.homeBg) {
      return (
        <video 
           src={theme.homeBg} 
           autoPlay 
           muted 
           loop 
           playsInline 
           className="w-full h-full object-cover opacity-80" 
        />
      );
    }

    if (theme.homeBgType === 'image' && theme.homeBg) {
      return (
        <img 
          src={getMediaSource(theme.homeBg)} 
          className="w-full h-full object-cover opacity-80" 
          alt="" 
        />
      );
    }
    
    return <div className="w-full h-full bg-neutral-900" />;
  };`;

prev = prev.replace(regex, newFn);
fs.writeFileSync('src/components/admin/HeroPreview.tsx', prev);
console.log("Fixed renderBackground");
