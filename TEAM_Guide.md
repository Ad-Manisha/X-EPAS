# EPAS Team Collaboration Guide

This document provides **step-by-step instructions** and best practices for our 3-member team to collaborate on the ** X-Employee Performance Assessment System (X-EPAS) GitHub repository.

---

## Team Members & Responsibilities

| Member           | Responsibility                  | Branch     |
| ---------------- | ------------------------------- | ---------- |
| Manisha Adhikari | Backend + Database              | `backend`  |
| Preeti Gurung    | Frontend + UML                  | `frontend` |
| Aashika Regmi    | AI Evaluation / Data Processing | `ai`       |

> Each member will work on their branch and merge into `main` after review.

---

## 1. Cloning the Repository

Each member clones the repo locally:

```bash
git clone https://github.com/Ad-Manisha/X-EPAS
cd X-EPAS
```

---

## 2. Creating and Using Personal Branches

Create a branch for your work:

```bash
# Example for backend
git checkout -b backend

# Example for frontend
git checkout -b frontend

# Example for AI
git checkout -b ai
```

> Always work on your personal branch instead of `main`.

---

## 3. Working on Code

1. Add or modify files in your branch
2. Stage changes:

```bash
git add .
```

3. Commit changes with meaningful message:

```bash
git commit -m "Add initial backend folder structure"
```

---

## 4. Pushing Changes to GitHub

```bash
git push origin <branch-name>
# Example: git push origin backend
```

> This uploads your branch to GitHub so others can see your work.

---

## 5. Merging to Main Branch (Pull Request)

1. Go to GitHub → Repository → Pull Requests → New Pull Request
2. Select your branch and compare with `main`
3. Create PR → Assign a teammate for review → Merge after approval

> Do not push directly to `main`.

---

## 6. Keeping Branches Updated

Before starting new work, update your branch with latest `main`:

```bash
git checkout <your-branch>
git pull origin main
```

> Prevents conflicts with merged code from others.

---

## 7. Recommended Folder Structure

```
epas_project/
├─ backend/       # Backend APIs, FastAPI files
│   └─ .gitkeep
├─ frontend/      # React frontend files
│   └─ .gitkeep
├─ ai/            # AI model scripts, evaluation code
│   └─ .gitkeep
├─ database/        # Database models / schemas
│   └─ .gitkeep
├─ README.md      # Project info
└─ docs/          # Additional documentation
    └─ .gitkeep
```

> `.gitkeep` files ensure folders are tracked by Git even if empty.

---

## 8. Best Practices

* Commit often with descriptive messages
* Use separate branches for each feature/task
* Pull latest changes from `main` before starting work
* Use Pull Requests to merge and review code
* Avoid pushing directly to `main`

---

## 9. Helpful Commands

```bash
# Check current branch
git branch

# Switch branch
git checkout <branch-name>

# Stage changes
git add .

# Commit changes
git commit -m "Your message"

# Push changes
git push origin <branch-name>

# Pull latest changes from main
git pull origin main
```

---

**Follow this guide carefully** 
