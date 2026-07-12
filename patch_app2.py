import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_end = ''' setSlides(sld);
 } catch (error) {
 console.error("Error loading database content:", error);
 } finally {
 setIsLoading(false);
 }
 };'''
new_end = ''' setSlides(sld);
 } catch (error) {
 console.error("Error loading database content:", error);
 } finally {
 if (showLoadingScreen) setIsLoading(false);
 }
 };'''

if old_end in content:
    content = content.replace(old_end, new_end)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Patched App.tsx finally block")
else:
    print("Could not find old_end")
