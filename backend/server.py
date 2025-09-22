from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date
from enum import Enum
from collections import defaultdict
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="Жилищный баланс - Админ панель", 
    description="Админ панель для управления роботом-продавцом с метриками токенов и стоимости",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class ChatStatus(str, Enum):
    CONSULTATION = "consultation"
    INDIVIDUAL_CONSULTATION = "individual_consultation"
    NO_RESPONSE = "no_response"
    ACTIVE = "active"

class DealStatus(str, Enum):
    CONSULTATION_SCHEDULED = "consultation_scheduled"
    INDIVIDUAL_CONSULTATION_SCHEDULED = "individual_consultation_scheduled"
    NO_RESPONSE = "no_response"

# Models
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    sender: str  # 'bot' or 'client'
    message: str
    tokens_used: int = 0  # Количество токенов для этого сообщения
    
class Chat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    client_phone: str
    status: ChatStatus
    started_at: datetime
    last_message_at: datetime
    messages: List[ChatMessage] = []
    total_interactions: int = 0
    dialog_cost: float = 0.0
    total_tokens_used: int = 0  # Общее количество токенов для чата

class Deal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    status: DealStatus
    created_at: datetime
    updated_at: datetime
    estimated_cost: float = 0.0

# New models for analytics
class DailyDealPoint(BaseModel):
    date: str
    total_deals: int
    consultation_scheduled: int
    individual_consultation_scheduled: int
    no_response: int

class CostTrendPoint(BaseModel):
    date: str
    average_dialog_cost: float
    average_conversion_cost: float
    chat_count: int

class StatisticsResponse(BaseModel):
    total_deals: int
    consultation_scheduled: int
    individual_consultation_scheduled: int
    no_response: int
    average_interactions_per_client: float
    average_dialog_cost: float
    average_conversion_cost: float
    total_tokens_used: int
    total_period_cost: float
    deals_by_day: List[DailyDealPoint]
    daily_costs: List[CostTrendPoint]
    status_distribution: dict
    total_chats: int
    period_start: str
    period_end: str

class ChatListResponse(BaseModel):
    chats: List[Chat]
    total: int

# Generate test data function
async def generate_test_data():
    """Generate test data for demonstration"""
    try:
        # Always regenerate data to ensure fresh token data
        print("Regenerating test data with tokens...")
        
        # Clear existing data
        await db.chats.delete_many({})
        await db.deals.delete_many({})
        print("Cleared existing data")
        
        # Clear existing data
        await db.chats.delete_many({})
        await db.deals.delete_many({})
        
        # Generate test clients and chats
        clients = []
        for i in range(50):
            client_id = str(uuid.uuid4())
            client_name = f"Клиент {i+1}"
            client_phone = f"+375{random.randint(29, 44)}{random.randint(1000000, 9999999)}"
            clients.append((client_id, client_name, client_phone))
        
        # Generate chats
        chats_data = []
        deals_data = []
        
        for client_id, client_name, client_phone in clients:
            # Determine chat status (now with individual consultation)
            status_weights = [
                (ChatStatus.CONSULTATION, 0.35),  # КК - групповые консультации
                (ChatStatus.INDIVIDUAL_CONSULTATION, 0.25),  # ИК - индивидуальные консультации
                (ChatStatus.NO_RESPONSE, 0.25),
                (ChatStatus.ACTIVE, 0.15)
            ]
            status = random.choices(
                [s[0] for s in status_weights],
                weights=[s[1] for s in status_weights]
            )[0]
            
            # Generate chat with dates spread over last 60 days
            started_at = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))
            last_message_at = started_at + timedelta(hours=random.randint(1, 48))
            
            messages = []
            total_interactions = random.randint(3, 15)
            total_tokens_used = 0
            
            # Generate messages
            for j in range(total_interactions):
                message_time = started_at + timedelta(minutes=j * random.randint(5, 30))
                sender = "bot" if j % 2 == 0 else "client"
                
                if sender == "bot":
                    bot_messages = [
                        "Добро пожаловать! Я помогу вам с вопросами по жилищным программам.",
                        "Расскажите, какие у вас планы по приобретению жилья?",
                        "Мы предлагаем рассрочку до 15 лет без первоначального взноса.",
                        "Хотели бы записаться на бесплатную консультацию?",
                        "Предлагаю записаться на индивидуальную консультацию для детального разбора.",
                        "Наши специалисты проконсультируют вас по всем вопросам."
                    ]
                    message_text = random.choice(bot_messages)
                    # Бот использует больше токенов для генерации ответов
                    message_tokens = random.randint(50, 200)
                else:
                    client_messages = [
                        "Здравствуйте!",
                        "Интересует покупка квартиры в рассрочку",
                        "Какие условия?",
                        "Да, хочу записаться на консультацию",
                        "Лучше индивидуально пообщаться",
                        "Спасибо за информацию"
                    ]
                    message_text = random.choice(client_messages)
                    # Клиент использует меньше токенов (обработка входящих сообщений)
                    message_tokens = random.randint(10, 50)
                
                total_tokens_used += message_tokens
                
                messages.append({
                    "id": str(uuid.uuid4()),
                    "timestamp": message_time.isoformat(),
                    "sender": sender,
                    "message": message_text,
                    "tokens_used": message_tokens
                })
            
            dialog_cost = random.uniform(5.0, 25.0)  # Cost in BYN
            
            chat_data = {
                "id": str(uuid.uuid4()),
                "client_id": client_id,
                "client_name": client_name,
                "client_phone": client_phone,
                "status": status.value,
                "started_at": started_at.isoformat(),
                "last_message_at": last_message_at.isoformat(),
                "messages": messages,
                "total_interactions": total_interactions,
                "dialog_cost": dialog_cost,
                "total_tokens_used": total_tokens_used
            }
            chats_data.append(chat_data)
            
            # Generate deal if appropriate status
            if status in [ChatStatus.CONSULTATION, ChatStatus.INDIVIDUAL_CONSULTATION, ChatStatus.ACTIVE]:
                if status == ChatStatus.CONSULTATION:
                    deal_status = DealStatus.CONSULTATION_SCHEDULED
                elif status == ChatStatus.INDIVIDUAL_CONSULTATION:
                    deal_status = DealStatus.INDIVIDUAL_CONSULTATION_SCHEDULED
                else:
                    deal_status = random.choice(list(DealStatus))
                
                deal_data = {
                    "id": str(uuid.uuid4()),
                    "client_id": client_id,
                    "client_name": client_name,
                    "status": deal_status.value,
                    "created_at": started_at.isoformat(),
                    "updated_at": last_message_at.isoformat(),
                    "estimated_cost": random.uniform(80000, 300000)  # Cost in BYN
                }
                deals_data.append(deal_data)
        
        # Insert data
        if chats_data:
            await db.chats.insert_many(chats_data)
        if deals_data:
            await db.deals.insert_many(deals_data)
            
        print(f"Generated {len(chats_data)} chats and {len(deals_data)} deals")
        
    except Exception as e:
        print(f"Error generating test data: {e}")

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Жилищный баланс - Админ панель API"}

@api_router.get("/statistics", response_model=StatisticsResponse)
async def get_statistics(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get chatbot statistics for date range"""
    try:
        # Parse dates or use defaults
        if start_date and end_date:
            try:
                start_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
                end_dt = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
        else:
            # Default to last 7 days
            end_dt = datetime.now(timezone.utc)
            start_dt = end_dt - timedelta(days=7)
        
        # Get deals in period
        deals_pipeline = [
            {
                "$addFields": {
                    "created_at_date": {
                        "$dateFromString": {"dateString": "$created_at"}
                    }
                }
            },
            {
                "$match": {
                    "created_at_date": {
                        "$gte": start_dt,
                        "$lte": end_dt
                    }
                }
            }
        ]
        
        deals_cursor = db.deals.aggregate(deals_pipeline)
        deals = await deals_cursor.to_list(length=None)
        
        total_deals = len(deals)
        consultation_scheduled = len([d for d in deals if d["status"] == "consultation_scheduled"])
        individual_consultation_scheduled = len([d for d in deals if d["status"] == "individual_consultation_scheduled"])
        no_response = len([d for d in deals if d["status"] == "no_response"])
        
        # Get chats statistics
        chats_pipeline = [
            {
                "$addFields": {
                    "started_at_date": {
                        "$dateFromString": {"dateString": "$started_at"}
                    }
                }
            },
            {
                "$match": {
                    "started_at_date": {
                        "$gte": start_dt,
                        "$lte": end_dt
                    }
                }
            }
        ]
        
        chats_cursor = db.chats.aggregate(chats_pipeline)
        chats = await chats_cursor.to_list(length=None)
        
        total_chats = len(chats)
        
        # Group deals by day for daily analytics
        deals_by_day = defaultdict(lambda: {
            'total_deals': 0,
            'consultation_scheduled': 0,
            'individual_consultation_scheduled': 0,
            'no_response': 0
        })
        
        # Status distribution
        status_distribution = {
            'consultation_scheduled': 0,
            'individual_consultation_scheduled': 0,
            'no_response': 0
        }
        
        for deal in deals:
            deal_date = datetime.fromisoformat(deal['created_at']).date().isoformat()
            deals_by_day[deal_date]['total_deals'] += 1
            
            if deal['status'] in status_distribution:
                deals_by_day[deal_date][deal['status']] += 1
                status_distribution[deal['status']] += 1
        
        # Group chats by day for cost analytics
        chats_by_day = defaultdict(list)
        
        for chat in chats:
            chat_date = datetime.fromisoformat(chat['started_at']).date().isoformat()
            chats_by_day[chat_date].append(chat)
        
        # Calculate daily costs
        daily_costs = []
        for date_str, day_chats in chats_by_day.items():
            if day_chats:
                total_dialog_cost = sum(chat.get("dialog_cost", 0) for chat in day_chats)
                avg_dialog_cost = total_dialog_cost / len(day_chats)
                
                # Count successful conversions for this day
                successful_conversions = 0
                for chat in day_chats:
                    if chat.get('status') in ['consultation', 'individual_consultation']:
                        successful_conversions += 1
                
                avg_conversion_cost = total_dialog_cost / successful_conversions if successful_conversions > 0 else 0
                
                daily_costs.append(CostTrendPoint(
                    date=date_str,
                    average_dialog_cost=round(avg_dialog_cost, 2),
                    average_conversion_cost=round(avg_conversion_cost, 2),
                    chat_count=len(day_chats)
                ))
        
        # Convert deals_by_day to list and sort
        deals_by_day_list = []
        for date_str, data in deals_by_day.items():
            deals_by_day_list.append(DailyDealPoint(
                date=date_str,
                total_deals=data['total_deals'],
                consultation_scheduled=data['consultation_scheduled'],
                individual_consultation_scheduled=data['individual_consultation_scheduled'],
                no_response=data['no_response']
            ))
        
        # Sort by date
        deals_by_day_list.sort(key=lambda x: x.date)
        daily_costs.sort(key=lambda x: x.date)
        
        if chats:
            total_interactions = sum(chat.get("total_interactions", 0) for chat in chats)
            total_clients = len(chats)
            average_interactions_per_client = total_interactions / total_clients if total_clients > 0 else 0
            
            # Calculate token and cost statistics
            total_dialog_cost = sum(chat.get("dialog_cost", 0) for chat in chats)
            total_tokens_used = sum(chat.get("total_tokens_used", 0) for chat in chats)
            
            average_dialog_cost = total_dialog_cost / total_clients if total_clients > 0 else 0
            
            # Average conversion cost (total dialog cost / successful conversions)
            successful_conversions = consultation_scheduled + individual_consultation_scheduled
            average_conversion_cost = total_dialog_cost / successful_conversions if successful_conversions > 0 else 0
            
            # Total period cost is sum of all dialog costs in the period
            total_period_cost = total_dialog_cost
        else:
            average_interactions_per_client = 0
            average_dialog_cost = 0
            average_conversion_cost = 0
            total_tokens_used = 0
            total_period_cost = 0.0
        
        return StatisticsResponse(
            total_deals=total_deals,
            consultation_scheduled=consultation_scheduled,
            individual_consultation_scheduled=individual_consultation_scheduled,
            no_response=no_response,
            average_interactions_per_client=round(average_interactions_per_client, 2),
            average_dialog_cost=round(average_dialog_cost, 2),
            average_conversion_cost=round(average_conversion_cost, 2),
            total_tokens_used=total_tokens_used,
            total_period_cost=round(total_period_cost, 2),
            period_start=start_dt.isoformat(),
            period_end=end_dt.isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {e}")

@api_router.get("/chats", response_model=ChatListResponse)
async def get_chats(limit: int = 20, offset: int = 0, search: Optional[str] = None):
    """Get chat history with pagination and search"""
    try:
        # Build query
        query = {}
        if search:
            query = {
                "$or": [
                    {"client_name": {"$regex": search, "$options": "i"}},
                    {"client_phone": {"$regex": search, "$options": "i"}}
                ]
            }
        
        # Get total count
        total = await db.chats.count_documents(query)
        
        # Get chats with pagination
        chats_cursor = db.chats.find(query).sort("last_message_at", -1).skip(offset).limit(limit)
        chats_data = await chats_cursor.to_list(length=None)
        
        # Convert to Chat models
        chats = []
        for chat_data in chats_data:
            # Convert datetime strings back to datetime objects for response
            chat_data["started_at"] = datetime.fromisoformat(chat_data["started_at"])
            chat_data["last_message_at"] = datetime.fromisoformat(chat_data["last_message_at"])
            
            # Convert message timestamps
            for message in chat_data.get("messages", []):
                message["timestamp"] = datetime.fromisoformat(message["timestamp"])
            
            chats.append(Chat(**chat_data))
        
        return ChatListResponse(chats=chats, total=total)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting chats: {e}")

@api_router.get("/chats/{chat_id}")
async def get_chat_details(chat_id: str):
    """Get detailed chat information"""
    try:
        chat_data = await db.chats.find_one({"id": chat_id})
        if not chat_data:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Convert datetime strings back to datetime objects
        chat_data["started_at"] = datetime.fromisoformat(chat_data["started_at"])
        chat_data["last_message_at"] = datetime.fromisoformat(chat_data["last_message_at"])
        
        # Convert message timestamps
        for message in chat_data.get("messages", []):
            message["timestamp"] = datetime.fromisoformat(message["timestamp"])
        
        return Chat(**chat_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting chat details: {e}")

@api_router.post("/generate-test-data")
async def generate_test_data_endpoint():
    """Generate test data for demonstration"""
    try:
        await generate_test_data()
        return {"message": "Test data generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating test data: {e}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Generate test data on startup"""
    await generate_test_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Add missing import
from datetime import timedelta