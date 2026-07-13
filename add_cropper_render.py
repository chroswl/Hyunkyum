with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

replacement = """
        )}

        {cropTarget && (
          <ImageCropperModal
            imageSrc={cropTarget.src}
            aspect={cropTarget.aspect}
            onCropDone={(base64) => cropTarget.onCrop(base64)}
            onCropCancel={() => setCropTarget(null)}
          />
        )}
      </motion.div>
    </div>
  );
}
"""

content = content.replace("        )}\n      </motion.div>\n    </div>\n  );\n}", replacement)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Done")
