import os
import joblib
import pandas as pd
from fastapi import FastAPI, status
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application
app = FastAPI(
    title="Mindscope AI - Mental Health Score Predictor API",
    description="Backend API serving Machine Learning predictions for student mental health scores",
    version="1.0.0",
)

# Load the trained machine learning model
model = joblib.load('Mental_Health_Model.pkl')

# Top countries recognized by the model pipeline
top_countries = ['Other', 'India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France']

# Configure CORS for Cloudflare Pages and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schema for request validation
class StudentData(BaseModel):
    age                     : int = Field(..., ge=10, le=100, description="Age between 10 and 100")
    gender                  : Literal['Male', 'Female']
    country                 : str
    academic_level          : Literal['Undergraduate', 'Graduate', 'High School']
    most_used_platform      : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter', 'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp', 'WeChat']
    purpose_of_use          : Literal['Networking', 'Education', 'Entertainment', 'News']
    avg_daily_usage_hours   : float = Field(..., ge=0, le=24, description="Daily social media usage hours")
    daily_unlocks           : int = Field(..., ge=0, description="Number of phone unlocks per day")
    study_hours             : float = Field(..., ge=0, le=24, description="Daily study hours")
    physical_activity_hours : float = Field(..., ge=0, le=24, description="Daily physical exercise hours")
    sleep_hours_per_night   : float = Field(..., ge=0, le=24, description="Average sleep hours per night")
    stress_level            : Literal['Low', 'Medium', 'Very High', 'High']


# Pydantic schema for response output
class PredictionResponse(BaseModel):
    predicted_mental_health_score : float


@app.get('/', status_code=status.HTTP_200_OK)
def root():
    return {
        "status": "online",
        "service": "Mindscope AI Prediction API",
        "docs_url": "/docs",
        "health_check": "/health"
    }


@app.get('/health', status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }


@app.post('/predict', response_model=PredictionResponse, status_code=status.HTTP_200_OK)
def predict(data: StudentData):
    country_group = data.country if data.country in top_countries else "Other"
    input_row = pd.DataFrame([{
        'Age'                       : data.age,
        'Gender'                    : data.gender,
        'Country'                   : data.country,
        'Academic_Level'            : data.academic_level,
        'Most_Used_Platform'        : data.most_used_platform,
        'Purpose_Of_Use'            : data.purpose_of_use,
        'Avg_Daily_Usage_Hours'     : data.avg_daily_usage_hours,
        'Daily_Unlocks'             : data.daily_unlocks,
        'Study_Hours'               : data.study_hours,
        'Physical_Activity_Hours'   : data.physical_activity_hours,
        'Sleep_Hours_Per_Night'     : data.sleep_hours_per_night,
        'Stress_Level'              : data.stress_level,
        'Group_country'             : country_group
    }])

    prediction = model.predict(input_row)[0]
    return PredictionResponse(predicted_mental_health_score=round(float(prediction), 2))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
