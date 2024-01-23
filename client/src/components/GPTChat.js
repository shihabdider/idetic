import React from 'react';
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput
} from "@chatscope/chat-ui-kit-react";

function GPTChat() {
  return (
    <div style={{ position: "relative", height: "500px", border: "none" }}>
      <MainContainer>
        <ChatContainer>
          <MessageList>
            <Message
              model={{
                message: "Hello my friend",
                sentTime: "just now",
                sender: "GPT",
              }}
            />
          </MessageList>
          <MessageInput placeholder="Type message here" attachButton={false}/>
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default GPTChat;
