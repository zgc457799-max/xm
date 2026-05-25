import bpy
import os

def inspect_features(glb_path, texture_path, is_spongebob):
    print(f"\n================= Inspecting Face Features of {os.path.basename(glb_path)} =================")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    obj = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH'][0]
    verts = obj.data.vertices
    
    # Load texture to sample original colors
    image = bpy.data.images.load(texture_path, check_existing=True)
    w, h = image.size[0], image.size[1]
    pixels = [0.0] * (w * h * 4)
    image.pixels.foreach_get(pixels)
    
    uv_layer = obj.data.uv_layers.active.data
    uvs = [0.0] * (len(obj.data.loops) * 2)
    uv_layer.foreach_get("uv", uvs)
    
    loop_vertex_indices = [0] * len(obj.data.loops)
    obj.data.loops.foreach_get("vertex_index", loop_vertex_indices)
    
    vertex_u = [0.0] * len(verts)
    vertex_v = [0.0] * len(verts)
    vertex_count = [0] * len(verts)
    
    for i in range(len(obj.data.loops)):
        v_idx = loop_vertex_indices[i]
        vertex_u[v_idx] += uvs[i * 2]
        vertex_v[v_idx] += uvs[i * 2 + 1]
        vertex_count[v_idx] += 1
        
    # Let's search for vertices that are colored blue (iris) or red (tie/tongue)
    blue_verts = []
    red_verts = []
    
    for i in range(len(verts)):
        count = vertex_count[i]
        if count > 0:
            u = vertex_u[i] / count
            v = vertex_v[i] / count
        else:
            u, v = 0.5, 0.5
        u = max(0.0, min(1.0, u))
        v = max(0.0, min(1.0, v))
        
        px = int(u * (w - 1))
        py = int(v * (h - 1))
        idx = (py * w + px) * 4
        
        r, g, b = pixels[idx], pixels[idx+1], pixels[idx+2]
        
        # Blue iris detection (b > 0.6 and r < 0.3)
        if b > 0.5 and r < 0.4 and g < 0.6:
            blue_verts.append((i, verts[i].co.x, verts[i].co.y, verts[i].co.z))
            
        # Red tie/tongue detection (r > 0.6 and g < 0.2 and b < 0.2)
        if r > 0.6 and g < 0.3 and b < 0.3:
            red_verts.append((i, verts[i].co.x, verts[i].co.y, verts[i].co.z))
            
    print(f"Detected {len(blue_verts)} blue iris vertices.")
    if blue_verts:
        x_coords = [co[1] for co in blue_verts]
        y_coords = [co[2] for co in blue_verts]
        z_coords = [co[3] for co in blue_verts]
        print(f"  Blue X range: {min(x_coords):.3f} to {max(x_coords):.3f}")
        print(f"  Blue Y range: {min(y_coords):.3f} to {max(y_coords):.3f}")
        print(f"  Blue Z range: {min(z_coords):.3f} to {max(z_coords):.3f}")
        
    print(f"Detected {len(red_verts)} red tie/tongue vertices.")
    if red_verts:
        x_coords = [co[1] for co in red_verts]
        y_coords = [co[2] for co in red_verts]
        z_coords = [co[3] for co in red_verts]
        print(f"  Red X range: {min(x_coords):.3f} to {max(x_coords):.3f}")
        print(f"  Red Y range: {min(y_coords):.3f} to {max(y_coords):.3f}")
        print(f"  Red Z range: {min(z_coords):.3f} to {max(z_coords):.3f}")

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(project_root, "public")

spongebob_in = os.path.join(public_dir, "jrtg-round-model-1779515060361.glb")
spongebob_tex = os.path.join(public_dir, "spongebob_pet.png")
inspect_features(spongebob_in, spongebob_tex, is_spongebob=True)
