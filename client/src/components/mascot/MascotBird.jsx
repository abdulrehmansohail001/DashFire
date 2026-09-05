import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useMascot } from "../../context/MascotContext";
import { FRAMES, SHEET_SRC, CELL_WIDTH, CELL_HEIGHT, GRID_COLS, RENDER_WIDTH, RENDER_HEIGHT } from "../../data/mascotConfig";
import { MASCOT_MESSAGES, POINTING_MESSAGES } from "../../data/mascotMessages";
import SpeechBubble from "./SpeechBubble";

export default function MascotBird() {
  const { phase, target, perchPosition, arrived, landedHome, currentToken, pointingMessages, hidden } = useMascot();
  const [frameIndex, setFrameIndex] = useState(0);
  const prevX = useRef(perchPosition.left);

  const [localPhase, setLocalPhase] = useState(phase);
  
  useEffect(() => {
    if (phase === "perched" && localPhase !== "perched") {
      setLocalPhase("land");
      const duration = (1000 / FRAMES.land.fps) * FRAMES.land.indices.length;
      const timer = setTimeout(() => setLocalPhase("perched"), duration);
      return () => clearTimeout(timer);
    } else {
      setLocalPhase(phase);
    }
  }, [phase, localPhase]);

  let currentAnim = "idle";
  if (phase === "flying-out" || phase === "flying-home") currentAnim = "fly";
  if (phase === "pointing") currentAnim = "point";
  const activeAnim = localPhase === "land" ? "land" : currentAnim;

  useEffect(() => {
    let index = 0;
    const { indices, fps } = FRAMES[activeAnim];
    setFrameIndex(indices[0]);

    const interval = setInterval(() => {
      index = (index + 1) % indices.length;
      setFrameIndex(indices[index]);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [activeAnim]);

  const destX = target ? target.x : perchPosition.left;
  const destY = target ? target.y : (window.innerHeight - perchPosition.bottom - RENDER_HEIGHT);

  useEffect(() => {
    prevX.current = destX;
  }, [destX]);

  const onAnimationComplete = () => {
    if (phase === "flying-out") arrived(currentToken());
    else if (phase === "flying-home") landedHome();
  };

  const col = frameIndex % GRID_COLS;
  const row = Math.floor(frameIndex / GRID_COLS);
  const backgroundPositionX = -(col * RENDER_WIDTH);
  const backgroundPositionY = -(row * RENDER_HEIGHT);
  const bgSizeWidth = GRID_COLS * RENDER_WIDTH;

  let showBubble = false;
  let messages = [];
  
  if (phase === "pointing") {
    showBubble = true;
    messages = pointingMessages || POINTING_MESSAGES;
  } else if (localPhase === "perched") {
    // We could show MASCOT_MESSAGES here occasionally, but for exactness with the prompt constraints we'll just show pointing for now.
  }

  if (hidden) return null;

  return (
    <>
      {showBubble && (
        <SpeechBubble 
          x={destX + (RENDER_WIDTH / 2)} 
          y={destY + RENDER_HEIGHT + 10} 
          messages={messages} 
        />
      )}
      <motion.div
        initial={false}
        animate={{ x: destX, y: destY }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        onAnimationComplete={onAnimationComplete}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: RENDER_WIDTH,
          height: RENDER_HEIGHT,
          pointerEvents: "none",
          zIndex: 10000,
          backgroundImage: `url(${SHEET_SRC})`,
          backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
          backgroundSize: `${bgSizeWidth}px auto`,
          backgroundRepeat: "no-repeat",
        }}
      />
    </>
  );
}
