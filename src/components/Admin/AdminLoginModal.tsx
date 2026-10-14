import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/auth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'approved' | 'mismatch'>('idle');
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Always reset fields and status on open / start fresh with visible password typing
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setStatus('idle');
      setShowPassword(true);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setStatus('idle');

    const res = await authService.login(password);

    if (res.success && res.message === 'approved') {
      setStatus('approved');
      setLoading(false);
      setPassword('');
      setStatus('idle');
      onSuccess();
    } else {
      setStatus('mismatch');
      setLoading(false);
      inputRef.current?.select();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5C4D40]/30 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#FDFCF9] border border-[#EADBBD] shadow-2xl overflow-hidden rounded-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#F5EACB] border-b border-[#EADBBD] text-[#5A4112]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#88641C]" />
            <h3 className="font-serif text-base font-bold tracking-wide">
              Admin Access
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7E5C1E] hover:text-[#44331C] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: Displays ONLY the password text field and status */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status feedback */}
          {status === 'approved' && (
            <div className="py-2.5 px-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2 rounded-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>approved</span>
            </div>
          )}

          {status === 'mismatch' && (
            <div className="py-2.5 px-3 bg-amber-50 border border-amber-300 text-[#8A241C] text-sm font-bold flex items-center justify-center gap-2 rounded-xs">
              <AlertCircle className="w-4 h-4 text-[#8A241C]" />
              <span>Password mismatch</span>
            </div>
          )}

          {/* Only the text field */}
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              placeholder="Enter admin password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              className="w-full bg-[#FAF6EE] border border-[#DECFA9] px-3.5 py-2.5 pr-10 text-sm font-sans text-[#44331C] font-medium focus:outline-none focus:border-[#7E5C1E] rounded-xs placeholder:text-[#9E8A72]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#88641C] hover:text-[#5A4112] transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Submit action */}
          <button
            type="submit"
            disabled={loading || status === 'approved'}
            className="w-full py-2.5 bg-[#7E5C1E] text-[#FAF6EE] hover:bg-[#684A14] transition-all text-xs font-sans font-bold tracking-[0.18em] uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-70 rounded-xs"
          >
            <span>{loading ? 'Verifying...' : status === 'approved' ? 'approved' : 'Submit'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
