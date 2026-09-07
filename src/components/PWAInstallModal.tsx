import React from 'react';
import { Smartphone, Monitor, Download, CheckCircle2, Share, PlusSquare, X, ShieldCheck, Zap, HardDriveDownload } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstalled, isIOS, canPromptDirectly, installPWA } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const installed = await installPWA();
    if (installed) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <HardDriveDownload className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Uygulama Olarak Yükle
                <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono font-semibold">
                  PWA Desteği
                </span>
              </h3>
              <p className="text-xs text-slate-400">Masaüstü bilgisayarınıza veya mobil cihazınıza kurun</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {isInstalled ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">Uygulama Zaten Yüklü!</h4>
                <p className="text-xs text-emerald-200/80">AkademiPanel şu an cihazınızda tam ekran uygulama modunda çalışıyor.</p>
              </div>
            </div>
          ) : canPromptDirectly ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Tek Tıkla Doğrudan Kurulum</h4>
                    <p className="text-xs text-slate-400">Tarayıcı çubuğu olmadan masaüstü veya ana ekrandan doğrudan başlatın.</p>
                  </div>
                </div>

                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Şimdi Cihaza Yükle</span>
                </button>
              </div>
            </div>
          ) : isIOS ? (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs text-slate-300">
              <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                <Smartphone className="w-4 h-4" /> iOS (iPhone & iPad) Kurulum Adımları
              </h4>
              <ol className="space-y-2 list-decimal list-inside text-slate-300">
                <li className="leading-relaxed">
                  Safari alt menüsündeki <span className="inline-flex items-center gap-1 font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"><Share className="w-3.5 h-3.5 text-sky-400 inline" /> Paylaş</span> butonuna dokunun.
                </li>
                <li className="leading-relaxed">
                  Açılan menüde aşağı kaydırarak <span className="inline-flex items-center gap-1 font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Ana Ekrana Ekle</span> seçeneğini tıklayın.
                </li>
                <li className="leading-relaxed">
                  Sağ üstteki <strong>Ekle</strong> butonuna basarak kurulumu tamamlayın.
                </li>
              </ol>
            </div>
          ) : (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <p className="text-xs text-slate-300">
                Tarayıcınızın adres çubuğundaki <strong>"Yükle"</strong> veya <strong>"Uygulamayı Ekle"</strong> simgesini tıklayarak AkademiPanel'i bilgisayarınıza veya telefonunuza yükleyebilirsiniz.
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                <Monitor className="w-4 h-4 text-sky-400" />
                <span>Yükleme İstemi Gönder</span>
              </button>
            </div>
          )}

          {/* Features list */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Anında Açılış
              </span>
              <p className="text-[11px] text-slate-400">Tarayıcı sekmesi olmadan masaüstünden hızlı erişim.</p>
            </div>

            <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl space-y-1">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Çevrimdışı Çalışma
              </span>
              <p className="text-[11px] text-slate-400">İnternet kesildiğinde yerel veri koruması.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>AkademiPanel Progressive Web App</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
