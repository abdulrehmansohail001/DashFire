import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SpeechBubble.css';

export default function SpeechBubble({ x, y, messages }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [text, setText] = useState('');
  
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    let currentText = '';
    const fullText = messages[msgIndex];
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        currentText += fullText.charAt(charIndex);
        setText(currentText);
        charIndex++;
      } else {
        clearInterval(typeInterval);
        
        if (messages.length > 1) {
          setTimeout(() => {
            setMsgIndex((prev) => (prev + 1) % messages.length);
            setText('');
          }, 1400);
        }
      }
    }, 45);
    
    return () => clearInterval(typeInterval);
  }, [messages, msgIndex]);

  useEffect(() => {
    setMsgIndex(0);
    setText('');
  }, [messages]);

  return (
    <AnimatePresence>
      {messages && messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            left: x,
            top: y,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 9999,
            backgroundColor: 'rgba(15, 20, 30, 0.95)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #44e',
            width: 'max-content',
            maxWidth: '250px',
            textAlign: 'left',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.5)',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.6rem',
            lineHeight: '1.5'
          }}
        >
          {text}
          <span className="blinking-cursor">_</span>
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '8px',
              borderStyle: 'solid',
              borderColor: '#44e transparent transparent transparent'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
