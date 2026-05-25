import bpy
import os

def analyze_png(texture_path):
    print(f"\n================= Analyzing PNG: {os.path.basename(texture_path)} =================")
    image = bpy.data.images.load(texture_path, check_existing=True)
    w, h = image.size[0], image.size[1]
    print(f"Dimensions: {w}x{h}")
    
    pixels = [0.0] * (w * h * 4)
    image.pixels.foreach_get(pixels)
    
    # Let's check a 10x10 grid of average colors
    grid_size = 10
    step_x = w // grid_size
    step_y = h // grid_size
    
    print("Color grid (R, G, B, A in sRGB scale 0-255):")
    for gy in range(grid_size - 1, -1, -1):
        row_str = []
        for gx in range(grid_size):
            # Average color in this grid cell
            r_sum, g_sum, b_sum, a_sum = 0.0, 0.0, 0.0, 0.0
            count = 0
            for dy in range(min(step_y, h - gy * step_y)):
                y = gy * step_y + dy
                for dx in range(min(step_x, w - gx * step_x)):
                    x = gx * step_x + dx
                    idx = (y * w + x) * 4
                    r_sum += pixels[idx]
                    g_sum += pixels[idx + 1]
                    b_sum += pixels[idx + 2]
                    a_sum += pixels[idx + 3]
                    count += 1
            
            avg_r = int((r_sum / count) * 255)
            avg_g = int((g_sum / count) * 255)
            avg_b = int((b_sum / count) * 255)
            avg_a = int((a_sum / count) * 255)
            
            # format as hex or RGB
            row_str.append(f"({avg_r:3},{avg_g:3},{avg_b:3})")
        print(" | ".join(row_str))

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(project_root, "public")

analyze_png(os.path.join(public_dir, "spongebob_pet.png"))
analyze_png(os.path.join(public_dir, "patrick_pet.png"))
