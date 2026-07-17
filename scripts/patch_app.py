import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_load = ''' const loadAllData = async () => {
 setIsLoading(true);'''
new_load = ''' const loadAllData = async (showLoadingScreen = true) => {
 if (showLoadingScreen) setIsLoading(true);'''

content = content.replace(old_load, new_load)

old_end = ''' setSlides(sld);
 } catch (error) {
 console.error("Error loading data:", error);
 } finally {
 setIsLoading(false);
 }
 };'''
new_end = ''' setSlides(sld);
 } catch (error) {
 console.error("Error loading data:", error);
 } finally {
 if (showLoadingScreen) setIsLoading(false);
 }
 };'''
content = content.replace(old_end, new_end)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("patched App.tsx")
