import React, { useState, useEffect } from 'react';
import { 
  Home, UserPlus, LogIn, CheckCircle, 
  FileText, LogOut, ShieldCheck, Users, Search, X, Printer
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, updateDoc } from 'firebase/firestore';

// --- GANTI DENGAN URL WEB APP GOOGLE SCRIPT ANDA ---
const GAS_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnS4Q0xUO85vPS3AbLnJXMpu56bSx4yP4oxMhyvHRE4ecBwEc12fJH8IHEplcpu7aoHVZgokgqHfw2QZoJxdbej-qhSrPCzROV34Hil5mTdo83rSFJtBxN9YDpQSQi84DmZ7akO6IfPB-OBEcNWVSyi7wBDTqT89nLngoAGq5nHCw8ITqidxPXW_9v_A2PIxvhTq-wGj5B6xssQKToHNZnY5I3bFZfET-8j6QVi7ldjbG6nwxoFXkJEaoFPGDDQrtHv-o7CBwSx8VB_1xt6qFf0w7HM6yg&lib=MOFESadi2MtNUzpoZKcL__poji-5SnTXy"; 

// Masukkan Config Firebase Anda di sini
const firebaseConfig = {
  apiKey: "AIzaSy...", 
  authDomain: "project-id.firebaseapp.com",
  projectId: "project-id",
  storageBucket: "project-id.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

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
    nama: '', nisn: '', nik: '', asalSekolah: '', noHp: ''
  });
  const [loginData, setLoginData] = useState({ nisn: '', nik: '' });
  const [adminLogin, setAdminLogin] = useState({ username: '', password: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    const initAuth = async () => {
       if (!auth.currentUser) await signInAnonymously(auth);
    };
    initAuth();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin && user) {
      const q = collection(db, 'artifacts', appId, 'public', 'data', 'registrations');
      return onSnapshot(q, (snapshot) => {
        setAllApplicants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [isAdmin, user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'registrations', formData.nisn);
      const dataToSave = { ...formData, status: 'Diproses', tanggalDaftar: new Date().toLocaleString() };
      await setDoc(docRef, dataToSave);
      
      if (GAS_URL && GAS_URL.startsWith("https")) {
        await fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(dataToSave) });
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
    try {
      const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registrations', loginData.nisn));
      if (docSnap.exists() && docSnap.data().nik === loginData.nik) {
        setStudentData(docSnap.data());
        setCurrentView('dashboard');
      } else { 
        setError("Data tidak ditemukan atau NIK salah."); 
      }
    } catch (err) {
      setError("Gagal login.");
    }
  };

  const updateStatus = async (nisn, newStatus) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registrations', nisn), { status: newStatus });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-lg no-print">
        <h1 className="font-bold cursor-pointer" onClick={() => setCurrentView('home')}>PPDB SMPN 7 SINGINGI</h1>
        <button onClick={() => setCurrentView('admin-login')} className="text-xs border border-white/30 px-2 py-1 rounded hover:bg-blue-700">Login Admin</button>
      </header>

      <main className="p-4 max-w-lg mx-auto pt-10">
        {currentView === 'home' && (
          <div className="text-center space-y-6 animate-in fade-in duration-500">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <FileText size={40} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Portal PPDB Online</h2>
            <p className="text-gray-500">Silakan pilih menu di bawah untuk melanjutkan pendaftaran.</p>
            <div className="space-y-3">
              <button onClick={() => setCurrentView('register')} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Daftar Sekarang</button>
              <button onClick={() => setCurrentView('login')} className="w-full bg-white border border-blue-600 text-blue-600 p-4 rounded-xl font-bold hover:bg-blue-50 transition-all">Cek Status Siswa</button>
            </div>
          </div>
        )}

        {currentView === 'register' && (
          <form onSubmit={submitRegistration} className="bg-white p-6 rounded-2xl shadow-xl space-y-4 border border-gray-100">
            <h2 className="text-xl font-bold flex items-center gap-2"><UserPlus /> Form Pendaftaran</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            <div className="space-y-3">
              <input required name="nama" placeholder="Nama Lengkap" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleInputChange} />
              <input required name="nisn" placeholder="NISN (10 Digit)" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleInputChange} />
              <input required name="nik" placeholder="NIK (16 Digit)" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleInputChange} />
              <input required name="asalSekolah" placeholder="Asal Sekolah" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleInputChange} />
              <input required name="noHp" placeholder="No HP/WA Aktif" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={handleInputChange} />
            </div>
            <button disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-all">
              {loading ? "Mengirim Data..." : "Kirim Pendaftaran"}
            </button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-gray-400 text-sm">Batal</button>
          </form>
        )}

        {currentView === 'login' && (
          <form onSubmit={submitLogin} className="bg-white p-6 rounded-2xl shadow-xl space-y-4 border border-gray-100">
            <h2 className="text-xl font-bold flex items-center gap-2"><LogIn /> Login Siswa</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input required placeholder="Masukkan NISN" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setLoginData({...loginData, nisn: e.target.value})} />
            <input required type="password" placeholder="Masukkan NIK" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setLoginData({...loginData, nik: e.target.value})} />
            <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700">Masuk</button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-gray-400 text-sm">Kembali</button>
          </form>
        )}

        {currentView === 'admin-login' && (
          <form onSubmit={(e) => { e.preventDefault(); if(adminLogin.password === 'smpn7singingi') {setIsAdmin(true); setCurrentView('admin-dashboard');} else {setError("Password salah")}} } className="bg-white p-6 rounded-2xl shadow-xl space-y-4 border border-gray-100">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck /> Login Admin</h2>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input required placeholder="Password Admin" type="password" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setAdminLogin({...adminLogin, password: e.target.value})} />
            <button className="w-full bg-black text-white p-4 rounded-xl font-bold hover:opacity-80">Masuk Admin</button>
            <button type="button" onClick={() => setCurrentView('home')} className="w-full text-gray-400 text-sm">Kembali</button>
          </form>
        )}

        {currentView === 'dashboard' && (
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center space-y-6 border border-gray-100">
            <div className="bg-blue-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-blue-600">
              <CheckCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{studentData?.nama}</h2>
              <p className="text-gray-500 text-sm">NISN: {studentData?.nisn}</p>
            </div>
            <div className={`p-4 rounded-xl font-bold border-2 ${
              studentData?.status === 'Diterima' ? 'bg-green-50 border-green-200 text-green-700' : 
              studentData?.status === 'Ditolak' ? 'bg-red-50 border-red-200 text-red-700' :
              'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              STATUS: {studentData?.status}
            </div>
            <div className="grid grid-cols-2 gap-2 no-print">
              <button onClick={() => window.print()} className="bg-gray-800 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-bold"><Printer size={18}/> Cetak</button>
              <button onClick={() => {setStudentData(null); setCurrentView('home')}} className="bg-gray-100 text-gray-600 p-3 rounded-lg font-bold">Keluar</button>
            </div>
          </div>
        )}

        {currentView === 'admin-dashboard' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Daftar Pendaftar</h2>
              <button onClick={() => {setIsAdmin(false); setCurrentView('home')}} className="text-red-500 text-sm font-bold">Log Out</button>
            </div>
            <input 
              placeholder="Cari nama..." 
              className="w-full p-3 border rounded-xl mb-4 outline-none" 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {allApplicants
              .filter(app => app.nama.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(applicant => (
              <div key={applicant.id} className="bg-white p-4 rounded-xl shadow border border-gray-100 flex justify-between items-center hover:shadow-md transition-all">
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{applicant.nama}</p>
                  <p className="text-xs text-gray-500">{applicant.asalSekolah} | {applicant.status}</p>
                  <p className="text-[10px] text-gray-400">{applicant.nisn}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => updateStatus(applicant.id, 'Diterima')} className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1.5 rounded hover:bg-green-100">TERIMA</button>
                  <button onClick={() => updateStatus(applicant.id, 'Ditolak')} className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1.5 rounded hover:bg-red-100">TOLAK</button>
                </div>
              </div>
            ))}
            {allApplicants.length === 0 && <p className="text-center text-gray-400 py-10">Belum ada pendaftar.</p>}
          </div>
        )}
      </main>
    </div>
  );
}