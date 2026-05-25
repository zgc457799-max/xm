import bpy
import os

def inspect_baked_vertex_colors(glb_path, is_spongebob):
    print(f"\n================= Inspecting Baked Vertex Colors: {os.path.basename(glb_path)} =================")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objs:
        print("No mesh found!")
        return
        
    obj = mesh_objs[0]
    num_vertices = len(obj.data.vertices)
    print(f"Mesh: {obj.name}, Vertices: {num_vertices}")
    
    if "Color" not in obj.data.color_attributes:
        print("No Color attribute found!")
        return
        
    color_attr = obj.data.color_attributes["Color"]
    print(f"Color attribute found! Domain: {color_attr.domain}, Type: {color_attr.data_type}")
    
    # Read vertex colors based on domain
    domain_len = len(obj.data.loops) if color_attr.domain == 'CORNER' else num_vertices
    colors = [0.0] * (domain_len * 4)
    color_attr.data.foreach_get("color", colors)
    
    # Group unique colors in the model
    color_counts = {}
    for i in range(domain_len):
        r = round(colors[i * 4], 4)
        g = round(colors[i * 4 + 1], 4)
        b = round(colors[i * 4 + 2], 4)
        rgb = (r, g, b)
        color_counts[rgb] = color_counts.get(rgb, 0) + 1

        
    print(f"Total unique colors in the mesh: {len(color_counts)}")
    print("Color distribution:")
    sorted_colors = sorted(color_counts.items(), key=lambda item: item[1], reverse=True)
    for rgb, count in sorted_colors[:15]:
        percent = count / num_vertices * 100
        # Convert linear back to sRGB for display
        srgb_r = int((rgb[0] ** (1/2.2)) * 255) if rgb[0] > 0 else 0
        srgb_g = int((rgb[1] ** (1/2.2)) * 255) if rgb[1] > 0 else 0
        srgb_b = int((rgb[2] ** (1/2.2)) * 255) if rgb[2] > 0 else 0
        hex_val = f"#{srgb_r:02X}{srgb_g:02X}{srgb_b:02X}"
        print(f"  Color LinearRGB={rgb}, sRGB={hex_val}: Count={count:6d} ({percent:5.2f}%)")

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(project_root, "public")

spongebob_in = os.path.join(public_dir, "jrtg-round-model-1779515060361.glb")
patrick_in = os.path.join(public_dir, "jrtg-round-model-1779516455.glb" if not os.path.exists(os.path.join(public_dir, "jrtg-round-model-1779515636455.glb")) else os.path.join(public_dir, "jrtg-round-model-1779515636455.glb"))

inspect_baked_vertex_colors(spongebob_in, is_spongebob=True)
inspect_baked_vertex_colors(patrick_in, is_spongebob=False)
