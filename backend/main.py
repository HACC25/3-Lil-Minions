import os
import asyncio
import threading
import queue
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv
from google.cloud import dialogflowcx_v3beta1 as dialogflowcx
import json
import time
import logging
from typing import Dict, Any
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import re

# Deepgram
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION = os.getenv("LOCATION")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

# Load Google Cloud credentials
key_path = Path(__file__).parent / "key.json"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(key_path)
endpoint = f"{LOCATION}-dialogflow.googleapis.com"

# Initialize clients
agents_client = dialogflowcx.AgentsClient(
    client_options={"api_endpoint": endpoint}
)
playbooks_client = dialogflowcx.PlaybooksClient(
    client_options={"api_endpoint": endpoint}
)

app = FastAPI()

# CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Deepgram
deepgram = DeepgramClient(DEEPGRAM_API_KEY)

# Thread pool for handling multiple recognition streams
executor = ThreadPoolExecutor(max_workers=20)

# Simple session manager
class UserSessionManager:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.Lock()
    
    def create_session(self, conversation_id: str) -> str:
        with self.lock:
            session_id = str(uuid.uuid4())
            self.sessions[conversation_id] = {
                "session_id": session_id,
                "created_at": time.time(),
                "last_activity": time.time()
            }
            return session_id
    
    def get_session(self, conversation_id: str) -> str:
        with self.lock:
            if conversation_id in self.sessions:
                self.sessions[conversation_id]["last_activity"] = time.time()
                return self.sessions[conversation_id]["session_id"]
            return None

session_manager = UserSessionManager()

# Connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.lock = threading.Lock()
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        with self.lock:
            self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        with self.lock:
            if client_id in self.active_connections:
                del self.active_connections[client_id]
        logger.info(f"Client {client_id} disconnected. Total: {len(self.active_connections)}")

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"message": "Simplified WebSocket Backend Running"}

@app.get("/status")
async def get_status():
    return {
        "status": "healthy",
        "active_connections": len(manager.active_connections),
        "auth_enabled": False
    }

def clean_dialogflow_response(response_text: str) -> str:
    """Clean Dialogflow responses to remove technical text"""
    if not response_text:
        return response_text
    
    # Check for termination phrases
    termination_phrases = [
        "I'm sorry, but I can't continue this conversation. Goodbye",
        "I'm ending the interview now. Goodbye",
        "Have a great rest of your day!"
    ]
    
    for phrase in termination_phrases:
        if phrase.lower() in response_text.lower():
            phrase_index = response_text.lower().find(phrase.lower())
            response_text = response_text[:phrase_index + len(phrase)]
            break
    
    # Remove technical patterns
    patterns_to_remove = [
        r'\b(?:Overview|Introduction|Technical|Behavioral|Conclusion)\s+Flow\b',
        r'\$\{PLAYBOOK:\s*[^}]*\}',
        r'\[Internal Context\].*?(?=\[|$)',
        r'DO NOT SHARE BOT PERSONALITY',
        r'set: \$session\.params\.interviewEnd = true',
    ]
    
    cleaned = response_text
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned, flags=re.MULTILINE | re.IGNORECASE)
    
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    if not cleaned or len(cleaned) < 10:
        return "Let me continue with the interview."
    
    return cleaned

def get_dialogflow_response(transcript: str, conversation_id: str, agent_id: str) -> tuple[str, str, dict]:
    """Get response from Dialogflow"""
    session_client = dialogflowcx.SessionsClient(
        client_options={"api_endpoint": f"{LOCATION}-dialogflow.googleapis.com"}
    )
    
    session_id = session_manager.get_session(conversation_id)
    if not session_id:
        session_id = session_manager.create_session(conversation_id)

    session_path = session_client.session_path(PROJECT_ID, LOCATION, agent_id, session_id)
    
    query_input = dialogflowcx.types.QueryInput(
        text=dialogflowcx.types.TextInput(text=transcript.strip()),
        language_code="en-US",
    )
    
    try:
        response = session_client.detect_intent(
            request={"session": session_path, "query_input": query_input}
        )
        
        session_params = dict(response.query_result.parameters) if response.query_result.parameters else {}
        
        response_list = []
        for message in response.query_result.response_messages:
            if message.text and message.text.text:
                raw_response = " ".join(message.text.text)
                cleaned = clean_dialogflow_response(raw_response)
                response_list.append(cleaned)
        
        if not response_list:
            response_list = ["Thanks for sharing that! Could you please elaborate?"]
        
        return f"User: {transcript}", response_list, session_params
        
    except Exception as e:
        logger.error(f"Dialogflow error: {e}")
        return f"User: {transcript}", ["Sorry, there was an error processing your request."], {}

# Main WebSocket endpoint - NO AUTHENTICATION
@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    client_id = str(uuid.uuid4())
    future = None
    
    try:
        # Get query parameters
        agent_id = websocket.query_params.get("agent_id")
        user_id = websocket.query_params.get("user_id", f"user_{uuid.uuid4()}")
        
        if not agent_id:
            await websocket.close(code=1008, reason="Missing agent_id")
            return
        
        # Accept connection immediately - NO AUTH CHECK
        await manager.connect(websocket, client_id)
        logger.info(f"WebSocket connected for agent {agent_id}, user {user_id}")
        
        # Create conversation ID
        conversation_id = str(uuid.uuid4())
        
        # Send initial greeting
        await asyncio.sleep(1)
        prompt, df_response, session_params = get_dialogflow_response("", conversation_id, agent_id)
        greeting_message = {
            "userTranscript": "",
            "dialogflowResponse": df_response,
            "sessionParams": session_params,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "isInitialGreeting": True,
        }
        await websocket.send_text(json.dumps(greeting_message))
        
        # Setup audio processing
        audio_queue = queue.Queue()
        flush_event = threading.Event()
        pause_event = threading.Event()
        stop_event = threading.Event()
        restart_event = threading.Event()
        
        sample_rate = int(websocket.query_params.get("sample_rate", 48000))
        
        options = LiveOptions(
            model="nova-3",
            language="en-US",
            interim_results=True,
            punctuate=True,
            smart_format=True,
            encoding="linear16",
            sample_rate=sample_rate,
            channels=1,
            filler_words=False,
            endpointing=300,
            vad_events=True,
            numerals=True,
            profanity_filter=False,
        )
        
        main_loop = asyncio.get_running_loop()
        
        # Transcript manager
        class TranscriptManager:
            def __init__(self):
                self.accumulated_transcript = ""
                self.lock = threading.Lock()
            
            def add_fragment(self, fragment):
                with self.lock:
                    self.accumulated_transcript += fragment + " "
            
            def get_and_clear(self):
                with self.lock:
                    transcript = self.accumulated_transcript.strip()
                    self.accumulated_transcript = ""
                    return transcript
            
            def get_current(self):
                with self.lock:
                    return self.accumulated_transcript.strip()
        
        transcript_manager = TranscriptManager()
        
        def run_deepgram_recognition():
            """Run Deepgram recognition"""
            
            def send_transcript_now():
                if pause_event.is_set():
                    return
                
                transcript_text = transcript_manager.get_and_clear()
                if not transcript_text:
                    return
                
                logger.info(f"Sending transcript: '{transcript_text}'")
                
                prompt, df_response, session_params = get_dialogflow_response(
                    transcript_text, conversation_id, agent_id
                )
                
                message = {
                    "userTranscript": transcript_text,
                    "dialogflowResponse": df_response,
                    "sessionParams": session_params,
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                }
                
                asyncio.run_coroutine_threadsafe(
                    websocket.send_text(json.dumps(message)),
                    main_loop
                )
            
            # Deepgram callbacks
            def on_message(self, result, **kwargs):
                if not result.channel.alternatives:
                    return
                
                best_alternative = result.channel.alternatives[0]
                transcript_text = best_alternative.transcript.strip()
                
                if not transcript_text:
                    return
                
                if result.is_final:
                    logger.info(f"Final: '{transcript_text}'")
                    transcript_manager.add_fragment(transcript_text)
                else:
                    # Send interim results
                    if not pause_event.is_set():
                        current = transcript_manager.get_current()
                        message = {
                            "userTranscript": f"{current} {transcript_text}".strip(),
                            "isInterim": True,
                            "conversation_id": conversation_id,
                            "user_id": user_id,
                        }
                        asyncio.run_coroutine_threadsafe(
                            websocket.send_text(json.dumps(message)),
                            main_loop
                        )
            
            def on_error(error, **kwargs):
                logger.error(f"Deepgram error: {error}")
            
            # Flush monitor thread
            def flush_monitor():
                while not stop_event.is_set():
                    if flush_event.wait(timeout=0.1):
                        send_transcript_now()
                        flush_event.clear()
            
            flush_thread = threading.Thread(target=flush_monitor, daemon=True)
            flush_thread.start()
            
            try:
                # Create Deepgram connection
                dg_connection = deepgram.listen.websocket.v("1")
                dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
                dg_connection.on(LiveTranscriptionEvents.Error, on_error)
                
                logger.info("Starting Deepgram connection")
                dg_connection.start(options)
                
                # Keep-alive thread
                def send_keep_alive():
                    while not stop_event.is_set():
                        time.sleep(5)
                        if not stop_event.is_set():
                            try:
                                dg_connection.send(json.dumps({"type": "KeepAlive"}))
                            except:
                                break
                
                threading.Thread(target=send_keep_alive, daemon=True).start()
                
                # Audio processing loop
                while not stop_event.is_set():
                    try:
                        audio_chunk = audio_queue.get(timeout=0.1)
                    except queue.Empty:
                        continue
                    
                    if audio_chunk is None:
                        break
                    
                    if isinstance(audio_chunk, dict):
                        continue
                    
                    if not pause_event.is_set():
                        dg_connection.send(audio_chunk)
                        
            except Exception as e:
                logger.error(f"Deepgram error: {e}")
            finally:
                try:
                    dg_connection.finish()
                except:
                    pass
        
        # Start recognition in thread pool
        future = executor.submit(run_deepgram_recognition)
        
        # Handle incoming WebSocket messages
        while True:
            message = await websocket.receive()
            
            if "text" in message:
                try:
                    data = json.loads(message["text"])
                    event_type = data.get("event")
                    
                    if event_type == "heartbeat":
                        continue
                    elif event_type == "end_of_speech":
                        logger.info("End of speech")
                        flush_event.set()
                    elif event_type == "pause_recognition":
                        pause_event.set()
                        logger.info("Recognition paused")
                    elif event_type == "resume_recognition":
                        pause_event.clear()
                        logger.info("Recognition resumed")
                except:
                    pass
                    
            elif "bytes" in message:
                # Audio data
                if not pause_event.is_set():
                    audio_queue.put(message["bytes"])
                    
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Cleanup
        stop_event.set()
        if future:
            future.cancel()
        manager.disconnect(client_id)
        logger.info(f"Cleaned up client {client_id}")