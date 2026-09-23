import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css"
import "./App.css";

function App() {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    const terminal = new Terminal({
    fontSize: 14,
    cursorBlink: true,
  });

    terminalInstanceRef.current = terminal;

    terminal.open(terminalRef.current);

    terminal.focus();

    const socket = new WebSocket(
      "ws://dev.cyberrange.fsid-iisc.in:8181/ws",
      "tty"
    );

    socket.onopen = () => {
      console.log("WebSocket connected");
      terminal.write("Connected to WebSocket\r\n");

    const initMessage = '{"AuthToken":"","columns":80,"rows":24}';

    socket.send(initMessage);
  };


    // socket.onmessage = async (event) => {
    //   const data = new Uint8Array(await event.data.arrayBuffer());
    //   console.log("Received:", data);
    //   terminal.write(data.slice(1));
    // };

    socket.onmessage=async(event)=> {

      try{
        if(event.data instanceof Blob){
          const data =new Uint8Array(await event.data.arrayBuffer());
          terminal.write(data.slice(1))
        }
        else{
          terminal.write(event.data)        
        }
      }
      catch(err){
        console.error("Error handling message",err);
      }
    }

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
        return;
      }
    });

  return () => {
    socket.close();
    terminal.dispose();
  };
}, []);

function increaseFontSize() {
  setFontSize((currentSize) => {
    const newSize = currentSize + 1;

    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.options.fontSize = newSize;
    }

    return newSize;
  });
}

function decreaseFontSize() {
  setFontSize((currentSize) => {
    const newSize = Math.max(8, currentSize - 1);

    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.options.fontSize = newSize;
    }

    return newSize;
  });
}

return (
  <div className="page">
    <div>
      <div className="buttons">
        <button onClick={increaseFontSize}>A+</button>
        <button onClick={decreaseFontSize}>A-</button>
      </div>

      <div
      className="terminal-container"
      ref={terminalRef}
    ></div>
    </div>
  </div>
);
}

export default App;