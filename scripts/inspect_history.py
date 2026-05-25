import json
import os

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logs_path = r"C:\Users\张广川\.gemini\antigravity\brain\7e5dad0c-3c8f-4cdc-bd0c-1bd980f29a71\.system_generated\logs\transcript.jsonl"

print("Searching transcript for model info...")
with open(logs_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get("content", "")
            tool_calls = data.get("tool_calls", [])
            
            # Check if there is text about importing or inspecting the models in the early steps
            if "jrtg-round-model" in str(content) or "jrtg-round-model" in str(tool_calls):
                step = data.get("step_index")
                source = data.get("source")
                print(f"\n--- Step {step} ({source}) ---")
                if content:
                    # Print lines containing the model name
                    for l in content.split("\n"):
                        if "jrtg-round-model" in l or "model-" in l or "texture" in l or "glb" in l or "png" in l:
                            print("  TEXT:", l[:150])
                if tool_calls:
                    print("  TOOLS:", tool_calls)
        except Exception as e:
            pass
