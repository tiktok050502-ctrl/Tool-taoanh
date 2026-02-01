import React, { useState } from 'react';
import { VideoPrompt, AppMode } from '../types';
import { generateVideoPrompts } from '../services/geminiService';
import { Copy, Film, Sparkles, Loader2, ArrowLeft, Image as ImageIcon, CheckCheck, FileText, Plus, Minus, Settings } from 'lucide-react';

interface PromptGeneratorProps {
  apiKey: string;
  mode: AppMode;
  generatedImage: string | null;
  prompts: VideoPrompt[];
  setPrompts: (prompts: VideoPrompt[]) => void;
  onBack: () => void;
  onOpenSettings: () => void;
}

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ 
  apiKey, 
  mode, 
  generatedImage, 
  prompts, 
  setPrompts, 
  onBack,
  onOpenSettings
}) => {
  // Use string state to allow empty input while typing
  const [countStr, setCountStr] = useState<string>("5");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("Vui lòng nhập API Key trong phần cài đặt.");
      return;
    }
    
    // Parse count safely
    let count = parseInt(countStr);
    if (isNaN(count) || count < 1) {
      count = 5;
      setCountStr("5");
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await generateVideoPrompts(apiKey, count, mode, generatedImage || undefined);
      setPrompts(result);
    } catch (err: any) {
      const msg = err.message || "Lỗi khi tạo prompts.";
      setError(msg);
      if (msg.includes("QUOTA_EXCEEDED")) {
        setError("API Key đã hết hạn mức (Quota).");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const adjustCount = (delta: number) => {
    let current = parseInt(countStr);
    if (isNaN(current)) current = 0;
    const newVal = Math.max(1, Math.min(1000, current + delta));
    setCountStr(newVal.toString());
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Logic: Copy all prompt texts, separated by double newline
  const handleCopyAllText = () => {
    const allText = prompts.map(p => p.prompt_text).join('\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(prompts, null, 2));
  };

  return (
    <div className="animate-in slide-in-from-right duration-300 h-full">
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-6">
        <button 
          onClick={onBack} 
          className="p-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-black" />
        </button>
        <div>
          <h2 className="text-3xl font-serif font-bold text-gray-900">AI Video Director</h2>
          <p className="text-gray-500 flex items-center gap-2">
            Chuyển thể ảnh tĩnh thành kịch bản video
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold uppercase tracking-wider text-gray-600">
              {mode === AppMode.JEWELRY ? 'Trang Sức' : 'Thời Trang'}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* Left: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
              <Film className="w-5 h-5 text-accent" />
              Cấu hình Kịch bản
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-3">Số lượng Prompt (Frames)</label>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => adjustCount(-1)}
                    className="w-14 h-14 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95 border border-gray-200"
                  >
                    <Minus className="w-6 h-6 text-gray-700" />
                  </button>

                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      min="1" 
                      max="1000"
                      value={countStr}
                      onChange={(e) => setCountStr(e.target.value)}
                      onBlur={() => {
                        let val = parseInt(countStr);
                        if (isNaN(val) || val < 1) setCountStr("1");
                        if (val > 1000) setCountStr("1000");
                      }}
                      className="w-full h-14 text-center border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-xl font-bold bg-gray-50 focus:bg-white transition-colors"
                      placeholder="SL"
                    />
                  </div>

                  <button 
                    onClick={() => adjustCount(1)}
                    className="w-14 h-14 flex items-center justify-center bg-black hover:bg-gray-800 rounded-xl transition-all active:scale-95 shadow-md text-white"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-2 text-center">Gợi ý: 5-10 cho clip ngắn (Shorts), 100+ cho phim dài.</p>
              </div>

              {generatedImage ? (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <ImageIcon className="w-3 h-3" />
                    Ảnh tham chiếu
                  </div>
                  <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border border-gray-200">
                     <img src={generatedImage} alt="Reference" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 text-sm">
                   Chưa có ảnh được chọn. Hệ thống sẽ tạo kịch bản dựa trên mô tả văn bản thuần túy.
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all
                  ${isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-black text-white hover:bg-gray-900 hover:scale-[1.02] hover:shadow-xl'
                  }
                `}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isLoading ? "Đang viết kịch bản..." : "Tạo Prompt Ngay"}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 font-medium flex flex-col gap-2">
              <p>{error}</p>
              {error.includes("Quota") && (
                <button 
                  onClick={onOpenSettings}
                  className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-800 py-2 rounded-lg font-bold transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Đổi API Key Khác
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-[calc(100vh-200px)] min-h-[600px] flex flex-col overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/80 backdrop-blur flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800 text-lg">Kịch bản chi tiết</span>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md text-xs font-bold">{prompts.length} Frames</span>
              </div>
              
              {prompts.length > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCopyAllText}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all active:scale-95 shadow-md"
                    title="Copy nội dung prompt cách nhau 1 dòng"
                  >
                    {copiedAll ? <CheckCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    {copiedAll ? "Đã Copy!" : "Copy All Prompts"}
                  </button>
                  <button 
                    onClick={handleCopyJson}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all active:scale-95"
                  >
                    <Copy className="w-4 h-4" />
                    Copy JSON
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              {prompts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <Film className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Chưa có kịch bản nào được tạo.</p>
                  <p className="text-sm">Hãy nhập số lượng frames và nhấn nút tạo.</p>
                </div>
              ) : (
                prompts.map((p, idx) => (
                  <div key={idx} className="relative pl-8 border-l-[3px] border-gray-200 hover:border-accent transition-all duration-300 group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[11px] top-0 w-5 h-5 bg-white border-[3px] border-gray-200 rounded-full group-hover:border-accent transition-colors shadow-sm"></div>
                    
                    {/* Header Info */}
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-accent transition-colors">Frame {String(p.frame).padStart(2, '0')}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700 font-semibold border border-gray-200">{p.camera_movement}</span>
                    </div>
                    
                    {/* Action Title */}
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{p.action}</h4>
                    
                    {/* Prompt Box */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 font-mono leading-relaxed relative group/code hover:bg-white hover:shadow-md transition-all">
                      {p.prompt_text}
                      
                      <button 
                        onClick={() => copyToClipboard(p.prompt_text, idx)}
                        className={`
                          absolute top-3 right-3 p-2 rounded-lg border transition-all duration-200
                          ${copiedIndex === idx 
                            ? 'bg-green-50 border-green-200 text-green-600 opacity-100' 
                            : 'bg-white border-gray-200 text-gray-400 opacity-0 group-hover/code:opacity-100 hover:text-black hover:border-black'
                          }
                        `}
                        title="Copy prompt này"
                      >
                        {copiedIndex === idx ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};