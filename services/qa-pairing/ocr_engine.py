import torch
from transformers import AutoModel, AutoTokenizer
import os
import re
import tempfile
import shutil

class OCREngine:
    def __init__(self, model_name="deepseek-ai/DeepSeek-OCR", cache_dir="./model_cache/deepseek-ocr"):
        self.model_name = model_name
        self.cache_dir = cache_dir
        self.tokenizer = None
        self.model = None
        self._load_model()

    def _load_model(self):
        os.makedirs(self.cache_dir, exist_ok=True)
        print("\nChecking model cache...")

        if os.path.exists(os.path.join(self.cache_dir, "config.json")):
            print("➡ Loading model from local cache...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.cache_dir, trust_remote_code=True)
            self.model = AutoModel.from_pretrained(
                self.cache_dir,
                trust_remote_code=True,
                use_safetensors=True
            ).eval()
        else:
            print("➡ Downloading model (first run only)...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                cache_dir=self.cache_dir
            )
            self.model = AutoModel.from_pretrained(
                self.model_name,
                trust_remote_code=True,
                use_safetensors=True,
                cache_dir=self.cache_dir
            ).eval()
            print("✔ Model downloaded and saved to cache.")

        if torch.cuda.is_available():
            self.model = self.model.cuda().to(torch.bfloat16)
            print("✔ Running on GPU")
            print(f"  Device: {torch.cuda.get_device_name(0)}")
        else:
            print("⚠ Running on CPU (slower)")
            print(f"  [DEBUG] torch version: {torch.__version__}")

    def mmd_to_text(self, mmd_str):
        texts = re.findall(r"<\|ref\|>(.*?)<\|/ref\|>", mmd_str)
        if not texts:
            return ""
        return "\n".join(t.strip() for t in texts)

    def process_image(self, image_path):
        try:
            prompt = "<image>\nFree OCR."
            output_dir = tempfile.mkdtemp()

            if torch.cuda.is_available():
                with torch.autocast(device_type="cuda", dtype=torch.bfloat16):
                    self.model.infer(
                        self.tokenizer,
                        prompt=prompt,
                        image_file=image_path,
                        output_path=output_dir,
                        base_size=1024,
                        image_size=640,
                        crop_mode=True,
                        save_results=True
                    )
            else:
                self.model.infer(
                    self.tokenizer,
                    prompt=prompt,
                    image_file=image_path,
                    output_path=output_dir,
                    base_size=1024,
                    image_size=640,
                    crop_mode=True,
                    save_results=True
                )

            mmd_path = os.path.join(output_dir, "result.mmd")

            if not os.path.exists(mmd_path):
                return {
                    "error": "OCR failed, result.mmd not generated",
                    "generated_files": os.listdir(output_dir)
                }

            raw_mmd = open(mmd_path, "r", encoding="utf-8").read()
            clean_text = raw_mmd
            
            return {
                "status": "success",
                "clean_text": clean_text,
                "raw_mmd": raw_mmd
            }

        except Exception as e:
            return {"error": str(e)}

        finally:
            shutil.rmtree(output_dir, ignore_errors=True)
