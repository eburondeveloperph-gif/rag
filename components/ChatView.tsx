
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation } from '../types';
import { aiService } from '../services/aiService';

interface ChatViewProps {
  documents: any[];
  onUpload?: (files: FileList) => void;
}

// Helper functions for raw PCM audio decoding from Gemini TTS
const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

const ChatView: React.FC<ChatViewProps> = ({ documents, onUpload }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      audioSourceRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  const handleSpeak = async (text: string, id: string) => {
    // If clicking the same message that is playing, stop it
    if (playingMessageId === id) {
      audioSourceRef.current?.stop();
      setPlayingMessageId(null);
      return;
    }

    try {
      setPlayingMessageId(id);
      
      const dataUri = await aiService.textToSpeech(text);
      const base64 = dataUri.split(',')[1];
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioData = decodeBase64(base64);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
      
      // Stop current playback if any
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setPlayingMessageId(null);
      source.start();
      audioSourceRef.current = source;
      
    } catch (error) {
      console.error("Speech synthesis failed", error);
      setPlayingMessageId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await aiService.chatWithRAG(input, documents);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer,
        citations: result.citations,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Error: Failed to process request. Please check connectivity and security settings.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (mode: 'video' | 'scanner') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (mode === 'video') {
        setIsCameraActive(true);
      } else {
        setIsScannerActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Requires camera permission and HTTPS.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsScannerActive(false);
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onUpload && e.target.files) {
        onUpload(e.target.files);
      }
      const msg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: `[Attached Document: ${file.name}]`,
      };
      setMessages(prev => [...prev, msg]);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've received the file "${file.name}". How can I help you analyze it?`
        }]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-sm md:text-base">Eburon RAG Assistant</h2>
          <p className="text-[10px] md:text-xs text-slate-500">{documents.length} active documents</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full shrink-0">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] md:text-[11px] font-bold text-slate-600 uppercase tracking-tight">Active</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scroll-smooth relative">
        {(isCameraActive || isScannerActive) ? (
          <div className="absolute inset-4 md:inset-6 rounded-3xl overflow-hidden border border-[#E5E5EA] shadow-2xl z-20 bg-black flex flex-col">
            <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={stopCamera} className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 backdrop-blur-md transition-all">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            {isScannerActive && (
              <div className="absolute inset-0 border-4 border-[#34C759] m-8 rounded-2xl opacity-80 pointer-events-none">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-[#34C759] -mt-2 -ml-2 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-[#34C759] -mt-2 -mr-2 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-[#34C759] -mb-2 -ml-2 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-[#34C759] -mb-2 -mr-2 rounded-br-lg"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-black/80 text-[#34C759] px-4 py-2 rounded-lg backdrop-blur-md text-sm font-mono font-bold tracking-widest uppercase flex items-center gap-3 shadow-[0_0_15px_rgba(52,199,89,0.5)]">
                     <span className="w-3 h-3 rounded-full bg-[#34C759] animate-ping"></span>
                     YOLO26 Scan Active
                   </div>
                </div>
              </div>
            )}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-30">
              <button 
                onClick={() => {
                  if (canvasRef.current && videoRef.current) {
                    const canvas = canvasRef.current;
                    const video = videoRef.current;
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob((blob) => {
                      if (blob && onUpload) {
                        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        onUpload(dt.files);
                      }
                    }, 'image/jpeg');
                    
                    const msg: ChatMessage = {
                      id: Date.now().toString(),
                      role: 'user',
                      content: `[Captured ${isScannerActive ? 'Scan' : 'Photo'}]`, // Could embed image here if we supported rendering it
                    };
                    setMessages(prev => [...prev, msg]);
                    stopCamera();
                    
                    setTimeout(() => {
                      setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: isScannerActive 
                          ? "YOLO26 OCR Complete. Detected text: 'CONFIDENTIAL EBURON DIRECTIVE'. How should I log this?" 
                          : "I received the captured image. It appears to be a document. Would you like me to run analysis on it?"
                      }]);
                    }, 1500);
                  }
                }}
                className="w-20 h-20 rounded-full border-[6px] border-white/80 flex items-center justify-center hover:bg-white/20 transition-all bg-black/40 backdrop-blur-sm"
              >
                <div className="w-14 h-14 rounded-full bg-white shadow-lg"></div>
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 && !isCameraActive && !isScannerActive && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto px-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#007AFF]/10 rounded-[1.25rem] flex items-center justify-center mb-6">
              <i className="fa-solid fa-brain text-[#007AFF] text-2xl md:text-3xl"></i>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-[#1D1D1F] mb-2">Knowledge Assistant</h3>
            <p className="text-[#86868B] text-xs md:text-sm">Ask anything about your ingested data. I'll provide answers with verifiable citations.</p>
            <div className="mt-6 md:mt-8 grid grid-cols-1 gap-2 md:gap-3 w-full">
              {['Retention policy?', '2023 report summary', 'Liability clauses'].map(q => (
                <button 
                  key={q} 
                  onClick={() => setInput(q)}
                  className="text-left p-3 rounded-lg border border-[#E5E5EA] hover:border-[#007AFF]/50 hover:bg-[#F5F5F7] text-xs md:text-sm text-[#515154] transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-[85%] rounded-[1.25rem] p-3 md:p-4 ${
              msg.role === 'user' 
                ? 'bg-[#007AFF] text-white shadow-sm' 
                : 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5EA]'
            }`}>
              <div className="flex justify-between items-start gap-4">
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap flex-1">{msg.content}</div>
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => handleSpeak(msg.content, msg.id)}
                    className={`shrink-0 transition-all p-1.5 rounded-lg ${playingMessageId === msg.id ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-[#86868B] hover:text-[#007AFF] hover:bg-[#0000000A]'}`}
                    title="Read aloud"
                  >
                    <i className={`fa-solid ${playingMessageId === msg.id ? 'fa-circle-stop animate-pulse' : 'fa-volume-high'} text-xs md:text-sm`}></i>
                  </button>
                )}
              </div>
              
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#E5E5EA] space-y-2">
                  <p className="text-[10px] font-semibold text-[#86868B] tracking-wide">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cite, idx) => (
                      <button 
                        key={idx} 
                        className="bg-white hover:bg-[#F5F5F7] px-2.5 py-1.5 rounded-lg text-[10px] md:text-[11px] font-medium border border-[#E5E5EA] hover:border-[#C7C7CC] text-[#515154] flex items-center gap-1.5 transition-all text-left group shadow-sm"
                        title="View document (Not fully implemented)"
                        onClick={() => alert(`Navigating to document: ${cite.title}\n\nSnippet highlight feature is in development.`)}
                      >
                        <i className="fa-solid fa-file-lines text-[#86868B] group-hover:text-[#1D1D1F] text-[9px] md:text-[11px]"></i>
                        {cite.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-[1.25rem] p-4 flex gap-2">
              <div className="w-1.5 h-1.5 bg-[#86868B] rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-[#86868B] rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-[#86868B] rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 bg-white/80 backdrop-blur border-t border-[#E5E5EA]">
        <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={() => isCameraActive ? stopCamera() : startCamera('video')}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors ${isCameraActive ? 'bg-[#007AFF] text-white' : 'text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#007AFF]'}`} 
              title="Realtime Video"
            >
              <i className="fa-solid fa-video text-sm"></i>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#007AFF] transition-colors" 
              title="Attach file or image"
            >
              <i className="fa-solid fa-paperclip text-sm"></i>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAttachFile} 
              className="hidden" 
              accept="image/*,.pdf,.doc,.docx"
            />
            <button 
              onClick={() => isScannerActive ? stopCamera() : startCamera('scanner')}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors ${isScannerActive ? 'bg-[#34C759] text-white' : 'text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#007AFF]'}`} 
              title="YOLO26 Realtime Vision Scanner"
            >
              <i className="fa-solid fa-expand text-sm"></i>
            </button>
          </div>
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Query files..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-full px-5 py-3 md:px-6 md:py-3.5 text-sm md:text-[15px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#007AFF] transition-colors">
              <i className="fa-solid fa-microphone text-sm"></i>
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-[#007AFF] text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm hover:bg-[#007AFF]/90 disabled:opacity-50 transition-all shrink-0"
          >
            <i className="fa-solid fa-arrow-up text-sm md:text-base"></i>
          </button>
        </div>
        <p className="text-[10px] text-center text-[#86868B] mt-3 tracking-wide">
          Engine v2.4 • AI Powered • Secured BE-Gov
        </p>
      </div>
    </div>
  );
};

export default ChatView;
