use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;

// Input data structure (What we send to Ollama)
#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

// Output data structure (What Ollama replies)
#[derive(Deserialize)]
struct OllamaResponse {
    response: String,
}

// Structure for our training dataset log
#[derive(Serialize)]
struct LogEntry {
    prompt: String,
    completion: String,
}

// The command called by the React frontend
#[tauri::command]
async fn ask_ai(prompt: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    // Prepare the request for the Qwen model
    let request_body = OllamaRequest {
        model: "qwen2.5:1.5b".to_string(), 
        prompt: prompt.clone(), // Clone prompt to use it later for logging
        stream: false, 
    };

    // Make the local HTTP call to Ollama
    let res = client
        .post("http://localhost:11434/api/generate")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    // Parse the response
    let parsed: OllamaResponse = res
        .json()
        .await
        .map_err(|e| format!("JSON parsing error: {}", e))?;

    let ai_response = parsed.response;

    // Data collection for fine-tuning
    
    // Create the structured log entry
    let log_entry = LogEntry {
        prompt,
        completion: ai_response.clone(),
    };

    // Convert the entry to a single-line JSON string
    if let Ok(json_line) = serde_json::to_string(&log_entry) {
        // Open or create dataset.jsonl in append mode
        // This file will be created in the root folder of the Tauri backend
        let file_result = OpenOptions::new()
            .create(true)
            .append(true)
            .open("dataset.jsonl");

        if let Ok(mut file) = file_result {
            // Write the JSON line and a newline character
            if let Err(e) = writeln!(file, "{}", json_line) {
                eprintln!("Failed to write to dataset: {}", e);
            }
        } else {
            eprintln!("Failed to open dataset file.");
        }
    }

    Ok(ai_response)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![ask_ai])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}