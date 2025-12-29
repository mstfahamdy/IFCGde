import React, { useState } from 'react';
import { parseOrderFromText } from '../services/geminiService';
import { SalesOrder } from '../types';
import { Sparkles, ArrowRight, Loader2, X } from 'lucide-react';

interface MagicParserProps {
  onParsed: (data: Partial<SalesOrder>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MagicParser: React.FC<MagicParserProps> = ({ onParsed, isOpen, onClose }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await parseOrderFromText(text);
      onParsed(data);
      onClose();
      setText('');
    } catch (err) {
      setError("Failed to process text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Alexandria']">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <h3 className="text-xl font-bold">Magic Import</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-400 mb-4 text-sm font-medium">
            Paste a message directly from your WhatsApp sales group. The AI will fill out the form for you.
          </p>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., Please send 50 boxes of Mama Choice Fries and 20 Hot & Crispy to Ahmed Market in New Cairo tomorrow."
            className="w-full h-40 p-4 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none mb-4 text-white placeholder-gray-600 transition-all text-sm font-medium"
          />

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-800 flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-gray-400 hover:text-white font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleParse}
              disabled={loading || !text}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Analyzing...' : 'Auto-Fill Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};