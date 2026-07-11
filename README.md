<div align="center">
  <img src="./public/favicon.ico" alt="Logo" width="80" height="80">
  <h1 align="center">Logpose 🧭</h1>
  <p align="center">
    <strong>A 3D interactive compass that points to your greatest passions.</strong><br>
    Built for the <a href="https://dev.to/devteam/join-our-dev-weekend-challenge-passion-edition-1000-in-prizes-across-five-winners-submissions-due-july-13-at-659-am-utc-43i0">DEV Weekend Challenge: Passion Edition</a> 
    (Category: Best use of Snowflake ❄️)
  </p>
</div>

<br />

<!-- SCREENSHOT PLACEHOLDERS - REPLACE THESE LINKS WITH YOUR ACTUAL SCREENSHOTS -->
<div align="center">
  <img src="https://via.placeholder.com/800x450.png?text=Replace+with+Landing+Page+Screenshot" alt="Landing Page">
</div>

## 🌟 About the Project

**Passion pulls us in different directions.** Logpose is a beautiful, gamified tool for tracking the hobbies, side-projects, and crafts you pour your heart into. 

Inspired by the "Log Pose" from *One Piece* which locks onto the magnetic fields of islands, this application features a **fully interactive 3D compass**. Instead of magnetic fields, you create "Islands" representing your hobbies (e.g., Coding, Painting, Running). Every time you log a session, your passion score increases, and the 3D compass needle dynamically swings to point at the island you are currently obsessed with the most!

### ✨ Key Features

- 🧭 **Interactive 3D Compass**: A stunning, physics-based 3D environment built with React Three Fiber, featuring a starry cosmos, an animated ocean plane, and clickable interactive floating islands.
- 📊 **Passion Tracking**: Log the time spent on your hobbies and your mood. The app calculates a decayed "passion score" based on recent activity, streaks, and total hours invested.
- 🏆 **Achievement System**: Unlock beautiful milestone badges as you reach time and streak goals.
- ❄️ **Snowflake Powered**: A robust backend powered entirely by **Snowflake**, securely managing users, islands, log entries, and analytics.

---

<div align="center">
  <!-- SECOND SCREENSHOT PLACEHOLDER -->
  <img src="https://via.placeholder.com/800x450.png?text=Replace+with+Dashboard+Screenshot" alt="Dashboard">
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
