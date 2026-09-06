import React, { useState } from 'react';
import { X, UserPlus, Shield, Users, Trash2, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { state, updateUsers, userRole, setUserRole, currentUser } = useAppContext();
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  if (!isOpen) return null;

  const admins = state.admins || ['kirklareliataturkortaokulu@gmail.com'];
  const teachers = state.teachers || [];

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newTeacherEmail.trim().toLowerCase();
    if (email && !teachers.includes(email) && !admins.includes(email)) {
      updateUsers(admins, [...teachers, email]);
      setNewTeacherEmail('');
    }
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (email && !admins.includes(email)) {
      updateUsers([...admins, email], teachers.filter(t => t !== email));
      setNewAdminEmail('');
    }
  };

  const handleRemoveTeacher = (email: string) => {
    updateUsers(admins, teachers.filter(t => t !== email));
  };

  const handleRemoveAdmin = (email: string) => {
    if (email === 'kirklareliataturkortaokulu@gmail.com') return; // Cannot remove super admin
    updateUsers(admins.filter(a => a !== email), teachers);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div 
        className="bg-white rounded-t-[28px] sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-[#e6e2d3] flex flex-col animate-slide-up sm:animate-none pb-safe sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e6e2d3] bg-[#fcfbf7] rounded-t-[28px] sm:rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B08D57]/15 flex items-center justify-center text-[#B08D57]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-[#5a5a40]">Kullanıcı & Yetki Yönetimi</h2>
              <p className="text-[11px] text-[#8e8d82]">Sistem rollerini ve erişim yetkilerini yönetin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#8e8d82] hover:bg-[#e6e2d3] rounded-full transition-colors active:scale-95 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {/* Active Role Switcher */}
          <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#e6e2d3]">
            <span className="text-xs font-bold text-[#5a5a40] uppercase tracking-wider block mb-2">
              Aktif Çalışma Modu (Rol Değiştir)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUserRole('admin')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                  userRole === 'admin'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                {userRole === 'admin' && <CheckCircle2 className="w-3.5 h-3.5" />}
                Yönetici Modu (Tam Yetki)
              </button>
              <button
                type="button"
                onClick={() => setUserRole('teacher')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                  userRole === 'teacher'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <Users className="w-4 h-4" />
                {userRole === 'teacher' && <CheckCircle2 className="w-3.5 h-3.5" />}
                Öğretmen Modu (Görüntüleme)
              </button>
            </div>
          </div>

          {/* Admins Section */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#5a5a40] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> İdareciler (Tam Yetki)
            </h3>
            <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="email"
                required
                placeholder="İdareci E-posta Adresi"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white border border-[#e6e2d3] rounded-xl text-sm focus:outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]"
              />
              <button type="submit" className="px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer">
                <UserPlus className="w-4 h-4" /> Ekle
              </button>
            </form>
            <div className="space-y-2">
              {admins.map(email => (
                <div key={email} className="flex items-center justify-between p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-xs sm:text-sm font-medium text-emerald-800 truncate mr-2">
                    {email} {email === 'kirklareliataturkortaokulu@gmail.com' && '(Süper Admin)'}
                  </span>
                  {email !== 'kirklareliataturkortaokulu@gmail.com' && (
                    <button onClick={() => handleRemoveAdmin(email)} className="text-red-500 p-1.5 hover:bg-red-50 active:scale-90 rounded-lg transition-all cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#e6e2d3] w-full"></div>

          {/* Teachers Section */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#5a5a40] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Öğretmenler (Görüntüleme Yetkisi)
            </h3>
            <form onSubmit={handleAddTeacher} className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="email"
                required
                placeholder="Öğretmen E-posta Adresi"
                value={newTeacherEmail}
                onChange={(e) => setNewTeacherEmail(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white border border-[#e6e2d3] rounded-xl text-sm focus:outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]"
              />
              <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer">
                <UserPlus className="w-4 h-4" /> Ekle
              </button>
            </form>
            <div className="space-y-2">
              {teachers.map(email => (
                <div key={email} className="flex items-center justify-between p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                  <span className="text-xs sm:text-sm font-medium text-blue-800 truncate mr-2">{email}</span>
                  <button onClick={() => handleRemoveTeacher(email)} className="text-red-500 p-1.5 hover:bg-red-50 active:scale-90 rounded-lg transition-all cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {teachers.length === 0 && (
                <p className="text-xs text-[#8e8d82] text-center py-4 bg-gray-50 rounded-xl border border-dashed border-[#e6e2d3]">Henüz eklenmiş öğretmen bulunmuyor.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
