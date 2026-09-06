import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Users, Trash2, Clock, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { state, updateUsers, userRole } = useAppContext();
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && userRole === 'admin') {
      const q = query(collection(db, 'access_requests'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reqs: any[] = [];
        snapshot.forEach(doc => {
          reqs.push({ id: doc.id, ...doc.data() });
        });
        setRequests(reqs);
      }, (error) => {
        console.warn("Requests onSnapshot notice:", error?.message || error);
      });
      return () => unsubscribe();
    }
  }, [isOpen, userRole]);

  if (!isOpen || userRole !== 'admin') return null;

  const admins = state.admins || [];
  const teachers = state.teachers || [];

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeacherEmail && !teachers.includes(newTeacherEmail) && !admins.includes(newTeacherEmail)) {
      updateUsers(admins, [...teachers, newTeacherEmail]);
      setNewTeacherEmail('');
      deleteDoc(doc(db, 'access_requests', newTeacherEmail)).catch(() => {});
    }
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminEmail && !admins.includes(newAdminEmail)) {
      updateUsers([...admins, newAdminEmail], teachers.filter(t => t !== newAdminEmail));
      setNewAdminEmail('');
      deleteDoc(doc(db, 'access_requests', newAdminEmail)).catch(() => {});
    }
  };

  const handleAcceptRequest = (email: string, role: 'admin' | 'teacher') => {
    if (role === 'admin' && !admins.includes(email)) {
      updateUsers([...admins, email], teachers.filter(t => t !== email));
    } else if (role === 'teacher' && !teachers.includes(email) && !admins.includes(email)) {
      updateUsers(admins, [...teachers, email]);
    }
    deleteDoc(doc(db, 'access_requests', email)).catch(() => {});
  };

  const handleRejectRequest = (email: string) => {
    deleteDoc(doc(db, 'access_requests', email)).catch(() => {});
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
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[#5a5a40]">Kullanıcı Yetkilendirme</h2>
          </div>
          <button onClick={onClose} className="p-2 text-[#8e8d82] hover:bg-[#e6e2d3] rounded-full transition-colors active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 flex-1">
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
              <button type="submit" className="px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm">
                <UserPlus className="w-4 h-4" /> Ekle
              </button>
            </form>
            <div className="space-y-2">
              {admins.map(email => (
                <div key={email} className="flex items-center justify-between p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-xs sm:text-sm font-medium text-emerald-800 truncate mr-2">{email} {email === 'kirklareliataturkortaokulu@gmail.com' && '(Süper Admin)'}</span>
                  {email !== 'kirklareliataturkortaokulu@gmail.com' && (
                    <button onClick={() => handleRemoveAdmin(email)} className="text-red-500 p-1.5 hover:bg-red-50 active:scale-90 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending Requests Section */}          <div className="mb-4">            <h3 className="text-xs sm:text-sm font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">              <Clock className="w-4 h-4" /> Bekleyen Erişim İstekleri (Misafirler)            </h3>            {requests.length > 0 ? (              <div className="space-y-2">                {requests.map(req => (                  <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-amber-50/70 rounded-xl border border-amber-100 gap-3">                    <div className="flex flex-col min-w-0">                      <span className="text-sm font-semibold text-amber-900 truncate">{req.name}</span>                      <span className="text-xs text-amber-700 truncate">{req.email}</span>                    </div>                    <div className="flex items-center gap-2 shrink-0">                      <button onClick={() => handleAcceptRequest(req.email, 'teacher')} className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1" title="Öğretmen Yap">                        <Users className="w-3.5 h-3.5" /> Öğretmen Yap                      </button>                      <button onClick={() => handleAcceptRequest(req.email, 'admin')} className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1" title="İdareci Yap">                        <Shield className="w-3.5 h-3.5" /> İdareci Yap                      </button>                      <button onClick={() => handleRejectRequest(req.email)} className="px-2 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors" title="İsteği Sil">                        <Trash2 className="w-4 h-4" />                      </button>                    </div>                  </div>                ))}              </div>            ) : (              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 text-center text-amber-700/70 text-xs font-medium">                Şu an bekleyen yeni bir onay isteği bulunmuyor.<br/>Yeni bir kullanıcı giriş yaptığında burada listelenecektir.              </div>            )}          </div>

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
              <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm">
                <UserPlus className="w-4 h-4" /> Ekle
              </button>
            </form>
            <div className="space-y-2">
              {teachers.map(email => (
                <div key={email} className="flex items-center justify-between p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                  <span className="text-xs sm:text-sm font-medium text-blue-800 truncate mr-2">{email}</span>
                  <button onClick={() => handleRemoveTeacher(email)} className="text-red-500 p-1.5 hover:bg-red-50 active:scale-90 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {teachers.length === 0 && (
                <p className="text-xs text-[#8e8d82] text-center py-4 bg-gray-50 rounded-xl border border-dashed border-[#e6e2d3]">Henüz kayıtlı öğretmen bulunmuyor.</p>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
