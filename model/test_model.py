import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, KFold
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.metrics import roc_curve, roc_auc_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import time
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import joblib

df = pd.read_csv("./training_data/training_data.csv")

if df.__len__ == 0:
    print("No data, make sure you run 'npm run export' first")
    exit(-1)

df.drop(columns="event_id", inplace=True)

# Split the data into features and target
X = df.drop(['home_winner', 'home_avg_tackles_for_loss',
             'away_avg_tackles_for_loss', 'home_avg_drives', 'away_avg_drives',
             'home_completion_pct', 'away_completion_pct'], axis=1)
y = df['home_winner']

# Create a pipeline that includes scaling and logistic regression
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(max_iter=500))
])

# Fit the pipeline on the entire training data
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.33, random_state=12)

print("training...")
start = time.time()
pipeline.fit(X_train, y_train)
print("Training time: ", time.time()-start)

# Predictions and evaluation
y_pred = pipeline.predict(X_test)
y_score2 = pipeline.predict_proba(X_test)[:,1]

print(accuracy_score(y_pred, y_test))
print(confusion_matrix(y_test, y_pred))

# Optional: Cross-validation
model_accuracy = []
kf = KFold(n_splits=10)
for train, val in kf.split(X_train, y_train):
    pipe_cv = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression())
    ])
    pipe_cv.fit(X_train.iloc[train], y_train.iloc[train])
    y_pred = pipe_cv.predict(X_train.iloc[val])
    model_accuracy.append({
        'model': pipe_cv,
        'acc': accuracy_score(y_pred, y_train.iloc[val])
    })
    print(accuracy_score(y_pred, y_train.iloc[val]))

# Optional: Choose best model from cross-validation
clf_best = max(model_accuracy, key = lambda x: x['acc'])['model']

input_data = [4.0, 1.0, 5.0, 1.0, 9.0, 2.0, 5.0, 1.0, 6.0, 0.0, 11.0, 1.0, 20.727, 11.727273, 6.4545455, 2.5454545, 0.4031, 0.57143, 62.0, 351.0909, 0.90909094, 2.909091, 18.454546, 117.091, 29.09091, 65.93, 6.4545455, 50.090908, 1.6363636, 0.72727275, 1.9090909, 0.54545456, 102.3, 66.0, 3.4545455, 5.4545455, 1.4545455, 0.27272728, 24.625, 7.05, 0.91667, 2.1818182, 3.5454545, 42.436, 23.25, 12.666667, 9.0, 1.5833334, 0.45714, 0.64706004, 63.75, 395.16666, 0.75, 2.0, 15.166667, 154.417, 32.416668, 74.57, 6.1666665, 60.833332, 0.9166667, 0.16666667, 2.0, 1.75, 110.402, 62.083332, 2.5, 5.0, 1.1666666, 0.16666667, 33.555557, 13.545455, 0.95, 1.6666666, 3.0833333, 48.459]
input_data = pd.DataFrame([input_data], columns=X.columns)
print("PREDICTION:", pipeline.predict_proba(input_data))
# Convert pipeline to ONNX
initial_type = [('float_input', FloatTensorType([None, X_train.shape[1]]))]
onnx_model = convert_sklearn(pipeline, initial_types=initial_type)

# Save ONNX model
with open("../src/main/resources/lr_model/model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())

