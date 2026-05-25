import bpy
import os

def inspect_parts(glb_path):
    print(f"\n================= Analyzing Loose Parts of {os.path.basename(glb_path)} =================")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objs:
        print("No mesh found!")
        return
        
    main_obj = mesh_objs[0]
    print(f"Main mesh: {main_obj.name} with {len(main_obj.data.vertices)} vertices")
    
    # Separate by loose parts
    bpy.context.view_layer.objects.active = main_obj
    main_obj.select_set(True)
    
    # We must go into edit mode to separate
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.separate(type='LOOSE')
    bpy.ops.object.mode_set(mode='OBJECT')
    
    parts = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    print(f"Separated into {len(parts)} loose parts.")
    
    # Print details of the largest 25 parts
    parts.sort(key=lambda o: len(o.data.vertices), reverse=True)
    for idx, part in enumerate(parts[:25]):
        verts = len(part.data.vertices)
        
        # Calculate bounding box
        bbox = part.bound_box
        min_x = min(p[0] for p in bbox)
        max_x = max(p[0] for p in bbox)
        min_y = min(p[1] for p in bbox)
        max_y = max(p[1] for p in bbox)
        min_z = min(p[2] for p in bbox)
        max_z = max(p[2] for p in bbox)
        
        center = ((min_x + max_x)/2, (min_y + max_y)/2, (min_z + max_z)/2)
        dims = (max_x - min_x, max_y - min_y, max_z - min_z)
        
        print(f"  Part {idx:2d}: '{part.name}', Verts={verts:6d}, Center=({center[0]:.3f}, {center[1]:.3f}, {center[2]:.3f}), Dims=({dims[0]:.3f}, {dims[1]:.3f}, {dims[2]:.3f})")

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public_dir = os.path.join(project_root, "public")

spongebob_in = os.path.join(public_dir, "jrtg-round-model-1779515060361.glb")
inspect_parts(spongebob_in)
