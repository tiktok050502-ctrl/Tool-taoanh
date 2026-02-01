import React, { useState } from 'react';
import { X, Save, CheckCircle2, AlertCircle, Loader2, Key, AlertTriangle } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  apiKey: initialKey, 
  onSave 
}) => {
  const [keyInput, setKeyInput] = useState(initialKey);
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid' | 'warning'>('idle');

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!keyInput.trim()) {
      setStatus('invalid');
      return;
    }

    setIsValidating(true);
    setStatus('idle');

    // Regex check for Google API Key format (starts with AIza)
    const looksLikeKey = keyInput.trim().startsWith('AIza');
    
    try {
      const isValid = await validateApiKey(keyInput.trim());
      
      if (isValid) {
        setStatus('valid');
        onSave(keyInput.trim());
        setTimeout(() => onClose(), 1000);
      } else {
        if (looksLikeKey) {
          // If it looks like a key but failed validation (maybe network error or quota), allow "Force Save"
          setStatus('warning');
        } else {
          setStatus('invalid');
        }
      }
    } catch (e) {
      // In case of any unexpected sync/async error
      setStatus('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  const handleForceSave = () => {
    onSave(keyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Key className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Cài đặt API Key</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Google AI Studio API Key
            </label>
            <input 
              type="password"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setStatus('idle');
              }}
              placeholder="Dán mã API Key của bạn vào đây..."
              className={`w-full p-3 border rounded-xl outline-none transition-all ${
                status === 'invalid' 
                  ? 'border-red-300 focus:border-red-500 bg-red-50' 
                  : status === 'valid'
                  ? 'border-green-300 focus:border-green-500 bg-green-50'
                  : status === 'warning'
                  ? 'border-yellow-300 focus:border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 focus:border-black focus:ring-1 focus:ring-black'
              }`}
            />
            <p className="text-xs text-gray-500">
              Nhập API Key từ Google AI Studio để sử dụng. 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-600 hover:underline ml-1">Lấy Key tại đây</a>.
            </p>
          </div>

          {status === 'invalid' && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Key không hợp lệ hoặc sai định dạng.
              </span>
            </div>
          )}

          {status === 'warning' && (
            <div className="flex flex-col gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
              <div className="flex items-start gap-2 text-sm text-yellow-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Không thể xác thực Key (Có thể do lỗi mạng hoặc quyền truy cập), nhưng định dạng Key có vẻ đúng.
                </span>
              </div>
              <button 
                onClick={handleForceSave}
                className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold py-1.5 px-3 rounded-lg self-end transition-colors"
              >
                Vẫn lưu và tiếp tục →
              </button>
            </div>
          )}

          {status === 'valid' && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              API Key hợp lệ! Đã lưu thành công.
            </div>
          )}

          {status !== 'warning' && (
            <button
              onClick={handleSave}
              disabled={isValidating || !keyInput}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                status === 'valid'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-900 hover:bg-black text-white'
              }`}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : status === 'valid' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Đã lưu
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Lưu và kiểm tra
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};