"""
Green Impact Platform — API Flask de prédictions IA
====================================================
Endpoints :
  GET  /health
  POST /predict        → prédiction pour un projet
  POST /predict/batch  → prédictions pour une liste de projets

Lancer : python predict_api.py
Port   : 5001
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# ── Feature names (ordre identique à l'entraînement) ──────────────────────────
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

# ── Chargement des modèles au démarrage ───────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model_avancement = joblib.load(os.path.join(BASE_DIR, 'model_avancement.pkl'))
    model_retard     = joblib.load(os.path.join(BASE_DIR, 'model_retard.pkl'))
    model_risque     = joblib.load(os.path.join(BASE_DIR, 'model_risque.pkl'))
    print("✓ model_avancement.pkl chargé")
    print("✓ model_retard.pkl     chargé")
    print("✓ model_risque.pkl     chargé")
except FileNotFoundError as e:
    print(f"✗ Modèle introuvable : {e}")
    print("  → Lancez d'abord : python train_model.py")
    raise SystemExit(1)
except Exception as e:
    print(f"✗ Erreur chargement modèles : {e}")
    raise


# ── Fonction de prédiction pour un projet ─────────────────────────────────────
def predict_one(features_dict: dict) -> dict:
    """Retourne les 3 prédictions pour un jeu de features."""
    values = [float(features_dict.get(f, 0)) for f in FEATURES]
    X = pd.DataFrame([values], columns=FEATURES)

    av   = float(model_avancement.predict(X)[0])
    ret  = int(model_retard.predict(X)[0])
    risq = float(model_risque.predict(X)[0])

    # Bornes valides
    av   = round(max(0.0, min(100.0, av)),  1)
    risq = round(max(0.0, min(1.0,   risq)), 3)

    finira = ret == 0

    if risq >= 0.70:
        alerte = "Intervention urgente recommandee"
    elif risq >= 0.40:
        alerte = "Intervention recommandee"
    else:
        alerte = "Projet en bonne trajectoire"

    return {
        "avancement_predit": av,
        "en_retard":         bool(ret == 1),
        "risque_retard":     risq,
        "finira_a_temps":    finira,
        "message":           f"Ce projet aura {av}% dans 6 mois",
        "alerte":            alerte,
    }


# ── Route : GET /health ────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status":  "OK",
        "message": "Green Impact AI — Service operationnel",
        "models":  ["model_avancement", "model_retard", "model_risque"],
        "port":    5001,
    })


# ── Route : POST /predict ──────────────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Corps JSON invalide. Attendu : objet avec les 8 features."}), 400

    missing = [f for f in FEATURES if f not in data]
    if missing:
        return jsonify({
            "error":   f"Features manquantes : {missing}",
            "required": FEATURES,
        }), 400

    try:
        result = predict_one(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Route : POST /predict/batch ───────────────────────────────────────────────
@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    data = request.get_json(silent=True)
    if not data or not isinstance(data, list):
        return jsonify({
            "error": "Corps JSON invalide. Attendu : liste d'objets { projet_id, projet_nom, features: {...} }"
        }), 400

    results = []
    for i, item in enumerate(data):
        projet_id  = item.get('projet_id')
        projet_nom = item.get('projet_nom', f'Projet {i + 1}')

        # Accepte les features imbriquées ou à plat
        features = item.get('features') if 'features' in item else item

        missing = [f for f in FEATURES if f not in features]
        if missing:
            results.append({
                "projet_id":  projet_id,
                "projet_nom": projet_nom,
                "error":      f"Features manquantes : {missing}",
            })
            continue

        try:
            prediction = predict_one(features)
            results.append({
                "projet_id":  projet_id,
                "projet_nom": projet_nom,
                "features":   {f: features.get(f) for f in FEATURES},
                "prediction": prediction,
            })
        except Exception as e:
            results.append({
                "projet_id":  projet_id,
                "projet_nom": projet_nom,
                "error":      str(e),
            })

    return jsonify(results)


# ── Point d'entrée ────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 50)
    print("Green Impact AI — predict_api.py")
    print("Port : 5001")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True)
