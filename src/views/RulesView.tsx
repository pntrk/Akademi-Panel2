import React from 'react';
import { Info, Crown, TrendingUp, Shield, HelpCircle, Target } from 'lucide-react';

export default function RulesView() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#e6e2d3] rounded-[32px] p-8 shadow-sm">
        <div className="mb-8">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Takım Kriterleri (Ortalama Puan)</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
              <span className="w-4 h-4 rounded-full bg-amber-500 shadow-sm"></span>
              <span className="text-sm text-gray-700"><strong>Kutup Yıldızları:</strong> 400+ Puan</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
              <span className="w-4 h-4 rounded-full bg-blue-500 shadow-sm"></span>
              <span className="text-sm text-gray-700"><strong>Sıçrama Ustaları:</strong> 300 - 399 Puan</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
              <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm"></span>
              <span className="text-sm text-gray-700"><strong>Taktik Avcıları:</strong> 0 - 299 Puan</span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Temel Rozetler</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1.5 rounded-lg">🛡️ Kalkan</span>
                <span className="text-amber-600 font-black text-sm">+20 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Sınavda toplam boş sayısı, yanlış sayısından fazla ise.</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1.5 rounded-lg">👑 Zirve</span>
                  <span className="text-purple-600 font-black text-sm">+15 LP</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">Sınav sonucu 400 puan ve üzerinde ise.</p>
              </div>
              <p className="text-[10px] text-gray-500 italic mt-3 bg-white/50 p-1.5 rounded">Kısıtlı: Bu rozet Kutup Yıldızları için devre dışıdır.</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1.5 rounded-lg">🚀 İvme</span>
                <span className="text-blue-600 font-black text-sm">+15 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Sınav sonucu bir önceki ortalamadan yüksek ise.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1.5 rounded-lg">🎯 Tam İsabet</span>
                <span className="text-emerald-600 font-black text-sm">+10 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Bir derste hiç yanlış yapmadan doğru yapıldığında.</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1.5 rounded-lg">🟥 Kırmızı Kart</span>
                  <span className="text-red-600 font-black text-sm">-15 LP</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">Toplamda 15 ve üzeri yanlış yapanlar.</p>
              </div>
              <p className="text-[10px] text-gray-500 italic mt-3 bg-white/50 p-1.5 rounded">Kısıtlı: Sadece Kutup Yıldızları için geçerlidir.</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Takıma Özel Rozetler</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kutup Yıldızları */}
            <div className="bg-amber-50/50 border-2 border-amber-200 rounded-2xl p-5">
              <h5 className="text-amber-800 font-bold text-sm mb-4 flex items-center"><Crown className="w-4 h-4 mr-2" /> Kutup Yıldızları Hedefleri</h5>
              <div className="space-y-3">
                <div className="bg-white border border-amber-100 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-lg">📜 Sözel Şövalyesi</span>
                    <span className="text-amber-600 font-black text-sm">+15 LP</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-tight font-medium">İnkılap, Din ve İngilizce'de sıfır yanlış.</p>
                </div>
                <div className="bg-white border border-amber-100 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-lg">🏰 Sayısal Kalesi</span>
                    <span className="text-amber-600 font-black text-sm">+20 LP</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-tight font-medium">Matematik ve Fen'de toplam en fazla 2 yanlış.</p>
                </div>
              </div>
            </div>
            {/* Sıçrama Ustaları */}
            <div className="bg-blue-50/50 border-2 border-blue-200 rounded-2xl p-5">
              <h5 className="text-blue-800 font-bold text-sm mb-4 flex items-center"><TrendingUp className="w-4 h-4 mr-2" /> Sıçrama Ustaları Hedefleri</h5>
              <div className="space-y-3">
                <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-lg">💡 Matematik Uyanışı</span>
                    <span className="text-blue-600 font-black text-sm">+20 LP</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-tight font-medium">Matematik netinin 10 ve üzeri olması.</p>
                </div>
                <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-lg">⚖️ Denge Cambazı</span>
                    <span className="text-blue-600 font-black text-sm">+15 LP</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-tight font-medium">Türkçe ve Fen netlerinin 15+ olması.</p>
                </div>
              </div>
            </div>
            {/* Taktik Avcıları */}
            <div className="bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl p-5">
              <h5 className="text-emerald-800 font-bold text-sm mb-4 flex items-center"><Shield className="w-4 h-4 mr-2" /> Taktik Avcıları Hedefleri</h5>
              <div className="space-y-3">
                <div className="bg-white border border-emerald-100 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-lg">🎯 Keskin Nişancı</span>
                    <span className="text-emerald-600 font-black text-sm">+20 LP</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-tight font-medium">Doğru oranının %70 veya üzeri olması.</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-xl p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-lg">🧱 Temel Atıcı</span>
                    <span className="text-emerald-600 font-black text-sm">+15 LP</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-tight font-medium">Hiç eksi net olmaması, İnk/Din 8+ olması.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Uzmanlık Rozetleri (Seri Başarı)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold px-2 py-1.5 rounded-lg">🏰 Zirve Bekçisi</span>
                <span className="text-fuchsia-600 font-black text-sm">+30 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">İstikrarlı başarı (3 Sınavda 400+ puan).</p>
            </div>
            <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-cyan-100 text-cyan-800 text-xs font-bold px-2 py-1.5 rounded-lg">⚡ İvme Şampiyonu</span>
                <span className="text-cyan-600 font-black text-sm">+30 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Yükselen grafik (3 Sınavda +5 puan artış).</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1.5 rounded-lg">🔨 Baraj Yıkıcı</span>
                <span className="text-orange-600 font-black text-sm">+30 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Matematik uzmanı (3 Sınavda 10+ net).</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1.5 rounded-lg">🧠 Strateji Mh.</span>
                <span className="text-indigo-600 font-black text-sm">+40 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Akıllı test yönetimi (4 Sınavda Boş &gt; Yanlış).</p>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-1.5 rounded-lg">🕊️ İstikrar Elçisi</span>
                <span className="text-teal-600 font-black text-sm">+50 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Kusursuz dikkat (5 Sınavda 0 Kırmızı Kart).</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Efsanevi Rozetler (Nadir Başarılar)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-300 rounded-2xl p-4 shadow-lg hover:shadow-amber-500/30 transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow shadow-amber-500/50 text-xs font-extrabold px-3 py-1.5 rounded-lg">🏆 LGS Fatihi</span>
                <span className="text-amber-700 font-black text-sm animate-pulse">+200 LP</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed font-bold">Bir sınavda tüm derslerde tam net (yanlışsız ve boşsuz).</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-300 rounded-2xl p-4 shadow-lg hover:shadow-amber-500/30 transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow shadow-amber-500/50 text-xs font-extrabold px-3 py-1.5 rounded-lg">🤝 Takım Ruhu</span>
                <span className="text-amber-700 font-black text-sm animate-pulse">+50 LP</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed font-bold">Takımın haftalık deneme sınavına %100 katılım göstermesi.</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-300 rounded-2xl p-4 shadow-lg hover:shadow-amber-500/30 transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow shadow-amber-500/50 text-xs font-extrabold px-3 py-1.5 rounded-lg">🔥 Anka Kuşu</span>
                <span className="text-amber-700 font-black text-sm animate-pulse">+300 LP</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed font-bold">Taktik Avcıları'ndan Sıçrama Ustaları veya Kutup Yıldızları'na transfer.</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">GİZEMLİ ROZETLER (SÜRPRİZ BAŞARIMLAR)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-indigo-500/50 rounded-2xl p-4 shadow-lg shadow-indigo-900/20">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold px-3 py-1.5 rounded-lg">🏔️ Uyuyan Dev</span>
                <span className="text-indigo-400 font-black text-sm">+50 LP</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">Bir önceki sınavına göre puanını 40 ve üzeri artırmak.</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-lg shadow-emerald-900/20">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1.5 rounded-lg">🗿 Sabır Taşı</span>
                <span className="text-emerald-400 font-black text-sm">+40 LP</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">Sınav geneli toplam 15 ve üzeri boş bırakıp, hiç yanlış yapmamak.</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500/50 rounded-2xl p-4 shadow-lg shadow-purple-900/20">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold px-3 py-1.5 rounded-lg">☯️ Yin Yang</span>
                <span className="text-purple-400 font-black text-sm">+30 LP</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">Türkçe ve Matematik netinin eşit ve Matematik netinin en az 10 olması.</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">BRANŞ EFSANELERİ (TAM NET)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-lg">📚 Filozof</span>
                <span className="text-rose-600 font-black text-sm">+30 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Türkçe dersinde 20 doğru, 0 yanlış yapmak.</p>
            </div>
            
            <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1.5 rounded-lg">🔭 Newton</span>
                <span className="text-sky-600 font-black text-sm">+30 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Fen dersinde 20 doğru, 0 yanlış yapmak.</p>
            </div>
            
            <div className="bg-gradient-to-br from-lime-50 to-green-50 border-2 border-lime-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-lime-100 text-lime-800 text-xs font-bold px-3 py-1.5 rounded-lg">📐 Pisagor</span>
                <span className="text-lime-600 font-black text-sm">+50 LP</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">Matematik dersinde 20 doğru, 0 yanlış yapmak.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
