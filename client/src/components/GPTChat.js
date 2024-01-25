import React from 'react';
import axios from 'axios';
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  Button,
  TypingIndicator,
  InputToolbox
} from "@chatscope/chat-ui-kit-react";
import { IconButton, Tooltip } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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

  const handleClearMessages = () => {
    setMessages([]);
    localStorage.removeItem('messages');
  };

  const handleExportMessages = () => {
    const messageText = messages.map(msg => `${msg.sender}: ${msg.message}\n\n`).join('');
    const blob = new Blob([messageText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'chat_history.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div style={{ position: "relative", height: "640px",  border: "none" }}>
      <MainContainer style={{ border: "none", marginTop: "16px", display: "block" }}>
        <ChatContainer>
          <MessageList typingIndicator={isGPTTyping && <TypingIndicator content="Thinking" />}>
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
            sendButton={false}
          />
          <InputToolbox>
          <Tooltip title="Clear messages">
            <IconButton onClick={handleClearMessages} style={{ marginTop: "10px" }}>
                <DeleteOutlineIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export messages">
            <IconButton onClick={handleExportMessages} style={{ marginTop: "10px" }}>
                <SaveAltIcon />
            </IconButton>
          </Tooltip>
          </InputToolbox>
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default GPTChat;
