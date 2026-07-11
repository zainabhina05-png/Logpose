import snowflake from "snowflake-sdk";

snowflake.configure({ logLevel: "ERROR" });

type SnowflakeConnection = snowflake.Connection;

let connection: SnowflakeConnection | null = null;
let connecting: Promise<SnowflakeConnection> | null = null;

function getPrivateKey(): string {
  const raw = process.env.SNOWFLAKE_PRIVATE_KEY;
  if (!raw) throw new Error("SNOWFLAKE_PRIVATE_KEY is not configured");
  return raw.replace(/\\n/g, "\n");
}

function createConnection(): SnowflakeConnection {
  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  if (!account || !username) {
    throw new Error("Snowflake account/username not configured");
  }

  const options: snowflake.ConnectionOptions = {
    account,
    username,
    authenticator: "SNOWFLAKE_JWT",
    privateKey: getPrivateKey(),
    database: process.env.SNOWFLAKE_DATABASE ?? "logpose_db",
    schema: process.env.SNOWFLAKE_SCHEMA ?? "app",
    warehouse: process.env.SNOWFLAKE_WAREHOUSE ?? "logpose_wh",
    role: process.env.SNOWFLAKE_ROLE ?? "logpose_app_role",
  };

  const passphrase = process.env.SNOWFLAKE_PRIVATE_KEY_PASSPHRASE;
  if (passphrase) {
    options.privateKeyPass = passphrase;
  }

  return snowflake.createConnection(options);
}

function connect(conn: SnowflakeConnection): Promise<SnowflakeConnection> {
  return new Promise((resolve, reject) => {
    conn.connect((err) => {
      if (err) reject(err);
      else resolve(conn);
    });
  });
}

async function getConnection(): Promise<SnowflakeConnection> {
  if (connection) {
    return connection;
  }
  if (connecting) {
    return connecting;
  }
  connecting = connect(createConnection()).then((conn) => {
    connection = conn;
    connecting = null;
    return conn;
  });
  return connecting;
}

export async function execute<T = Record<string, unknown>>(
  sql: string,
  binds: snowflake.Binds = []
): Promise<T[]> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText: sql,
      binds,
      complete: (err, _stmt, rows) => {
        if (err) {
          console.error("[Snowflake]", err.message);
          reject(err);
        } else {
          resolve((rows ?? []) as T[]);
        }
      },
    });
  });
}
