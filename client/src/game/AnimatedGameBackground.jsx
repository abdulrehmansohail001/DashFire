import { useEffect, useState } from 'react';

const FRAME_INTERVAL = 200;
const FRAME_POSITIONS = [
  '0% 0%',
  '33.333% 0%',
  '66.667% 0%',
  '100% 0%',
  '0% 100%',
  '33.333% 100%',
  '66.667% 100%',
  '100% 100%',
];

export default function AnimatedGameBackground({ className, style }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFrameIndex((currentFrame) => (currentFrame + 1) % FRAME_POSITIONS.length);
    }, FRAME_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={className}
      style={{
        ...style,
        backgroundPosition: FRAME_POSITIONS[frameIndex],
      }}
    />
  );
}
