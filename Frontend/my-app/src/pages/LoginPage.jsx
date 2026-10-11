import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

const s = {
  page:{ minHeight:"100vh",display:"flex",background:"#090D16",fontFamily:"'Inter',system-ui,sans-serif"},
  left:{ flex:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 40px",background:"#090D16"},
  right:{ flex:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0F172A 0%,#111B2E 50%,#0F172A 100%)",borderLeft:"1px solid rgba(148,163,184,0.10)",padding:"48px",position:"relative",overflow:"hidden"},
  card:{ width:"100%",maxWidth:"400px"},
  brandRow:{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"40px"},
  logo:{ width:"40px",height:"40px",borderRadius:"12px",background:"linear-gradient(135deg,#38BDF8,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:"800",fontSize:"14px"},
  brandName:{ color:"#F1F5F9",fontSize:"16px",fontWeight:"700",letterSpacing:"-0.3px",margin:0},
  brandSub:{ color:"#64748B",fontSize:"9px",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.8px",marginTop:"2px"},
  heading:{ margin:"0 0 6px",color:"#F1F5F9",fontSize:"26px",fontWeight:"800",letterSpacing:"-0.5px"},
  sub:{ margin:"0 0 32px",color:"#64748B",fontSize:"13px",lineHeight:"1.5"},
  label:{ display:"block",marginBottom:"6px",color:"#94A3B8",fontSize:"11px",fontWeight:"700",letterSpacing:"0.4px",textTransform:"uppercase"},
  inputWrap:{ position:"relative",marginBottom:"16px"},
  icon:{ position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",color:"#64748B",display:"flex",alignItems:"center",pointerEvents:"none"},
  input:{ width:"100%",boxSizing:"border-box",background:"#111B2E",border:"1px solid rgba(148,163,184,0.10)",borderRadius:"10px",padding:"13px 16px 13px 40px",color:"#F1F5F9",fontSize:"14px",outline:"none",fontFamily:"inherit",transition:"border-color 0.2s ease"},
  inputF:{ borderColor:"rgba(56,189,248,0.5)",boxShadow:"0 0 0 3px rgba(56,189,248,0.08)"},
  errBox:{ marginBottom:"18px",padding:"12px 14px",background:"rgba(239,68,68,0.10)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"10px",color:"#F87171",fontSize:"13px",display:"flex",alignItems:"center",gap:"8px"},
  btn:{ width:"100%",marginTop:"10px",padding:"14px",border:"none",borderRadius:"10px",background:"linear-gradient(135deg,#38BDF8,#7C3AED)",color:"white",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",transition:"opacity 0.2s ease,transform 0.2s ease",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"},
  info:{ marginTop:"20px",padding:"14px",background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:"10px",fontSize:"11px",color:"#94A3B8",lineHeight:"1.6"},
  infoT:{ display:"block",color:"#38BDF8",fontWeight:"700",marginBottom:"6px",fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.5px"},
};

function Feature({ icon, title, desc }) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:"14px",marginBottom:"28px"}}>
      <div style={{width:"40px",height:"40px",borderRadius:"10px",background:"rgba(56,189,248,0.10)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",flexShrink:0}}>{icon}</div>
      <div>
        <div style={{color:"#F1F5F9",fontWeight:"700",fontSize:"14px",marginBottom:"3px"}}>{title}</div>
        <div style={{color:"#64748B",fontSize:"12px",lineHeight:"1.5"}}>{desc}</div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.access_token || res.data.token;
      const role = res.data.role;
      if (token) {
        localStorage.setItem("campusflow_token", token);
        navigate(role === "parent" ? "/parent-dashboard" : "/dashboard");
      } else {
        setError("No access token returned from server.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.card}>
          <div style={s.brandRow}>
            <div style={s.logo}>CF</div>
            <div>
              <p style={s.brandName}>CampusFlow AI</p>
              <span style={s.brandSub}>Academic Intelligence Platform</span>
            </div>
          </div>
          <h1 style={s.heading}>Welcome back</h1>
          <p style={s.sub}>Sign in to access your campus intelligence dashboard</p>
          {error && (
            <div style={s.errBox}>
              <AlertCircle size={15} style={{flexShrink:0}} />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div>
              <label style={s.label}>Email Address</label>
              <div style={s.inputWrap}>
                <span style={s.icon}><Mail size={15}/></span>
                <input id="login-email" type="email" required autoComplete="email"
                  value={email} onChange={e=>setEmail(e.target.value)}
                  onFocus={()=>setFocused("email")} onBlur={()=>setFocused(null)}
                  placeholder="you@university.edu"
                  style={{...s.input,...(focused==="email"?s.inputF:{})}}/>
              </div>
            </div>
            <div>
              <label style={s.label}>Password</label>
              <div style={s.inputWrap}>
                <span style={s.icon}><Lock size={15}/></span>
                <input id="login-password" type="password" required autoComplete="current-password"
                  value={password} onChange={e=>setPassword(e.target.value)}
                  onFocus={()=>setFocused("password")} onBlur={()=>setFocused(null)}
                  placeholder="••••••••"
                  style={{...s.input,...(focused==="password"?s.inputF:{})}}/>
              </div>
            </div>
            <button id="login-submit" type="submit" disabled={loading}
              style={{...s.btn,opacity:loading?0.7:1}}
              onMouseOver={e=>{if(!loading)e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";}}>
              {loading && <Loader2 size={16} style={{animation:"spin 0.8s linear infinite"}}/>}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div style={s.info}>
            <span style={s.infoT}>Access Information</span>
            Use credentials provided by your institution administrator.
            Role-based access: Admin · Faculty · Student · Parent.
          </div>
        </div>
      </div>
      <div style={s.right}>
        <div style={{maxWidth:"400px",width:"100%"}}>
          <div style={{marginBottom:"36px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",textTransform:"uppercase",letterSpacing:"1.2px",color:"#38BDF8",marginBottom:"10px"}}>
              Platform Features
            </div>
            <h2 style={{margin:"0 0 10px",color:"#F1F5F9",fontSize:"22px",fontWeight:"800",letterSpacing:"-0.4px"}}>
              AI-Powered Academic Intelligence
            </h2>
            <p style={{margin:0,color:"#64748B",fontSize:"13px",lineHeight:"1.6"}}>
              Real-time analytics, risk prediction, and automated reporting for modern educational institutions.
            </p>
          </div>
          <Feature icon="📊" title="Real-Time Analytics" desc="Monitor student performance, attendance trends and subject scores at a glance." />
          <Feature icon="🤖" title="AI Risk Prediction" desc="Identify at-risk students early using ML-powered attendance and marks analysis." />
          <Feature icon="📋" title="Automated Reporting" desc="Generate comprehensive academic PDF reports for students, faculty, and administration." />
          <Feature icon="📁" title="Data Import (ETL)" desc="Bulk import attendance and marks data via CSV or Excel with validation feedback." />
        </div>
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg);}}"}</style>
    </div>
  );
}
