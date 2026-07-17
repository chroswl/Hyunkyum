with open("src/components/BiographySection.tsx", "r") as f:
    content = f.read()

content = content.replace("setSuccessMsg('');", "")
content = content.replace("setSuccessMsg('Order updated');", "showNotification('Order updated');")
content = content.replace("setTimeout(() => setSuccessMsg(''), 2000);", "")

with open("src/components/BiographySection.tsx", "w") as f:
    f.write(content)
