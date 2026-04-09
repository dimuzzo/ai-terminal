use serde::{Deserialize, Serialize};

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

// The command called by the React frontend
#[tauri::command]
async fn ask_ai(prompt: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    // Prepare the request for the Qwen model
    let request_body = OllamaRequest {
        model: "qwen2.5:1.5b".to_string(), 
        prompt,
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

    Ok(parsed.response)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![ask_ai])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}