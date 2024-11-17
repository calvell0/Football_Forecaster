import numpy as np
from sklearn.linear_model import LogisticRegression
import logging

logger = logging.getLogger(__name__)

class NFLPredictor:
    def __init__(self, competitor_repository=None):
        """
        Initialize predictor with repository dependency

        Args:
            competitor_repository: Spring CompetitorRepository instance
        """
        self.model = LogisticRegression()
        self.competitor_repository = competitor_repository

    def predict_game(self, home_team_id, away_team_id):
        """
        Simple prediction based on current season records

        Args:
            home_team_id: ID for home team
            away_team_id: ID for away team

        Returns:
            (boolean, float): (True if home team wins, confidence between 0-1)
        """
        try:
            # Use repository to get latest records
            home_competitor = self.competitor_repository.findLatestByTeamId(home_team_id)
            away_competitor = self.competitor_repository.findLatestByTeamId(away_team_id)

            if not home_competitor.isPresent() or not away_competitor.isPresent():
                logger.warn(f"Missing competitor data for teams {home_team_id} and/or {away_team_id}")
                return (True, 0.5)

            # Calculate win percentages
            home_competitor = home_competitor.get()
            away_competitor = away_competitor.get()

            home_total_games = home_competitor.getTotalWins() + home_competitor.getTotalLosses()
            away_total_games = away_competitor.getTotalWins() + away_competitor.getTotalLosses()

            home_win_pct = (home_competitor.getTotalWins() / home_total_games) if home_total_games > 0 else 0.5
            away_win_pct = (away_competitor.getTotalWins() / away_total_games) if away_total_games > 0 else 0.5

            # Simple probability calculation
            home_prob = (home_win_pct + (1 - away_win_pct)) / 2

            # Return prediction matching PlaceholderPrediction format
            return (home_prob > 0.5, home_prob if home_prob > 0.5 else 1 - home_prob)

        except Exception as e:
            logger.error(f"Error predicting game outcome: {str(e)}")
            return (True, 0.5)  # Return 50-50 prediction on error