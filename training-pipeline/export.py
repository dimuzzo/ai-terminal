from unsloth import FastLanguageModel

print("Loading your custom adapter...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "lora_adapter", # The folder we just created
    max_seq_length = 2048,
    dtype = None,
    load_in_4bit = True,
)

print("Starting GGUF export. This might take a few minutes...")
# The "q4_k_m" method compresses the file for speed while keeping high quality
model.save_pretrained_gguf(
    "ai-terminal-custom", 
    tokenizer, 
    quantization_method = "q4_k_m"
)

print("Done! Your custom model is ready.")