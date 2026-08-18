"use client";

import { useEffect, useRef, useState } from "react";

export default function Audio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = 0.18;
    audio.loop = true;

    const startAudio = () => {
      audio
        .play()
        .catch(() => {});

      window.removeEventListener(
        "pointerdown",
        startAudio
      );
    };

    window.addEventListener(
      "pointerdown",
      startAudio
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        startAudio
      );
    };
  }, []);

  const toggleMute = () => {
    if (!audioRef.current) return;

    audioRef.current.muted =
      !audioRef.current.muted;

    setMuted(audioRef.current.muted);
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/ambience.mp3"
        preload="auto"
      />

      <button
        onClick={toggleMute}
        className="fixed bottom-7 right-7 z-[100] text-[10px] tracking-[0.3em] text-white/50 transition-opacity hover:text-white"
      >
        {muted ? "SOUND OFF" : "SOUND ON"}
      </button>
    </>
  );
}