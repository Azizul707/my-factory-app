"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, Users, CheckCircle, Calendar, LogOut, Trash2, ChevronDown, ChevronUp, Lock, FileText } from "lucide-react";

// --- Utility: বাংলা নাম্বার কনভার্টার ---
const bnToEn = (str) => {
  return str.replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d));
};

// --- Login Page ---
function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.target;
    
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: form.username.value,
        password: form.password.value
      })
    });

    const data = await res.json();
    if (res.ok) {
      onLogin(data);
    } else {
      setError(data.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-700">রাজভোগ সুইটস</h1>
            <p className="text-gray-500 text-sm">লগিন প্যানেল</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600">ইউজারনেম</label>
            <input name="username" type="email" placeholder="admin@rajbhog" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">পাসওয়ার্ড</label>
            <input name="password" type="password" placeholder="******" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
          </div>
          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
          <button disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 transition">
            {loading ? "লগিন হচ্ছে..." : "লগিন করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main App ---
export default function Home() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("LOADING");
  const [employees, setEmployees] = useState([]);
  const [sections, setSections] = useState([]); 
  const [selectedSection, setSelectedSection] = useState(""); // এটি আবার যোগ করা হয়েছে
  const [globalStats, setGlobalStats] = useState({ totalOnLeave: 0, leaveList: [] });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false); 
  const [expandedEmp, setExpandedEmp] = useState(null); 

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
        const data = await res.json();
        setUser(data);
        fetchSections(); 
        if (data.role === 'ADMIN') {
            setView("HOME");
            fetchGlobalStats();
        } else {
            // লিডার হলে তার সেকশন সেট করা হচ্ছে
            fetchSectionData(data.section);
        }
    } else {
        setView("LOGIN");
    }
  };

  const fetchSections = async () => {
    const res = await fetch("/api/sections");
    const data = await res.json();
    setSections(data);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setView("LOGIN");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const fetchGlobalStats = async () => {
    const res = await fetch(`/api/employees`); 
    const data = await res.json();
    const onLeave = data.filter(e => e.status === 'OnLeave');
    setGlobalStats({ totalOnLeave: onLeave.length, leaveList: onLeave });
  };

  // সেকশন ডাটা লোড করার সময় selectedSection আপডেট করা হচ্ছে
  const fetchSectionData = async (sec) => {
    setLoading(true);
    setSelectedSection(sec); // ফিক্স: সেকশন নাম মনে রাখা হচ্ছে
    const res = await fetch(`/api/employees?section=${sec}`);
    const data = await res.json();
    setEmployees(data);
    setLoading(false);
    setView("SECTION");
  };

  const handleAction = async (id, action, payload = {}) => {
    if(!confirm("Are you sure?")) return;
    await fetch('/api/employees', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, payload }) });
    
    // রিফ্রেশ করার সময় সঠিক সেকশন কল করা হচ্ছে
    if(view === 'SECTION') fetchSectionData(selectedSection);
    if(user.role === 'ADMIN') fetchGlobalStats();
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const rawSalary = formData.get("salary");
    const salary = Number(bnToEn(rawSalary)); 

    // ফিক্স: এখন সরাসরি selectedSection ব্যবহার করা হচ্ছে, তাই ভুল হওয়ার সুযোগ নেই
    const sec = user.role === 'ADMIN' ? selectedSection : user.section;
    
    await fetch('/api/employees', { method: 'POST', body: JSON.stringify({
      name: formData.get("name"),
      baseSalary: salary,
      section: sec,
    })});
    setShowAddModal(false);
    fetchSectionData(sec);
  };

  const handleAddSection = async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
          name: form.name.value,
          username: form.username.value,
          password: form.password.value
      };

      const res = await fetch('/api/sections', { method: 'POST', body: JSON.stringify(data) });
      if(res.ok) {
          fetchSections();
          setShowSectionModal(false);
      } else {
          alert("এই নামের সেকশন বা ইউজারনেম ইতিমধ্যে আছে!");
      }
  };

  const handleDeleteSection = async (id) => {
      if(!confirm("সেকশন ডিলিট করলে এর ডাটা হারাবে না, কিন্তু লগিন এক্সেস চলে যাবে। আপনি কি নিশ্চিত?")) return;
      await fetch('/api/sections', { method: 'DELETE', body: JSON.stringify({ id }) });
      fetchSections();
  };

  const handleAdvance = (id) => {
      const rawAmount = prompt("টাকার পরিমাণ (বাংলায় লিখলেও হবে):");
      if(!rawAmount) return;
      const amount = bnToEn(rawAmount); 
      handleAction(id, 'ADD_ADVANCE', { amount });
  };


  if (view === "LOADING") return <div className="h-screen flex items-center justify-center text-red-600 font-bold">রাজভোগ লোড হচ্ছে...</div>;
  if (view === "LOGIN") return <LoginPage onLogin={() => checkUser()} />;

  // --- ADMIN DASHBOARD ---
  if (view === "HOME" && user?.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-red-700 p-6 rounded-b-[30px] shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 z-20">
                <button onClick={handleLogout} className="bg-white/20 p-2 rounded-full text-white"><LogOut className="w-5 h-5"/></button>
            </div>
            <div className="relative z-10 mt-4">
                <h1 className="text-3xl font-bold text-yellow-400">রাজভোগ সুইটস</h1>
                <p className="text-red-100 text-sm">এডমিন প্যানেল</p>
                
                <div className="mt-6">
                    <Link href="/salary" className="bg-white text-red-700 p-4 rounded-xl shadow-lg flex items-center justify-between hover:bg-gray-100 transition active:scale-95">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2 rounded-full">
                                <FileText className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg">বেতন রিপোর্ট</h3>
                                <p className="text-xs text-red-800">বেতন শিট এবং পেমেন্ট করুন</p>
                            </div>
                        </div>
                        <div className="bg-red-50 text-red-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                            ➔
                        </div>
                    </Link>
                </div>
            </div>
        </div>

        <div className="p-4 relative z-20">
            {globalStats.leaveList.length > 0 && (
                <div className="mb-6 bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
                    <h3 className="font-bold flex gap-2 mb-2"><Users className="w-5 h-5 text-red-600"/> ছুটিতে আছেন ({globalStats.totalOnLeave})</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {globalStats.leaveList.map((emp, i) => (
                            <div key={i} className="flex justify-between text-sm border-b pb-1 last:border-0">
                                <span>{emp.name} ({emp.section})</span>
                                <span className="text-red-500 font-bold text-xs">{formatDate(emp.leaveStartDate)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-gray-700 font-bold">সকল সেকশন</h3>
                <button onClick={() => setShowSectionModal(true)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold">+ নতুন সেকশন</button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {sections.map((sec) => (
                    <div key={sec._id} className="relative group">
                        <button onClick={() => fetchSectionData(sec.name)} className="w-full p-4 bg-white rounded-xl shadow-sm border font-bold text-gray-700 hover:border-red-500 transition-all text-left">
                            <div className="flex justify-between items-center">
                                <span>{sec.name}</span>
                                {sec.username && <Lock className="w-3 h-3 text-gray-300"/>}
                            </div>
                            {sec.username && <p className="text-[10px] text-gray-400 font-normal mt-1">User: {sec.username}</p>}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSection(sec._id); }}
                            className="absolute -top-2 -right-2 bg-red-100 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                            <Trash2 className="w-3 h-3"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Modal: Create Section with Login */}
        {showSectionModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                    <h2 className="text-xl font-bold mb-4">নতুন সেকশন ও এক্সেস</h2>
                    <form onSubmit={handleAddSection} className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500">সেকশন নাম</label>
                            <input name="name" placeholder="যেমন: উত্তরা" required className="w-full p-3 border rounded text-sm" />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-xs font-bold text-red-500 mb-2">লগিন এক্সেস তৈরি করুন:</p>
                            <div className="space-y-2">
                                <input name="username" placeholder="User ID (ex: uttara@emp)" required className="w-full p-2 border rounded text-sm bg-white" />
                                <input name="password" placeholder="Password" required className="w-full p-2 border rounded text-sm bg-white" />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                            <button type="button" onClick={() => setShowSectionModal(false)} className="px-4 py-2 bg-gray-100 rounded text-sm font-bold">বাতিল</button>
                            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold shadow">তৈরি করুন</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- SECTION VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-red-700 text-white sticky top-0 z-30 shadow-md flex items-center justify-between p-4">
            {user?.role === 'ADMIN' ? (
                <button onClick={() => setView("HOME")} className="p-2 hover:bg-red-600 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
            ) : <div className="w-6"></div>}
            
            <h1 className="text-lg font-bold text-yellow-300">{selectedSection}</h1>
            <button onClick={handleLogout} className="p-2 bg-red-800 rounded-full"><LogOut className="w-4 h-4" /></button>
      </div>

      <div className="p-4 space-y-4">
        {loading ? <div className="text-center mt-10 text-red-600">লোড হচ্ছে...</div> : employees.map((emp) => {
          const isLeave = emp.status === 'OnLeave';
          const isExpanded = expandedEmp === emp._id;

          return (
            <div key={emp._id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-t-4 ${isLeave ? 'border-red-500' : 'border-green-500'}`}>
              <div className="p-4 pb-2 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{emp.name}</h2>
                  <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isLeave ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{isLeave ? 'ছুটিতে' : 'উপস্থিত'}</span>
                  </div>
                  {isLeave && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatDate(emp.leaveStartDate)} থেকে</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">মূল বেতন</p>
                  <p className="text-lg font-bold text-gray-700">৳{emp.baseSalary}</p>
                </div>
              </div>

              {/* Advance History */}
              <div className="px-4 py-2">
                  <div className="bg-yellow-50 p-2 rounded text-center cursor-pointer hover:bg-yellow-100 border border-yellow-200" onClick={() => setExpandedEmp(isExpanded ? null : emp._id)}>
                        <p className="text-[10px] text-yellow-700 flex justify-center items-center gap-1">এডভান্স হিস্ট্রি {isExpanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}</p>
                  </div>
              </div>

              {isExpanded && emp.advances.length > 0 && (
                  <div className="bg-yellow-50/50 px-4 py-2 mx-4 rounded mb-2 border border-yellow-100">
                      {emp.advances.map((adv, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-gray-600 border-b border-yellow-100 last:border-0 py-1">
                              <span>{formatDate(adv.date)}</span>
                              <span className="font-bold">৳{adv.amount}</span>
                          </div>
                      ))}
                  </div>
              )}

              <div className="p-4 grid grid-cols-2 gap-3 pt-2">
                    {emp.status === 'Active' ? (
                    <>
                        <button onClick={() => handleAction(emp._id, 'MARK_ABSENT')} className="bg-gray-100 py-3 rounded-lg text-sm font-medium hover:bg-gray-200">আজ নেই</button>
                        <button onClick={() => handleAction(emp._id, 'START_LEAVE')} className="bg-red-50 text-red-600 py-3 rounded-lg text-sm font-medium border border-red-100 hover:bg-red-100">ছুটি শুরু</button>
                    </>
                    ) : (
                    <button onClick={() => handleAction(emp._id, 'END_LEAVE')} className="col-span-2 bg-green-600 text-white py-3 rounded-lg text-sm font-bold shadow hover:bg-green-700">কাজে ফিরেছেন</button>
                    )}
                    
                    <button onClick={() => handleAdvance(emp._id)} className="col-span-2 bg-yellow-100 text-yellow-800 py-3 rounded-lg text-sm font-medium hover:bg-yellow-200 border border-yellow-200">এডভান্স দিন</button>
                    
                    <button onClick={() => handleAction(emp._id, 'TERMINATE')} className="col-span-2 text-red-400 text-xs py-1 mt-2 underline text-center">স্থায়ী সেটেলমেন্ট/ছাটাই</button>
              </div>
            </div>
          );
        })}
        {employees.length === 0 && (
             <div className="text-center text-gray-400 mt-10">এই সেকশনে কোনো কর্মী নেই। নিচের (+) বাটনে ক্লিক করে যোগ করুন।</div>
        )}
      </div>

      <button onClick={() => setShowAddModal(true)} className="fixed bottom-6 right-6 bg-red-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold active:scale-95 transition-transform">+</button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
             <h2 className="text-xl font-bold mb-4">নতুন কর্মী যোগ করুন</h2>
             <form onSubmit={handleAddEmployee} className="space-y-4">
               <div>
                   <label className="text-xs font-bold text-gray-500">নাম</label>
                   <input name="name" type="text" placeholder="যেমন: রহিম" required className="w-full p-3 border rounded" />
               </div>
               <div>
                   <label className="text-xs font-bold text-gray-500">বেতন (বাংলা বা ইংরেজি)</label>
                   <input name="salary" type="text" placeholder="যেমন: ২৫০০০ বা 25000" required className="w-full p-3 border rounded" />
               </div>
               <div className="flex gap-2 justify-end mt-4">
                 <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-100 rounded">বাতিল</button>
                 <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">সেভ</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}