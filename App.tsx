import React, { useState, useEffect } from 'react';
import { AppMode, AppView, AspectRatio, JewelryPosition, ImageResolution, VideoPrompt } from './types';
import { generateTryOnImage } from './services/geminiService';
import { ModeSelector } from './components/ModeSelector';
import { UploadZone } from './components/UploadZone';
import { SettingsModal } from './components/SettingsModal';
import { PromptGenerator } from './components/PromptGenerator';
import { Wand2, Download, AlertCircle, Loader2, Settings, Sparkles, ScanEye, Menu, X, MonitorPlay, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  // App State
  const [apiKey, setApiKey] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  const [currentView, setCurrentView] = useState<AppView>(AppView.TRY_ON);
  
  // Data State (Persisted across views)
  const [mode, setMode] = useState<AppMode>(AppMode.JEWELRY);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [videoPrompts, setVideoPrompts] = useState<VideoPrompt[]>([]); // Lifted state
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.PORTRAIT);
  const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.HD);
  const [jewelryPosition, setJewelryPosition] = useState<JewelryPosition>(JewelryPosition.WRIST);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load API Key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setTimeout(() => setIsSettingsOpen(true), 500);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    // Clear error immediately so user can try again
    if (error?.includes("Quota")) {
      setError(null); 
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      setError("Vui lòng nhập API Key để tiếp tục.");
      return;
    }

    if (!productImage || !personImage) {
      setError("Vui lòng tải lên cả ảnh sản phẩm và ảnh nhân vật.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null); 

    try {
      const result = await generateTryOnImage({
        apiKey, // This always uses the current state, so if user updated it, it works
        productImage,
        personImage,
        mode,
        aspectRatio,
        resolution,
        position: mode === AppMode.JEWELRY ? jewelryPosition : undefined
      });
      setGeneratedImage(result);
      setVideoPrompts([]); 
    } catch (err: any) {
      console.error("Generation error:", err);
      const errorMessage = err.message || "";
      
      if (errorMessage.includes("QUOTA_EXCEEDED")) {
        setError("API Key này đã hết lượt sử dụng (Quota). Vui lòng nhập Key mới.");
        setIsSettingsOpen(true); // Auto open settings
      } else if (errorMessage.includes("API Key") || errorMessage.includes("403")) {
        setError("API Key không hợp lệ hoặc không có quyền. Vui lòng kiểm tra cài đặt.");
        setIsSettingsOpen(true);
      } else {
        setError(errorMessage || "Đã xảy ra lỗi khi tạo ảnh. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `ai-tryon-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const switchView = (view: AppView) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans pb-10">
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSave={handleSaveApiKey}
      />

      {/* Header - Transparent & Modern */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 h-16">
        <div className="max-w-[1800px] mx-auto px-6 h-full flex items-center justify-between relative">
          
          {/* LEFT: Menu & Logo */}
          <div className="flex items-center gap-6">
             {/* Menu Button */}
             <div className="relative">
               <button 
                 onClick={() => setIsMenuOpen(!isMenuOpen)}
                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-800"
               >
                 {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
               </button>
               
               {/* Dropdown Menu */}
               {isMenuOpen && (
                 <div className="absolute top-14 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 p-2">
                   <div className="space-y-1">
                     <button 
                      onClick={() => switchView(AppView.TRY_ON)}
                      className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-all ${currentView === AppView.TRY_ON ? 'bg-black text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
                     >
                       <div className={`p-2 rounded-lg ${currentView === AppView.TRY_ON ? 'bg-white/20' : 'bg-gray-100'}`}>
                          <Wand2 className="w-5 h-5" />
                       </div>
                       <div>
                         <span className="font-semibold block">Phòng thử đồ ảo</span>
                         <span className={`text-xs ${currentView === AppView.TRY_ON ? 'text-gray-300' : 'text-gray-400'}`}>Tạo ảnh sản phẩm AI</span>
                       </div>
                       {currentView === AppView.TRY_ON && <ChevronRight className="w-4 h-4 ml-auto" />}
                     </button>
                     
                     <button 
                      onClick={() => switchView(AppView.PROMPT_GEN)}
                      className={`w-full text-left px-4 py-4 rounded-xl flex items-center gap-4 transition-all ${currentView === AppView.PROMPT_GEN ? 'bg-black text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
                     >
                       <div className={`p-2 rounded-lg ${currentView === AppView.PROMPT_GEN ? 'bg-white/20' : 'bg-gray-100'}`}>
                          <MonitorPlay className="w-5 h-5" />
                       </div>
                       <div>
                         <span className="font-semibold block">Tạo Video Prompt</span>
                         <span className={`text-xs ${currentView === AppView.PROMPT_GEN ? 'text-gray-300' : 'text-gray-400'}`}>Viết kịch bản quảng cáo</span>
                       </div>
                       {currentView === AppView.PROMPT_GEN && <ChevronRight className="w-4 h-4 ml-auto" />}
                     </button>
                   </div>
                 </div>
               )}
             </div>

             {/* Logo */}
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-gray-900 hidden sm:block">
                  Fashion<span className="text-[#D4AF37]">AI</span>
                </h1>
             </div>
          </div>

          {/* RIGHT: Settings */}
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200">
               <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
               <span className="text-xs font-semibold text-gray-600">Gemini 3 Pro</span>
             </div>
             
             <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              title="Cài đặt API Key"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-[1800px] mx-auto px-4 md:px-6 pt-6 h-[calc(100vh-64px)]">
        
        {currentView === AppView.TRY_ON && (
          <div className="animate-in fade-in duration-500 h-full flex flex-col">
            
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 shrink-0">
              <div>
                <h2 className="font-serif text-3xl font-bold text-gray-900 leading-tight">Studio Sáng Tạo</h2>
                <p className="text-gray-500 text-sm mt-1">Hệ thống phân tích form dáng & vật lý vải thông minh.</p>
              </div>
              <ModeSelector currentMode={mode} setMode={(m) => {
                setMode(m);
                setGeneratedImage(null); 
                setVideoPrompts([]);
                setError(null);
              }} />
            </div>

            {/* Main Workspace - 2 Columns Full Height */}
            <div className="flex flex-col lg:flex-row gap-6 h-full pb-6">
              
              {/* LEFT: Control Panel */}
              <div className="lg:w-[420px] xl:w-[480px] shrink-0 flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-1">
                
                {/* 1. Upload Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                     <h3 className="font-semibold text-gray-900">Tải lên nguyên liệu</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <UploadZone 
                      label={mode === AppMode.JEWELRY ? "Sản phẩm" : "Trang phục"}
                      subLabel={mode === AppMode.JEWELRY ? "Ảnh tách nền" : "Ảnh quần áo"}
                      image={productImage}
                      onUpload={setProductImage}
                      onClear={() => setProductImage(null)}
                      heightClass="h-40"
                    />
                    <UploadZone 
                      label="Người mẫu"
                      subLabel="Ảnh gốc"
                      image={personImage}
                      onUpload={setPersonImage}
                      onClear={() => setPersonImage(null)}
                      heightClass="h-40"
                    />
                  </div>
                </div>

                {/* 2. Configuration Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-5 flex-1">
                   <div className="flex items-center gap-2 mb-2">
                     <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                     <h3 className="font-semibold text-gray-900">Thiết lập thông số</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Aspect Ratio */}
                    <div className="group">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block group-hover:text-black transition-colors">Tỉ lệ khung hình</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[AspectRatio.SQUARE, AspectRatio.PORTRAIT, AspectRatio.LANDSCAPE].map((r) => (
                          <button
                            key={r}
                            onClick={() => setAspectRatio(r)}
                            className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${
                              aspectRatio === r 
                                ? 'bg-black text-white border-black shadow-md' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {r === AspectRatio.SQUARE ? '1:1' : r === AspectRatio.PORTRAIT ? '9:16' : '16:9'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resolution */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Chất lượng</label>
                      <select 
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value as ImageResolution)}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-black focus:border-transparent outline-none font-medium"
                      >
                        <option value={ImageResolution.SD}>Nhanh (SD) - Tối ưu tốc độ</option>
                        <option value={ImageResolution.HD}>Chi tiết (HD) - Cân bằng</option>
                        <option value={ImageResolution.UHD}>Siêu nét (4K) - Tốt nhất</option>
                      </select>
                    </div>

                     {/* Position selector - Only visible in JEWELRY mode */}
                    {mode === AppMode.JEWELRY && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Vị trí đeo</label>
                        <select 
                          value={jewelryPosition}
                          onChange={(e) => setJewelryPosition(e.target.value as JewelryPosition)}
                          className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 focus:ring-2 focus:ring-black focus:border-transparent outline-none font-medium"
                        >
                          <option value={JewelryPosition.HAND}>Cầm tay (Hand)</option>
                          <option value={JewelryPosition.WRIST}>Đeo tay (Wrist)</option>
                          <option value={JewelryPosition.NECK}>Đeo cổ (Neck)</option>
                          <option value={JewelryPosition.EAR}>Đeo tai (Ear)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex flex-col gap-2 items-start text-red-600 bg-red-50 p-4 rounded-xl text-sm border border-red-100">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-medium">{error}</p>
                      </div>
                      {error.includes("Quota") && (
                        <button 
                          onClick={() => setIsSettingsOpen(true)}
                          className="mt-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                        >
                          Đổi API Key Khác →
                        </button>
                      )}
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !productImage || !personImage}
                    className={`
                      w-full py-4 rounded-xl font-bold text-lg shadow-xl transform transition-all duration-200 mt-4
                      flex items-center justify-center gap-3 border border-transparent
                      ${isLoading || !productImage || !personImage 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border-gray-200' 
                        : 'bg-gradient-to-br from-gray-900 to-black text-white hover:scale-[1.02] hover:shadow-2xl hover:ring-2 hover:ring-offset-2 hover:ring-black'
                      }
                    `}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 text-[#D4AF37]" />
                        HOÀN TẤT & TẠO ẢNH
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT: Canvas / Result */}
              <div className="flex-1 min-h-[500px] bg-white rounded-3xl shadow-xl border border-gray-200 p-4 relative overflow-hidden flex flex-col group">
                 {/* Top Bar inside Canvas */}
                 <div className="absolute top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur border-b border-gray-100 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-400"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                       <div className="w-3 h-3 rounded-full bg-green-400"></div>
                       <span className="ml-3 text-xs font-mono text-gray-400">OUTPUT_CANVAS_V3.0</span>
                    </div>
                    {generatedImage && (
                       <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded">
                         {resolution.split(' ')[0]} / {mode}
                       </span>
                    )}
                 </div>

                <div className="flex-1 rounded-2xl bg-[#F8F9FA] mt-12 flex items-center justify-center relative overflow-hidden border border-gray-100">
                  <div className="absolute inset-0 pattern-grid opacity-[0.03] pointer-events-none"></div>
                  
                  {generatedImage ? (
                    <img 
                      src={generatedImage} 
                      alt="Generated Try-On" 
                      className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-700"
                    />
                  ) : (
                    <div className="text-center p-8 relative z-0">
                      <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                        {isLoading ? (
                          <div className="relative">
                            <div className="w-20 h-20 border-[6px] border-gray-100 border-t-[#D4AF37] rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="opacity-10 grayscale">
                            {mode === AppMode.JEWELRY ? <Sparkles className="w-16 h-16" /> : <ScanEye className="w-16 h-16" />}
                          </div>
                        )}
                      </div>
                      <h3 className="text-3xl font-serif font-medium text-gray-900 mb-3 tracking-tight">
                        {isLoading ? "AI đang May đo..." : "Canvas Trống"}
                      </h3>
                      <p className="text-gray-400 text-base max-w-sm mx-auto font-light">
                        {isLoading 
                          ? "Hệ thống đang tính toán ánh sáng và vật lý..." 
                          : "Vui lòng tải lên ảnh và nhấn nút tạo để xem kết quả."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Controls Overlay */}
                {generatedImage && (
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-2 rounded-2xl shadow-2xl flex items-center gap-2 pointer-events-auto transform hover:scale-105 transition-transform duration-300">
                       <button 
                        onClick={() => switchView(AppView.PROMPT_GEN)}
                        className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
                      >
                        <MonitorPlay className="w-5 h-5" />
                        Tạo Video Prompt
                      </button>
                      <div className="w-px h-8 bg-gray-200 mx-1"></div>
                      <button 
                        onClick={downloadImage}
                        className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
                        title="Tải ảnh về"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === AppView.PROMPT_GEN && (
           <PromptGenerator 
             apiKey={apiKey}
             mode={mode}
             generatedImage={generatedImage}
             prompts={videoPrompts}
             setPrompts={setVideoPrompts}
             onBack={() => switchView(AppView.TRY_ON)}
             onOpenSettings={() => setIsSettingsOpen(true)}
           />
        )}
      </main>
    </div>
  );
};

export default App;