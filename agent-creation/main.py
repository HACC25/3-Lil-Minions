import os
import asyncio
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google.cloud import dialogflowcx_v3beta1 as dialogflowcx
from google.cloud.dialogflowcx_v3beta1.types import Playbook, ParameterDefinition
from google.protobuf import field_mask_pb2
import json
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

from prompts_template import (
    BEHAVIORAL_FLOW_TEMPLATE,
    BEHAVIORAL_PLAYBOOK_META,
    BEHAVIORAL_QUESTIONS_CONTENT,
    INTRODUCTION_QUESTIONS_CONTENT,
    NO_BEHAVIORAL_QUESTIONS_CONTENT,
    NO_INTRODUCTION_QUESTIONS_CONTENT,
    NO_TECHNICAL_QUESTIONS_CONTENT,
    TECHNICAL_OVERVIEW_TEMPLATE,
    INTRODUCTION_FLOW_TEMPLATE,
    TECHNICAL_FLOW_TEMPLATE,
    CONCLUSION_FLOW_TEMPLATE,
    DEFAULT_COMPANY_DATA,
    DEFAULT_POSITION_DATA,
    OVERVIEW_PLAYBOOK_META,
    INTRODUCTION_PLAYBOOK_META,
    TECHNICAL_PLAYBOOK_META,
    CONCLUSION_PLAYBOOK_META,
    TECHNICAL_QUESTIONS_CONTENT,
    PRE_QUALIFICATION_PLAYBOOK_META,
    PRE_QUALIFICATION_FLOW_TEMPLATE,
    PRE_QUALIFICATION_QUESTIONS_CONTENT,
    NO_PRE_QUALIFICATION_QUESTIONS_CONTENT,
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION = os.getenv("LOCATION")

# Load Google Cloud credentials
key_path = Path(__file__).parent / "key.json"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(key_path)
endpoint = f"{LOCATION}-dialogflow.googleapis.com"

# Initialize Dialogflow clients
agents_client = dialogflowcx.AgentsClient(
    client_options={"api_endpoint": endpoint}
)
playbooks_client = dialogflowcx.PlaybooksClient(
    client_options={"api_endpoint": endpoint}
)

# Thread pool for async operations
executor = ThreadPoolExecutor(max_workers=10)

app = FastAPI(title="Dialogflow Agent Creation Service")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://hexcelerate.app",
    "https://banana.hexcelerate.app",
    "https://api.hexcelerate.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class PositionData(BaseModel):
    position_title: str = DEFAULT_POSITION_DATA["position_title"]
    job_description: str = DEFAULT_POSITION_DATA["job_description"]
    job_salary: str = DEFAULT_POSITION_DATA.get("job_salary", "competitive salary")

class CompanyData(BaseModel):
    company_name: str = DEFAULT_COMPANY_DATA["company_name"]
    company_industry: str = DEFAULT_COMPANY_DATA["company_industry"]
    company_description: str = DEFAULT_COMPANY_DATA["company_description"]
    company_mission: str = DEFAULT_COMPANY_DATA["company_mission"]

class PlaybookCustomization(BaseModel):
    position_data: PositionData = PositionData()
    company_data: CompanyData = CompanyData()
    bot_personality: str = "friendly and professional"
    introduction_questions: list[str] = []
    technical_questions: list[str] = []
    behavioral_questions: list[str] = []
    prequalification_questions: list[str] = []
    company_overview: str = DEFAULT_COMPANY_DATA["company_description"]

class AgentIn(BaseModel):
    display_name: str
    meta: dict
    playbook_goal: str
    customization: PlaybookCustomization = PlaybookCustomization()

# Helper Functions
def template_to_steps(template: str, indent: int = 4) -> list[Playbook.Step]:
    """
    Convert a template string into a list of Playbook.Step objects.
    Preserves exact formatting and indentation from the template.
    Each top-level bullet point (- ) becomes a new step.
    """
    steps = []
    current_step = []
    
    for line in template.strip().splitlines():
        line = line.rstrip()
        if not line.strip():
            continue
            
        if line.startswith('- '):
            if current_step:
                steps.append(Playbook.Step(text='\n'.join(current_step)))
                current_step = []
            current_step.append(line)
        else:
            current_step.append(line)
    
    if current_step:
        steps.append(Playbook.Step(text='\n'.join(current_step)))
    
    return steps

def create_playbook_with_output_params(parent, display_name, goal, steps, add_output_params=False):
    """Create a playbook with optional structured output parameters."""
    try:
        playbook_obj = Playbook(
            display_name=display_name,
            goal=goal,
            instruction=Playbook.Instruction(
                steps=steps
            )
        )
        
        if add_output_params:
            playbook_obj.output_parameter_definitions = [
                ParameterDefinition(
                    name="interviewEnd",
                    type_=ParameterDefinition.ParameterType.BOOLEAN,
                    description="Indicates when the interview should be terminated"
                )
            ]
        
        created_playbook = playbooks_client.create_playbook(parent=parent, playbook=playbook_obj)
        logger.info("Created playbook %s with%s output parameters", 
                    created_playbook.name, "" if add_output_params else "out")
        return created_playbook
        
    except Exception as e:
        logger.warning("Failed to create playbook with output parameters directly: %s", e)
        
        if add_output_params:
            try:
                playbook_obj = Playbook(
                    display_name=display_name,
                    goal=goal,
                    instruction=Playbook.Instruction(
                        steps=steps
                    )
                )
                created_playbook = playbooks_client.create_playbook(parent=parent, playbook=playbook_obj)
                
                updated_playbook = Playbook(
                    name=created_playbook.name,
                    output_parameter_definitions=[
                        ParameterDefinition(
                            name="interviewEnd",
                            type_=ParameterDefinition.ParameterType.BOOLEAN,
                            description="Indicates when the interview should be terminated"
                        )
                    ]
                )
                
                playbooks_client.update_playbook(
                    playbook=updated_playbook,
                    update_mask=field_mask_pb2.FieldMask(paths=["output_parameter_definitions"])
                )
                logger.info("Updated playbook %s with output parameters", created_playbook.name)
                return created_playbook
                
            except Exception as update_error:
                logger.error("Failed to update playbook with output parameters: %s", update_error)
                return created_playbook
        else:
            raise e

def _create_technical_playbooks(body: AgentIn) -> dict:
    """Main function to create Dialogflow agent with playbooks"""
    parent = f"projects/{PROJECT_ID}/locations/{LOCATION}"

    # Check what question types are available
    has_introduction = bool(body.customization.introduction_questions)
    has_prequalification = bool(getattr(body.customization, 'prequalification_questions', []))
    has_technical = bool(getattr(body.customization, 'technical_questions', []))
    has_behavioral = bool(getattr(body.customization, 'behavioral_questions', []))
    bot_personality = getattr(body.customization, 'bot_personality', 'friendly and professional')
    
    # Determine the flow order based on available questions
    def determine_flow_order():
        flow = ["Overview"]
        
        if has_prequalification:
            flow.append("Pre-Qualification")
        if has_introduction:
            flow.append("Introduction")
        if has_behavioral:
            flow.append("Behavioral")
        if has_technical:
            flow.append("Technical")
            
        flow.append("Conclusion")
        return flow
    
    flow_sections = determine_flow_order()
    logger.info(f"Dynamic flow created: {' → '.join(flow_sections)}")
    
    # Format questions for templates
    def format_questions_for_template(questions_list):
        if not questions_list:
            return ""
        
        formatted = []
        for i, question in enumerate(questions_list, 1):
            formatted.append(f"    - Question {i}: \"{question}\"")
        return "\n".join(formatted)

    # Create Overview playbook
    overview_playbook = TECHNICAL_OVERVIEW_TEMPLATE.format(
        position_title=body.customization.position_data.position_title,
        job_description=body.customization.position_data.job_description,
        company_overview=body.customization.company_data.company_description,
        company_data=json.dumps(body.customization.company_data.dict(), indent=2),
        bot_personality=bot_personality,
        next_section_playbook="",
        next_section=""
    )

    # Create playbooks only for sections that exist
    playbooks_to_create = {}

    if "Pre-Qualification" in flow_sections:
        prequalification_content = PRE_QUALIFICATION_QUESTIONS_CONTENT.format(
            prequalification_questions=format_questions_for_template(
                getattr(body.customization, 'prequalification_questions', [])
            )
        ) if has_prequalification else NO_PRE_QUALIFICATION_QUESTIONS_CONTENT
        
        prequalification_playbook = PRE_QUALIFICATION_FLOW_TEMPLATE.format(
            has_prequalification_questions=has_prequalification,
            prequalification_content=prequalification_content,
            bot_personality=bot_personality,
            job_description=body.customization.position_data.job_description,
            company_overview=body.customization.company_data.company_description,
            company_data=json.dumps(body.customization.company_data.dict(), indent=2),
            next_section_playbook="",
            next_section=""
        )
        playbooks_to_create["Pre-Qualification"] = {
            "template": prequalification_playbook,
            "meta": PRE_QUALIFICATION_PLAYBOOK_META
        }
    
    if "Introduction" in flow_sections:
        intro_content = INTRODUCTION_QUESTIONS_CONTENT.format(
            introduction_questions=format_questions_for_template(body.customization.introduction_questions)
        ) if has_introduction else NO_INTRODUCTION_QUESTIONS_CONTENT
        
        intro_playbook = INTRODUCTION_FLOW_TEMPLATE.format(
            has_introduction_questions=has_introduction,
            introduction_content=intro_content,
            bot_personality=bot_personality,
            job_description=body.customization.position_data.job_description,
            company_overview=body.customization.company_data.company_description,
            company_data=json.dumps(body.customization.company_data.dict(), indent=2),
            next_section_playbook="",
            next_section=""
        )
        playbooks_to_create["Introduction"] = {
            "template": intro_playbook,
            "meta": INTRODUCTION_PLAYBOOK_META
        }

    if "Technical" in flow_sections:
        tech_content = TECHNICAL_QUESTIONS_CONTENT.format(
            technical_questions=format_questions_for_template(
                getattr(body.customization, 'technical_questions', [])
            )
        ) if has_technical else NO_TECHNICAL_QUESTIONS_CONTENT
        
        tech_playbook = TECHNICAL_FLOW_TEMPLATE.format(
            has_technical_questions=has_technical,
            technical_content=tech_content,
            bot_personality=bot_personality,
            job_description=body.customization.position_data.job_description,
            company_overview=body.customization.company_data.company_description,
            company_data=json.dumps(body.customization.company_data.dict(), indent=2),
            next_section_playbook="",
            next_section=""
        )
        playbooks_to_create["Technical"] = {
            "template": tech_playbook,
            "meta": TECHNICAL_PLAYBOOK_META
        }

    if "Behavioral" in flow_sections:
        behavioral_content = BEHAVIORAL_QUESTIONS_CONTENT.format(
            behavioral_questions=format_questions_for_template(
                getattr(body.customization, 'behavioral_questions', [])
            )
        ) if has_behavioral else NO_BEHAVIORAL_QUESTIONS_CONTENT
        
        behavioral_playbook = BEHAVIORAL_FLOW_TEMPLATE.format(
            has_behavioral_questions=has_behavioral,
            behavioral_content=behavioral_content,
            bot_personality=bot_personality,
            job_description=body.customization.position_data.job_description,
            company_overview=body.customization.company_data.company_description,
            company_data=json.dumps(body.customization.company_data.dict(), indent=2),
            next_section_playbook="",
            next_section=""
        )
        playbooks_to_create["Behavioral"] = {
            "template": behavioral_playbook,
            "meta": BEHAVIORAL_PLAYBOOK_META
        }

    # Create Conclusion playbook
    conclusion_playbook = CONCLUSION_FLOW_TEMPLATE.format(
        job_salary=body.customization.position_data.job_salary,
        job_description=body.customization.position_data.job_description,
        company_overview=body.customization.company_data.company_description,
        company_data=json.dumps(body.customization.company_data.dict(), indent=2),
        bot_personality=bot_personality,
    )

    # Check if agent already exists
    existing = next(
        (ag for ag in agents_client.list_agents(parent=parent)
         if ag.display_name == body.display_name),
        None
    )

    if existing:
        logger.warning("Agent name collision for %s", body.display_name)
        raise HTTPException(
            status_code=400,
            detail=f"Bot name '{body.display_name}' is already in use. Please choose a different name."
        )
    else:
        agent = dialogflowcx.Agent(
            display_name=body.display_name,
            default_language_code="en",
            time_zone="America/Los_Angeles",
            description=body.meta.get("description", ""),
            avatar_uri=body.meta.get("avatarUri", ""),
        )
        agent = agents_client.create_agent(parent=parent, agent=agent)
        logger.info("Created agent %s", agent.name)

    # Create playbooks
    created_playbooks = {}
    section_playbook_names = {}

    # Create Overview Playbook
    overview_pb_name = OVERVIEW_PLAYBOOK_META['display_name']
    initial_overview = overview_playbook.replace("${PLAYBOOK:", "").replace("}", "")

    overview_playbook_obj = create_playbook_with_output_params(
        parent=agent.name,
        display_name=overview_pb_name,
        goal=OVERVIEW_PLAYBOOK_META["goal"],
        steps=template_to_steps(initial_overview),
        add_output_params=True
    )
    created_playbooks['overview'] = overview_playbook_obj
    logger.info("Created overview playbook %s", overview_playbook_obj.name)

    # Create middle section playbooks
    for section_name, section_data in playbooks_to_create.items():
        pb_name = section_data['meta']['display_name']
        initial_template = section_data['template'].replace("${PLAYBOOK:", "").replace("}", "")
        
        playbook_obj = create_playbook_with_output_params(
            parent=agent.name,
            display_name=pb_name,
            goal=section_data['meta']["goal"],
            steps=template_to_steps(initial_template),
            add_output_params=True
        )
        
        created_playbooks[section_name.lower()] = playbook_obj
        section_playbook_names[section_name] = pb_name
        logger.info("Created %s playbook %s", section_name.lower(), playbook_obj.name)

    # Create Conclusion Playbook
    conclusion_pb_name = CONCLUSION_PLAYBOOK_META['display_name']
    initial_conclusion = conclusion_playbook.replace("${PLAYBOOK:", "").replace("}", "")

    conclusion_playbook_obj = create_playbook_with_output_params(
        parent=agent.name,
        display_name=conclusion_pb_name,
        goal=CONCLUSION_PLAYBOOK_META["goal"],
        steps=template_to_steps(initial_conclusion),
        add_output_params=True
    )
    created_playbooks['conclusion'] = conclusion_playbook_obj
    logger.info("Created conclusion playbook %s", conclusion_playbook_obj.name)

    # Update playbook transitions
    def get_next_section(current_section):
        try:
            current_index = flow_sections.index(current_section)
            if current_index + 1 < len(flow_sections):
                return flow_sections[current_index + 1]
            return None
        except ValueError:
            return None

    def get_transition_text(current_section, next_section):
        transitions = {
            "Overview": {
                "Pre-Qualification": "",
                "Introduction": "",
                "Technical": "",
                "Behavioral": "",
                "Conclusion": ""
            },
            "Pre-Qualification": {
                "Introduction": "",
                "Technical": "",
                "Behavioral": "",
                "Conclusion": ""
            },
            "Introduction": {
                "Technical": "",
                "Behavioral": "",
                "Conclusion": ""
            },
            "Technical": {
                "Behavioral": "",
                "Conclusion": ""
            },
            "Behavioral": {
                "Technical": "",
                "Conclusion": ""
            }
        }
        return transitions.get(current_section, {}).get(next_section, "Let's continue.")

    # Update Overview transitions
    next_section = get_next_section("Overview")
    if next_section:
        next_pb_name = section_playbook_names.get(next_section, conclusion_pb_name)
        if next_pb_name:
            transition_text = get_transition_text("Overview", next_section)
            new_steps = template_to_steps(
                initial_overview + f"\n- {transition_text} ${{PLAYBOOK: {next_pb_name}}}"
            )
            overview_playbook_obj.instruction.steps[:] = new_steps
            playbooks_client.update_playbook(
                playbook=overview_playbook_obj,
                update_mask=field_mask_pb2.FieldMask(paths=["instruction.steps"])
            )

    # Update middle section transitions
    for section_name in flow_sections[1:-1]:
        if section_name.lower() in created_playbooks:
            playbook_obj = created_playbooks[section_name.lower()]
            next_section = get_next_section(section_name)
            if next_section:
                next_pb_name = section_playbook_names.get(next_section, conclusion_pb_name)
                if next_pb_name:
                    transition_text = get_transition_text(section_name, next_section)
                    initial_template = playbooks_to_create[section_name]["template"].replace("${PLAYBOOK:", "").replace("}", "")
                    new_steps = template_to_steps(
                        initial_template + f"\n- {transition_text} ${{PLAYBOOK: {next_pb_name}}}"
                    )
                    playbook_obj.instruction.steps[:] = new_steps
                    playbooks_client.update_playbook(
                        playbook=playbook_obj,
                        update_mask=field_mask_pb2.FieldMask(paths=["instruction.steps"])
                    )

    # Update Conclusion playbook
    conclusion_playbook_obj.instruction.steps[:] = template_to_steps(
        initial_conclusion + "\n- End of interview"
    )
    playbooks_client.update_playbook(
        playbook=conclusion_playbook_obj,
        update_mask=field_mask_pb2.FieldMask(paths=["instruction.steps"])
    )

    # Set the overview playbook as the start playbook
    if agent.start_playbook != overview_playbook_obj.name:
        agent.start_playbook = overview_playbook_obj.name
        agents_client.update_agent(
            agent=agent,
            update_mask=field_mask_pb2.FieldMask(paths=["start_playbook"]),
        )

    agent_id = agent.name.rsplit("/", 1)[-1]
    
    # Build result object
    result = {
        "agent_name": agent.name,
        "agent_id": agent_id,
        "overview_playbook": overview_playbook_obj.name,
        "conclusion_playbook": conclusion_playbook_obj.name,
        "available_sections": flow_sections,
        "flow_structure": " → ".join(flow_sections)
    }
    
    if "Pre-Qualification" in flow_sections:
        result["prequalification_playbook"] = created_playbooks['pre-qualification'].name
    if "Introduction" in flow_sections:
        result["introduction_playbook"] = created_playbooks['introduction'].name
    if "Technical" in flow_sections:
        result["technical_playbook"] = created_playbooks['technical'].name
    if "Behavioral" in flow_sections:
        result["behavioral_playbook"] = created_playbooks['behavioral'].name
    
    logger.info(f"Created agent {agent.name} with ID {agent_id}")
    logger.info(f"Dynamic interview flow: {' → '.join(flow_sections)}")
    
    return result

# API Endpoints
@app.get("/")
def read_root():
    return {
        "message": "Dialogflow Agent Creation Service",
        "version": "1.0.0",
        "endpoints": {
            "create_agent": "POST /dialogflow/agents",
            "health": "GET /health"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "agent-creation",
        "project_id": PROJECT_ID,
        "location": LOCATION
    }

@app.post("/dialogflow/agents")
async def create_agent(body: AgentIn):
    """
    Create a Dialogflow CX agent with custom playbooks for interview automation
    """
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            executor, _create_technical_playbooks, body
        )
        return {"ok": True, **result}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error creating agent: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create agent: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)