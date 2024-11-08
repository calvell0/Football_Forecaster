# model/model.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import requests
from datetime import datetime
import json

class NFLPredictor:
    def __init__(self):
        self.model = LogisticRegression(random_state=42)
        self.scaler = StandardScaler()
        self.base_url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"

    def fetch_team_stats(self, team_id):
        """Fetch team statistics from ESPN API"""
        try:
            url = f"{self.base_url}/teams/{team_id}/statistics"
            response = requests.get(url)
            data = response.json()

            # Extract relevant statistics
            stats = {}
            if 'splits' in data:
                categories = data['splits']['categories']
                for category in categories:
                    if category['name'] == 'offense':
                        for stat in category['stats']:
                            stats[f"offense_{stat['name']}"] = float(stat['value'])
                    elif category['name'] == 'defense':
                        for stat in category['stats']:
                            stats[f"defense_{stat['name']}"] = float(stat['value'])

            return stats
        except Exception as e:
            print(f"Error fetching stats for team {team_id}: {e}")
            return {}

    def fetch_historical_games(self, season=2023):
        """Fetch historical game data from ESPN API"""
        try:
            url = f"{self.base_url}/scoreboard"
            params = {
                'limit': 1000,
                'dates': season
            }
            response = requests.get(url, params=params)
            return response.json()['events']
        except Exception as e:
            print(f"Error fetching historical games: {e}")
            return []

    def prepare_game_data(self, season=2023):
        """Prepare training data from historical games"""
        games = self.fetch_historical_games(season)
        training_data = []

        for game in games:
            if game['status']['type']['completed']:
                home_team = None
                away_team = None
                winner_id = None

                for competitor in game['competitions'][0]['competitors']:
                    if competitor['homeAway'] == 'home':
                        home_team = competitor
                    else:
                        away_team = competitor

                    if competitor['winner']:
                        winner_id = competitor['team']['id']

                if home_team and away_team:
                    # Fetch team stats
                    home_stats = self.fetch_team_stats(home_team['team']['id'])
                    away_stats = self.fetch_team_stats(away_team['team']['id'])

                    if home_stats and away_stats:
                        # Create feature vector
                        features = {
                            'home_offense_points': home_stats.get('offense_points', 0),
                            'home_offense_yards': home_stats.get('offense_yards', 0),
                            'home_defense_points': home_stats.get('defense_points', 0),
                            'home_defense_yards': home_stats.get('defense_yards', 0),
                            'away_offense_points': away_stats.get('offense_points', 0),
                            'away_offense_yards': away_stats.get('offense_yards', 0),
                            'away_defense_points': away_stats.get('defense_points', 0),
                            'away_defense_yards': away_stats.get('defense_yards', 0),
                            'home_win': 1 if winner_id == home_team['team']['id'] else 0
                        }
                        training_data.append(features)

        return pd.DataFrame(training_data)

    def train(self, season=2023):
        """Train the model using historical data"""
        # Prepare training data
        df = self.prepare_game_data(season)

        if df.empty:
            raise ValueError("No training data available")

        # Separate features and target
        X = df.drop('home_win', axis=1)
        y = df['home_win']

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )

        # Train model
        self.model.fit(X_train, y_train)

        # Calculate accuracy
        train_accuracy = self.model.score(X_train, y_train)
        test_accuracy = self.model.score(X_test, y_test)

        print(f"Training accuracy: {train_accuracy:.3f}")
        print(f"Testing accuracy: {test_accuracy:.3f}")

    def predict_game(self, home_team_id, away_team_id):
        """Predict the outcome of a game between two teams"""
        # Fetch current stats for both teams
        home_stats = self.fetch_team_stats(home_team_id)
        away_stats = self.fetch_team_stats(away_team_id)

        if not home_stats or not away_stats:
            raise ValueError("Could not fetch team stats")

        # Prepare feature vector
        features = pd.DataFrame([{
            'home_offense_points': home_stats.get('offense_points', 0),
            'home_offense_yards': home_stats.get('offense_yards', 0),
            'home_defense_points': home_stats.get('defense_points', 0),
            'home_defense_yards': home_stats.get('defense_yards', 0),
            'away_offense_points': away_stats.get('offense_points', 0),
            'away_offense_yards': away_stats.get('offense_yards', 0),
            'away_defense_points': away_stats.get('defense_points', 0),
            'away_defense_yards': away_stats.get('defense_yards', 0)
        }])

        # Scale features
        features_scaled = self.scaler.transform(features)

        # Make prediction
        prediction = self.model.predict_proba(features_scaled)[0]

        return {
            'home_team_win_probability': prediction[1],
            'away_team_win_probability': prediction[0]
        }

    def save_model(self, filename='nfl_model.json'):
        """Save model parameters and scaler"""
        model_params = {
            'coefficients': self.model.coef_.tolist(),
            'intercept': self.model.intercept_.tolist(),
            'scaler_mean': self.scaler.mean_.tolist(),
            'scaler_scale': self.scaler.scale_.tolist()
        }

        with open(filename, 'w') as f:
            json.dump(model_params, f)

    def load_model(self, filename='nfl_model.json'):
        """Load model parameters and scaler"""
        with open(filename, 'r') as f:
            model_params = json.load(f)

        self.model.coef_ = np.array(model_params['coefficients'])
        self.model.intercept_ = np.array(model_params['intercept'])
        self.scaler.mean_ = np.array(model_params['scaler_mean'])
        self.scaler.scale_ = np.array(model_params['scaler_scale'])

# Example usage:
if __name__ == "__main__":
    predictor = NFLPredictor()

    try:
        # Train the model
        print("Training model...")
        predictor.train()

        # Save the model
        predictor.save_model()

        # Example prediction (using Kansas City Chiefs vs San Francisco 49ers)
        chiefs_id = "2"  # Kansas City Chiefs
        niners_id = "25"  # San Francisco 49ers

        prediction = predictor.predict_game(chiefs_id, niners_id)
        print("\nPrediction for Chiefs (Home) vs 49ers (Away):")
        print(f"Chiefs win probability: {prediction['home_team_win_probability']:.3f}")
        print(f"49ers win probability: {prediction['away_team_win_probability']:.3f}")

    except Exception as e:
        print(f"An error occurred: {e}")