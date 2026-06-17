"""
Green Impact Platform — Entraînement des modèles IA
====================================================
Lit green_impact_4000_training_data.xlsx (feuille "Dataset Principal")
et entraîne 3 modèles RandomForest :
  - model_avancement.pkl  (régression,    label_avancement_s_plus_1)
  - model_retard.pkl      (classification, label_en_retard OUI/NON)
  - model_risque.pkl      (régression,    label_risque_retard)
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, accuracy_score, classification_report
import joblib
import os

# ── Configuration ──────────────────────────────────────────────────────────────
EXCEL_FILE = 'green_impact_4000_training_data.xlsx'
SHEET_NAME = 'Dataset Principal'

FEATURES = [
    'avancement_actuel_pct',
    'avancement_prevu_pct',
    'ecart_avancement_pct',
    'budget_consomme_pct',
    'taux_completion_jalons_pct',
    'velocity_score',
    'ratio_avancement_budget',
    'semestre_normalise',
]

LABEL_AVANCEMENT = 'label_avancement_s_plus_1'
LABEL_RETARD     = 'label_en_retard'
LABEL_RISQUE     = 'label_risque_retard'

SEP = "=" * 60

# ── 1. Lecture du fichier Excel ────────────────────────────────────────────────
print(SEP)
print("CHARGEMENT DES DONNÉES")
print(SEP)

script_dir = os.path.dirname(os.path.abspath(__file__))
excel_path = os.path.join(script_dir, EXCEL_FILE)

df = pd.read_excel(excel_path, sheet_name=SHEET_NAME, header=1)
print(f"Dataset chargé : {df.shape[0]} lignes × {df.shape[1]} colonnes")

# Afficher les colonnes disponibles pour diagnostic
print(f"Colonnes         : {list(df.columns[:10])} … ({df.shape[1]} total)")

# ── 2. Encodage label_en_retard  OUI → 1 / NON → 0 ───────────────────────────
df[LABEL_RETARD] = df[LABEL_RETARD].map({'OUI': 1, 'NON': 0})

# ── 3. Suppression des lignes avec valeurs manquantes ─────────────────────────
cols_needed = FEATURES + [LABEL_AVANCEMENT, LABEL_RETARD, LABEL_RISQUE]
before = len(df)
df = df.dropna(subset=cols_needed)
print(f"Lignes retenues  : {len(df)} (supprimées : {before - len(df)})")

# ── 4. Features et labels ──────────────────────────────────────────────────────
X  = df[FEATURES]
y1 = df[LABEL_AVANCEMENT].astype(float)
y2 = df[LABEL_RETARD].astype(int)
y3 = df[LABEL_RISQUE].astype(float)

# ── 5. Split train / test 80/20 ───────────────────────────────────────────────
X_train, X_test, y1_train, y1_test, y2_train, y2_test, y3_train, y3_test = \
    train_test_split(X, y1, y2, y3, test_size=0.20, random_state=42)

print(f"Train : {len(X_train)} lignes | Test : {len(X_test)} lignes")

# ── 6. Modèle 1 — Avancement (Régression) ─────────────────────────────────────
print(f"\n{SEP}")
print("Modèle 1 — Avancement (Régression)")
print(SEP)

model_avancement = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
)
model_avancement.fit(X_train, y1_train)

y1_pred = model_avancement.predict(X_test)
r2_av   = r2_score(y1_test, y1_pred)
mae_av  = mean_absolute_error(y1_test, y1_pred)

print(f"   R²  = {r2_av:.3f}  {'[OK] objectif R² > 0.85 atteint' if r2_av >= 0.85 else '[!!] objectif R² > 0.85 non atteint'}")
print(f"   MAE = {mae_av:.2f}%  {'[OK] objectif MAE < 5% atteint'  if mae_av < 5  else '[!!] objectif MAE < 5% non atteint'}")

# ── 7. Modèle 2 — Retard (Classification) ─────────────────────────────────────
print(f"\n{SEP}")
print("Modèle 2 — Retard (Classification)")
print(SEP)

model_retard = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
)
model_retard.fit(X_train, y2_train)

y2_pred  = model_retard.predict(X_test)
acc_ret  = accuracy_score(y2_test, y2_pred)

print(f"   Accuracy = {acc_ret:.3f}  {'[OK] objectif > 0.90 atteint' if acc_ret >= 0.90 else '[!!] objectif > 0.90 non atteint'}")
print()
print(classification_report(y2_test, y2_pred, target_names=['NON (0)', 'OUI (1)']))

# ── 8. Modèle 3 — Risque (Régression) ─────────────────────────────────────────
print(f"\n{SEP}")
print("Modèle 3 — Risque (Régression)")
print(SEP)

model_risque = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
)
model_risque.fit(X_train, y3_train)

y3_pred = model_risque.predict(X_test)
r2_ri   = r2_score(y3_test, y3_pred)
mae_ri  = mean_absolute_error(y3_test, y3_pred)

print(f"   R²  = {r2_ri:.3f}  {'[OK] objectif R² > 0.85 atteint' if r2_ri >= 0.85 else '[!!] objectif R² > 0.85 non atteint'}")
print(f"   MAE = {mae_ri:.4f}")

# ── 9. Feature importance (Top 5) ─────────────────────────────────────────────
print(f"\n{SEP}")
print("Top 5 features — Modèle Avancement")
print(SEP)

importances = pd.Series(model_avancement.feature_importances_, index=FEATURES)
importances = importances.sort_values(ascending=False)
for rank, (feat, imp) in enumerate(importances.head(5).items(), 1):
    bar = '#' * int(imp * 100 / 3)
    print(f"   {rank}. {feat:<35} : {imp * 100:5.1f}%  {bar}")

# ── 10. Sauvegarde des modèles ─────────────────────────────────────────────────
print(f"\n{SEP}")
print("SAUVEGARDE DES MODÈLES")
print(SEP)

for model, filename in [
    (model_avancement, 'model_avancement.pkl'),
    (model_retard,     'model_retard.pkl'),
    (model_risque,     'model_risque.pkl'),
]:
    path = os.path.join(script_dir, filename)
    joblib.dump(model, path)
    print(f"   [OK] {filename} sauvegardé → {path}")

# ── 11. Test de prédiction exemple ────────────────────────────────────────────
print(f"\n{SEP}")
print("TEST PRÉDICTION EXEMPLE")
print(SEP)

test_values = {
    'avancement_actuel_pct':      42.0,
    'avancement_prevu_pct':       50.0,
    'ecart_avancement_pct':       -8.0,
    'budget_consomme_pct':        65.0,
    'taux_completion_jalons_pct': 43.0,
    'velocity_score':              0.84,
    'ratio_avancement_budget':     0.65,
    'semestre_normalise':          0.5,
}

test_df = pd.DataFrame([test_values])[FEATURES]

av_pred   = round(float(model_avancement.predict(test_df)[0]), 1)
ret_pred  = int(model_retard.predict(test_df)[0])
risq_pred = round(float(model_risque.predict(test_df)[0]), 2)

# Clamp
av_pred   = max(0.0, min(100.0, av_pred))
risq_pred = max(0.0, min(1.0, risq_pred))

print(f"   Input  : avancement=42%, prévu=50%, écart=-8%")
print(f"            budget=65%, jalons=43%, velocity=0.84")
print(f"            ratio=0.65, semestre=0.5")
print()
print(f"   Avancement prédit : {av_pred}%")
print(f"   En retard         : {'OUI' if ret_pred == 1 else 'NON'}")
print(f"   Risque            : {risq_pred}")
print(f"   Message           : Ce projet aura {av_pred}% dans 6 mois")

print(f"\n{SEP}")
print("Entraînement terminé avec succès !")
print(SEP)
