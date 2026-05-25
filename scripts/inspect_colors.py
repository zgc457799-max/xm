import bpy
import os

def inspect_sampled_colors(glb_path, texture_path):
    print(f"\n================= Inspecting Colors of {os.path.basename(glb_path)} =================")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    obj = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH'][0]
    num_vertices = len(obj.data.vertices)
    num_loops = len(obj.data.loops)
    
    image = bpy.data.images.load(texture_path, check_existing=True)
    width, height = image.size[0], image.size[1]
    
    pixels = [0.0] * (width * height * 4)
    image.pixels.foreach_get(pixels)
    
    uv_layer = obj.data.uv_layers.active.data
    uvs = [0.0] * (num_loops * 2)
    uv_layer.foreach_get("uv", uvs)
    
    loop_vertex_indices = [0] * num_loops
    obj.data.loops.foreach_get("vertex_index", loop_vertex_indices)
    
    vertex_u = [0.0] * num_vertices
    vertex_v = [0.0] * num_vertices
    vertex_count = [0] * num_vertices
    
    for i in range(num_loops):
        v_idx = loop_vertex_indices[i]
        vertex_u[v_idx] += uvs[i * 2]
        vertex_v[v_idx] += uvs[i * 2 + 1]
        vertex_count[v_idx] += 1
        
    white_count = 0
    non_white_count = 0
    sampled_samples = []
    
    for i in range(num_vertices):
        count = vertex_count[i]
        if count > 0:
            avg_u = vertex_u[i] / count
            avg_v = vertex_v[i] / count
        else:
            avg_u = 0.5
            avg_v = 0.5
            
        avg_u = max(0.0, min(1.0, avg_u))
        avg_v = max(0.0, min(1.0, avg_v))
        
        px = int(avg_u * (width - 1))
        py = int(avg_v * (height - 1))
        pixel_idx = (py * width + px) * 4
        
        r, g, b = pixels[pixel_idx], pixels[pixel_idx + 1], pixels[pixel_idx + 2]
        
        # Check if color is close to pure white (r > 0.95 and g > 0.95 and b > 0.95)
        if r > 0.95 and g > 0.95 and b > 0.95:
            white_count += 1
        else:
            non_white_count += 1
            if len(sampled_samples) < 10:
                sampled_samples.append((i, avg_u, avg_v, (r, g, b)))
                
    print(f"Total vertices: {num_vertices}")
    print(f"White vertices (r,g,b > 0.95): {white_count} ({white_count/num_vertices*100:.2f}%)")
    print(f"Non-white vertices: {non_white_count} ({non_white_count/num_vertices*100:.2f}%)")
    print("Some non-white samples:")
    for idx, u, v, rgb in sampled_samples:
        print(f"  Vert {idx}: U={u:.4f}, V={v:.4f}, RGB=({rgb[0]:.4f}, {rgb[1]:.4f}, {rgb[2]:.4f})")

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(project_root, "public")

spongebob_in = os.path.join(public_dir, "jrtg-round-model-1779515060361.glb")
spongebob_tex = os.path.join(public_dir, "spongebob_pet.png")
inspect_sampled_colors(spongebob_in, spongebob_tex)
