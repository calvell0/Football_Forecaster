

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from flask import Flask, request
import joblib as joblib
from collections.abc import Iterable
import matplotlib.pyplot as plt
import seaborn as sns

SHOW_PLOTS = True

def plot_confusion_matrix(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 7))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix')
    plt.show()

def plot_accuracy_score(y_true, y_pred_proba, thresholds):
    accuracies = [accuracy_score(y_true, (y_pred_proba[:, 1] >= t).astype(int)) for t in thresholds]
    plt.figure(figsize=(10, 7))
    plt.plot(thresholds, accuracies, marker='o')
    plt.xlabel('Threshold')
    plt.ylabel('Accuracy')
    plt.title('Accuracy Score vs. Threshold')
    plt.grid(True)
    plt.show()

def plot_feature_importance(feature_importance):
    plt.figure(figsize=(10, 8))
    sns.barplot(x='importance', y='feature', data=feature_importance)
    plt.title('Feature Importances')
    plt.xlabel('Importance')
    plt.ylabel('Feature')
    plt.show()

EXPECTED_COLS_COUNT = 0
ORIG_FEATURE_NAMES = []

def replace_record_with_win_pct(df: pd.DataFrame):
    df['home_home_win_pct'] = df['home_home_wins'] / (df['home_home_wins'] + df['home_home_losses']).replace({0: 0.5})
    df['home_away_win_pct'] = df['home_away_wins'] / (df['home_away_wins'] + df['home_away_losses']).replace({0: 0.5})
    df['away_home_win_pct'] = df['away_home_wins'] / (df['away_home_wins'] + df['away_home_losses']).replace({0: 0.5})
    df['away_away_win_pct'] = df['away_away_wins'] / (df['away_away_wins'] + df['away_away_losses']).replace({0: 0.5})
    df['home_overall_win_pct'] = df['home_total_wins'] / (df['home_total_wins'] + df['home_total_losses']).replace({0: 0.5})
    df['away_overall_win_pct'] = df['away_total_wins'] / (df['away_total_wins'] + df['away_total_losses']).replace({0: 0.5})

    df.drop(columns=['home_home_wins', 'home_home_losses', 'home_away_wins', 'home_away_losses', 'away_home_wins', 'away_home_losses', 'away_away_wins', 'away_away_losses', 'home_total_wins', 'home_total_losses', 'away_total_wins', 'away_total_losses'], inplace=True)
    return df

def load_data():
    global ORIG_FEATURE_NAMES
    df = pd.read_csv("./training_data/training_data.csv")
    df.drop(columns="event_id", inplace=True)

    print("Class Distribution:")
    print(df['home_winner'].value_counts(normalize=True))

    X = df.drop(['home_winner', 'home_avg_tackles_for_loss',
                 'away_avg_tackles_for_loss', 'home_avg_drives',
                 'away_avg_drives', 'home_completion_pct', 'away_completion_pct'], axis=1)
    y = df['home_winner']
    ORIG_FEATURE_NAMES = X.columns

    X = replace_record_with_win_pct(X)
    print(X.sample(5))

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.33, random_state=12, stratify=y)

    print(df.sample(5))

    return X_train, X_test, y_train, y_test, X


def create_pipeline():
    global EXPECTED_COLS_COUNT
    X_train, X_test, y_train, y_test, X = load_data()

    model = Pipeline([

        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(
            max_iter=1000,
            C=0.1,
            class_weight='balanced'
        ))
    ])

    print(X_test.sample(2))


    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)

    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': np.abs(model.named_steps['classifier'].coef_[0])
    })
    feature_importance = feature_importance.sort_values('importance', ascending=False)

    if SHOW_PLOTS:
        plot_confusion_matrix(y_test, y_pred)
        thresholds = np.arange(0.0, 1.1, 0.1)
        plot_accuracy_score(y_test, y_prob, thresholds)
        plot_feature_importance(feature_importance)

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    print("\nConfidence Levels:")
    for true, pred, prob in zip(y_test, y_pred, y_prob):
        max_prob = max(prob)
        # print(f"True: {true}, Predicted: {pred}, Confidence: {max_prob:.4f}")

    EXPECTED_COLS_COUNT = len(X.columns)



    return model

def persist_pipeline(model_obj):
    joblib.dump(model_obj, 'pipeline.pkl')




app = Flask(__name__)

try:
    model_info = joblib.load('pipeline.pkl')
    pipeline = model_info['model']
    ORIG_FEATURE_NAMES = model_info['orig_features']
    print("Pipeline loaded from file system")
except FileNotFoundError:
    pipeline = create_pipeline()
    persist_pipeline({ 'model': pipeline, 'orig_features': ORIG_FEATURE_NAMES })

feature_names = pipeline.feature_names_in_

@app.post('/predict')
def get_prediction():
    input_vector = request.json
    if input_vector is None or not isinstance(input_vector, Iterable) or len(input_vector) != 76:
        return "Invalid input vector", 400
    input_df = pd.DataFrame([input_vector], columns=ORIG_FEATURE_NAMES)
    input_df = replace_record_with_win_pct(input_df)

    prediction = pipeline.predict(input_df).tolist()[0]
    probability = pipeline.predict_proba(input_df).tolist()
    probability = max(probability[0])
    print(f"Prediction: {prediction}, Probability: {probability}")
    return {
        'outcome': prediction,
        'confidence': probability
    }



