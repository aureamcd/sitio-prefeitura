import os
import re

today = "2026-05-04"
# Pattern to match both lastUpdate="YYYY-MM-DD" and lastUpdate="DD/MM/YYYY"
pattern = re.compile(r'lastUpdate="[^"]*"')

for root, dirs, files in os.walk("app"):
    for file in files:
        if file.endswith(".tsx"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = pattern.sub(f'lastUpdate="{today}"', content)
                
                if content != new_content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Updated: {path}")
            except Exception as e:
                print(f"Error updating {path}: {e}")
