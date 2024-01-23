import React from 'react';
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput
} from "@chatscope/chat-ui-kit-react";
import { useState } from 'react';

function GPTChat() {
  const [messages, setMessages] = useState([
    {
      message: "Hi! I'm iDeticon. What would you like to know about this text?",
      timestamp: new Date().toLocaleTimeString(),
      sender: "GPT",
    }
  ]);

  const handleSend = (text) => {
    if (text.trim()) {
      const newMessage = {
        message: text,
        timestamp: new Date().toLocaleTimeString(),
        sender: "User",
        direction: "outgoing",
      };
      setMessages([...messages, newMessage]);
    }
  };

  return (
    <div style={{ position: "relative", height: "500px", border: "none" }}>
      <MainContainer>
        <ChatContainer>
          <MessageList>
            {messages.map((msg, index) => (
              <Message
                key={index}
                model={{
                  message: msg.message,
                  sentTime: msg.timestamp,
                  sender: msg.sender,
                  direction: msg.direction,
                }}
              />
            ))}
          </MessageList>
          <MessageInput
            placeholder="Type message here"
            onSend={handleSend}
            attachButton={false}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default GPTChat;
