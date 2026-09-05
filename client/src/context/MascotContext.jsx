import { createContext, useContext, useRef, useState, useCallback } from "react";
import { PERCH_POSITION, RENDER_WIDTH } from "../data/mascotConfig";
const MascotContext = createContext(null);

export function MascotProvider({ children }) {
  const [phase, setPhase] = useState("perched");
  const [target, setTarget] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  const [pointingMessages, setPointingMessages] = useState(null);
  const hoverTokenRef = useRef(0);

  const flyTo = useCallback((cardId, rect, messages) => {
    const myToken = ++hoverTokenRef.current;
    setActiveCardId(cardId);
    setPointingMessages(messages ?? null);
    setTarget({ x: rect.left - RENDER_WIDTH + 24, y: rect.top - 24 });
    setPhase("flying-out");
    return myToken;
  }, []);

  const arrived = useCallback((token) => {
    if (token !== hoverTokenRef.current) return;
    setPhase("pointing");
  }, []);

  const flyHome = useCallback((cardId) => {
    if (cardId !== undefined && cardId !== activeCardId) return;
    hoverTokenRef.current++;
    setPhase("flying-home");
    setTarget(null);
  }, [activeCardId]);

  const landedHome = useCallback(() => {
    setPhase("perched");
    setActiveCardId(null);
  }, []);

  const value = {
    phase, target, activeCardId, pointingMessages,
    perchPosition: PERCH_POSITION,
    flyTo, arrived, flyHome, landedHome,
    currentToken: () => hoverTokenRef.current,
  };

  return <MascotContext.Provider value={value}>{children}</MascotContext.Provider>;
}

export function useMascot() {
  const ctx = useContext(MascotContext);
  if (!ctx) throw new Error("useMascot must be used within a MascotProvider");
  return ctx;
}
