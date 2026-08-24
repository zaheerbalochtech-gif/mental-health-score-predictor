import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, StandardScaler, OrdinalEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor

def train_and_save_model():
    print("Loading dataset...")
    df = pd.read_csv("Student Social Media And Mental Health Impact.csv")
    
    top_countries = ['Other', 'India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France']
    df['Group_country'] = df['Country'].apply(lambda c: c if c in top_countries else 'Other')
    
    skewed_col = ['Study_Hours']
    other_numeric_cols = [
        'Age',
        'Avg_Daily_Usage_Hours',
        'Daily_Unlocks',
        'Physical_Activity_Hours',
        'Sleep_Hours_Per_Night'
    ]
    ordinal_col = ['Stress_Level']
    categorical_col = [
        'Gender',
        'Academic_Level',
        'Most_Used_Platform',
        'Purpose_Of_Use',
        'Group_country'
    ]
    
    feature_cols = skewed_col + other_numeric_cols + ordinal_col + categorical_col
    X = df[feature_cols]
    y = df['Mental_Health_Score']
    
    skew_pipeline = Pipeline(steps=[
        ('log_transform', FunctionTransformer(np.log1p)),
        ('scale', StandardScaler())
    ])
    
    plain_numeric_pipeline = Pipeline(steps=[
        ('scale', StandardScaler())
    ])
    
    ordinal_pipeline = Pipeline(steps=[
        ('encode', OrdinalEncoder(categories=[['Low', 'Medium', 'High', 'Very High']]))
    ])
    
    nominal_pipeline = Pipeline(steps=[
        ('encode', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('skew', skew_pipeline, skewed_col),
            ('num', plain_numeric_pipeline, other_numeric_cols),
            ('ord', ordinal_pipeline, ordinal_col),
            ('nom', nominal_pipeline, categorical_col)
        ]
    )
    
    rf_best_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('random forest', RandomForestRegressor(
            max_depth=15,
            min_samples_leaf=2,
            min_samples_split=5,
            n_estimators=300,
            random_state=42,
            n_jobs=-1
        ))
    ])
    
    print("Fitting model...")
    rf_best_pipeline.fit(X, y)
    
    print("Saving model to Mental_Health_Model.pkl...")
    joblib.dump(rf_best_pipeline, 'Mental_Health_Model.pkl')
    print("Model successfully generated and saved!")

if __name__ == "__main__":
    train_and_save_model()
