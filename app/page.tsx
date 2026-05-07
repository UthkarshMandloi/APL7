"use client";

import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CricketerScene } from '@/components/canvas/CricketerScene';
import { Mic, Send, ChevronDown, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGemini } from '@/hooks/useGemini';
import { useSpeech } from '@/hooks/useSpeech';

type Message = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
};

const MODES = ["Motivational", "Match Strategy", "Roast Mode", "Career Story"];
const PERSONAS = ["The Aggressor", "Captain Cool", "The Finisher"];

export default function Home() {
  const [currentEmotion, setCurrentEmotion] = useState('idle');
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { id: '1', sender: 'ai', text: "Welcome to the simulation. Ready for the next match?" }
  ]);
  
  const { sendMessage, isLoading } = useGemini();
  const { startListening, stopListening, isRecording, isSpeaking, transcript, setTranscript, speak, getAudioLevel, micError } = useSpeech();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = async (overrideText?: string) => {
    // If the event was passed from onClick, overrideText might be a React SyntheticEvent, so we check type
    const textToSend = typeof overrideText === 'string' ? overrideText : inputText;
    if (!textToSend.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: textToSend };
    setChatHistory(prev => [...prev, userMessage]);
    setInputText("");
    setCurrentEmotion('serious'); // Set to serious while thinking

    // Build the prompt context based on persona and mode
    const systemPrompt = `You are a legendary cricketer persona known as "${selectedPersona}". 
    The user wants to engage in a conversation in "${selectedMode}" mode.
    Stay in character. Be concise.
    User's input: ${textToSend}`;

    const response = await sendMessage(systemPrompt, chatHistory);

    const aiMessage: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: response };
    setChatHistory(prev => [...prev, aiMessage]);
    
    // Switch emotion based on some very basic keyword analysis
    let newEmotion = 'idle';
    if (response.toLowerCase().includes('haha') || response.toLowerCase().includes('joke')) {
      newEmotion = 'laughing';
    } else if (response.toLowerCase().includes('great') || response.toLowerCase().includes('good')) {
      newEmotion = 'happy';
    }
    setCurrentEmotion(newEmotion);
    
    // Speak the response
    speak(response, newEmotion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Watch for completed speech transcript
  useEffect(() => {
    if (!isRecording && transcript.trim()) {
      handleSend(transcript);
      setTranscript(""); 
    }
  }, [isRecording, transcript]);

  // Live typing effect while speaking
  useEffect(() => {
    if (isRecording && transcript) {
      setInputText(transcript);
    }
  }, [transcript, isRecording]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050509]">
      {/* Z-Index 0: 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <CricketerScene emotion={currentEmotion} getAudioLevel={getAudioLevel} />
        </Canvas>
      </div>

      {/* Z-Index 10: UI Overlay Wrapper (pointer-events: none so clicks pass through to canvas if needed) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-8">
        
        {/* Top Navigation */}
        <header className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <Activity className="text-cyan-400 w-6 h-6 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-widest text-white text-neon">
              CRIC-AI
            </h1>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
              className="glass px-6 py-2 rounded-full flex items-center gap-2 text-white/90 hover:bg-white/10 transition-colors"
            >
              <span className="text-sm uppercase tracking-wider font-mono">{selectedPersona}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isPersonaMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isPersonaMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full glass-panel rounded-xl overflow-hidden py-2 border border-white/10"
                >
                  {PERSONAS.map(persona => (
                    <button
                      key={persona}
                      onClick={() => {
                        setSelectedPersona(persona);
                        setIsPersonaMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-mono text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {persona}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="glass px-6 py-2 rounded-full text-sm font-medium text-white/90 hover:bg-white/10 transition-colors">
            LOGIN
          </button>
        </header>

        {/* Main Stage (Center) - kept clear for 3D Avatar */}
        <div className="flex-1" />

        {/* Bottom Interface */}
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 pointer-events-auto">
          
          {/* Chat History Panel */}
          <div className="glass-panel rounded-2xl p-4 h-64 overflow-y-auto flex flex-col gap-3 scrollbar-hide">
            {chatHistory.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-cyan-500/20 border border-cyan-400/30 text-white rounded-br-sm' 
                      : 'bg-white/5 border border-white/10 text-zinc-300 rounded-bl-sm font-sans'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-zinc-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error display */}
          <AnimatePresence>
            {micError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center rounded-lg py-2"
              >
                Microphone Error: {micError === 'network' ? 'Network error (Requires internet or secure context)' : micError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls: Modes */}
          <div className="flex flex-wrap justify-center gap-2">
            {MODES.map(mode => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition-all duration-300 border ${
                  selectedMode === mode 
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.3)]' 
                    : 'bg-black/40 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the legend something..."
              className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none font-sans"
            />
            
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim()}
              className="p-3 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>

            {/* Glowing Mic Button */}
            <button 
              onClick={toggleRecording}
              className={`p-4 rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-cyan-500/20 neon-glow-active text-cyan-400 border border-cyan-400/50 animate-pulse' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
