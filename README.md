# NYC Discovery App

## Product Vision

FOR NYC residents and visitors,

WHO want to discover trending, seasonal, and highly-rated things to do in the city,

The NYC Discovery App is a personalized recommendation platform

THAT provides a "For You Page" (FYP) based on user interests, ratings, and past visits, suggesting activities like Bryant Park Winter Village during winter.

UNLIKE generic city guides or scattered social media posts,

OUR PRODUCT uses RAG (Retrieval-Augmented Generation) recommendations, location verification, and daily trending content scraping to provide personalized, up-to-date suggestions that adapt to user preferences and seasonal trends.

## Key Features (MVP)
- **Personalized Feed** - FYP with trending and recommended places
- **Search & Discovery** - Find places by category and location
- **Location Verification** - Check-in system to verify visits
- **Rating System** - Rate and review places you've visited
- **Hunter College Section** - School-specific events and places

## How to run locally:
Frontend:
- cd into frontend folder;
- run following commands:
  - npm install;
  - npm start;

Backend:
- cd into backend folder;
- If first time,
  - run: python3 -m venv venv
- All the time:
  - for mac: source venv/bin/activate
  - for windows: venv/scripts/activate
- If first time, run: pip install -r requirements.txt
- Then run: python3 run.py


You can also download an APK containing our frontend: https://expo.dev/accounts/ataurm/projects/frontend/builds/b5f70672-fec8-4da7-b941-7320826a12d5


Layered Software Architecture:
- Important Qualities:
  - Security 
  - Preformance
  - Short product lifetime
  - Able to handle large quantity of simultaneous users
  
Architecture:

<img width="1594" height="1162" alt="image" src="https://github.com/user-attachments/assets/5cf0e92c-b481-4c70-844c-7ed418ff8de9" />


- Technologies:
  - React Native with typescript 
  - Relational SQL database for users to have personalized and saved locations and events
  - Mobile platform
  - Public cloud, AWS
