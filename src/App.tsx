import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

import "xterm/css/xterm.css";
import "./App.css";

function App() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize the terminal with more scrollback memory
    const term = new Terminal({
      fontFamily: '"Fira Code", monospace',
      fontSize: 15,
      cursorBlink: true,
      cursorStyle: 'block',
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#f7768e',     
        selectionBackground: '#364A82',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#787c99',
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#acb0d0'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // 2. Setup initial UI and prompt string
    term.writeln("Welcome to AI-Terminal (Powered by Qwen)");
    term.writeln("Type normal OS commands (dir, echo, ...), or prefix with '?' to ask AI.");
    
    const promptText = '\r\n\x1b[1;32m⚡ user\x1b[0m@\x1b[1;34mai-terminal\x1b[0m:~$ ';
    term.write("\r\n" + promptText);

    // 3. State variables for input and history
    let currentInput = "";
    const commandHistory: string[] = [];
    let historyIndex = -1;

    // 4. Handle keyboard input
    term.onKey(async ({ key, domEvent }) => {
      const ev = domEvent;

      // Command: clear screen (Ctrl+L)
      if (ev.ctrlKey && ev.key === "l") {
        term.clear();
        term.write("\r\n" + promptText + currentInput);
        return;
      }

      // Command: execute (Enter)
      if (ev.key === "Enter") {
        term.writeln(""); // Move to next line

        if (currentInput.trim() !== "") {
          // Save to history and reset index
          commandHistory.unshift(currentInput);
          historyIndex = -1;

          term.writeln("\x1b[33mThinking...\x1b[0m");

          try {
            // Route the input to our new Rust handler
            const response = await invoke<string>("process_input", {
              input: currentInput,
            });
            const formattedResponse = response.replace(/\n/g, "\r\n");
            term.writeln(formattedResponse);
          } catch (error) {
            term.writeln(`\x1b[31mError: ${error}\x1b[0m`);
          }
        }

        currentInput = "";
        term.write("\r\n" + promptText);
      } 
      
      // Command: Backspace
      else if (ev.key === "Backspace") {
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write("\b \b");
        }
      } 
      
      // Command: history up (Arrow Up)
      else if (ev.key === "ArrowUp") {
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          currentInput = commandHistory[historyIndex];
          // \x1b[2K clears the entire line, \r moves cursor to start
          term.write("\x1b[2K\r" + promptText + currentInput);
        }
      } 
      
      // Command: history down (Arrow Down)
      else if (ev.key === "ArrowDown") {
        if (historyIndex > 0) {
          historyIndex--;
          currentInput = commandHistory[historyIndex];
          term.write("\x1b[2K\r" + promptText + currentInput);
        } else if (historyIndex === 0) {
          historyIndex = -1;
          currentInput = "";
          term.write("\x1b[2K\r" + promptText);
        }
      } 
      
      // Standard typing (ignore modifier keys and special keys)
      // We check ev.key.length === 1 to ensure we only print actual characters,
      // ignoring special keys like 'Shift', 'Alt', etc., to prevent garbage output.
      else if (!ev.altKey && !ev.ctrlKey && !ev.metaKey && ev.key.length === 1) {
        currentInput += key;
        term.write(key);
      }
    });

    // 5. Handle standard pasting via browser events
    term.textarea?.addEventListener("paste", (e) => {
      e.preventDefault();
      const pastedText = e.clipboardData?.getData("text") || "";
      // Remove any newlines from pasted text to prevent accidental execution
      const sanitizedText = pastedText.replace(/\n|\r/g, " ");
      currentInput += sanitizedText;
      term.write(sanitizedText);
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener("resize", handleResize);

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
      <div ref={terminalRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default App;