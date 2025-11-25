# 🛡️ SentinelIQ - Advanced Insider Threat Detection

**Enterprise-Grade AI/ML-Powered Cyber Security Platform**

[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)]()
[![Python](https://img.shields.io/badge/python-3.11-blue)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)]()
[![React](https://img.shields.io/badge/react-18.2-blue)]()
[![Docker](https://img.shields.io/badge/docker-ready-blue)]()

---

## 👥 Team Members

- **Abhinav P V** - Full-Stack Developer & ML Engineer
- **Abhinav Gadde** - Backend Developer & DevOps
- **Indushree** - Frontend Developer & UI/UX

---

## 🎯 Quick Overview

**SentinelIQ** is a comprehensive insider threat detection platform that uses advanced AI/ML to identify security threats from within organizations. Features real-time monitoring, behavioral analytics, and predictive threat scoring with an intuitive professional dashboard.

**Key Features:**
- 🤖 **Ensemble ML Models** - XGBoost (91.4%), Random Forest (89.7%), Isolation Forest (83.4%) → **89.3% Ensemble Accuracy**
- 📊 **Real-Time ITS Scoring** - 0-100 risk assessment
- 🎨 **Professional Dashboard** - React-based with live updates
- 🔐 **Role-Based Authentication** - Admin (full access) vs User (personal view)
- ⚡ **High Performance** - <1s threat scoring, 48ms detection time
- 🚀 **Production Ready** - Docker deployment, scalable architecture

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (v20.10+)
- Docker Compose (v2.0+)
- 4GB RAM minimum
- Ports 3000, 8000, 5432 available

### Installation & Launch

```bash
# Clone the repository
git clone https://github.com/Abhinav-P-V/Insider-Threat-Detection.git
cd insider-threat-detection

# Start all services (includes database initialization)
docker-compose up -d

# Initialize database with demo data
docker-compose exec backend python populate_database.py

# Wait for services to initialize (30 seconds)
# Access the dashboard
open http://localhost:3000
```

**That's it!** 🎉 The system is now running with:
- ✅ 50 pre-populated users
- ✅ 7 days of activity history
- ✅ Real-time threat scoring
- ✅ Interactive dashboard

> **Note:** All dependencies are installed automatically via Docker. No external installations required!

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3000 | Main web interface |
| **API** | http://localhost:8000 | REST API endpoints |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |

---

## 🔐 Quick Login

### Admin Access (View All Data):
- **Username:** `admin` | **Password:** `admin123`
- **Username:** `secadmin` | **Password:** `secure123`

### User Access (View Personal Data):
- **Any User:** `U001` to `U050` | **Password:** `user123`

📄 **Full credentials:** See [docs/LOGIN_CREDENTIALS.md](docs/LOGIN_CREDENTIALS.md)

---

## 📚 Documentation

**All comprehensive documentation is in the `docs/` folder:**

📖 **Start here:** [docs/INDEX.md](docs/INDEX.md) - Complete documentation index

**Main Documents:**
- **[docs/README.md](docs/README.md)** - Detailed project overview and quick start
- **[docs/PROJECT_EXPLANATION.md](docs/PROJECT_EXPLANATION.md)** - Complete project explanation (includes features & architecture)
- **[docs/LOGIN_CREDENTIALS.md](docs/LOGIN_CREDENTIALS.md)** - All login credentials
- **[docs/ANOMALY_TRIGGER_GUIDE.md](docs/ANOMALY_TRIGGER_GUIDE.md)** - How to trigger anomalies
- **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** - 🚀 Render cloud deployment guide
- **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API reference
- **[docs/AGENT_QUICK_START.md](docs/AGENT_QUICK_START.md)** - Real-time monitoring agent setup

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend Layer                       │
│              React + TailwindCSS + Recharts             │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────┴────────────────────────────────────┐
│                     Backend Layer                        │
│          FastAPI + Python 3.11 + Uvicorn                │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │  User APIs   │  │  ML Engine  │  │  Alerts API   │  │
│  └──────────────┘  └─────────────┘  └───────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                   Data Layer                             │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │  PostgreSQL  │  │   Redis     │  │  ML Models    │  │
│  │  (Main DB)   │  │  (Cache)    │  │  (.pkl files) │  │
│  └──────────────┘  └─────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 ML Model Performance

### Ensemble Accuracy: **89.3%**

| Model | Accuracy | Weight | Contribution |
|-------|----------|--------|--------------|
| **XGBoost** | 91.4% | 50% | 45.7% |
| **Random Forest** | 89.7% | 30% | 26.9% |
| **Isolation Forest** | 83.4% | 20% | 16.7% |
| **Ensemble** | **89.3%** | - | **100%** |

**Why Ensemble?** While XGBoost alone achieves 91.4% accuracy, the ensemble approach provides critical security advantages: reduces false positives, catches zero-day threats, improves generalization, and provides redundancy for critical decisions.

---

## 🛠️ Tech Stack

- **Backend:** FastAPI, Python 3.11, PostgreSQL, SQLAlchemy, Uvicorn
- **Frontend:** React, Vite, TailwindCSS, Recharts, Lucide React
- **ML/AI:** XGBoost, scikit-learn, NumPy, Pandas
- **Deployment:** Docker, Docker Compose
- **Database:** PostgreSQL 15

---

## 📊 Dataset & Data Generation

This project uses **programmatic data generation** rather than static dataset files:

- **Initial Data:** Generated via `backend/populate_database.py` script
- **Training Data:** ML models train on data from the PostgreSQL database
- **Real-time Data:** System generates realistic activity logs for demonstration
- **Pre-trained Models:** Included in `models/` directory (`.pkl` files)

The `populate_database.py` script creates:
- 50 users with realistic Indian names and roles
- 14 days of activity history (logon, file access, email activities)
- Realistic behavioral patterns for ML model training

**To regenerate data:**
```bash
docker-compose exec backend python populate_database.py
```

---

## 📄 License

This project is for educational purposes as part of a cybersecurity course.

---

## 🙏 Acknowledgments

- FastAPI framework for excellent API development
- scikit-learn and XGBoost for ML capabilities
- React and TailwindCSS for beautiful UI
- Docker for seamless deployment
- PostgreSQL for robust data storage

---

## 🎯 Project Status

✅ **Production Ready** - Fully functional and deployed

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: Active Development

---

<div align="center">

**Built with ❤️ for Cyber Security Education**

⭐ Star this repo if you found it helpful!

</div>
