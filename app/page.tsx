"use client";
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Plus, Trash2, Clock, MessageSquare, CheckCircle2, FileText, ArrowRight, UserPlus, X, Loader2, Lock, ShieldCheck } from 'lucide-react';
// Import the new configuration object
import { CIRCLE_DATA } from '../src/data/members';

const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

export default function MinutesApp() {
  // Authorization State - Now stores the whole Circle Object
  const [passcode, setPasscode] = useState('');
  const [activeCircle, setActiveCircle] = useState<{name: string, members: string[]} | null>(null);
  const [authError, setAuthError] = useState(false);

  // Form States
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState({ h: '10', m: '00', p: 'AM' });
  const [isSaving, setIsSaving] = useState(false);
  
  const [attendees, setAttendees] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');

  const [agendaItems, setAgendaItems] = useState([
    { h: '10', m: '00', p: 'AM', hEnd: '10', mEnd: '30', pEnd: 'AM', desc: '' }
  ]);
  const [topics, setTopics] = useState(['']);
  const [decisions, setDecisions] = useState(['']);

  // Check for existing session on load
  useEffect(() => {
    const savedPass = localStorage.getItem('yi_minutes_auth_pass');
    if (savedPass && CIRCLE_DATA[savedPass]) {
      setActiveCircle(CIRCLE_DATA[savedPass]);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Check if the password exists in our CIRCLE_DATA
    const foundCircle = CIRCLE_DATA[passcode];
    
    if (foundCircle) {
      setActiveCircle(foundCircle);
      localStorage.setItem('yi_minutes_auth_pass', passcode);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('yi_minutes_auth_pass');
    setActiveCircle(null);
    setPasscode('');
    setAttendees([]); // Reset attendees for security
  };

  useEffect(() => {
    setAgendaItems(prev => {
      const newItems = [...prev];
      newItems[0] = { ...newItems[0], h: startTime.h, m: startTime.m, p: startTime.p };
      return newItems;
    });
  }, [startTime]);

  const toggleAttendee = (name: string) => {
    setAttendees(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const addCustomAttendee = () => {
    if (customName.trim() && !attendees.includes(customName.trim())) {
      setAttendees([...attendees, customName.trim()]);
      setCustomName('');
    }
  };

  const addRow = (type: 'agenda' | 'topics' | 'decisions') => {
    if (type === 'agenda') {
      const lastItem = agendaItems[agendaItems.length - 1];
      setAgendaItems([...agendaItems, { 
        h: lastItem.hEnd, m: lastItem.mEnd, p: lastItem.pEnd, 
        hEnd: lastItem.hEnd, mEnd: lastItem.mEnd, pEnd: lastItem.pEnd, 
        desc: '' 
      }]);
    }
    if (type === 'topics') setTopics([...topics, '']);
    if (type === 'decisions') setDecisions([...decisions, '']);
  };

  const removeRow = (index: number, type: 'agenda' | 'topics' | 'decisions') => {
    if (type === 'agenda') setAgendaItems(agendaItems.filter((_, i) => i !== index));
    if (type === 'topics') setTopics(topics.filter((_, i) => i !== index));
    if (type === 'decisions') setDecisions(decisions.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    if (!activeCircle) return;
    setIsSaving(true);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    try {
      doc.addImage("/YI-logo.jpeg", "JPEG", centerX - 15, 15, 30, 30, undefined, 'NONE');
    } catch (e) {
      doc.setFontSize(22).setTextColor(0, 51, 153).text("YI", centerX, 30, { align: "center" });
    }

    doc.setFontSize(22).setTextColor(0, 0, 0).setFont("helvetica", "bold").text("Youth India Khobar", centerX, 55, { align: "center" });

    // DYNAMIC CIRCLE NAME IN PDF
    doc.setFontSize(14).setTextColor(0, 51, 153).setFont("helvetica", "italic").text(activeCircle.name, centerX, 63, { align: "center" });

    doc.setDrawColor(200).line(20, 78, 190, 78);

    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(100).text(`Location: ${location || 'N/A'}  |  Date: ${date || 'N/A'}  |  Started: ${startTime.h}:${startTime.m} ${startTime.p}`, centerX, 73, { align: "center" });

    let y = 90;
    doc.setTextColor(0).setFont("helvetica", "bold").setFontSize(12).text("Members Present:", 20, y);
    
    y += 7;
    doc.setFont("helvetica", "normal").setFontSize(10);
    const memberList = attendees.join(", ") || "None recorded";
    const splitAttendees = doc.splitTextToSize(memberList, 170);
    doc.text(splitAttendees, 20, y);
    
    y += (splitAttendees.length * 5); 
    doc.setFont("helvetica", "bold").text(`Total attendees: ${attendees.length}`, 20, y);

    y += 12;
    doc.setFontSize(12).text("Agenda & Timeline:", 20, y);
    y += 8;
    doc.setFont("helvetica", "normal").setFontSize(10);
    agendaItems.forEach(item => {
      doc.text(`${item.h}:${item.m} ${item.p} - ${item.hEnd}:${item.mEnd} ${item.pEnd}: ${item.desc}`, 25, y);
      y += 7;
    });

    y += 5;
    doc.setFont("helvetica", "bold").text("Topics Discussed:", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    topics.forEach(t => { if(t) { doc.text(`• ${t}`, 25, y); y += 6; }});

    y += 5;
    doc.setFont("helvetica", "bold").text("Decisions Made:", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    decisions.forEach(d => { if(d) { doc.text(`• ${d}`, 25, y); y += 6; }});

    // DYNAMIC FILENAME
    const safeCircleName = activeCircle.name.replace(/\s+/g, '_');
    doc.save(`YI_Khobar_${safeCircleName}_Minutes_${date || 'Meeting'}.pdf`);

    try {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const payload = {
        circleName: activeCircle.name,
        circle: activeCircle.name, // Added circle name to payload
        date: date|| new Date().toISOString().split('T')[0],
        location: location,
        attendees: attendees.join(", "),
        attendeesCount: attendees.length,
        agenda: agendaItems.map(item => `${item.h}:${item.m} ${item.p} - ${item.desc}`).join(" | "),
        topics: topics.filter(t => t.trim() !== "").join(" | "), 
        decisions: decisions.filter(d => d.trim() !== "").join(" | "),
        pdfBase64: pdfBase64 
      };

      await fetch('https://script.google.com/macros/s/AKfycbxFDQuIKCUNeeg_Y1AHX3nElfovWi9ssIFMnYjTFpUuzzNDHzkoFUOibJLZwhgR1HtfgA/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      alert(`Success: ${activeCircle.name} Minutes saved and synced!`);
    } catch (error) {
      alert("PDF generated, but there was an error syncing to Google Sheets.");
    } finally {
      setIsSaving(false);
    }
  };

  const iosSelectStyle = "bg-gray-100 border-none rounded-lg px-2 py-2 text-sm font-bold text-gray-700 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer";

  const TimePicker = ({ h, m, p, onChange, label, light = false }: any) => (
    <div className="flex flex-col gap-1">
      {label && <span className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-wider">{label}</span>}
      <div className={`flex items-center gap-1 p-1 rounded-xl border border-gray-200 shadow-sm ${light ? 'bg-white' : 'bg-gray-50'}`}>
        <select className={iosSelectStyle} value={h} onChange={e => onChange('h', e.target.value)}>{HOUR_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}</select>
        <span className="font-bold text-gray-400">:</span>
        <select className={iosSelectStyle} value={m} onChange={e => onChange('m', e.target.value)}>{MINUTE_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}</select>
        <select className={`${iosSelectStyle} bg-blue-50 text-blue-700`} value={p} onChange={e => onChange('p', e.target.value)}><option>AM</option><option>PM</option></select>
      </div>
    </div>
  );

  // --- LOGIN UI ---
  if (!activeCircle) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100 text-center">
          <div className="w-20 h-20 bg-blue-50 mx-auto rounded-3xl flex items-center justify-center mb-6">
            <Lock className="text-blue-600" size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase">Circle Access</h1>
          <p className="text-gray-500 text-sm mb-8 font-medium">Enter your circle's unique authorization code.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder="Authorization Code"
              className={`w-full bg-gray-50 border ${authError ? 'border-red-500' : 'border-gray-200'} rounded-2xl px-6 py-4 text-center text-xl font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all`}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
            {authError && <p className="text-red-500 text-xs font-bold uppercase tracking-wider">Invalid Circle Code</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
              <ShieldCheck size={20} /> Login to Circle
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI ---
  return (
    <main className="p-4 md:p-10 bg-slate-50 min-h-screen font-sans text-gray-800">
      <div className="max-w-5xl mx-auto bg-white p-6 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100">
        
        {/* Header - DYNAMIC CIRCLE NAME */}
        <div className="flex items-center justify-between border-b pb-8 mb-8">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white flex items-center justify-center rounded-2xl shadow-lg border-4 border-white overflow-hidden shrink-0">
                    <img src="/YI-logo.jpeg" alt="YI Logo" className="object-contain w-full h-full" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Youth India Khobar</h1>
                    <p className="text-md text-blue-600 font-bold italic">{activeCircle.name}</p>
                </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest border border-gray-100 px-3 py-1 rounded-lg"
            >
                Switch Circle
            </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Location</label>
            <input className="bg-gray-100 border-none rounded-2xl px-5 py-3 shadow-inner h-[52px]" placeholder="Meeting Location" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 ml-1">Date</label>
            <input type="date" className="bg-gray-100 border-none rounded-2xl px-5 py-3 shadow-inner h-[52px]" onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <TimePicker label="Meeting Start" h={startTime.h} m={startTime.m} p={startTime.p} onChange={(k:any, v:any) => setStartTime({...startTime, [k]: v})} />
          </div>
        </div>

        {/* Attendance Section - DYNAMIC MEMBERS */}
        <div className="mb-10">
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">Attendance ({activeCircle.name})</label>
          <div className="flex gap-2 mb-6 max-w-md">
            <div className="relative flex-1">
              <UserPlus className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Add visitor name..." 
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomAttendee()}
              />
            </div>
            <button onClick={addCustomAttendee} className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 shadow-md transition-all active:scale-90">
              <Plus size={24} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Show only this circle's members */}
            {activeCircle.members.map(name => (
              <button key={name} onClick={() => toggleAttendee(name)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${attendees.includes(name) ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-gray-500 border-gray-100 hover:border-blue-200"}`}>
                {name}
              </button>
            ))}
            {/* Show manually added guests */}
            {attendees.filter(a => !activeCircle.members.includes(a)).map(name => (
              <div key={name} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                {name}
                <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => toggleAttendee(name)} />
              </div>
            ))}
          </div>
        </div>

        {/* Agenda Section */}
        <div className="mb-10 bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2"><Clock className="text-blue-600" size={20} /> Agenda</h2>
            <button onClick={() => addRow('agenda')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md text-sm font-bold active:scale-95 transition-all"><Plus size={16} /> Add Topic</button>
          </div>
          <div className="space-y-4">
            {agendaItems.map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap lg:flex-nowrap items-center gap-4">
                <TimePicker label="Start" h={item.h} m={item.m} p={item.p} onChange={(k:any, v:any) => { const n = [...agendaItems]; (n[index] as any)[k] = v; setAgendaItems(n); }} light />
                <ArrowRight className="mt-4 text-gray-300 hidden lg:block" size={16}/>
                <TimePicker label="End" h={item.hEnd} m={item.mEnd} p={item.pEnd} onChange={(k:any, v:any) => { const n = [...agendaItems]; (n[index] as any)[k === 'h' ? 'hEnd' : k === 'm' ? 'mEnd' : 'pEnd'] = v; setAgendaItems(n); }} light />
                <div className="flex-1 min-w-[200px] flex flex-col gap-1">
                   <span className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-wider">Discussion Topic</span>
                   <input className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Agenda topic..." value={item.desc} onChange={e => { const n = [...agendaItems]; n[index].desc = e.target.value; setAgendaItems(n); }} />
                </div>
                {index > 0 && <button onClick={() => removeRow(index, 'agenda')} className="self-end mb-2 text-red-300 hover:text-red-500"><Trash2 size={20} /></button>}
              </div>
            ))}
          </div>
        </div>

        {/* Topics & Decisions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-orange-800 text-sm uppercase tracking-widest flex items-center gap-2"><MessageSquare size={16}/> Topics Discussed</h2>
              <button onClick={() => addRow('topics')} className="p-1 bg-orange-200 text-orange-800 rounded-lg hover:bg-orange-300 transition-colors"><Plus size={16}/></button>
            </div>
            {topics.map((t, i) => (
              <div key={i} className="flex gap-2 mb-2"><input className="flex-1 bg-white border-none rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-orange-400 outline-none" placeholder="Add note..." value={t} onChange={e => { const n = [...topics]; n[i] = e.target.value; setTopics(n); }} />{i > 0 && <button onClick={() => removeRow(i, 'topics')} className="text-orange-300"><Trash2 size={16}/></button>}</div>
            ))}
          </div>
          <div className="bg-green-50/50 p-6 rounded-[2rem] border border-green-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-green-800 text-sm uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={16}/> Decisions Taken</h2>
              <button onClick={() => addRow('decisions')} className="p-1 bg-green-200 text-green-800 rounded-lg hover:bg-green-300 transition-colors"><Plus size={16}/></button>
            </div>
            {decisions.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2"><input className="flex-1 bg-white border-none rounded-xl px-4 py-2 shadow-sm border-l-4 border-l-green-500 focus:ring-2 focus:ring-green-400 outline-none" placeholder="Add decision..." value={d} onChange={e => { const n = [...decisions]; n[i] = e.target.value; setDecisions(n); }} />{i > 0 && <button onClick={() => removeRow(i, 'decisions')} className="text-green-300"><Trash2 size={16}/></button>}</div>
            ))}
          </div>
        </div>

        <button 
          onClick={generatePDF} 
          disabled={isSaving}
          className={`w-full ${isSaving ? 'bg-gray-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'} text-white font-black py-5 rounded-2xl text-lg shadow-xl transition-all flex items-center justify-center gap-3`}
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" /> Syncing {activeCircle.name} data...
            </>
          ) : (
            <>
              <FileText /> Generate & Save {activeCircle.name} Minutes
            </>
          )}
        </button>
      </div>
    </main>
  );
}