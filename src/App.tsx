import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

// Import the essential CSS for xterm to render correctly
import "xterm/css/xterm.css";
import "./App.css";

function App() {
  // Reference to the HTML div where the terminal will be injected
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize the terminal
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#1e1e1e", // Classic dark terminal background
        foreground: "#cccccc",
      },
      fontFamily: 'Consolas, "Courier New", monospace',
    });

    // 2. Add the plugin to make it fit the window size
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // 3. Mount it to the DOM
    term.open(terminalRef.current);
    fitAddon.fit();

    // 4. Initial welcome text
    term.writeln("Welcome to AI-Terminal (Powered by Qwen)");
    term.writeln("Type a prompt and press Enter...");
    term.write("\r\n\x1b[32muser@ai-terminal\x1b[0m:\x1b[34m~\x1b[0m$ ");

    let currentInput = "";

    // 5. Handle keyboard input
    term.onKey(async ({ key, domEvent }) => {
      const ev = domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

      if (ev.keyCode === 13) {
        // ENTER key pressed
        term.writeln(""); // Move to next line

        if (currentInput.trim() !== "") {
          // Visual feedback that the AI is thinking
          term.writeln("\x1b[33mThinking...\x1b[0m");

          try {
            // Call our Rust backend!
            const response = await invoke<string>("ask_ai", {
              prompt: currentInput,
            });

            // Format the response for the terminal (xterm needs \r\n for newlines)
            const formattedResponse = response.replace(/\n/g, "\r\n");
            term.writeln(formattedResponse);
          } catch (error) {
            term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
          }
        }

        // Reset input and print the prompt prefix again
        currentInput = "";
        term.write("\r\n\x1b[32muser@ai-terminal\x1b[0m:\x1b[34m~\x1b[0m$ ");
      } else if (ev.keyCode === 8) {
        // BACKSPACE key pressed
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          // Move cursor back, print space, move cursor back again
          term.write("\b \b");
        }
      } else if (printable) {
        // Regular characters
        currentInput += key;
        term.write(key);
      }
    });

    // Handle window resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

    // Cleanup function when component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#1e1e1e",
        padding: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* This div is where xterm will live */}
      <div ref={terminalRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default App;