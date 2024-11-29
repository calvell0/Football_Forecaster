import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, KFold
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.metrics import roc_curve, roc_auc_score
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
import time
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import joblib

df = pd.read_csv("./training_data/training_data.csv")

if df.__len__ == 0:
    print("No data, make sure you run 'npm run export' first")
    exit(-1)

df.drop(columns="event_id", inplace=True)
# pd.get_dummies(df, columns=["home_winner"])

# Split the data into features and target
X = df.drop(['home_winner', 'home_avg_tackles_for_loss', 'away_avg_tackles_for_loss'], axis=1)
y = df['home_winner']

# Scale the features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y,
    test_size=0.33, random_state=12)

print("training...")
start = time.time()
clf = LogisticRegression(max_iter=500).fit(X_train, y_train)
print("Training time: ", time.time()-start)
y_pred = clf.predict(X_test)
y_score2 = clf.predict_proba(X_test)[:,1]

print(accuracy_score(y_pred, y_test))
print(confusion_matrix(y_test, y_pred))

cols = X.columns
print(cols)
feat_importances = pd.Series(clf.coef_[0], index=cols)
feat_importances.nsmallest(40).plot(kind='barh')
# plt.tight_layout()
# plt.show()

model_accuracy = []
kf = KFold(n_splits=10)
#split train data to train and validation
for train, val in kf.split(X_train, y_train):
    clf = LogisticRegression().fit(X_train[train], y_train.iloc[train])
    y_pred = clf.predict(X_train[val])
    model_accuracy.append({'model': clf, 'acc': accuracy_score(y_pred, y_train.iloc[val])})
    print(accuracy_score(y_pred, y_train.iloc[val]))

#choosing the highest accuracy model
clf_best = max(model_accuracy, key = lambda x: x['acc'])['model']

#run it on the test set
y_test_pred = clf_best.predict(X_test)
print('test accuracy:',accuracy_score(y_test, y_test_pred))

false_positive_rate2, true_positive_rate2, threshold2 = roc_curve(y_test, y_score2)
print('roc_auc_score for Logistic Regression: ', roc_auc_score(y_test, y_score2))


initial_type = [('float_input', FloatTensorType([None, X_train.shape[1]]))]
onnx_model = convert_sklearn(clf_best, initial_types=initial_type)
with open("../src/main/resources/lr_model/model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())
