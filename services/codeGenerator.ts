
export const getStreamlitCode = (): string => {
  return `
import streamlit as st
import time
from datetime import datetime
# Note: In a real environment, you would need 'transformers' and 'torch' installed.
# pip install streamlit transformers torch

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="NeuroForge | Local AI",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- THEME & CSS INJECTION (CYBERPUNK AESTHETIC) ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@300;500;700&display=swap');

    /* Variables matching the React App */
    :root {
        --bg-void: #030712;
        --bg-obsidian: #0f1117;
        --bg-basalt: #1a1d26;
        --neon-blue: #3b82f6;
        --neon-purple: #8b5cf6;
        --neon-green: #10b981;
        --neon-red: #ef4444;
        --text-main: #e2e8f0;
    }

    /* Global Overrides */
    .stApp {
        background-color: var(--bg-void);
        color: var(--text-main);
        font-family: 'Space Grotesk', sans-serif;
    }
    
    .stTextArea textarea {
        background-color: var(--bg-obsidian) !important;
        color: #f1f5f9 !important;
        border: 1px solid #1f2937 !important;
        font-family: 'JetBrains Mono', monospace !important;
    }
    
    .stTextArea textarea:focus {
        border-color: var(--neon-blue) !important;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.2) !important;
    }

    /* Buttons */
    .stButton button {
        background-color: rgba(59, 130, 246, 0.1) !important;
        border: 1px solid rgba(59, 130, 246, 0.5) !important;
        color: var(--neon-blue) !important;
        font-family: 'JetBrains Mono', monospace !important;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
    }
    
    .stButton button:hover {
        background-color: rgba(59, 130, 246, 0.2) !important;
        border-color: var(--neon-blue) !important;
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
    }

    /* Sidebar */
    section[data-testid="stSidebar"] {
        background-color: var(--bg-obsidian);
        border-right: 1px solid #1f2937;
    }

    /* Metrics/Cards */
    div[data-testid="metric-container"] {
        background-color: var(--bg-basalt);
        border: 1px solid #1f2937;
        padding: 10px;
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)

# --- SESSION STATE ---
if 'content' not in st.session_state:
    st.session_state.content = ""
if 'logs' not in st.session_state:
    st.session_state.logs = []
if 'analysis' not in st.session_state:
    st.session_state.analysis = None

def add_log(source, message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    st.session_state.logs.append(f"[{timestamp}] {source}: {message}")
    # Keep last 5 logs
    if len(st.session_state.logs) > 5:
        st.session_state.logs.pop(0)

# --- SIDEBAR CONFIG ---
with st.sidebar:
    st.title("NEUROFORGE")
    st.caption("LOCAL_INFERENCE_ENGINE")
    
    st.divider()
    
    st.subheader("Generator Matrix")
    temperature = st.slider("Temperature", 0.1, 1.5, 0.8)
    max_tokens = st.slider("Max Tokens", 10, 200, 50)
    
    st.divider()
    
    st.subheader("Analysis Module")
    model_choice = st.selectbox(
        "Classifier Model", 
        ["distilbert-base-uncased-finetuned-sst-2-english", "toxic-bert", "multilingual-bert"]
    )
    
    st.info("System Online. Neural pathways active.")

# --- MOCK AI SERVICES (To Replace with Transformers) ---
# In a real app, you would import pipelines here:
# generator = pipeline('text-generation', model='distilgpt2')
# classifier = pipeline('sentiment-analysis', model=model_choice)

def mock_generate(prompt):
    time.sleep(1.5) # Simulate inference
    return " [Generated Sequence: The neural network has extended your thought based on the current context vector.]"

def mock_analyze(text):
    time.sleep(1.0)
    # Mock logic based on keywords
    score = 0.95
    label = "POSITIVE" if "good" in text.lower() or "neural" in text.lower() else "NEGATIVE"
    conflict_score = 0.8 if "but" in text.lower() or "however" in text.lower() else 0.1
    return {"sentiment": {"label": label, "score": score}, "conflict": conflict_score}

# --- MAIN LAYOUT ---
col_editor, col_telemetry = st.columns([3, 1])

# --- EDITOR PANE ---
with col_editor:
    st.markdown("### WORKSPACE")
    new_content = st.text_area(
        "Input Sequence", 
        value=st.session_state.content, 
        height=500,
        label_visibility="collapsed",
        placeholder="// Type your prompt here..."
    )
    
    # Update state if changed manually
    if new_content != st.session_state.content:
        st.session_state.content = new_content
        # Trigger analysis debounce could go here

    if st.button("EXECUTE GENERATION", use_container_width=True):
        if not st.session_state.content.strip():
            st.warning("Input buffer empty.")
        else:
            add_log("AI", f"Synthesizing (Temp: {temperature})...")
            with st.spinner("Generating sequences..."):
                generated = mock_generate(st.session_state.content)
                st.session_state.content += generated
                st.rerun()

# --- TELEMETRY PANE ---
with col_telemetry:
    # Manual Trigger for Analysis in Streamlit (vs automatic in React)
    if st.button("RUN DIAGNOSTICS", use_container_width=True):
        add_log("SYSTEM", "Running Analysis Engine...")
        result = mock_analyze(st.session_state.content)
        st.session_state.analysis = result
    
    st.divider()
    
    st.markdown("#### NEURAL TELEMETRY")
    
    if st.session_state.analysis:
        res = st.session_state.analysis
        
        # Sentiment
        st.markdown("**PRIMARY SENTIMENT**")
        s_color = "green" if res['sentiment']['label'] == 'POSITIVE' else "red"
        st.markdown(f":{s_color}[{res['sentiment']['label']}]")
        st.progress(res['sentiment']['score'])
        
        st.markdown("---")
        
        # Conflict
        st.markdown("**CONFLICT SCAN**")
        c_score = res['conflict']
        c_label = "CONFLICT DETECTED" if c_score > 0.5 else "CONSISTENT"
        c_color = "orange" if c_score > 0.5 else "gray"
        st.markdown(f":{c_color}[{c_label}]")
        st.progress(c_score)
        
    else:
        st.markdown("*NO SIGNAL*")
        
    st.divider()
    
    st.markdown("#### SYSTEM LOG")
    log_container = st.container(height=200)
    with log_container:
        for log in reversed(st.session_state.logs):
            st.text(log)

# --- FOOTER ---
st.markdown("---")
st.caption("NEUROFORGE // LOCAL INFERENCE // STREAMLIT PROTOTYPE")
`;
};
