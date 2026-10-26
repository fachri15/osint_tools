import React, { useState, useEffect } from 'react';
import { authApi } from '../services/api';

export function AdminAuthModal({ isOpen, onClose }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'totp'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [totp, setTotp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(authApi.getCurrentUser());

  useEffect(() => {
    if (isOpen) {
      setCurrentUser(authApi.getCurrentUser());
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTotpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newTotp = [...totp];
    newTotp[index] = value;
    setTotp(newTotp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`totp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    setErrorMessage('');

    try {
      const res = await authApi.login(username, password);
      setCurrentUser(res.user);
      setIsVerifying(false);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setIsVerifying(false);
      setErrorMessage(err.message || 'Login gagal. Periksa username dan password.');
    }
  };

  const handleVerify2fa = async () => {
    const code = totp.join('');
    if (code.length !== 6) {
      setErrorMessage('Harap masukkan 6 digit token 2FA lengkap.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      await authApi.verify2fa(code);
      setIsVerifying(false);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setIsVerifying(false);
      setErrorMessage(err.message || 'Verifikasi 2FA gagal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full shadow-2xl border border-outline-variant/40 overflow-hidden">
        {/* Modal Top Banner */}
        <div className="p-6 bg-gradient-to-br from-[#002c98] to-[#2445b5] text-white flex flex-col items-center text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg mb-3">
            <span className="material-symbols-outlined text-[32px] text-white">verified_user</span>
          </div>
          
          <h2 className="text-lg font-bold">Autentikasi Internal Admin OSINT</h2>
          <span className="text-xs text-white/80 font-mono mt-0.5">
            ZERO-TRUST ENCLAVE • PRO-JUSTITIA LEVEL
          </span>

          {/* Mode Switcher */}
          <div className="flex gap-2 mt-4 bg-white/10 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                authMode === 'login' ? 'bg-white text-primary shadow' : 'text-white/80 hover:text-white'
              }`}
            >
              Login Kredensial
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('totp'); setErrorMessage(''); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                authMode === 'totp' ? 'bg-white text-primary shadow' : 'text-white/80 hover:text-white'
              }`}
            >
              Token 2FA Authenticator
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {authSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <span className="material-symbols-outlined text-tertiary-container text-[48px] animate-bounce">
                check_circle
              </span>
              <h3 className="font-bold text-on-surface text-base">Autentikasi Berhasil!</h3>
              <p className="text-xs text-on-surface-variant">Sesi analis diperpanjang dan token JWT aktif selama 8 jam.</p>
            </div>
          ) : (
            <>
              {/* Analyst Profile Pill */}
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-outline-variant/30 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                    {currentUser ? currentUser.username.slice(0, 2).toUpperCase() : 'AU'}
                  </div>
                  <div>
                    <span className="font-bold text-on-surface block">
                      {currentUser?.fullName || 'Administrator Utama'}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {currentUser?.nip || 'ANL-7709-ID'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                  {currentUser ? 'LOGGED IN' : 'SESSION REQUIRED'}
                </span>
              </div>

              {authMode === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Username Admin
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username admin..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-surface-container-low border border-outline-variant/50 focus:border-primary-container focus:bg-surface-container-lowest focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password admin..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-surface-container-low border border-outline-variant/50 focus:border-primary-container focus:bg-surface-container-lowest focus:outline-none transition-all"
                    />
                    <span className="text-[10px] text-on-surface-variant mt-1 block">
                      Default: <code>admin</code> / <code>admin123</code> (Enkripsi SHA-256 + Salt)
                    </span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2 rounded-xl border border-outline-variant/50 text-xs font-semibold hover:bg-surface-container-low transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="flex-1 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">lock_open</span>
                          <span>Masuk Sistem</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* 2FA Input */
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-on-surface">Kode Token 2FA Authenticator</span>
                    <span className="text-primary text-[11px] hover:underline cursor-pointer">Kirim via YubiKey</span>
                  </div>
                  
                  <div className="flex justify-between gap-2">
                    {totp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`totp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleTotpChange(idx, e.target.value)}
                        placeholder="•"
                        className="w-12 h-12 text-center text-lg font-mono font-bold rounded-xl bg-surface-container-low border border-outline-variant/50 focus:border-primary-container focus:bg-surface-container-lowest focus:outline-none transition-all"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-on-surface-variant block text-center">
                    Masukkan 6 digit kode dari Google Authenticator (contoh: 123456)
                  </span>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2 rounded-xl border border-outline-variant/50 text-xs font-semibold hover:bg-surface-container-low transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleVerify2fa}
                      disabled={isVerifying}
                      className="flex-1 py-2 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">verified</span>
                          <span>Konfirmasi 2FA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
