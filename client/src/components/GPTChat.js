import React from 'react';
import axios from 'axios';
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator
} from "@chatscope/chat-ui-kit-react";
import { useState, useEffect } from 'react';

function GPTChat(bookId) {
  const [messages, setMessages] = useState([]);
  const [isGPTTyping, setIsGPTTyping] = useState(false);

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    setMessages(storedMessages);
  }, []);

  const generateGPTResponse = async (question) => {
    setIsGPTTyping(true);
    try {
      const response = await axios.post(`http://localhost:3001/highlights/${bookId}/query-gpt`, {
        question: question
      }, { withCredentials: true });
      console.log('Answer:', response.data.answer);
      setIsGPTTyping(false);
      return response.data.answer;
    } catch (error) {
      setIsGPTTyping(false);
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
      setMessages(messages => {
        const updatedMessages = [...messages, newMessage].slice(-100);
        localStorage.setItem('messages', JSON.stringify(updatedMessages));
        return updatedMessages;
      });

      generateGPTResponse(text).then((gptResponse) => {
        setMessages(messages => {
          const updatedMessages = [
            ...messages,
            {
              message: gptResponse,
              timestamp: new Date().toLocaleTimeString(),
              sender: "GPT",
              direction: "incoming",
            }
          ].slice(-100);
          localStorage.setItem('messages', JSON.stringify(updatedMessages));
          return updatedMessages;
        });
      });
    }
  };

  return (
    <div style={{ position: "relative", height: "600px", border: "none" }}>
      <MainContainer style={{ border: "none", marginTop: "16px" }}>
        <ChatContainer>
          <MessageList typingIndicator={isGPTTyping && <TypingIndicator content="GPT is typing" />}>
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
