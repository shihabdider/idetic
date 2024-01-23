import React from 'react';
import axios from 'axios';
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";
import { useState } from 'react';

function GPTChat(bookId) {
  const [messages, setMessages] = useState([
    {
      message: "Hi! I'm iDeticon. What would you like to know about this text?",
      timestamp: new Date().toLocaleTimeString(),
      sender: "GPT",
    }
  ]);

  const generateGPTResponse = async (question) => {
    try {
      const response = await axios.post(`http://localhost:3001/highlights/${bookId}/query-gpt`, {
        question: question
      }, { withCredentials: true });
      console.log('Answer:', response.data.answer);
      return response.data.answer;
    } catch (error) {
      console.error('Error generating gpt answer:', error);
    }
  }

  const handleSend = (text) => {
    if (text.trim()) {
      const newMessage = {
        message: text,
        timestamp: new Date().toLocaleTimeString(),
        sender: "User",
        direction: "outgoing",
      };
      setMessages([...messages, newMessage]);

      generateGPTResponse(text).then((response) => {
        const newGPTMessage = {
          message: response,
          timestamp: new Date().toLocaleTimeString(),
          sender: "GPT",
          direction: "incoming",
        };
        setMessages([...messages, newGPTMessage]);
      });
    }
  };

  return (
    <div style={{ position: "relative", height: "600px", border: "none" }}>
      <MainContainer style={{ border: "none", marginTop: "16px" }}>
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
