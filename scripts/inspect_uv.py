import bpy
import os

def inspect_uvs(glb_path, texture_path):
    print(f"\n================= Inspecting {os.path.basename(glb_path)} =================")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objs:
        print("No mesh found!")
        return
        
    obj = mesh_objs[0]
    print(f"Mesh name: {obj.name}")
    print(f"Vertices: {len(obj.data.vertices)}")
    print(f"Loops: {len(obj.data.loops)}")
    
    if not obj.data.uv_layers:
        print("No UV layers found!")
        return
        
    uv_layer = obj.data.uv_layers.active.data
    uvs = [0.0] * (len(obj.data.loops) * 2)
    uv_layer.foreach_get("uv", uvs)
    
    u_vals = [uvs[i * 2] for i in range(len(obj.data.loops))]
    v_vals = [uvs[i * 2 + 1] for i in range(len(obj.data.loops))]
    
    print(f"UV U range: {min(u_vals)} to {max(u_vals)}")
    print(f"UV V range: {min(v_vals)} to {max(v_vals)}")
    
    # Load texture
    image = bpy.data.images.load(texture_path, check_existing=True)
    w, h = image.size[0], image.size[1]
    print(f"Texture dimensions: {w}x{h}")
    
    # Sample some UVs
    print("First 10 UV coords:")
    for i in range(min(10, len(obj.data.loops))):
        print(f"  Loop {i}: U={uvs[i*2]:.4f}, V={uvs[i*2+1]:.4f}")

# Define paths
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(project_root, "public")

spongebob_in = os.path.join(public_dir, "jrtg-round-model-1779515060361.glb")
spongebob_tex = os.path.join(public_dir, "spongebob_pet.png")
patrick_in = os.path.join(public_dir, "jrtg-round-model-1779515636455.glb")
patrick_tex = os.path.join(public_dir, "patrick_pet.png")

inspect_uvs(spongebob_in, spongebob_tex)
inspect_uvs(patrick_in, patrick_tex)
