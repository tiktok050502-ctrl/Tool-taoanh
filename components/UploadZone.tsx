import React, { useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  label: string;
  subLabel?: string;
  image: string | null;
  onUpload: (base64: string) => void;
  onClear: () => void;
  heightClass?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  label,
  subLabel,
  image,
  onUpload,
  onClear,
  heightClass = "h-40"
}) => {

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onUpload]);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
      </div>
      
      {!image ? (
        <div 
          className={`relative border border-dashed border-gray-300 hover:border-black/50 hover:bg-gray-50 rounded-xl bg-white transition-all duration-300 ease-in-out group cursor-pointer flex flex-col items-center justify-center text-center p-4 ${heightClass}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
           <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
          />
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-white group-hover:shadow-sm transition-all border border-gray-100">
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-black" />
          </div>
          <p className="text-gray-900 font-semibold text-xs">Tải ảnh lên</p>
          {subLabel && <p className="text-[10px] text-gray-400 mt-0.5">{subLabel}</p>}
        </div>
      ) : (
        <div className={`relative rounded-xl overflow-hidden shadow-sm group border border-gray-200 ${heightClass}`}>
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
          <img 
            src={image} 
            alt="Uploaded preview" 
            className="w-full h-full object-cover relative z-0"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10 backdrop-blur-[1px]">
             <button 
              onClick={onClear}
              className="bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Xóa
            </button>
             <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                 <button className="bg-white/20 text-white border border-white/50 px-3 py-1.5 rounded-lg text-xs font-bold pointer-events-none backdrop-blur-md">
                   Thay đổi
                 </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};