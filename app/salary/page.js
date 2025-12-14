"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Printer, CheckCircle, Filter } from "lucide-react";
import Link from "next/link";

export default function SalaryReport() {
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState("সব");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);

  // ১. ডিফল্ট মাস সেট (বর্তমান মাস)
  useEffect(() => {
    const today = new Date();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    setSelectedMonth(`${y}-${m}`);
  }, []);

  // ২. ডাটা লোড
  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    const res = await fetch(`/api/employees`); 
    const data = await res.json();
    
    setAllEmployees(data);
    setFilteredEmployees(data);

    // ইউনিক সেকশন লিস্ট
    const uniqueSections = ["সব", ...new Set(data.map(item => item.section))];
    setSections(uniqueSections);
    setLoading(false);
  };

  // ৩. ফিল্টারিং (সেকশন অনুযায়ী)
  useEffect(() => {
    if (selectedSection === "সব") {
        setFilteredEmployees(allEmployees);
    } else {
        setFilteredEmployees(allEmployees.filter(emp => emp.section === selectedSection));
    }
  }, [selectedSection, allEmployees]);

  // ৪. তারিখ ফরম্যাট
  const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return `${date.getDate()}/${date.getMonth()+1}`; 
  };

  // ৫. ফাইনাল ক্যালকুলেশন লজিক (আপডেটেড - জয়েনিং ডেট চেক সহ)
  const calculateSalary = (emp) => {
    if(!selectedMonth) return {};

    const [yearStr, monthStr] = selectedMonth.split('-'); 
    const targetMonth = parseInt(monthStr) - 1; // 0-11 index
    const targetYear = parseInt(yearStr);

    // --- নতুন লজিক: জয়েনিং ডেট চেক ---
    const empJoinDate = new Date(emp.joinDate);
    // রিপোর্টের মাসের ১ তারিখ
    const reportStartDate = new Date(targetYear, targetMonth, 1);
    // কর্মীর জয়েনিং মাসের ১ তারিখ
    const joinMonthStart = new Date(empJoinDate.getFullYear(), empJoinDate.getMonth(), 1);

    // যদি রিপোর্টের মাস কর্মীর জয়েনিং মাসের আগে হয়, তবে সে তখন ছিল না
    if (reportStartDate < joinMonthStart) {
        return { notJoinedYet: true, netPayable: 0 };
    }

    // --- সাধারণ হিসাব ---

    // এই মাসের মোট অনুপস্থিতি
    const absentInMonth = emp.absentDates.filter(d => {
        const date = new Date(d);
        return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
    }).length;

    // এই মাসের মোট এডভান্স
    const monthAdvances = emp.advances.filter(adv => {
        const date = new Date(adv.date);
        return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
    });
    const totalAdvance = monthAdvances.reduce((sum, item) => sum + item.amount, 0);

    // লজিক: ৩৪ থেকে বিয়োগ
    const payableDays = 34 - absentInMonth;

    const dailyRate = emp.baseSalary / 30;
    const grossPay = payableDays * dailyRate;
    const netPayable = Math.floor(grossPay - totalAdvance);

    // পেইড কিনা চেক
    const isPaid = emp.paymentHistory.some(p => p.monthStr === `${monthStr}-${yearStr}`);

    return {
      notJoinedYet: false,
      payableDays,
      absentInMonth,
      monthAdvances,
      totalAdvance,
      netPayable: netPayable > 0 ? netPayable : 0,
      isPaid
    };
  };

  // ৬. পেমেন্ট বাটন অ্যাকশন
  const handlePay = async (empId, amount) => {
    if(!confirm("নিশ্চিত বেতন পরিশোধ করতে চান?")) return;
    
    const [year, month] = selectedMonth.split('-');
    const monthStr = `${month}-${year}`;

    await fetch('/api/employees', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: empId, 
        action: 'PAY_SALARY', 
        payload: { monthStr, amount } 
      }),
    });
    fetchReport(); 
  };

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 print:bg-white print:p-0">
      
      {/* --- কন্ট্রোল প্যানেল (প্রিন্টের সময় লুকানো থাকবে) --- */}
      <div className="print:hidden mb-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
                <Link href="/" className="bg-white p-2 rounded-full shadow hover:bg-gray-100"><ArrowLeft className="w-5 h-5"/></Link>
                <h1 className="text-xl md:text-2xl font-bold text-red-700">বেতন রিপোর্ট</h1>
            </div>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-blue-700 text-sm">
                <Printer className="w-4 h-4"/> প্রিন্ট
            </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* মাস সিলেকশন */}
            <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">মাস সিলেক্ট করুন</label>
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="p-3 border rounded-lg font-bold text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                />
            </div>
            
            {/* সেকশন সিলেকশন (Dropdown) */}
            <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">সেকশন ফিল্টার</label>
                <div className="relative">
                    <select 
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full p-3 border rounded-lg font-bold text-gray-700 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        {sections.map(sec => (
                            <option key={sec} value={sec}>{sec}</option>
                        ))}
                    </select>
                    <Filter className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </div>
      </div>

      {/* --- স্যালারি টেবিল --- */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm print:shadow-none print:p-0 max-w-5xl mx-auto">
        
        {/* প্রিন্ট হেডার */}
        <div className="hidden print:block text-center mb-6 border-b pb-4">
            <h1 className="text-3xl font-bold text-black">রাজভোগ সুইটস</h1>
            <p className="text-gray-600 font-bold mt-1">বেতন শিট - {selectedMonth}</p>
            <p className="text-sm text-gray-500">সেকশন: {selectedSection}</p>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                    <tr className="bg-red-50 text-red-900 text-xs uppercase tracking-wider print:bg-gray-100 print:text-black">
                        <th className="p-3 border font-bold">নাম ও সেকশন</th>
                        <th className="p-3 border font-bold text-right">মূল বেতন</th>
                        <th className="p-3 border font-bold text-center">অনুপস্থিত</th>
                        <th className="p-3 border font-bold text-center">প্রাপ্য দিন</th>
                        <th className="p-3 border font-bold w-1/4">এডভান্স</th>
                        <th className="p-3 border font-bold text-right">নেট পাবেন</th>
                        <th className="p-3 border font-bold text-center print:hidden">অ্যাকশন</th>
                    </tr>
                </thead>
                <tbody className="text-gray-700 text-sm">
                    {filteredEmployees.map((emp) => {
                        const stats = calculateSalary(emp);
                        
                        // যদি কর্মী এই মাসে জয়েন না করে থাকে, তবে লিস্টে দেখাবে না
                        if (stats.notJoinedYet) return null;

                        return (
                            <tr key={emp._id} className="hover:bg-gray-50">
                                <td className="p-3 border">
                                    <p className="font-bold text-base">{emp.name}</p>
                                    <p className="text-xs text-gray-500">{emp.section}</p>
                                </td>
                                <td className="p-3 border text-right font-medium">
                                    {emp.baseSalary.toLocaleString()}
                                </td>
                                <td className="p-3 border text-center">
                                    {stats.absentInMonth > 0 ? <span className="text-red-600 font-bold">{stats.absentInMonth} দিন</span> : <span className="text-gray-400">-</span>}
                                </td>
                                <td className="p-3 border text-center font-bold">
                                    {stats.payableDays}
                                </td>
                                <td className="p-3 border">
                                    {stats.monthAdvances.length > 0 ? (
                                        <div className="space-y-1">
                                            {stats.monthAdvances.map((adv, i) => (
                                                <div key={i} className="text-xs flex justify-between">
                                                    <span className="text-gray-500">{formatDate(adv.date)}:</span>
                                                    <span className="font-bold">{adv.amount}</span>
                                                </div>
                                            ))}
                                            <div className="border-t border-gray-300 pt-1 font-bold text-xs mt-1 text-right">মোট: {stats.totalAdvance}</div>
                                        </div>
                                    ) : <span className="text-gray-400 text-xs text-center block">-</span>}
                                </td>
                                <td className="p-3 border text-right font-bold text-lg text-black">
                                    ৳{stats.netPayable.toLocaleString()}
                                </td>
                                <td className="p-3 border text-center print:hidden">
                                    {stats.isPaid ? (
                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                            <CheckCircle className="w-3 h-3"/> PAID
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={() => handlePay(emp._id, stats.netPayable)}
                                            className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 text-xs font-bold"
                                        >
                                            Pay Now
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            {filteredEmployees.length === 0 && (
                <div className="text-center p-8 text-gray-400">কোনো ডাটা পাওয়া যায়নি</div>
            )}
        </div>
      </div>
    </div>
  );
}