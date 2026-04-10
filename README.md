# 🚀 AI-Terminal: Self-Learning Local CLI

A blazing-fast, custom terminal emulator powered by Rust (Tauri), React, and xterm.js, integrated with a local LLM (Qwen) via Ollama. 

This is not just an AI chat wrapper. The ultimate goal of this project is to collect user commands and AI outputs locally to build a personalized dataset for future fine-tuning (LoRA), making the terminal natively adapted to your specific workflow.

## Features
- **Local AI Inference:** Completely offline, privacy-first AI responses using local models.
- **High Performance:** Built on Tauri and Rust for minimal overhead.
- **Native Rendering:** Uses `xterm.js` for an authentic terminal experience.
- **Data Collection:** Silently builds a `.jsonl` dataset of prompt-completion pairs.
- **Custom System Commands:** Intercepts standard OS commands (like `dir` or `ls`) for clean, privacy-focused outputs.

## Prerequisites
- [Node.js](https://nodejs.org/) & npm
- [Rust](https://rustup.rs/)
- [Ollama](https://ollama.com/)
- **For Training:** Python 3.11 & NVIDIA GPU

## Installation & Setup (Terminal Application)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dimuzzo/ai-terminal.git
   cd ai-terminal
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Start the local AI model:**

   Open a separate terminal and run:
   ```bash
   ollama run qwen2.5:1.5b
   ```

4. **Launch the terminal:**
   ```bash
   npm run tauri dev
   ```

## Local Fine-Tuning Pipeline (WIP)
To train the model on your collected data (`dataset.jsonl`), we use Unsloth for highly optimized, low-VRAM LoRA fine-tuning.

1. Navigate to the training directory:
   ```bash
   cd training-pipeline
   ```
2. Create and activate a Python 3.11 virtual environment:
   ```bash
   # Windows
   C:\path\to\python3.11.exe -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
   pip install trl peft accelerate bitsandbytes
   ```

## Stack
- **Frontend**: React, TypeScript, xterm.js
- **Backend**: Rust, Tauri
- **AI Engine**: Ollama (Inference) / PyTorch & Unsloth (Training)