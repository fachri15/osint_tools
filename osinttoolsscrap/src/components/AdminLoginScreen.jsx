import React, { useState } from 'react';
import { authApi } from '../services/api';

export function AdminLoginScreen({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('password'); // 'password' or '2fa'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [totp, setTotp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan Password wajib diisi!');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.login(username.trim(), password.trim());
      setIsLoading(false);
      onLoginSuccess(res.user);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Login gagal. Periksa username dan password.');
    }
  };

  const handleTotpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newTotp = [...totp];
    newTotp[index] = value;
    setTotp(newTotp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`login-totp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handle2faLogin = async (e) => {
    e.preventDefault();
    const code = totp.join('');
    if (code.length !== 6) {
      setErrorMsg('Harap masukkan 6 digit token 2FA lengkap.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // Login admin default dahulu jika belum ada token
      const res = await authApi.login('admin', 'admin123');
      await authApi.verify2fa(code);
      setIsLoading(false);
      onLoginSuccess(res.user);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Verifikasi token 2FA gagal.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden select-none">
      {/* Background Cyber Glow & Grid Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-md w-full bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden backdrop-blur-xl">
        {/* Top Header Banner */}
        <div className="p-8 bg-gradient-to-br from-[#002c98] via-[#1a3fa8] to-[#0b1d5c] text-white text-center relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-4">
            <span className="material-symbols-outlined text-[36px] text-white">verified_user</span>
          </div>

          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono tracking-widest uppercase font-bold text-white/90 mb-2">
            ZERO-TRUST ENCLAVE • PRO-JUSTITIA LEVEL
          </span>

          <h1 className="text-xl font-bold tracking-tight">Menyalahati Cyber Intelligence</h1>
          <p className="text-xs text-white/80 mt-1 max-w-xs leading-relaxed">
            Sistem Forensik Intelijen Siber, Penanggulangan Doxing & Anti-Pinjol Ilegal
          </p>

          {/* Mode Selector */}
          <div className="flex gap-2 mt-5 bg-black/20 p-1 rounded-xl text-xs w-full max-w-xs">
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                authMode === 'password'
                  ? 'bg-white text-primary shadow-sm font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Kata Sandi Admin
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('2fa'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                authMode === '2fa'
                  ? 'bg-white text-primary shadow-sm font-bold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Token 2FA / TOTP
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-7 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2.5 animate-fadeIn">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span className="leading-tight">{errorMsg}</span>
            </div>
          )}

          {authMode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Username Analis / Admin
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username admin..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-surface-container-low border border-outline-variant/50 focus:border-primary-container focus:bg-surface-container-lowest focus:outline-none transition-all text-on-surface"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Password Administrator
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-surface-container-low border border-outline-variant/50 focus:border-primary-container focus:bg-surface-container-lowest focus:outline-none transition-all text-on-surface"
                    required
                  />
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[11px] text-on-surface-variant">
                  <span>Enkripsi Database: SHA-256 + Salt</span>
                  <span className="text-primary font-mono font-semibold">Default: admin123</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                      <span>Mengotentikasi ke MySQL...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      <span>Masuk ke Pusat Operasi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handle2faLogin} className="space-y-4">
              <div className="space-y-2 text-center">
                <span className="text-xs font-semibold text-on-surface block">
                  Kode Token 2FA Authenticator
                </span>
                <p className="text-[11px] text-on-surface-variant">
                  Buka aplikasi Authenticator Anda dan masukkan 6 digit token verifikasi.
                </p>

                <div className="flex justify-center gap-2 pt-2">
                  {totp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`login-totp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleTotpChange(idx, e.target.value)}
                      placeholder="•"
                      className="w-11 h-12 text-center text-lg font-mono font-bold rounded-xl bg-surface-container-low border border-outline-variant/50 focus:border-primary-container focus:bg-surface-container-lowest focus:outline-none transition-all"
                    />
                  ))}
                </div>
                <span className="text-[10px] text-on-surface-variant block mt-1">
                  Simulator 2FA: Masukkan sembarang 6 angka (misal: <code>123456</code>)
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                      <span>Memverifikasi 2FA...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Konfirmasi 2FA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Security Protocols Bar */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-[11px] text-on-surface-variant space-y-1.5">
            <div className="flex items-center gap-2 text-tertiary-container font-semibold">
              <span className="material-symbols-outlined text-[15px]">lock</span>
              <span>Protokol Enkripsi: AES-256 GCM & JWT Terotentikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-secondary">database</span>
              <span>Database Terhubung: MySQL Server (Database <code>osint_tools</code>)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
