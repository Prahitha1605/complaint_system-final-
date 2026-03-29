"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Urgency = "HIGH" | "MEDIUM" | "LOW";
type Status = "Pending" | "In Progress" | "Resolved";

type Complaint = {
  caseId: string;
  anonymous: boolean;
  name?: string;
  mobile?: string;
  district: string;
  category: string;
  department: string;
  urgency: Urgency;
  dateOfIncident: string;
  incidentLocation: string;
  description: string;
  evidenceName?: string;
  status: Status;
  createdAt: string;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

type ComplaintContextShape = {
  complaints: Complaint[];
  addComplaint: (complaint: Complaint) => void;
  updateStatus: (caseId: string, status: Status) => void;
  lastSubmitted?: Complaint;
  setLastSubmitted: (c?: Complaint) => void;
};

const ComplaintContext = createContext<ComplaintContextShape | undefined>(undefined);

const CATEGORY_TO_DEPARTMENT: Record<string, string> = {
  "Bribery / Corruption (லஞ்சம்)": "DVAC",
  "Large Scale Accident / Safety Risk (பெரும் விபத்து)": "District Collector Office + Police",
  "Official Misconduct (அலுவலர் நடத்தை)": "District Collector Office",
  "Land / Revenue Dispute (நில தகராறு)": "Revenue Department",
  "Theft / Criminal Activity (திருட்டு)": "Police",
  "Public Service Delay (சேவை தாமதம்)": "Relevant Department",
  "Civic Infrastructure (சாலை, நீர், மின்சாரம்)": "PWD / Municipal Corporation / Electricity Board",
  "Other (மற்றவை)": "District Collector Office",
};

const CATEGORY_TO_URGENCY: Record<string, Urgency> = {
  "Bribery / Corruption (லஞ்சம்)": "HIGH",
  "Large Scale Accident / Safety Risk (பெரும் விபத்து)": "HIGH",
  "Official Misconduct (அலுவலர் நடத்தை)": "MEDIUM",
  "Land / Revenue Dispute (நில தகராறு)": "MEDIUM",
  "Theft / Criminal Activity (திருட்டு)": "MEDIUM",
  "Public Service Delay (சேவை தாமதம்)": "LOW",
  "Civic Infrastructure (சாலை, நீர், மின்சாரம்)": "LOW",
  "Other (மற்றவை)": "LOW",
};

const DISTRICTS = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Tiruchirappalli",
  "Salem",
  "Tirunelveli",
  "Vellore",
  "Erode",
  "Thoothukudi",
  "Dindigul",
  "Thanjavur",
  "Ranipet",
  "Kancheepuram",
  "Chengalpattu",
  "Villupuram",
  "Cuddalore",
  "Nagapattinam",
  "Tiruvarur",
  "Mayiladuthurai",
  "Ariyalur",
  "Perambalur",
  "Karur",
  "Namakkal",
  "Dharmapuri",
  "Krishnagiri",
  "Tirupattur",
  "The Nilgiris",
  "Coimbatore",
  "Tiruppur",
  "Kallakurichi",
  "Virudhunagar",
  "Ramanathapuram",
  "Sivaganga",
  "Pudukkottai",
  "Theni",
  "Tenkasi",
  "Kanyakumari",
  "Tiruvannamalai",
];

const CATEGORY_OPTIONS = Object.keys(CATEGORY_TO_DEPARTMENT);

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    caseId: "TN-2025-10234",
    anonymous: true,
    district: "Chennai",
    category: "Bribery / Corruption (லஞ்சம்)",
    department: "Revenue Dept",
    urgency: "HIGH",
    dateOfIncident: "2025-03-01",
    incidentLocation: "Chennai local office",
    description: "Bribery requested by official for water connection.",
    status: "Pending",
    createdAt: "2025-03-02",
  },
  {
    caseId: "TN-2025-10235",
    anonymous: true,
    district: "Madurai",
    category: "Large Scale Accident / Safety Risk (பெரும் விபத்து)",
    department: "Police",
    urgency: "HIGH",
    dateOfIncident: "2025-02-25",
    incidentLocation: "Madurai highway",
    description: "Big accident due to poor road and no signage.",
    status: "In Progress",
    createdAt: "2025-02-26",
  },
  {
    caseId: "TN-2025-10236",
    anonymous: false,
    name: "Priya R.",
    district: "Coimbatore",
    category: "Official Misconduct (அலுவலர் நடத்தை)",
    department: "District Collector Office",
    urgency: "MEDIUM",
    dateOfIncident: "2025-01-10",
    incidentLocation: "Coimbatore revenue office",
    description: "Officer denied service and demanded informal payment.",
    status: "Pending",
    createdAt: "2025-01-11",
  },
  {
    caseId: "TN-2025-10237",
    anonymous: true,
    district: "Salem",
    category: "Theft / Criminal Activity (திருட்டு)",
    department: "Police",
    urgency: "MEDIUM",
    dateOfIncident: "2025-03-05",
    incidentLocation: "Salem market",
    description: "Community fund stolen by local council member.",
    status: "Pending",
    createdAt: "2025-03-06",
  },
  {
    caseId: "TN-2025-10238",
    anonymous: false,
    name: "Murugan K.",
    district: "Villupuram",
    category: "Land / Revenue Dispute (நில தகராறு)",
    department: "Revenue Dept",
    urgency: "MEDIUM",
    dateOfIncident: "2025-01-20",
    incidentLocation: "Villupuram village",
    description: "Neighbor encroached farmland and revenue office did not act.",
    status: "In Progress",
    createdAt: "2025-01-21",
  },
  {
    caseId: "TN-2025-10239",
    anonymous: true,
    district: "Thanjavur",
    category: "Public Service Delay (சேவை தாமதம்)",
    department: "Health Dept",
    urgency: "LOW",
    dateOfIncident: "2025-02-15",
    incidentLocation: "Thanjavur clinic",
    description: "Hospital appointment delayed by weeks with no information.",
    status: "Pending",
    createdAt: "2025-02-16",
  },
  {
    caseId: "TN-2025-10240",
    anonymous: false,
    name: "Kavitha S.",
    district: "Tirunelveli",
    category: "Civic Infrastructure (சாலை, நீர், மின்சாரம்)",
    department: "PWD",
    urgency: "LOW",
    dateOfIncident: "2025-01-05",
    incidentLocation: "Tirunelveli road",
    description: "Streetlights and water drain not repaired for months.",
    status: "Resolved",
    createdAt: "2025-01-06",
  },
  {
    caseId: "TN-2025-10241",
    anonymous: true,
    district: "Vellore",
    category: "Bribery / Corruption (லஞ்சம்)",
    department: "DVAC",
    urgency: "HIGH",
    dateOfIncident: "2025-03-09",
    incidentLocation: "Vellore local office",
    description: "Staff asked for bribe to release public project money.",
    status: "Pending",
    createdAt: "2025-03-10",
  },
];

const HOME_BUTTON_STYLE =
  "inline-flex items-center gap-2 px-3 py-2 rounded-md font-semibold text-white bg-[#1a2e4a] hover:bg-[#162444]";

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white`} style={{ backgroundColor: color }}>
    {label}
  </span>
);

function ComplaintProvider({ children }: { children: React.ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [lastSubmitted, setLastSubmitted] = useState<Complaint | undefined>(undefined);

  const addComplaint = (complaint: Complaint) => {
    setComplaints((current) => [complaint, ...current]);
    setLastSubmitted(complaint);
  };

  const updateStatus = (caseId: string, status: Status) => {
    setComplaints((current) =>
      current.map((complaint) =>
        complaint.caseId === caseId ? { ...complaint, status } : complaint
      )
    );
  };

  return (
    <ComplaintContext.Provider
      value={{ complaints, addComplaint, updateStatus, lastSubmitted, setLastSubmitted }}
    >
      {children}
    </ComplaintContext.Provider>
  );
}

function useComplaints() {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error("useComplaints must be used within ComplaintProvider");
  }
  return context;
}

function HomeBar() {
  const location = useLocation();
  if (location.pathname === "/") {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-2 sm:px-6 flex justify-start">
        <Link to="/" className={HOME_BUTTON_STYLE}>
          <span>🏠</span>
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-[#1a2e4a] text-white py-3 mt-8 border-t border-[#dde3f0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm">
        All complaints are confidential | Powered by AI | Tamil Nadu Government
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-96px)] bg-white text-[#1a2e4a] px-4 py-10 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-6 text-6xl leading-none">🏵️</div>
        <h1 className="text-3xl sm:text-5xl font-bold">Tamil Nadu Grievance Redressal Portal</h1>
        <p className="mt-2 text-xl text-[#1a2e4a] font-semibold">தமிழ்நாடு புகார் தீர்வு தளம்</p>
        <p className="mt-4 text-lg text-[#1a2e4a]">Your voice matters. File complaints safely and anonymously.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-1">
          <Link
            to="/citizen-welcome"
            className="px-4 py-4 rounded-lg bg-[#f4a300] text-[#1a2e4a] text-lg font-bold shadow-md hover:bg-[#e69400] block"
          >
            🧑‍🌾 I am a Citizen / நான் ஒரு குடிமகன்
          </Link>
          <Link
            to="/authority"
            className="px-4 py-4 rounded-lg border border-[#1a2e4a] bg-white text-[#1a2e4a] text-lg font-bold shadow-sm hover:bg-[#f0f6ff] block"
          >
            🏛️ I am an Authority / நான் ஒரு அதிகாரி
          </Link>
        </div>
      </div>
      <div className="mt-16 text-center text-sm text-slate-500">
        <p>All complaints are confidential | Powered by AI | Tamil Nadu Government</p>
      </div>
    </div>
  );
}

function CitizenWelcomePage() {
  return (
    <div className="min-h-[calc(100vh-96px)] bg-white px-4 py-6 sm:px-6">
      <div className="max-w-3xl mx-auto rounded-xl border border-[#dae6f0] p-5 sm:p-8 shadow-sm">
        <div className="text-lg font-semibold text-[#1a2e4a]">💡 Before filing, our AI assistant can help you understand what category your issue falls under, which law may apply, and which department can help.</div>
        <p className="mt-2 text-[#1a2e4a]">புகார் பதிவு செய்வதற்கு முன், எங்கள் AI உதவியாளரிடம் பேசுங்கள். இது உங்களுக்கு வழிகாட்டும்.</p>
        <div className="mt-4 inline-flex items-center px-3 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">🔒 Your identity is always protected</div>

        <div className="mt-8 grid gap-4">
          <Link
            to="/chatbot"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#f4a300] text-[#1a2e4a] px-4 py-4 font-bold text-lg shadow-md hover:bg-[#e69400]"
          >
            💬 Chat with AI Assistant (Recommended) / AI உதவியாளரிடம் பேசுங்கள்
          </Link>
          <Link
            to="/complaint-form"
            className="flex items-center justify-center gap-2 rounded-lg border border-[#1a2e4a] text-[#1a2e4a] px-4 py-4 font-bold text-lg hover:bg-[#f0f6ff]"
          >
            📝 Skip & File Complaint Directly / நேரடியாக புகார் செய்யுங்கள்
          </Link>
        </div>
      </div>
    </div>
  );
}

const SYSTEM_PROMPT = `You are a bilingual (English and Tamil) legal awareness assistant for the Tamil Nadu District Grievance Redressal System. Your only role is to SUGGEST and GUIDE citizens — never to command, judge, or make definitive legal statements.

When a citizen describes their issue:
1. Acknowledge with empathy in 1 sentence
2. Suggest the complaint CATEGORY it may fall under:
   Bribery/Corruption, Public Service Delay, Official Misconduct, Land/Revenue Dispute, Civic Infrastructure, Large Scale Accident/Safety, Theft, Other
3. Suggest which LAW may be relevant (choose from):
   Prevention of Corruption Act 1988, RTI Act 2005, IPC Section 166, Whistleblowers Protection Act 2011, Lokpal & Lokayuktas Act 2013, IT Act 2000
   Explain each law in ONE plain simple sentence.
4. Suggest which DEPARTMENT could help:
   DVAC, District Collector Office, Revenue Department, Police, PWD, Health Department, Electricity Board, Municipal Corporation
5. Tell them if their complaint can be filed on this platform or if they need external help
6. Always end with:
   'You may click File My Complaint above to proceed, or continue asking me questions.'

STRICT LANGUAGE RULES:
- Always respond in BOTH English AND Tamil
- English first, then Tamil below a divider line ———
- Simple words only — no legal jargon without explanation
- NEVER use: must, should, have to, required, illegal, criminal (when referring to the user/complainant)
- ALWAYS use: may, could, might, one option is, you are welcome to, it may help to
- Tone: warm, calm, reassuring — like a trusted elder`;

function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I am here to help you understand your rights before filing a complaint. Please describe your issue in your own words — in English or Tamil.\n\nவணக்கம்! புகார் பதிவு செய்வதற்கு முன் உங்களுக்கு வழிகாட்ட நான் இங்கே இருக்கிறேன். நீங்கள் எதிர்கொள்ளும் பிரச்சனையை உங்கள் சொந்த வார்த்தைகளில் சொல்லுங்கள்.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey =
    process.env.NEXT_PUBLIC_GROQ_API_KEY ||
    process.env.VITE_GROQ_API_KEY ||
    (typeof window !== "undefined" ? (window as any).VITE_GROQ_API_KEY : undefined) ||
    "";

  const sendMessage = async () => {
    const cleanInput = input.trim();
    if (!cleanInput) return;

    setMessages((prev) => [...prev, { role: "user", content: cleanInput }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      if (!apiKey) {
        throw new Error("API key is missing");
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: cleanInput },
          ],
          max_tokens: 600,
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(`Groq API error: ${response.status} ${bodyText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "Sorry, I could not get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to reach AI assistant. Please try again later.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I am sorry, I am not able to connect to the AI service right now. You may continue to file your complaint directly.\n\nமன்னிக்கவும், தற்போது AI சேவையுடன் இணைக்க முடியவில்லை. நீங்கள் நேரடியாக உங்கள் புகாரை பதிவு செய்யலாம்.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage();
  };

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#f7fbff] px-4 py-6 sm:px-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-[#dae6f0] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e4a]">AI Legal Assistant / AI சட்ட உதவியாளர்</h2>
          <div className="flex gap-2">
            <Link to="/complaint-form" className="inline-flex items-center gap-2 px-3 py-2 bg-[#f4a300] text-[#1a2e4a] rounded-md font-semibold">
              📝 File My Complaint
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 px-3 py-2 border border-[#1a2e4a] text-[#1a2e4a] rounded-md font-semibold">
              🏠 Exit to Home
            </Link>
          </div>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-green-100 text-green-800 font-medium">
          🔒 Your identity is protected
        </div>

        <div className="mt-6 max-h-[52vh] overflow-y-auto rounded-lg border border-[#d4e2f5] p-4 bg-[#f8fafc] space-y-3">
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] whitespace-pre-wrap rounded-xl p-3 text-sm ${
                  msg.role === "user"
                    ? "bg-[#1a2e4a] text-white text-right"
                    : "bg-slate-100 text-[#1a2e4a]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-[#a7c3e0] px-3 py-2 text-base"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your issue in English or Tamil / உங்கள் பிரச்சனையை எளிமையாக சொல்லுங்கள்"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#f4a300] text-[#1a2e4a] font-semibold px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

function ComplaintFormPage() {
  const { addComplaint } = useComplaints();
  const navigate = useNavigate();

  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [department, setDepartment] = useState(CATEGORY_TO_DEPARTMENT[CATEGORY_OPTIONS[0]]);
  const [urgency, setUrgency] = useState(CATEGORY_TO_URGENCY[CATEGORY_OPTIONS[0]]);
  const [dateOfIncident, setDateOfIncident] = useState("");
  const [incidentLocation, setIncidentLocation] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceName, setEvidenceName] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDepartment(CATEGORY_TO_DEPARTMENT[category] || "District Collector Office");
    setUrgency(CATEGORY_TO_URGENCY[category] || "LOW");
  }, [category]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEvidenceName(file.name);
    } else {
      setEvidenceName(undefined);
    }
  };

  const validate = () => {
    if (!district.trim() || !category.trim() || !dateOfIncident.trim() || !incidentLocation.trim()) {
      return "Please fill all required fields: District, Category, Date, Location.";
    }
    if (description.trim().length < 50) {
      return "Complaint Description must have at least 50 characters.";
    }
    if (dateOfIncident > new Date().toISOString().split("T")[0]) {
      return "Date of incident cannot be in the future.";
    }
    return null;
  };

  const generateCaseId = () => {
    const year = new Date().getFullYear();
    const number = String(Math.floor(10000 + Math.random() * 90000));
    return `TN-${year}-${number}`;
  };

  const onSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const newComplaint: Complaint = {
      caseId: generateCaseId(),
      anonymous,
      name: anonymous ? undefined : name.trim() || undefined,
      mobile: anonymous ? undefined : mobile.trim() || undefined,
      district,
      category,
      department,
      urgency,
      dateOfIncident,
      incidentLocation,
      description,
      evidenceName,
      status: "Pending",
      createdAt: new Date().toISOString().split("T")[0],
    };

    addComplaint(newComplaint);
    setError(null);
    navigate("/success");
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#f7fbff] px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white border border-[#dae6f0] rounded-xl shadow-sm p-5 sm:p-8">
        <div className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full bg-blue-50 text-[#1a2e4a]">
          💡 Not sure what to fill? Chat with our AI assistant first —
          <Link to="/chatbot" className="underline text-[#1a2e4a]">
            Chat Now
          </Link>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-sm font-medium">
          🔒 Your identity is protected
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <input
              id="anonymous"
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="anonymous" className="text-lg font-semibold text-[#1a2e4a]">
              🔒 File Anonymously / அநாமதேய புகார்
            </label>
          </div>

          {!anonymous && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium">Full Name</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[#a7c3e0] px-3 py-2"
                  placeholder="Optional — leave blank to stay anonymous"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Mobile Number</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[#a7c3e0] px-3 py-2"
                  placeholder="Optional — for Case ID via SMS"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </label>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium">District</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#a7c3e0] px-3 py-2"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Complaint Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#a7c3e0] px-3 py-2"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Concerned Department</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#a7c3e0] px-3 py-2"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium">Urgency Level</span>
              <div className="mt-1">
                <Badge
                  label={
                    urgency === "HIGH"
                      ? "🔴 HIGH"
                      : urgency === "MEDIUM"
                      ? "🟡 MEDIUM"
                      : "🟢 LOW"
                  }
                  color={urgency === "HIGH" ? "#dc2626" : urgency === "MEDIUM" ? "#d97706" : "#16a34a"}
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium block">Date of Incident</label>
              <input
                type="date"
                max={today}
                value={dateOfIncident}
                onChange={(e) => setDateOfIncident(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#a7c3e0] px-3 py-2"
              />
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Location of Incident</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#a7c3e0] px-3 py-2"
              placeholder="Village, town, or specific location"
              value={incidentLocation}
              onChange={(e) => setIncidentLocation(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Complaint Description</span>
            <textarea
              rows={5}
              className="mt-1 w-full rounded-lg border border-[#a7c3e0] px-3 py-2"
              placeholder="Describe what happened, when, and who was involved. More detail helps faster resolution. நடந்தது என்ன, எப்போது, யார் என்று விவரமாக சொல்லுங்கள்."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">📎 Upload photo or document (optional)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFile}
              className="mt-1"
            />
            {evidenceName ? <p className="text-xs text-slate-500 mt-1">Uploaded: {evidenceName}</p> : null}
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#f4a300] text-[#1a2e4a] font-bold text-lg"
          >
            Submit Complaint / புகார் சமர்ப்பிக்கவும்
          </button>
        </form>
      </div>
    </div>
  );
}

function SuccessPage() {
  const { lastSubmitted } = useComplaints();
  const navigate = useNavigate();

  if (!lastSubmitted) {
    return (
      <div className="min-h-[calc(100vh-96px)] bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#1a2e4a]">No complaint was found. Please submit a complaint first.</p>
          <button onClick={() => navigate("/complaint-form")} className="mt-4 px-4 py-2 rounded bg-[#1a2e4a] text-white">
            Go to Complaint Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#f7fbff] px-4 py-6 sm:px-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-[#dae6f0] p-6 text-center">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-[#1a2e4a] mt-2">Complaint Submitted Successfully</h2>
        <p className="mt-2 text-[#1a2e4a]">உங்கள் புகார் பதிவு செய்யப்பட்டது.</p>
        <p className="mt-3 text-lg font-semibold">Your Case ID: {lastSubmitted.caseId}</p>
        <p className="text-sm text-slate-600">Save this Case ID to track your complaint.</p>
        <p className="mt-2 text-sm text-green-700 font-semibold">🔒 Your identity is fully protected</p>
        <button
          onClick={() => navigate("/")}
          className="mt-5 px-5 py-2 rounded-lg bg-[#1a2e4a] text-white font-semibold"
        >
          🏠 Return to Home
        </button>
      </div>
    </div>
  );
}

function AuthorityPage() {
  const { complaints, updateStatus } = useComplaints();

  const [tab, setTab] = useState<"list" | "overview">("list");
  const [urgencyFilter, setUrgencyFilter] = useState<"All" | Urgency>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [districtFilter, setDistrictFilter] = useState<string>("All");

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (urgencyFilter !== "All" && c.urgency !== urgencyFilter) return false;
      if (categoryFilter !== "All" && c.category !== categoryFilter) return false;
      if (districtFilter !== "All" && c.district !== districtFilter) return false;
      return true;
    });
  }, [complaints, urgencyFilter, categoryFilter, districtFilter]);

  const total = complaints.length;
  const high = complaints.filter((c) => c.urgency === "HIGH").length;
  const medium = complaints.filter((c) => c.urgency === "MEDIUM").length;
  const low = complaints.filter((c) => c.urgency === "LOW").length;
  const pending = complaints.filter((c) => c.status === "Pending").length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;

  const categoryData = Object.keys(CATEGORY_TO_DEPARTMENT).map((cat) => ({
    category: cat.replace(/\s*\(.+\)/, ""),
    count: complaints.filter((c) => c.category === cat).length,
  }));

  const urgencyData = [
    { name: "High", value: high, color: "#dc2626" },
    { name: "Medium", value: medium, color: "#d97706" },
    { name: "Low", value: low, color: "#16a34a" },
  ];

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#f7fbff] px-4 py-6 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h2 className="text-2xl font-bold text-[#1a2e4a]">Authority Dashboard</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTab("list")}
              className={`px-3 py-2 rounded ${tab === "list" ? "bg-[#1a2e4a] text-white" : "bg-white text-[#1a2e4a] border border-[#1a2e4a]"}`}
            >
              📋 Complaints List
            </button>
            <button
              onClick={() => setTab("overview")}
              className={`px-3 py-2 rounded ${tab === "overview" ? "bg-[#1a2e4a] text-white" : "bg-white text-[#1a2e4a] border border-[#1a2e4a]"}`}
            >
              📊 Overview
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-[#1a2e4a] text-white p-4">
            <p className="text-sm">Total Complaints</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="rounded-lg bg-[#dc2626] text-white p-4">
            <p className="text-sm">🔴 High Urgency</p>
            <p className="text-2xl font-bold">{high}</p>
          </div>
          <div className="rounded-lg bg-[#d97706] text-white p-4">
            <p className="text-sm">🟡 Pending</p>
            <p className="text-2xl font-bold">{pending}</p>
          </div>
          <div className="rounded-lg bg-[#16a34a] text-white p-4">
            <p className="text-sm">🟢 Resolved</p>
            <p className="text-2xl font-bold">{resolved}</p>
          </div>
        </div>

        {tab === "list" ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value as any)} className="rounded-lg border border-[#a7c3e0] px-3 py-2">
                <option value="All">All Urgency</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-[#a7c3e0] px-3 py-2">
                <option value="All">All Categories</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="rounded-lg border border-[#a7c3e0] px-3 py-2">
                <option value="All">All Districts</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg border border-[#dae6f0] text-sm">
                <thead className="bg-[#1a2e4a] text-white">
                  <tr>
                    <th className="p-2 text-left">Case ID</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">District</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Urgency</th>
                    <th className="p-2 text-left">Department</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Filed By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-500">
                        No complaints found.
                      </td>
                    </tr>
                  )}
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.caseId} className="border-t border-[#e8eff9] hover:bg-[#f8fbff]">
                      <td className="p-2 font-semibold">{complaint.caseId}</td>
                      <td className="p-2">{complaint.category.replace(/\s*\(.+\)/, "")}</td>
                      <td className="p-2">{complaint.district}</td>
                      <td className="p-2">{complaint.dateOfIncident}</td>
                      <td className="p-2">
                        <Badge
                          label={
                            complaint.urgency === "HIGH"
                              ? "🔴 HIGH"
                              : complaint.urgency === "MEDIUM"
                              ? "🟡 MEDIUM"
                              : "🟢 LOW"
                          }
                          color={
                            complaint.urgency === "HIGH"
                              ? "#dc2626"
                              : complaint.urgency === "MEDIUM"
                              ? "#d97706"
                              : "#16a34a"
                          }
                        />
                      </td>
                      <td className="p-2">{complaint.department}</td>
                      <td className="p-2">
                        <select
                          value={complaint.status}
                          onChange={(e) => updateStatus(complaint.caseId, e.target.value as Status)}
                          className="rounded-lg border border-[#a7c3e0] px-2 py-1"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="p-2">{complaint.anonymous ? "Anonymous" : complaint.name || "Anonymous"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 border border-[#dae6f0] shadow-sm">
              <h3 className="font-semibold text-[#1a2e4a] mb-2">Complaints by Category</h3>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#1a2e4a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#dae6f0] shadow-sm">
              <h3 className="font-semibold text-[#1a2e4a] mb-2">Complaints by Urgency</h3>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie dataKey="value" data={urgencyData} nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {urgencyData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ComplaintProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white text-[#1a2e4a]" style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
          <HomeBar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/citizen-welcome" element={<CitizenWelcomePage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/complaint-form" element={<ComplaintFormPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/authority" element={<AuthorityPage />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
          <SiteFooter />
        </div>
      </BrowserRouter>
    </ComplaintProvider>
  );
}
