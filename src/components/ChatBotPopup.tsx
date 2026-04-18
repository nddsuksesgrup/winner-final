import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ChatBotPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Halo! Saya asisten pintar dari Winner Agent. Ada ide artikel yang ingin didiskusikan atau butuh saran keyword?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Itu ide yang bagus! Untuk niche tersebut, saya sarankan menargetkan audiens di kota-kota besar. Apakah Anda ingin saya otomatiskan pembuatan draft untuk topik itu?' 
      }]);
    }, 1000);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 w-14 h-14 bg-primary text-bg rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:scale-110 transition-transform z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 w-80 sm:w-96 bg-panel border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
            style={{ height: '500px', maxHeight: '80vh' }}
          >
            <header className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-bg" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Winner Assistant</h3>
                  <p className="text-[10px] text-primary">Sparring Partner AI Anda</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-primary text-bg rounded-br-none font-medium' : 'bg-white/10 text-white rounded-bl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-panel border-t border-white/5">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  placeholder="Ketik pesan..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-primary/50"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 w-8 h-8 flex items-center justify-center bg-primary rounded-full text-bg hover:scale-105 transition-transform"
                >
                  <Send className="w-4 h-4 -ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
