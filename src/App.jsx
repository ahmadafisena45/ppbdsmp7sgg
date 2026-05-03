import React, { useState, useEffect } from 'react';
import { 
  Home, UserPlus, LogIn, CheckCircle, 
  FileText, LogOut, ShieldCheck, Users, Search, X, Printer
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';

/**
 * PANDUAN PENGISIAN:
 * Gunakan konfigurasi Web App dari Firebase Console.
 * JANGAN gunakan Service Account (JSON) di sini karena ini adalah sisi Client.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAnEtLhzheZE49vXVSZ_A3B2Rg26jhqDHY", // Ganti dengan API Key dari Firebase Console
  authDomain: "ppbdsmp7sgg.firebaseapp.com",
  projectId: "ppbdsmp7sgg",
  storageBucket: "ppbdsmp7sgg.appspot.com",
  messagingSenderId: "202081928365", // Ganti dengan Sender ID Anda
  appId: "1:202081928365:web:6300505417d3bf64f13224" // Ganti dengan App ID Anda
};

const GAS_URL = "https://script.google.com/macros/s/AKfycbwcI_v-v_p-m6K9Y0G7p_x-wGj5B6xssQKToHNZnY5I3bFZfET-8j6QVi7ldjbG6nwxoFXk/exec"; 

// Inisialisasi Firebase Client
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
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin && user) {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'registrations');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAllApplicants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("Firestore Error:", err);
        setError("Gagal memuat data. Pastikan Rules Firestore sudah diset ke 'allow read, write: if true;'");
      });
      return () => unsubscribe();
    }
  }, [isAdmin, user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Koneksi belum siap. Tunggu sebentar.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'registrations', formData.nisn);
      const dataToSave = { 
        ...formData, 
        status: 'Diproses', 
        tanggalDaftar: new Date().toLocaleString('id-ID') 
      };
      
      await setDoc(docRef, dataToSave);
      
      if (GAS_URL) {
        fetch(GAS_URL, { 
          method: 'POST', 
          mode: 'no-cors', 
          body: JSON.stringify(dataToSave) 
        }).catch(err => console.log("Sheets Error:", err));
      }
      
      setStudentData(dataToSave);
      setSuccess("Pendaftaran Berhasil!");
      setTimeout(() => setCurrentView('dashboard'), 1500);
    } catch (err) { 
      setError("Gagal mendaftar: " + err.message); 
    }
    setLoading(false);
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registrations', loginData.nisn));
      if (docSnap.exists() && docSnap.data().nik === loginData.nik) {
        setStudentData(docSnap.data());
        setCurrentView('dashboard');
      } else { 
        setError("Data tidak ditemukan."); 
      }
    } catch (err) {
      setError("Gagal masuk.");
    }
    setLoading(false);
  };

  const updateStatus = async (nisn, newStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registrations', nisn), { status: newStatus });
    } catch (err) {
      setError("Gagal mengubah status.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50 no-print">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
          <ShieldCheck size={24} />
          <h1 className="font-bold tracking-tight">SMPN 7 SINGINGI</h1>
        </div>
        <button onClick={() => {setError(''); setCurrentView('admin-login')}} className="text-[10px] font-bold bg-blue-800 px-3 py-1.5 rounded-lg border border-blue-600 uppercase">Admin</button>
      </header>

      <main className="p-4 max-w-lg mx-auto pt-8">
        {currentView === 'home' && (
          <div className="text-center space-y-8 py-10">
            <div className="bg-blue-600 w-28 h-28 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-2xl rotate-3">
              <FileText size={56} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">PPDB ONLINE</h2>
              <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Tahun Pelajaran 2026/2027</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => setCurrentView('register')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all">Daftar Sekarang</button>
              <button onClick={() => setCurrentView('login')} className="w-full bg-white border-2 border-blue-100 text-blue-600 p-4 rounded-2xl font-bold hover:bg-blue-50 transition-all">Cek Status Siswa</button>
            </div>
          </div>
        )}

        {currentView === 'register' && (
          <form onSubmit={submitRegistration} className="bg-white p-6 rounded-3xl shadow-xl space-y-4 border border-slate-100">
            <h2 className="text-xl font-bold border-b pb-4">Data Calon Siswa</h2>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold">{error}</div>}
            <div className="space-y-4">
              <input required name="nama" placeholder="Nama Lengkap" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" onChange={handleInputChange} />
              <div className="grid grid-cols-2 gap-3">
                <input required name="nisn" maxLength="10" placeholder="NISN" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" onChange={handleInputChange} />
                <input required name="nik" maxLength="16" placeholder="NIK" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" onChange={handleInputChange} />
              </div>
              <input required name="asalSekolah" placeholder="Asal Sekolah" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" onChange={handleInputChange} />
              <input required name="noHp" placeholder="No. WhatsApp" className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none" onChange={handleInputChange} />
            </div>
            <button disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg disabled:opacity-50 mt-4">Kirim Pendaftaran</button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-slate-400 text-sm py-2">Batal</button>
          </form>
        )}

        {currentView === 'login' && (
          <form onSubmit={submitLogin} className="bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-6">
            <h2 className="text-2xl font-black text-slate-800 text-center uppercase tracking-tight">Cek Status</h2>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs text-center font-bold">{error}</div>}
            <div className="space-y-4">
              <input required placeholder="NISN" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" onChange={(e) => setLoginData({...loginData, nisn: e.target.value})} />
              <input required type="password" placeholder="NIK" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" onChange={(e) => setLoginData({...loginData, nik: e.target.value})} />
            </div>
            <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-xl">Masuk</button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-slate-400 text-xs font-bold text-center">Kembali</button>
          </form>
        )}

        {currentView === 'dashboard' && (
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-blue-700 p-8 text-white text-center">
              <CheckCircle size={40} className="mx-auto mb-2" />
              <h2 className="text-2xl font-black uppercase leading-tight">{studentData?.nama}</h2>
              <p className="font-mono text-sm opacity-90">NISN: {studentData?.nisn}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className={`py-4 px-6 rounded-2xl font-black text-center text-lg border-2 ${
                studentData?.status === 'Diterima' ? 'bg-green-50 border-green-100 text-green-700' : 
                studentData?.status === 'Ditolak' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                {studentData?.status?.toUpperCase()}
              </div>
              <button onClick={() => window.print()} className="w-full bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg"><Printer size={18}/> Cetak Kartu</button>
              <button onClick={() => {setStudentData(null); setCurrentView('home')}} className="w-full text-slate-400 text-sm">Keluar</button>
            </div>
          </div>
        )}

        {currentView === 'admin-login' && (
          <form onSubmit={(e) => { e.preventDefault(); if(adminLogin.password === 'smpn7singingi') {setIsAdmin(true); setCurrentView('admin-dashboard');} else {setError("Sandi Salah!")}} } className="bg-white p-8 rounded-3xl shadow-xl space-y-6">
            <h2 className="text-xl font-black text-slate-800 text-center uppercase tracking-tight">Panel Admin</h2>
            <input required placeholder="Password Admin" type="password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center font-bold" onChange={(e) => setAdminLogin({...adminLogin, password: e.target.value})} />
            <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold">Otorisasi</button>
          </form>
        )}

        {currentView === 'admin-dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">Pendaftar</h2>
              <button onClick={() => {setIsAdmin(false); setCurrentView('home')}} className="text-red-500"><LogOut size={20}/></button>
            </div>
            <div className="space-y-3">
              {allApplicants.map(applicant => (
                <div key={applicant.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group">
                  <div>
                    <p className="font-black text-slate-800">{applicant.nama}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{applicant.asalSekolah} • {applicant.status}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => updateStatus(applicant.id, 'Diterima')} className="text-[10px] font-black text-white bg-green-500 px-3 py-1.5 rounded-lg uppercase">Terima</button>
                    <button onClick={() => updateStatus(applicant.id, 'Ditolak')} className="text-[10px] font-black text-white bg-red-500 px-3 py-1.5 rounded-lg uppercase">Tolak</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-10 p-10 text-center border-t border-slate-100 no-print">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">&copy; 2026 SMPN 7 SINGINGI</p>
      </footer>
    </div>
  );
}
