# 🚀 AI-Terminal: Self-Learning Local CLI

A blazing-fast, custom terminal emulator powered by Rust (Tauri), React, and xterm.js, integrated with a local LLM (Qwen) via Ollama. 

This is not just an AI chat wrapper. The ultimate goal of this project is to collect user commands and AI outputs locally to build a personalized dataset for future fine-tuning (LoRA), making the terminal natively adapted to your specific workflow.

## Features
- **Local AI Inference:** Completely offline, privacy-first AI responses using local models.
- **High Performance:** Built on Tauri and Rust for minimal overhead.
- **Native Rendering:** Uses `xterm.js` for an authentic terminal experience.
- **Data Collection (WIP):** Silently builds a `.jsonl` dataset of prompt-completion pairs for model fine-tuning.

## Prerequisites
- [Node.js](https://nodejs.org/) & npm
- [Rust](https://rustup.rs/)
- [Ollama](https://ollama.com/)

## Installation & Setup

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

## Stack
- **Frontend**: React, TypeScript, xterm.js
- **Backend**: Rust, Tauri
- **AI Engine**: Ollama (Qwen 1.5B)