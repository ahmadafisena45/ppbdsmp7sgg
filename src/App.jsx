import React, { useState, useEffect } from 'react';
import { 
  Home, UserPlus, LogIn, CheckCircle, 
  FileText, LogOut, ShieldCheck, Users, Search, X, Printer, AlertTriangle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';

/**
 * KONFIGURASI FIREBASE
 */
const firebaseConfig = {
  apiKey: "AIzaSyAnEtLhzheZE49vXVSZ_A3B2Rg26jhqDHY",
  authDomain: "ppbdsmp7sgg.firebaseapp.com",
  projectId: "ppbdsmp7sgg",
  storageBucket: "ppbdsmp7sgg.appspot.com",
  messagingSenderId: "202081928365",
  appId: "1:202081928365:web:6300505417d3bf64f13224"
};

const GAS_URL = "https://script.google.com/macros/s/AKfycbwcI_v-v_p-m6K9Y0G7p_x-wGj5B6xssQKToHNZnY5I3bFZfET-8j6QVi7ldjbG6nwxoFXk/exec"; 

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
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nama: '', nisn: '', nik: '', asalSekolah: '', noHp: '',
    tempatLahir: '', tanggalLahir: '', jenisKelamin: 'Laki-laki', alamat: ''
  });
  const [loginData, setLoginData] = useState({ nisn: '', nik: '' });
  const [adminLogin, setAdminLogin] = useState({ password: '' });

  // Inisialisasi Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error:", err);
        setError("Koneksi Database Gagal. Pastikan 'Anonymous Sign-in' AKTIF di Firebase.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Listener Data Admin
  useEffect(() => {
    if (isAdmin && user) {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'registrations');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAllApplicants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        setError("Gagal sinkronisasi data. Periksa Rules Firestore.");
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
      setError("Menghubungkan ke server...");
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
      
      // Kirim ke Google Sheets
      if (GAS_URL) {
        fetch(GAS_URL, { 
          method: 'POST', 
          mode: 'no-cors', 
          body: JSON.stringify(dataToSave) 
        }).catch(e => console.log("GAS Error"));
      }
      
      setStudentData(dataToSave);
      setCurrentView('dashboard');
    } catch (err) { 
      setError("Pendaftaran Gagal: " + err.message); 
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
        setError("NISN tidak terdaftar atau NIK salah."); 
      }
    } catch (err) {
      setError("Gagal masuk ke sistem.");
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
          <h1 className="font-bold uppercase tracking-tight">SMPN 7 SINGINGI</h1>
        </div>
        <button onClick={() => setCurrentView('admin-login')} className="text-[10px] font-bold bg-blue-800 px-3 py-1.5 rounded-lg border border-blue-600 uppercase">Admin</button>
      </header>

      <main className="p-4 max-w-lg mx-auto pt-8">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl text-sm animate-pulse">
            {error}
          </div>
        )}

        {currentView === 'home' && (
          <div className="text-center space-y-8 py-10">
            <div className="bg-blue-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto text-white shadow-xl rotate-3">
              <FileText size={48} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">PPDB ONLINE</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Tahun Pelajaran 2026/2027</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => setCurrentView('register')} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Daftar Sekarang</button>
              <button onClick={() => setCurrentView('login')} className="w-full bg-white border-2 border-blue-100 text-blue-600 p-4 rounded-2xl font-bold hover:bg-blue-50 active:scale-95 transition-all">Cek Status Siswa</button>
            </div>
          </div>
        )}

        {currentView === 'register' && (
          <form onSubmit={submitRegistration} className="bg-white p-6 rounded-3xl shadow-xl space-y-4 border border-slate-100">
            <h2 className="text-xl font-bold border-b pb-3">Formulir Pendaftaran</h2>
            <div className="space-y-3">
              <input required name="nama" placeholder="Nama Lengkap" className="w-full p-3.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" onChange={handleInputChange} />
              <div className="grid grid-cols-2 gap-3">
                <input required name="nisn" maxLength="10" placeholder="NISN" className="w-full p-3.5 bg-slate-50 border rounded-xl outline-none" onChange={handleInputChange} />
                <input required name="nik" maxLength="16" placeholder="NIK" className="w-full p-3.5 bg-slate-50 border rounded-xl outline-none" onChange={handleInputChange} />
              </div>
              <input required name="asalSekolah" placeholder="Asal Sekolah" className="w-full p-3.5 bg-slate-50 border rounded-xl outline-none" onChange={handleInputChange} />
              <input required name="noHp" placeholder="No. WhatsApp" className="w-full p-3.5 bg-slate-50 border rounded-xl outline-none" onChange={handleInputChange} />
            </div>
            <button disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg mt-2">
              {loading ? "Mengirim..." : "Kirim Data"}
            </button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-slate-400 text-xs py-2">Kembali</button>
          </form>
        )}

        {currentView === 'login' && (
          <form onSubmit={submitLogin} className="bg-white p-8 rounded-[2rem] shadow-xl space-y-6">
            <h2 className="text-2xl font-black text-center uppercase">Login</h2>
            <div className="space-y-4">
              <input required placeholder="NISN" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setLoginData({...loginData, nisn: e.target.value})} />
              <input required type="password" placeholder="NIK" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setLoginData({...loginData, nik: e.target.value})} />
            </div>
            <button disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-xl">
              {loading ? "Memproses..." : "Masuk"}
            </button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-slate-400 text-xs font-bold text-center">Kembali</button>
          </form>
        )}

        {currentView === 'dashboard' && (
          <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 print-area">
            <div className="bg-blue-700 p-8 text-white text-center">
              <CheckCircle size={40} className="mx-auto mb-2 opacity-80" />
              <h2 className="text-2xl font-black uppercase leading-tight">{studentData?.nama}</h2>
              <p className="font-mono text-xs opacity-70">NISN: {studentData?.nisn}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Anda:</span>
                <div className={`mt-2 py-4 px-6 rounded-2xl font-black text-xl border-2 ${
                  studentData?.status === 'Diterima' ? 'bg-green-50 border-green-100 text-green-700' : 
                  studentData?.status === 'Ditolak' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                }`}>
                  {studentData?.status?.toUpperCase()}
                </div>
              </div>
              <div className="no-print space-y-3">
                <button onClick={() => window.print()} className="w-full bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg">
                  <Printer size={18}/> Cetak Bukti
                </button>
                <button onClick={() => {setStudentData(null); setCurrentView('home')}} className="w-full text-slate-400 text-xs font-bold uppercase">Keluar</button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'admin-login' && (
          <form onSubmit={(e) => { e.preventDefault(); if(adminLogin.password === 'smpn7singingi') {setIsAdmin(true); setCurrentView('admin-dashboard');} else {setError("Sandi Salah!")}} } className="bg-white p-8 rounded-3xl shadow-xl space-y-6">
            <h2 className="text-xl font-black text-center uppercase">Panel Admin</h2>
            <input required placeholder="Sandi Admin" type="password" className="w-full p-4 bg-slate-50 border rounded-2xl text-center font-bold" onChange={(e) => setAdminLogin({...adminLogin, password: e.target.value})} />
            <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold shadow-lg">Buka Panel</button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-slate-400 text-xs font-bold text-center">Batal</button>
          </form>
        )}

        {currentView === 'admin-dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
              <h2 className="text-lg font-black text-slate-800 uppercase">Pendaftar</h2>
              <button onClick={() => {setIsAdmin(false); setCurrentView('home')}} className="text-red-500 bg-red-50 p-2 rounded-xl"><LogOut size={20}/></button>
            </div>
            <input 
              placeholder="Cari nama..." 
              className="w-full p-3 border rounded-xl mb-2 outline-none" 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="space-y-3">
              {allApplicants
                .filter(app => app.nama?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(applicant => (
                <div key={applicant.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                  <div className="overflow-hidden">
                    <p className="font-black text-slate-800 truncate leading-none">{applicant.nama}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{applicant.status} | {applicant.asalSekolah}</p>
                  </div>
                  <div className="flex gap-1.5 ml-2">
                    <button onClick={() => updateStatus(applicant.id, 'Diterima')} className="text-[9px] font-black text-white bg-green-500 px-3 py-2 rounded-xl uppercase">Terima</button>
                    <button onClick={() => updateStatus(applicant.id, 'Ditolak')} className="text-[9px] font-black text-white bg-red-500 px-3 py-2 rounded-xl uppercase">Tolak</button>
                  </div>
                </div>
              ))}
              {allApplicants.length === 0 && <p className="text-center text-slate-400 text-xs py-10">Belum ada pendaftar.</p>}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-10 p-10 text-center border-t border-slate-100 no-print text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
        &copy; 2026 SMPN 7 SINGINGI
      </footer>
    </div>
  );
}
