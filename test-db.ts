import { execute } from "./lib/snowflake";

async function run() {
  try {
    const rows = await execute("SELECT user_id, email, password_hash FROM users LIMIT 5");
    console.log("Users:", rows);
  } catch (err) {
    console.error(err);
  }
}
run();
