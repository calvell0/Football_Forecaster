import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import logging
import joblib
import pandas as pd

logger = logging.getLogger(__name__)

class NFLPredictor:
    def __init__(self, competitor_repository=None):
        self.model = LogisticRegression(random_state=42)
        self.competitor_repository = competitor_repository
        self.scaler = StandardScaler()

    def calculate_win_percentage(self, wins, losses):
        total_games = wins + losses
        return wins / total_games if total_games > 0 else 0.5

    def train(self, data_path, save_model_path=None):
        try:
            # Load and preprocess data
            df = pd.read_csv(data_path)

            # Handle any missing values or infinities
            df = df.fillna(0)

            # Extract features
            feature_columns = [
                'home_total_wins', 'home_total_losses',
                'away_total_wins', 'away_total_losses',
                'home_win_pct', 'away_win_pct'
            ]

            X = df[feature_columns]
            y = df['home_winner']

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)

            # Train model
            self.model.fit(X_train_scaled, y_train)

            # Evaluate model
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)

            logger.info(f"Model Training Complete:")
            logger.info(f"Training accuracy: {train_score:.3f}")
            logger.info(f"Testing accuracy: {test_score:.3f}")

            if save_model_path:
                self.save_model(save_model_path)

            return train_score, test_score

        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            logger.error("Stack trace:", exc_info=True)
            raise

    def predict_game(self, home_team_id, away_team_id):
        try:
            home_competitor = self.competitor_repository.findLatestByTeamId(home_team_id)
            away_competitor = self.competitor_repository.findLatestByTeamId(away_team_id)

            if not home_competitor.isPresent() or not away_competitor.isPresent():
                logger.warn(f"Missing competitor data for teams {home_team_id} and/or {away_team_id}")
                return (True, 0.5)

            home_competitor = home_competitor.get()
            away_competitor = away_competitor.get()

            # Calculate win percentages safely
            home_win_pct = self.calculate_win_percentage(
                home_competitor.getTotalWins(),
                home_competitor.getTotalLosses()
            )
            away_win_pct = self.calculate_win_percentage(
                away_competitor.getTotalWins(),
                away_competitor.getTotalLosses()
            )

            features = np.array([[
                home_competitor.getTotalWins(),
                home_competitor.getTotalLosses(),
                away_competitor.getTotalWins(),
                away_competitor.getTotalLosses(),
                home_win_pct,
                away_win_pct
            ]])

            features_scaled = self.scaler.transform(features)
            prob = self.model.predict_proba(features_scaled)[0]
            home_win_prob = prob[1]

            logger.info(f"Home team record: {home_competitor.getTotalWins()}-{home_competitor.getTotalLosses()}")
            logger.info(f"Away team record: {away_competitor.getTotalWins()}-{away_competitor.getTotalLosses()}")
            logger.info(f"Prediction probabilities: {prob}")

            return (home_win_prob > 0.5, max(home_win_prob, 1 - home_win_prob))

        except Exception as e:
            logger.error(f"Error predicting game outcome: {str(e)}")
            logger.error("Stack trace:", exc_info=True)
            return (True, 0.5)

    def save_model(self, path):
        try:
            model_data = {
                'model': self.model,
                'scaler': self.scaler
            }
            joblib.dump(model_data, path)
            logger.info(f"Model saved to {path}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def load_model(self, path):
        try:
            model_data = joblib.load(path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            logger.info(f"Model loaded from {path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise