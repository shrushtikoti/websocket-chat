import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css"
import "./App.css";

function App() {
  const terminalRefs = useRef({});
  const terminalInstances = useRef({});
  const socketInstances = useRef({});
  
  const [fontSize, setFontSize] = useState(14);
  const [tabs, setTabs] = useState([1]);
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
    tabs.forEach((tab) => {
      if (terminalInstances.current[tab]) {
        return;
      }

      const terminalElement = terminalRefs.current[tab];

      if (!terminalElement) {
        return;
      }

    const terminal = new Terminal({
    fontSize: 14,
    cursorBlink: true,
  });

    terminalInstances.current[tab] = terminal;

      terminal.open(terminalElement);

      if (tab === activeTab) {
    terminal.focus();
}
    
    const socket = new WebSocket(
      "ws://dev.cyberrange.fsid-iisc.in:8181/ws",
      "tty"
    );

    socketInstances.current[tab] = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");

      terminal.write("Connected to WebSocket\r\n");

    const initMessage = '{"AuthToken":"","columns":80,"rows":24}';

    socket.send(initMessage);
  };

    socket.onmessage = async (event) => {
      try {
        const raw =
          event.data instanceof Blob
            ? new Uint8Array(await event.data.arrayBuffer())
            : new TextEncoder().encode(event.data);

        if (raw.length === 0) return;

        const frameType = String.fromCharCode(raw[0]);
        const payload = raw.slice(1);

        if (frameType === "0") {
          terminal.write(payload);        
        } else if (frameType === "1") {
          document.title = new TextDecoder().decode(payload);   
        } else if (frameType === "2") {
          console.log("prefs", new TextDecoder().decode(payload));
        }
      } catch (err) {
        console.error("Error handling message", err);
      }
    };  

    socket.onerror = () => {
      console.log("WebSocket error");
      terminal.write("\r\nWebSocket error\r\n");
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
      terminal.write("\r\nWebSocket connection closed\r\n");
    };

    terminal.onData((data) => {
      const state = socket.readyState;

      if (state === WebSocket.CONNECTING) {
        console.log("WebSocket is still connecting");
        return;
      }

      if (state === WebSocket.OPEN) {

        const input = new TextEncoder().encode(data);
        const message = new Uint8Array(input.length + 1);

        message[0]= 48;
        message.set(input, 1);
        
        socket.send(message.buffer);
        return;
      }

      if (state === WebSocket.CLOSING) {
        console.log("WebSocket is closing");
        return;
      }

      if (state === WebSocket.CLOSED) {
        console.log("WebSocket is closed");
      }
      });
    });
  }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [tabs, activeTab]);
        
    useEffect(() => {
      return () => {
        Object.values(socketInstances.current).forEach(
          (socket) => socket.close()
        );

        Object.values(
          terminalInstances.current
        ).forEach((terminal) => terminal.dispose());
      };
    }, []);

function addTab() {
  const newTab = tabs.length + 1;

  setTabs((currentTabs) => [...currentTabs, newTab]);
  setActiveTab(newTab);
}

function increaseFontSize() {
  setFontSize((currentSize) => {
    const newSize = currentSize + 1;

    const terminal = terminalInstances.current[activeTab];

    if (terminal) {
      terminal.options.fontSize = newSize;
    }

    return newSize;
  });
}

function decreaseFontSize() {
  setFontSize((currentSize) => {
    const newSize = Math.max(8, currentSize - 1);

    const terminal = terminalInstances.current[activeTab];

    if (terminal) {
      terminal.options.fontSize = newSize;
    }

    return newSize;
  });
}

return (
  <div className="page">
    <div>
      <div className="buttons">
      {tabs.map((tab) => (
        <button key={tab} onClick={() => setActiveTab(tab)}>
        Terminal {tab}
        </button>
      ))}
      <button onClick={addTab}>+</button>

        <button onClick={increaseFontSize}>A+</button>
        <button onClick={decreaseFontSize}>A-</button>
      </div>

      <div
      className="terminal-container">
      {tabs.map((tab) => (
        <div
        key={tab}
        ref={(element) => {
          terminalRefs.current[tab] = element;
        }}

        className={
          activeTab === tab
          ? "terminal-tab active"
          : "terminal-tab"
        }
        ></div>
    ))}
      </div>
      </div>
      </div>

    );
  }

export default App;