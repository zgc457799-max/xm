import bpy
import os

def find_eye_centers_patrick(glb_path, texture_path):
    print(f"\n================= Calculating Precise Eye Centers: {os.path.basename(glb_path)} =================")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    obj = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH'][0]
    verts = obj.data.vertices
    
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
        
    left_iris_verts = []
    right_iris_verts = []
    
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
        
        # Check if vertex is on the face front (Y > 0.10) and has black color
        if verts[i].co.y > 0.10 and verts[i].co.z > 0.10:
            # Black pupil/eyebrows detection
            if r < 0.15 and g < 0.15 and b < 0.15:
                if verts[i].co.x < 0:
                    left_iris_verts.append(verts[i].co)
                else:
                    right_iris_verts.append(verts[i].co)
                    
    if left_iris_verts:
        avg_x = sum(v.x for v in left_iris_verts) / len(left_iris_verts)
        avg_y = sum(v.y for v in left_iris_verts) / len(left_iris_verts)
        avg_z = sum(v.z for v in left_iris_verts) / len(left_iris_verts)
        print(f"Left Eye Pupil Center: X={avg_x:.4f}, Y={avg_y:.4f}, Z={avg_z:.4f} (Vertices: {len(left_iris_verts)})")
        
    if right_iris_verts:
        avg_x = sum(v.x for v in right_iris_verts) / len(right_iris_verts)
        avg_y = sum(v.y for v in right_iris_verts) / len(right_iris_verts)
        avg_z = sum(v.z for v in right_iris_verts) / len(right_iris_verts)
        print(f"Right Eye Pupil Center: X={avg_x:.4f}, Y={avg_y:.4f}, Z={avg_z:.4f} (Vertices: {len(right_iris_verts)})")

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(project_root, "public")

patrick_in = os.path.join(public_dir, "jrtg-round-model-1779515636455.glb")
patrick_tex = os.path.join(public_dir, "patrick_pet.png")
find_eye_centers_patrick(patrick_in, patrick_tex)
