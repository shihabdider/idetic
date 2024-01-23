import React from 'react';
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput
} from "@chatscope/chat-ui-kit-react";

function SimpleChat() {
  return (
    <div style={{ position: "relative", height: "500px", border: "none" }}>
      <MainContainer>
        <ChatContainer>
          <MessageList>
            <Message
              model={{
                message: "Hello my friend",
                sentTime: "just now",
                sender: "Joe",
              }}
            />
          </MessageList>
          {/* Removed the upload file button from MessageInput */}
        </ChatContainer>
      </MainContainer>
      <MessageInput placeholder="Type message here" />
    </div>
  );
}

export default SimpleChat;
