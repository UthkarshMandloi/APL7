"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeech() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setMicError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          currentTranscript += result[0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'no-speech') {
          setMicError("No speech detected. Click mic to try again.");
        } else {
          setMicError(event.error);
        }
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setMicError("Browser does not support Speech Recognition");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isRecording) {
      setTranscript("");
      setMicError(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start listening:", e);
        setMicError("Failed to start microphone");
        setIsRecording(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isRecording) {
      setIsRecording(false);
      recognitionRef.current.stop();
    }
  };

  const speak = async (text: string, emotion: string) => {
    setIsSpeaking(true);
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, emotion }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to fetch TTS";
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.audioContent) throw new Error("No audio content");

      const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audio);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      audio.onended = () => {
        setIsSpeaking(false);
        analyserRef.current = null;
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      };

      await audio.play();

    } catch (error) {
      console.error("TTS Playback Error", error);
      setIsSpeaking(false);
    }
  };

  // Provide a way for R3F to get the current audio level without re-rendering
  const getAudioLevel = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      return sum / dataArrayRef.current.length;
    }
    return 0;
  }, []);

  return { startListening, stopListening, isRecording, isSpeaking, transcript, setTranscript, speak, getAudioLevel, micError };
}
