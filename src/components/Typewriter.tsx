import React, { useState, useEffect, useRef } from 'react';
import { playTick } from '../utils/audio';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  playSound?: boolean;
  showCursor?: boolean;
  delayStart?: number;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 30,
  className = '',
  onComplete,
  playSound = true,
  showCursor = true,
  delayStart = 0,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const textIndex = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText('');
    setIsDone(false);
    textIndex.current = 0;

    const startTyping = () => {
      timerRef.current = window.setInterval(() => {
        if (textIndex.current < text.length) {
          const nextChar = text.charAt(textIndex.current);
          setDisplayedText((prev) => prev + nextChar);
          textIndex.current += 1;
          
          if (playSound && nextChar !== ' ') {
            playTick();
          }
        } else {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsDone(true);
          if (onComplete) {
            onComplete();
          }
        }
      }, speed);
    };

    let startTimeout: number;
    if (delayStart > 0) {
      startTimeout = window.setTimeout(startTyping, delayStart);
    } else {
      startTyping();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (startTimeout) clearTimeout(startTimeout);
    };
  }, [text, speed, playSound, onComplete, delayStart]);

  return (
    <span className={`${className} inline`}>
      {displayedText}
      {showCursor && !isDone && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-neon-green animate-pulse align-middle"></span>
      )}
    </span>
  );
};
