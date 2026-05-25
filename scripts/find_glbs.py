import os

def find_glbs(dir_path):
    print(f"\nSearching for GLB files in: {dir_path}")
    for root, dirs, files in os.walk(dir_path):
        # Skip node_modules and .git
        if "node_modules" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith(".glb") or file.endswith(".gltf"):
                full_path = os.path.join(root, file)
                size = os.path.getsize(full_path)
                print(f"  Found: {full_path} (Size: {size / (1024*1024):.2f} MB)")

project_root = r"c:\Users\张广川\Desktop\xm"
brain_root = r"C:\Users\张广川\.gemini\antigravity\brain\7e5dad0c-3c8f-4cdc-bd0c-1bd980f29a71"

find_glbs(project_root)
find_glbs(brain_root)
