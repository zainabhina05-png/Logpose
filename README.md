<div align="center">
  <img width="762" height="496" alt="image" src="https://github.com/user-attachments/assets/52a54911-6417-4d77-8061-5b2697f48e63" />
  <h1 align="center">Logpose 🧭</h1>
  <p align="center">
    <strong>A 3D interactive compass that points to your greatest passions.</strong><br>
    Built for the <a href="https://dev.to/devteam/join-our-dev-weekend-challenge-passion-edition-1000-in-prizes-across-five-winners-submissions-due-july-13-at-659-am-utc-43i0">DEV Weekend Challenge: Passion Edition</a> 
    (Category: Best use of Snowflake ❄️)
  </p>
  <p align="center">
    <a href="https://logpose-brown.vercel.app/">
      <img src="https://img.shields.io/badge/Live%20Demo-View%20App-C9973B?style=for-the-badge" alt="Live Demo">
    </a>
  </p>
</div>

<br />

<div align="center">
<img width="1792" height="907" alt="logpose5" src="https://github.com/user-attachments/assets/0ecb86d2-00cd-4fc0-8062-326bd0d04dd6" />
</div>


## 🌟 About the Project

This project was built for the **DEV Community's Weekend Challenge — Passion Edition**, a hackathon focused on building tools around the theme of passion and personal growth.

**Passion pulls us in different directions.** Logpose is a beautiful, gamified tool for tracking the hobbies, side-projects, and crafts you pour your heart into. 

Inspired by the "Log Pose" from *One Piece* which locks onto the magnetic fields of islands, this application features a **fully interactive 3D compass**. Instead of magnetic fields, you create "Islands" representing your hobbies (e.g., Coding, Painting, Running). Every time you log a session, your passion score increases, and the 3D compass needle dynamically swings to point at the island you are currently obsessed with the most!

### ✨ Key Features

- 🧭 **Interactive 3D Compass**: A stunning, physics-based 3D environment built with React Three Fiber, featuring a starry cosmos, an animated ocean plane, and clickable interactive floating islands.
- 📊 **Passion Tracking**: Log the time spent on your hobbies and your mood. The app calculates a decayed "passion score" based on recent activity, streaks, and total hours invested.
- 🏆 **Achievement System**: Unlock beautiful milestone badges as you reach time and streak goals.
- ❄️ **Snowflake Powered**: A robust backend powered entirely by **Snowflake**, securely managing users, islands, log entries, and analytics.

---

<div align="center">

<img width="1920" height="1080" alt="logpose6" src="https://github.com/user-attachments/assets/dc504014-0ade-4d83-a361-97ce12689e3c" /><br>

<img width="980" height="822" alt="logpose7" src="https://github.com/user-attachments/assets/e01c774a-4925-49ab-843a-792b1bef4b05" />

</div>

## 🛠️ Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), React, [Tailwind CSS](https://tailwindcss.com/)
- **3D Engine**: [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) (@react-three/drei)
- **Database**: [Snowflake](https://www.snowflake.com/) (using `snowflake-sdk`)
- **Authentication**: Custom JWT Authentication with secure HTTP-only cookies

## 🚀 Getting Started

To run this project locally, you will need Node.js and a Snowflake account.

### Prerequisites

1. Node.js (v18 or higher)
2. A Snowflake account (Trial works perfectly!)

### Installation

1. Clone the repository
```sh
   git clone https://github.com/your-username/logpose.git
   cd logpose
```

2. Install NPM packages
```sh
   npm install
```

3. Setup your `.env.local` file at the root of the project with your Snowflake credentials:
```env
   # Authentication
   JWT_SECRET=your_super_secret_jwt_key

   # Snowflake Connection
   SNOWFLAKE_ACCOUNT=your_account_identifier
   SNOWFLAKE_USERNAME=your_username
   SNOWFLAKE_PASSWORD=your_password
   SNOWFLAKE_DATABASE=your_db_name
   SNOWFLAKE_SCHEMA=your_schema_name
   SNOWFLAKE_WAREHOUSE=your_warehouse_name
   SNOWFLAKE_ROLE=your_role
```

4. Run the development server
```sh
   npm run dev
```
5. Open `http://localhost:3000` to view the app!

## 📜 Snowflake Database Schema

To initialize the database in your Snowflake instance, run the following SQL commands:

```sql
-- Users Table
CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,
    username VARCHAR,
    password_hash VARCHAR,
    created_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Islands Table (Hobbies/Projects)
CREATE TABLE islands (
    island_id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    name VARCHAR,
    color_hex VARCHAR,
    icon VARCHAR,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Entries Table (Logged sessions)
CREATE TABLE entries (
    entry_id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(user_id),
    island_id VARCHAR REFERENCES islands(island_id),
    minutes_spent NUMBER,
    mood_score NUMBER,
    note VARCHAR,
    logged_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#).

## 📄 License
This project is licensed under the MIT License.
