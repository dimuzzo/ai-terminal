use serde::{Deserialize, Serialize};
use std::env;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;
use std::process::Command;

#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaResponse {
    response: String,
}

#[derive(Serialize)]
struct LogEntry {
    prompt: String,
    completion: String,
}

// Helper function to talk to AI and save logs
async fn ask_ollama(prompt: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    let request_body = OllamaRequest {
        model: "qwen2.5:1.5b".to_string(), 
        prompt: prompt.clone(), 
        stream: false, 
    };

    let res = client
        .post("http://localhost:11434/api/generate")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let parsed: OllamaResponse = res
        .json()
        .await
        .map_err(|e| format!("JSON parsing error: {}", e))?;

    let ai_response = parsed.response;

    // Data collection for fine-tuning
    let log_entry = LogEntry {
        prompt,
        completion: ai_response.clone(),
    };

    if let Ok(json_line) = serde_json::to_string(&log_entry) {
        let file_result = OpenOptions::new()
            .create(true)
            .append(true)
            .open("../dataset.jsonl"); 

        if let Ok(mut file) = file_result {
            let _ = writeln!(file, "{}", json_line);
        }
    }

    Ok(ai_response)
}

// The main command router called by React
#[tauri::command]
async fn process_input(input: String) -> Result<String, String> {
    let input = input.trim();
    
    if input.is_empty() {
        return Ok("".to_string());
    }

    // 1. Is it an AI prompt? (Starts with "?")
    if input.starts_with("?") {
        // Remove the "?" and the space after it
        let prompt = input[1..].trim().to_string();
        return ask_ollama(prompt).await;
    }

    // 2. Is it a "Change Directory" (cd) command?
    if input.starts_with("cd ") {
        let new_dir = input[3..].trim();
        let path = Path::new(new_dir);
        
        match env::set_current_dir(&path) {
            Ok(_) => return Ok("".to_string()), 
            Err(e) => return Ok(format!("cd: {}: {}", new_dir, e)),
        }
    }

    // 3. Custom "dir" or "ls" for a clean, private output
    if input == "dir" || input == "ls" {
        let mut result = String::new();
        // Get current path to show where we are
        let current_dir = env::current_dir().unwrap_or_default();
        result.push_str(&format!("Path: {}\r\n\r\n", current_dir.display()));

        if let Ok(entries) = std::fs::read_dir(".") {
            let mut dirs = Vec::new();
            let mut files = Vec::new();

            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if let Ok(file_type) = entry.file_type() {
                    if file_type.is_dir() {
                        dirs.push(name);
                    } else {
                        files.push(name);
                    }
                }
            }

            // Sort alphabetically for a nice terminal feel
            dirs.sort();
            files.sort();

            for d in dirs {
                result.push_str(&format!("<DIR>  {}\r\n", d));
            }
            for f in files {
                result.push_str(&format!("       {}\r\n", f));
            }
        }
        return Ok(result);
    }

    // 4. Otherwise, execute as a native OS Command
    // Since you are on Windows, we route it through cmd.exe
    #[cfg(target_os = "windows")]
    let output = Command::new("cmd")
        .args(["/C", input])
        .output();

    #[cfg(not(target_os = "windows"))]
    let output = Command::new("sh")
        .arg("-c")
        .arg(input)
        .output();

    match output {
        Ok(out) => {
            // Combine stdout and stderr
            // Warning: Windows cmd output is often CP850/CP1252, but Rust assumes UTF-8. 
            // String::from_utf8_lossy handles invalid characters gracefully.
            let mut result = String::from_utf8_lossy(&out.stdout).to_string();
            let err = String::from_utf8_lossy(&out.stderr).to_string();
            
            if !err.is_empty() {
                result.push_str(&err);
            }
            Ok(result)
        }
        Err(e) => Ok(format!("Execution error: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // Register the new routing command
        .invoke_handler(tauri::generate_handler![process_input])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}