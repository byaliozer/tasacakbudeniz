from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import httpx
import random
import asyncio
from cachetools import TTLCache

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Google Sheets Configuration
SHEET_ID = "1txXN5xN_W4OaLL2FVm6QM5TzbUeb4KMWKWYK55GvOIc"
EPISODES_GID = "0"
QUESTIONS_GID = "1459380949"

# Cache with 5 minute TTL
cache = TTLCache(maxsize=100, ttl=300)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# === MODELS ===

class Episode(BaseModel):
    id: int
    name: str
    question_count: int = 0
    is_locked: bool = False
    description: str = ""

class QuestionOption(BaseModel):
    id: str
    text: str

class Question(BaseModel):
    id: str
    text: str
    options: List[QuestionOption]
    correct_option: str
    difficulty: str
    points: int

class QuizResponse(BaseModel):
    episode_id: int
    episode_name: str
    questions: List[Question]
    total_questions: int
    max_possible_score: int

class LeaderboardEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    episode_id: int
    player_name: str
    score: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class LeaderboardCreate(BaseModel):
    episode_id: int
    player_name: str
    score: int

class LeaderboardResponse(BaseModel):
    top_10: List[Dict[str, Any]]
    player_rank: Optional[int] = None
    player_entry: Optional[Dict[str, Any]] = None
    total_players: int = 0

# === GOOGLE SHEETS FUNCTIONS ===

async def fetch_csv_from_sheets(gid: str) -> str:
    """Fetch CSV data from Google Sheets"""
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.text

def parse_csv(csv_text: str) -> List[List[str]]:
    """Parse CSV text into rows"""
    lines = csv_text.strip().split('\n')
    rows = []
    for line in lines:
        # Simple CSV parsing - handles basic cases
        cells = []
        current_cell = ""
        in_quotes = False
        for char in line:
            if char == '"':
                in_quotes = not in_quotes
            elif char == ',' and not in_quotes:
                cells.append(current_cell.strip())
                current_cell = ""
            else:
                current_cell += char
        cells.append(current_cell.strip())
        rows.append(cells)
    return rows

async def get_episodes_from_sheets() -> List[Episode]:
    """Fetch and parse episodes from Google Sheets"""
    cache_key = "episodes"
    if cache_key in cache:
        return cache[cache_key]
    
    try:
        csv_text = await fetch_csv_from_sheets(EPISODES_GID)
        rows = parse_csv(csv_text)
        
        episodes = []
        # Skip header row
        for row in rows[1:]:
            if len(row) >= 4:
                try:
                    episode_id = int(row[0]) if row[0].isdigit() else 0
                    if episode_id > 0:
                        episodes.append(Episode(
                            id=episode_id,
                            name=row[1].strip('"') if row[1] else f"{episode_id}. Bölüm",
                            is_locked=row[2].strip('"').lower() != "açık" if len(row) > 2 else True,
                            description=row[3].strip('"') if len(row) > 3 else ""
                        ))
                except (ValueError, IndexError) as e:
                    logger.warning(f"Error parsing episode row: {row}, error: {e}")
                    continue
        
        # Get question counts
        questions = await get_questions_from_sheets()
        for episode in episodes:
            episode.question_count = len([q for q in questions if q.get('episode_id') == episode.id])
        
        cache[cache_key] = episodes
        return episodes
    except Exception as e:
        logger.error(f"Error fetching episodes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch episodes: {str(e)}")

async def get_questions_from_sheets() -> List[Dict]:
    """Fetch and parse questions from Google Sheets"""
    cache_key = "questions"
    if cache_key in cache:
        return cache[cache_key]
    
    try:
        csv_text = await fetch_csv_from_sheets(QUESTIONS_GID)
        rows = parse_csv(csv_text)
        
        questions = []
        # Skip header row: Bölüm | Soru ID | Soru | A | B | C | D | Doğru Cevap | Zorluk | Puan
        for row in rows[1:]:
            if len(row) >= 10:
                try:
                    episode_id = int(row[0]) if row[0].isdigit() else 0
                    if episode_id > 0:
                        # Map difficulty to points
                        difficulty = row[8].strip('"').lower() if len(row) > 8 else "kolay"
                        points_str = row[9].strip('"') if len(row) > 9 else ""
                        
                        if points_str.isdigit():
                            points = int(points_str)
                        else:
                            # Default points based on difficulty
                            difficulty_points = {"kolay": 10, "orta": 20, "zor": 50, "easy": 10, "medium": 20, "hard": 50}
                            points = difficulty_points.get(difficulty, 10)
                        
                        questions.append({
                            "episode_id": episode_id,
                            "id": row[1].strip('"'),
                            "text": row[2].strip('"'),
                            "options": {
                                "A": row[3].strip('"'),
                                "B": row[4].strip('"'),
                                "C": row[5].strip('"'),
                                "D": row[6].strip('"')
                            },
                            "correct_answer": row[7].strip('"').upper(),
                            "difficulty": difficulty,
                            "points": points
                        })
                except (ValueError, IndexError) as e:
                    logger.warning(f"Error parsing question row: {row}, error: {e}")
                    continue
        
        cache[cache_key] = questions
        return questions
    except Exception as e:
        logger.error(f"Error fetching questions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch questions: {str(e)}")

# === API ROUTES ===

@api_router.get("/")
async def root():
    return {"message": "Taşacak Bu Deniz Quiz API", "status": "running"}

@api_router.get("/episodes", response_model=List[Episode])
async def get_episodes():
    """Get all episodes with their status"""
    return await get_episodes_from_sheets()

@api_router.get("/quiz/{episode_id}", response_model=QuizResponse)
async def start_quiz(episode_id: int, count: int = 20):
    """Start a quiz for a specific episode"""
    episodes = await get_episodes_from_sheets()
    episode = next((e for e in episodes if e.id == episode_id), None)
    
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    if episode.is_locked:
        raise HTTPException(status_code=403, detail="Bu bölüm henüz açılmadı")
    
    all_questions = await get_questions_from_sheets()
    episode_questions = [q for q in all_questions if q.get('episode_id') == episode_id]
    
    if not episode_questions:
        raise HTTPException(status_code=404, detail="Bu bölüm için soru bulunamadı")
    
    # Select random questions (up to count)
    selected = random.sample(episode_questions, min(count, len(episode_questions)))
    
    # Transform questions and shuffle options
    quiz_questions = []
    max_score = 0
    
    for q in selected:
        # Create shuffled options
        option_keys = ['A', 'B', 'C', 'D']
        options_list = [(key, q['options'][key]) for key in option_keys if q['options'].get(key)]
        random.shuffle(options_list)
        
        # Find new position of correct answer
        correct_text = q['options'].get(q['correct_answer'], '')
        correct_id = 'A'
        for i, (_, text) in enumerate(options_list):
            if text == correct_text:
                correct_id = option_keys[i]
                break
        
        quiz_questions.append(Question(
            id=q['id'],
            text=q['text'],
            options=[QuestionOption(id=option_keys[i], text=text) for i, (_, text) in enumerate(options_list)],
            correct_option=correct_id,
            difficulty=q['difficulty'],
            points=q['points']
        ))
        max_score += q['points'] + 5  # Include potential bonus
    
    return QuizResponse(
        episode_id=episode_id,
        episode_name=episode.name,
        questions=quiz_questions,
        total_questions=len(quiz_questions),
        max_possible_score=max_score
    )

@api_router.post("/leaderboard", response_model=LeaderboardEntry)
async def save_score(entry: LeaderboardCreate):
    """Save a player's score to the leaderboard"""
    if not entry.player_name or len(entry.player_name.strip()) == 0:
        raise HTTPException(status_code=400, detail="Player name is required")
    
    if len(entry.player_name) > 15:
        raise HTTPException(status_code=400, detail="Player name must be 15 characters or less")
    
    leaderboard_entry = LeaderboardEntry(
        episode_id=entry.episode_id,
        player_name=entry.player_name.strip(),
        score=entry.score
    )
    
    await db.leaderboard.insert_one(leaderboard_entry.dict())
    return leaderboard_entry

@api_router.get("/leaderboard/{episode_id}", response_model=LeaderboardResponse)
async def get_leaderboard(episode_id: int, player_name: Optional[str] = None):
    """Get leaderboard for a specific episode"""
    # Get all entries for this episode, sorted by score descending
    cursor = db.leaderboard.find(
        {"episode_id": episode_id}
    ).sort("score", -1)
    
    all_entries = await cursor.to_list(length=1000)
    total_players = len(all_entries)
    
    # Get top 10
    top_10 = []
    for i, entry in enumerate(all_entries[:10]):
        top_10.append({
            "rank": i + 1,
            "player_name": entry["player_name"],
            "score": entry["score"],
            "timestamp": entry.get("timestamp", datetime.utcnow()).isoformat()
        })
    
    # Find player's rank if name provided
    player_rank = None
    player_entry = None
    
    if player_name:
        for i, entry in enumerate(all_entries):
            if entry["player_name"].lower() == player_name.lower():
                player_rank = i + 1
                player_entry = {
                    "rank": player_rank,
                    "player_name": entry["player_name"],
                    "score": entry["score"],
                    "timestamp": entry.get("timestamp", datetime.utcnow()).isoformat()
                }
                break
    
    return LeaderboardResponse(
        top_10=top_10,
        player_rank=player_rank,
        player_entry=player_entry,
        total_players=total_players
    )

@api_router.get("/refresh-cache")
async def refresh_cache():
    """Force refresh the cache"""
    cache.clear()
    # Pre-fetch data to warm up cache
    await get_episodes_from_sheets()
    await get_questions_from_sheets()
    return {"message": "Cache refreshed successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
