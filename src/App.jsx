import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [status, setStatus] = useState("connecting...");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socketState, setSocketState] = useState("CONNECTING");

  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = new WebSocket(
      "wss://echo.websocket.org"
    );

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
      setStatus("Connected");
      setSocketState("OPEN");
    };

    socketRef.current.onmessage = (event) => {
      console.log("Message received:",event.data);

      setMessages((oldMessages) => [
        ...oldMessages,
        "ECHO: " + event.data
      ]);
    };

    socketRef.current.onerror = () => {
      console.log("WebSocket error");
      setStatus("Error");
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket closed");
      setStatus("Offline");
      setSocketState("CLOSED");

      setMessages((oldMessages) => [
        ...oldMessages,
        "Server is offline"
      ]);
    };

    return () => {
      socketRef.current.close();
    };
  }, []);

  function sendMessage() {
    const state = socketRef.current.readyState;

    if (state === WebSocket.CONNECTING) {
      console.log("WebSocket is still connecting");
      return;
    }

    if (state === WebSocket.OPEN) {
      socketRef.current.send(input);

    setMessages((oldMessages) => [
      ...oldMessages,
      "FROM: " + input
    ]);

    setInput("");
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
}
  return (
    <div className="page">
      <div className="chat">
    <h1>Websocket Chat</h1>

    <p>Status: {status}</p>
    <p>WebSocket State : {socketState}</p>

    <div className="message">
      {messages.map((message, index) => (
        <div key={index}>
          {message}
          </div>
      ))}
    </div>
  

    <input
    value={input}
    onChange={(event) => setInput(event.target.value)}
    placeholder="Type a message"
    />

    <button onClick={sendMessage}>
      Send
    </button>
    </div>
    </div>
  );
}

export default App;