import bpy
import os

def analyze_vertex_heights(glb_path):
    print(f"\n================= Bounding Box & Vertex Height Analysis: {os.path.basename(glb_path)} =================")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objs:
        print("No mesh found!")
        return
        
    obj = mesh_objs[0]
    verts = obj.data.vertices
    
    x_coords = [v.co.x for v in verts]
    y_coords = [v.co.y for v in verts]
    z_coords = [v.co.z for v in verts]
    
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    min_z, max_z = min(z_coords), max(z_coords)
    
    print(f"X range: {min_x:.4f} to {max_x:.4f} (width: {max_x - min_x:.4f})")
    print(f"Y range: {min_y:.4f} to {max_y:.4f} (depth: {max_y - min_y:.4f})")
    print(f"Z range: {min_z:.4f} to {max_z:.4f} (height: {max_z - min_z:.4f})")
    
    # Let's count how many vertices fall into 20 height bins along the Z-axis
    bins = 20
    z_min = min_z
    z_max = max_z
    z_step = (z_max - z_min) / bins
    
    bin_counts = [0] * bins
    for z in z_coords:
        bin_idx = int((z - z_min) / z_step) if z_step > 0 else 0
        bin_idx = max(0, min(bins - 1, bin_idx))
        bin_counts[bin_idx] += 1
        
    print("\nZ-axis Vertex Distribution (Bottom to Top):")
    for i in range(bins):
        z_start = z_min + i * z_step
        z_end = z_start + z_step
        percent = bin_counts[i] / len(verts) * 100
        bar = "#" * int(percent / 2)
        print(f"  Bin {i:2d} [{z_start:6.3f} to {z_end:6.3f}]: Verts={bin_counts[i]:6d} ({percent:5.2f}%) {bar}")

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(project_root, "public")

spongebob_in = os.path.join(public_dir, "jrtg-round-model-1779515060361.glb")
patrick_in = os.path.join(public_dir, "jrtg-round-model-1779515636455.glb")

analyze_vertex_heights(spongebob_in)
analyze_vertex_heights(patrick_in)
