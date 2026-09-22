import React from 'react';
import { Crown, TrendingUp, Shield, Sparkles, BookOpen, Award, Target, Flame, Compass } from 'lucide-react';

export default function RulesView() {
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-white border border-brand-border/80 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xs space-y-8">
        
        {/* Header summary */}
        <div className="border-b border-brand-border/60 pb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-brand-ink">
              Akademi Arena Kılavuzu & Lig Kuralları
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-brand-ink/60">
            Öğrencilerin sınav netleri ve gelişim hızlarına göre takım yerleşimleri, lig puanı (LP) hesaplama kuralları ve kazanılabilir rozetler.
          </p>
        </div>

        {/* Takım Kriterleri */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-brand-ink/60" />
            <h4 className="text-xs font-bold text-brand-ink/60 uppercase tracking-wider">Takım Kriterleri (Ortalama Puan Barajları)</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <Crown className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-amber-950">Kutup Yıldızları</p>
                <p className="text-xs font-semibold text-amber-700">400+ Puan Barajı</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/70 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-blue-950">Sıçrama Ustaları</p>
                <p className="text-xs font-semibold text-blue-700">300 – 399 Puan Barajı</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/70 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-emerald-950">Taktik Avcıları</p>
                <p className="text-xs font-semibold text-emerald-700">0 – 299 Puan Barajı</p>
              </div>
            </div>
          </div>
        </div>

        {/* Temel Rozetler */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-brand-ink/60" />
            <h4 className="text-xs font-bold text-brand-ink/60 uppercase tracking-wider">Temel Rozetler (Her Sınavda Kazanılabilir)</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-amber-50/40 border border-amber-200/70 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-1 rounded-lg">🛡️ Kalkan</span>
                  <span className="text-amber-700 font-extrabold text-xs sm:text-sm">+20 LP</span>
                </div>
                <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">Sınavda toplam boş sayısı, yanlış sayısından fazla ise.</p>
              </div>
            </div>

            <div className="bg-purple-50/40 border border-purple-200/70 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-purple-100 text-purple-900 text-xs font-bold px-2 py-1 rounded-lg">👑 Zirve</span>
                  <span className="text-purple-700 font-extrabold text-xs sm:text-sm">+15 LP</span>
                </div>
                <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">Sınav sonucu 400 puan ve üzerinde ise.</p>
              </div>
              <p className="text-[10px] text-purple-700/80 italic mt-2.5 bg-white/80 p-1.5 rounded-lg border border-purple-100">Kutup Yıldızları hariçtir.</p>
            </div>

            <div className="bg-blue-50/40 border border-blue-200/70 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2 py-1 rounded-lg">🚀 İvme</span>
                  <span className="text-blue-700 font-extrabold text-xs sm:text-sm">+15 LP</span>
                </div>
                <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">Sınav sonucu bir önceki ortalamasından yüksek ise.</p>
              </div>
            </div>

            <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-1 rounded-lg">🎯 Tam İsabet</span>
                  <span className="text-emerald-700 font-extrabold text-xs sm:text-sm">+10 LP</span>
                </div>
                <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">Herhangi bir derste sıfır yanlış ve tam doğru yapıldığında.</p>
              </div>
            </div>

            <div className="bg-rose-50/40 border border-rose-200/70 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-rose-100 text-rose-900 text-xs font-bold px-2 py-1 rounded-lg">🟥 Kırmızı Kart</span>
                  <span className="text-rose-700 font-extrabold text-xs sm:text-sm">-15 LP</span>
                </div>
                <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">Toplamda 15 ve üzeri yanlış yapanlar.</p>
              </div>
              <p className="text-[10px] text-rose-700/80 italic mt-2.5 bg-white/80 p-1.5 rounded-lg border border-rose-100">Sadece Kutup Yıldızları için geçerlidir.</p>
            </div>
          </div>
        </div>

        {/* Takıma Özel Rozetler */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-brand-ink/60" />
            <h4 className="text-xs font-bold text-brand-ink/60 uppercase tracking-wider">Takıma Özel Hedef Rozetleri</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kutup Yıldızları */}
            <div className="bg-amber-50/30 border border-amber-200 rounded-2xl p-4 space-y-3">
              <h5 className="text-amber-900 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Kutup Yıldızları Hedefleri</span>
              </h5>
              <div className="space-y-2.5">
                <div className="bg-white border border-amber-100 rounded-xl p-3 shadow-2xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-lg">📜 Sözel Şövalyesi</span>
                    <span className="text-amber-700 font-bold text-xs">+15 LP</span>
                  </div>
                  <p className="text-xs text-brand-ink/70 font-medium">İnkılap, Din ve İngilizce'de sıfır yanlış.</p>
                </div>
                <div className="bg-white border border-amber-100 rounded-xl p-3 shadow-2xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-lg">🏰 Sayısal Kalesi</span>
                    <span className="text-amber-700 font-bold text-xs">+20 LP</span>
                  </div>
                  <p className="text-xs text-brand-ink/70 font-medium">Matematik ve Fen'de toplam en fazla 2 yanlış.</p>
                </div>
              </div>
            </div>

            {/* Sıçrama Ustaları */}
            <div className="bg-blue-50/30 border border-blue-200 rounded-2xl p-4 space-y-3">
              <h5 className="text-blue-900 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Sıçrama Ustaları Hedefleri</span>
              </h5>
              <div className="space-y-2.5">
                <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-2xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2 py-0.5 rounded-lg">💡 Matematik Uyanışı</span>
                    <span className="text-blue-700 font-bold text-xs">+20 LP</span>
                  </div>
                  <p className="text-xs text-brand-ink/70 font-medium">Matematik netinin 10 ve üzeri olması.</p>
                </div>
                <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-2xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2 py-0.5 rounded-lg">⚖️ Denge Cambazı</span>
                    <span className="text-blue-700 font-bold text-xs">+15 LP</span>
                  </div>
                  <p className="text-xs text-brand-ink/70 font-medium">Türkçe ve Fen netlerinin 15+ olması.</p>
                </div>
              </div>
            </div>

            {/* Taktik Avcıları */}
            <div className="bg-emerald-50/30 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <h5 className="text-emerald-900 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Taktik Avcıları Hedefleri</span>
              </h5>
              <div className="space-y-2.5">
                <div className="bg-white border border-emerald-100 rounded-xl p-3 shadow-2xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-lg">🎯 Keskin Nişancı</span>
                    <span className="text-emerald-700 font-bold text-xs">+20 LP</span>
                  </div>
                  <p className="text-xs text-brand-ink/70 font-medium">Doğru oranının %70 veya üzeri olması.</p>
                </div>
                <div className="bg-white border border-emerald-100 rounded-xl p-3 shadow-2xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-lg">🧱 Temel Atıcı</span>
                    <span className="text-emerald-700 font-bold text-xs">+15 LP</span>
                  </div>
                  <p className="text-xs text-brand-ink/70 font-medium">Hiç eksi net olmaması, İnkılap/Din 8+ olması.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Uzmanlık Rozetleri */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-brand-ink/60" />
            <h4 className="text-xs font-bold text-brand-ink/60 uppercase tracking-wider">Uzmanlık Rozetleri (Seri İstikrar)</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-fuchsia-50/40 border border-fuchsia-200/70 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-fuchsia-100 text-fuchsia-900 text-xs font-bold px-2 py-1 rounded-lg">🏰 Zirve Bekçisi</span>
                <span className="text-fuchsia-700 font-bold text-xs">+30 LP</span>
              </div>
              <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">3 sınavda aralıksız 400+ puan elde etme.</p>
            </div>

            <div className="bg-cyan-50/40 border border-cyan-200/70 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-cyan-100 text-cyan-900 text-xs font-bold px-2 py-1 rounded-lg">⚡ İvme Şampiyonu</span>
                <span className="text-cyan-700 font-bold text-xs">+30 LP</span>
              </div>
              <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">3 sınav art arda en az +5 puan artış.</p>
            </div>

            <div className="bg-orange-50/40 border border-orange-200/70 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-orange-100 text-orange-900 text-xs font-bold px-2 py-1 rounded-lg">🔨 Baraj Yıkıcı</span>
                <span className="text-orange-700 font-bold text-xs">+30 LP</span>
              </div>
              <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">Matematikte 3 sınav boyunca 10+ net.</p>
            </div>

            <div className="bg-indigo-50/40 border border-indigo-200/70 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-indigo-100 text-indigo-900 text-xs font-bold px-2 py-1 rounded-lg">🧠 Strateji Mh.</span>
                <span className="text-indigo-700 font-bold text-xs">+40 LP</span>
              </div>
              <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">4 sınavda sürekli Boş &gt; Yanlış kontrolü.</p>
            </div>

            <div className="bg-teal-50/40 border border-teal-200/70 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-teal-100 text-teal-900 text-xs font-bold px-2 py-1 rounded-lg">🕊️ İstikrar Elçisi</span>
                <span className="text-teal-700 font-bold text-xs">+50 LP</span>
              </div>
              <p className="text-xs text-brand-ink/80 leading-relaxed font-medium">5 sınav boyunca 0 Kırmızı Kart disiplini.</p>
            </div>
          </div>
        </div>

        {/* Efsanevi Rozetler */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-brand-ink/60 uppercase tracking-wider">Efsanevi Rozetler (Nadir Başarılar)</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-amber-100/60 border border-amber-300 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-amber-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-2xs">🏆 LGS Fatihi</span>
                <span className="text-amber-800 font-extrabold text-sm">+200 LP</span>
              </div>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">Bir denemede tüm derslerde sıfır boş ve sıfır yanlışla tam net çıkarma.</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-amber-100/60 border border-amber-300 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-amber-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-2xs">🤝 Takım Ruhu</span>
                <span className="text-amber-800 font-extrabold text-sm">+50 LP</span>
              </div>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">Takımın haftalık deneme sınavına %100 tam kadro katılım göstermesi.</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-amber-100/60 border border-amber-300 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-amber-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-2xs">🔥 Anka Kuşu</span>
                <span className="text-amber-800 font-extrabold text-sm">+300 LP</span>
              </div>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">Taktik Avcıları'ndan Sıçrama Ustaları veya Kutup Yıldızları'na lig atlama.</p>
            </div>
          </div>
        </div>

        {/* Branş Efsaneleri */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-brand-ink/60" />
            <h4 className="text-xs font-bold text-brand-ink/60 uppercase tracking-wider">Branş Efsaneleri (Tam Net Başarıları)</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-rose-100 text-rose-900 text-xs font-bold px-2 py-1 rounded-lg">📚 Filozof</span>
                <span className="text-rose-700 font-extrabold text-sm">+30 LP</span>
              </div>
              <p className="text-xs text-brand-ink/80 font-medium leading-relaxed">Türkçe dersinde 20 doğru, 0 yanlış yapmak.</p>
            </div>

            <div className="bg-sky-50/50 border border-sky-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-sky-100 text-sky-900 text-xs font-bold px-2 py-1 rounded-lg">🔭 Newton</span>
                <span className="text-sky-700 font-extrabold text-sm">+30 LP</span>
              </div>
              <p className="text-xs text-brand-ink/80 font-medium leading-relaxed">Fen dersinde 20 doğru, 0 yanlış yapmak.</p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-1 rounded-lg">📐 Pisagor</span>
                <span className="text-emerald-700 font-extrabold text-sm">+50 LP</span>
              </div>
              <p className="text-xs text-brand-ink/80 font-medium leading-relaxed">Matematik dersinde 20 doğru, 0 yanlış yapmak.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
