import React, { useState, useEffect } from 'react';
import { 
  Home, UserPlus, LogIn, CheckCircle, 
  FileText, LogOut, ShieldCheck, Users, Search, X, Printer
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';

/**
 * PANDUAN PENTING:
 * 1. GAS_URL: Masukkan URL dari 'Deploy as Web App' di Google Apps Script.
 * 2. firebaseConfig: Masukkan konfigurasi dari Project Settings di Firebase Console.
 */
const GAS_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnS4Q0xUO85vPS3AbLnJXMpu56bSx4yP4oxMhyvHRE4ecBwEc12fJH8IHEplcpu7aoHVZgokgqHfw2QZoJxdbej-qhSrPCzROV34Hil5mTdo83rSFJtBxN9YDpQSQi84DmZ7akO6IfPB-OBEcNWVSyi7wBDTqT89nLngoAGq5nHCw8ITqidxPXW_9v_A2PIxvhTq-wGj5B6xssQKToHNZnY5I3bFZfET-8j6QVi7ldjbG6nwxoFXkJEaoFPGDDQrtHv-o7CBwSx8VB_1xt6qFf0w7HM6yg&lib=MOFESadi2MtNUzpoZKcL__poji-5SnTXy"; 

const firebaseConfig = {
  apiKey: "ISI_API_KEY_ANDA",
  authDomain: "ppbdsmp7sgg.firebaseapp.com",
  projectId: "ppbdsmp7sgg",
  storageBucket: "ppbdsmp7sgg.appspot.com",
  messagingSenderId: "ISI_SENDER_ID",
  appId: "ISI_APP_ID"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "ppdb-smpn7-singingi";

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allApplicants, setAllApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nama: '', nisn: '', nik: '', asalSekolah: '', noHp: '',
    tempatLahir: '', tanggalLahir: '', jenisKelamin: 'Laki-laki', alamat: ''
  });
  const [loginData, setLoginData] = useState({ nisn: '', nik: '' });
  const [adminLogin, setAdminLogin] = useState({ password: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    
    const initAuth = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin && user) {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'registrations');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAllApplicants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => console.error("Firestore Error:", err));
      return () => unsubscribe();
    }
  }, [isAdmin, user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Koneksi database belum siap. Tunggu sebentar.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'registrations', formData.nisn);
      const dataToSave = { ...formData, status: 'Diproses', tanggalDaftar: new Date().toLocaleString() };
      
      await setDoc(docRef, dataToSave);
      
      if (GAS_URL && GAS_URL.startsWith("https")) {
        await fetch(GAS_URL, { 
          method: 'POST', 
          mode: 'no-cors', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave) 
        });
      }
      
      setStudentData(dataToSave);
      setSuccess("Pendaftaran Berhasil! Mengalihkan...");
      setTimeout(() => setCurrentView('dashboard'), 1500);
    } catch (err) { 
      setError("Gagal mendaftar: " + err.message); 
    }
    setLoading(false);
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registrations', loginData.nisn));
      if (docSnap.exists() && docSnap.data().nik === loginData.nik) {
        setStudentData(docSnap.data());
        setCurrentView('dashboard');
      } else { 
        setError("Data tidak ditemukan atau NIK salah."); 
      }
    } catch (err) {
      setError("Gagal masuk ke sistem.");
    }
  };

  const updateStatus = async (nisn, newStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registrations', nisn), { status: newStatus });
    } catch (err) {
      console.error("Gagal update status:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-lg no-print">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
          <ShieldCheck size={24} />
          <h1 className="font-bold tracking-tight">PPDB SMPN 7 SINGINGI</h1>
        </div>
        <button onClick={() => {setError(''); setCurrentView('admin-login')}} className="text-xs bg-blue-800 px-3 py-1.5 rounded-full hover:bg-blue-900 transition-colors">Admin</button>
      </header>

      <main className="p-4 max-w-lg mx-auto pt-8">
        {currentView === 'home' && (
          <div className="text-center space-y-8 py-10">
            <div className="relative inline-block">
               <div className="bg-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto text-white shadow-xl rotate-3">
                <FileText size={48} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-800">Selamat Datang</h2>
              <p className="text-slate-500">Pendaftaran Peserta Didik Baru Online<br/>Tahun Pelajaran 2026/2027</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => setCurrentView('register')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">Daftar Sekarang</button>
              <button onClick={() => setCurrentView('login')} className="w-full bg-white border-2 border-blue-600 text-blue-600 p-4 rounded-2xl font-bold hover:bg-blue-50 transition-all">Cek Status Siswa</button>
            </div>
          </div>
        )}

        {currentView === 'register' && (
          <form onSubmit={submitRegistration} className="bg-white p-6 rounded-3xl shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><UserPlus size={20}/></div>
              <h2 className="text-xl font-bold">Data Diri Calon Siswa</h2>
            </div>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm font-medium">{success}</div>}
            
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase ml-1">Nama Lengkap</span>
                <input required name="nama" placeholder="Sesuai Ijazah/KK" className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleInputChange} />
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="text-xs font-semibold text-slate-500 uppercase ml-1">NISN</span>
                  <input required name="nisn" placeholder="10 Digit" className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleInputChange} />
                </label>
                <label>
                  <span className="text-xs font-semibold text-slate-500 uppercase ml-1">NIK</span>
                  <input required name="nik" placeholder="16 Digit" className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleInputChange} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="text-xs font-semibold text-slate-500 uppercase ml-1">Tempat Lahir</span>
                  <input required name="tempatLahir" placeholder="Kota/Kab" className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleInputChange} />
                </label>
                <label>
                  <span className="text-xs font-semibold text-slate-500 uppercase ml-1">Tanggal Lahir</span>
                  <input required name="tanggalLahir" type="date" className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleInputChange} />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase ml-1">Jenis Kelamin</span>
                <select name="jenisKelamin" className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleInputChange}>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase ml-1">Asal Sekolah (SD/MI)</span>
                <input required name="asalSekolah" placeholder="Nama Sekolah Asal" className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleInputChange} />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase ml-1">Alamat Lengkap</span>
                <textarea required name="alamat" placeholder="Dusun, Desa, RT/RW" className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" rows="2" onChange={handleInputChange}></textarea>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase ml-1">Nomor WhatsApp Aktif</span>
                <input required name="noHp" placeholder="08xxxxxxxxxx" className="w-full p-3 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" onChange={handleInputChange} />
              </label>
            </div>
            
            <button disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all mt-4">
              {loading ? "Menyimpan..." : "Kirim Pendaftaran"}
            </button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-slate-400 text-sm font-medium">Kembali</button>
          </form>
        )}

        {currentView === 'login' && (
          <form onSubmit={submitLogin} className="bg-white p-8 rounded-3xl shadow-xl space-y-6 border border-slate-100">
            <div className="text-center space-y-2">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-2">
                <LogIn size={28} />
              </div>
              <h2 className="text-2xl font-bold">Cek Status</h2>
              <p className="text-slate-500 text-sm">Gunakan NISN dan NIK untuk masuk</p>
            </div>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{error}</div>}
            <div className="space-y-4">
              <input required placeholder="Nomor NISN" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setLoginData({...loginData, nisn: e.target.value})} />
              <input required type="password" placeholder="Nomor NIK" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setLoginData({...loginData, nik: e.target.value})} />
            </div>
            <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700">Masuk Sekarang</button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-slate-400 text-sm">Kembali ke Beranda</button>
          </form>
        )}

        {currentView === 'admin-login' && (
          <form onSubmit={(e) => { e.preventDefault(); if(adminLogin.password === 'smpn7singingi') {setIsAdmin(true); setCurrentView('admin-dashboard');} else {setError("Password Admin Salah!")}} } className="bg-white p-8 rounded-3xl shadow-xl space-y-6 border border-slate-100">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Panel Admin</h2>
              <p className="text-slate-500 text-sm">Khusus Panitia PPDB</p>
            </div>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-bold">{error}</div>}
            <input required placeholder="Password Rahasia" type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-center" onChange={(e) => setAdminLogin({...adminLogin, password: e.target.value})} />
            <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-black">Buka Panel</button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-slate-400 text-sm">Batal</button>
          </form>
        )}

        {currentView === 'dashboard' && (
          <div className="space-y-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl text-center space-y-6 border-t-8 border-blue-600">
              <div className="space-y-1">
                <p className="text-blue-600 font-bold text-xs uppercase tracking-widest">Kartu Peserta PPDB</p>
                <h2 className="text-2xl font-extrabold text-slate-800 uppercase">{studentData?.nama}</h2>
                <p className="text-slate-500 font-mono">NISN: {studentData?.nisn}</p>
              </div>
              
              <div className={`py-4 px-6 rounded-2xl font-black text-lg border-4 shadow-inner ${
                studentData?.status === 'Diterima' ? 'bg-green-50 border-green-200 text-green-700' : 
                studentData?.status === 'Ditolak' ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {studentData?.status?.toUpperCase()}
              </div>

              <div className="text-left bg-slate-50 p-4 rounded-2xl space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-400">Asal Sekolah</span>
                  <span className="font-bold">{studentData?.asalSekolah}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-400">TTL</span>
                  <span className="font-bold">{studentData?.tempatLahir}, {studentData?.tanggalLahir}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tgl Daftar</span>
                  <span className="font-bold text-xs">{studentData?.tanggalDaftar}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 no-print">
                <button onClick={() => window.print()} className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg active:scale-95"><Printer size={20}/> Cetak</button>
                <button onClick={() => {setStudentData(null); setCurrentView('home')}} className="bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold active:scale-95">Keluar</button>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 no-print">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Informasi:</strong> Jika status Anda "Diproses", silakan cek berkala atau hubungi panitia melalui nomor WhatsApp sekolah.
              </p>
            </div>
          </div>
        )}

        {currentView === 'admin-dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-end no-print">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Data Pendaftar</h2>
                <p className="text-slate-500 text-xs">Total: {allApplicants.length} Siswa</p>
              </div>
              <button onClick={() => {setIsAdmin(false); setCurrentView('home')}} className="text-red-500 bg-red-50 px-3 py-1 rounded-lg text-xs font-bold">Logout</button>
            </div>

            <div className="relative no-print">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                placeholder="Cari nama atau asal sekolah..." 
                className="w-full p-3.5 pl-12 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500" 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {allApplicants
                .filter(app => 
                  app.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  app.asalSekolah.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(applicant => (
                <div key={applicant.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-lg leading-tight">{applicant.nama}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">{applicant.asalSekolah}</p>
                    <div className="mt-2 flex gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        applicant.status === 'Diterima' ? 'bg-green-100 text-green-600' : 
                        applicant.status === 'Ditolak' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>{applicant.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 no-print">
                    <button onClick={() => updateStatus(applicant.id, 'Diterima')} className="text-[10px] font-black text-white bg-green-500 px-3 py-2 rounded-xl hover:bg-green-600 shadow-sm shadow-green-100">TERIMA</button>
                    <button onClick={() => updateStatus(applicant.id, 'Ditolak')} className="text-[10px] font-black text-white bg-red-500 px-3 py-2 rounded-xl hover:bg-red-600 shadow-sm shadow-red-100">TOLAK</button>
                  </div>
                </div>
              ))}
              {allApplicants.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <Users className="mx-auto text-slate-200 mb-2" size={48} />
                  <p className="text-slate-400 font-medium">Belum ada data masuk</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-10 p-8 text-center text-slate-400 text-xs no-print">
        <p>&copy; 2026 SMPN 7 Singingi. All rights reserved.</p>
        <p className="mt-1">Sistem Informasi PPDB Digital v1.0</p>
      </footer>
    </div>
  );
}
