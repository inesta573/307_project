# 307_project

Accounts and login sessions are stored in one MariaDB database on the COMP 307 group server. Each person runs the PHP API and the React app on their own computer. Those API processes connect to the shared database through an SSH tunnel.

The database and tables already exist. Do not create another database.

| Setting | Value |
|---|---|
| SSH host | `fall2026-comp307` |
| Server | `fall2026-comp307-group11.cs.mcgill.ca` |
| Database | `comp-307-db` |
| MariaDB user | `cs307-user` |
| Password | the line in `~/mysqlpass.txt` on the server |
| Tunnel | your port `3307` to the server's port `3306` |

`backend/api/db.php` reads `DB_PASSWORD` from a `.env` file in the project root and connects to `127.0.0.1` port `3307`. Signup and login include that file. The React app never opens the database. It calls `/api/signup.php` and `/api/login.php`.

You need the McGill VPN, unless you are on campus or already on a McGill computer.

## 1. Install PHP and Node

On macOS with Homebrew:

```bash
brew install php node
php -m | grep mysqli
```

The last command should print `mysqli`.

Leave the local MySQL service stopped. The app does not use it. The `mysql` command from Homebrew MySQL 8.4 or newer also cannot log in to this server, because the server uses `mysql_native_password` and that client no longer includes it.

## 2. Set up the SSH key

The course email includes `cs307-group11-key`. Save it as `~/.ssh/cs307-group11-key` and restrict it:

```bash
chmod 400 ~/.ssh/cs307-group11-key
```

Add this to `~/.ssh/config`:

```
host fall2026-comp307
    User cs307-user
    Hostname fall2026-comp307-group11.cs.mcgill.ca
    IdentityFile ~/.ssh/cs307-group11-key
    IdentitiesOnly yes
```

Connect the McGill VPN, then check the login:

```bash
ssh fall2026-comp307
```

You should land in a shell as `cs307-user`.

## 3. Create `.env`

On the server, print the database password:

```bash
cat ~/mysqlpass.txt
```

Log out with `exit`. In the project folder on your computer, create `.env` with that value:

```
DB_PASSWORD=paste-the-password-here
```

`.env` is listed in `.gitignore`. Do not commit it. Each person creates this file on their own machine. The password is the same for the whole group.

## 4. Open the tunnel

In a terminal on your computer, not inside the SSH session:

```bash
ssh -L 3307:127.0.0.1:3306 fall2026-comp307
```

Leave this terminal open. Port `3307` is on your computer. The server's MariaDB stays on port `3306`.

## 5. Start the API

In a second terminal, from the `backend` folder:

```bash
php -S localhost:8000
```

Leave it open. `backend/api/db.php` loads `.env` and connects through the tunnel.

Check it:

```bash
curl http://localhost:8000/api/health.php
```

Expected response: `{"status":"ok","message":"CampusConnect API is running"}`.

The login file on disk is `backend/api/Login.php`. The URL is `/api/login.php`. That works on macOS.

## 6. Start the website

In a third terminal, from the `frontend` folder:

```bash
npm install
npm run dev
```

Open http://localhost:5173.

Vite forwards `/api/...` to `http://[::1]:8000`. All three terminals stay open while you use the app: the tunnel, PHP, and Vite.

Sign up with a `@mail.mcgill.ca` email, then log in. The new account is stored in `comp-307-db` on the group server, so the other people in the group can see it too.

## See the rows

On the group server, after `ssh fall2026-comp307`:

```bash
mysql -u cs307-user -p comp-307-db -e "SELECT * FROM members; SELECT * FROM tickets;"
```

Type the password from `~/mysqlpass.txt`.

From your Mac, the Homebrew `mysql` client fails with `Authentication plugin 'mysql_native_password' cannot be loaded`. Use PHP instead, from the project folder, while the tunnel is open:

```bash
php -r '
require "backend/api/db.php";
if ($conn->connect_error) { fwrite(STDERR, $conn->connect_error . "\n"); exit(1); }
foreach (["members", "tickets"] as $table) {
  echo "== $table ==\n";
  $result = $conn->query("SELECT * FROM $table");
  while ($row = $result->fetch_assoc()) { echo json_encode($row), "\n"; }
  if ($result->num_rows === 0) echo "(no rows)\n";
}
'
```

`members` holds `email`, `pin`, and `name`. `email` is the primary key. `pin` is the password in plain text. `tickets` holds the login session id and the member's email.

## Tables

These tables are already in `comp-307-db`. The account `cs307-user` cannot create a new database.

**`members`**

| Column | Type | Notes |
|---|---|---|
| `email` | `varchar(255)` | Primary key. Signup accepts only `@mail.mcgill.ca` and stores it in lowercase. |
| `pin` | `varchar(255)` | Password, stored as plain text. |
| `name` | `varchar(255)` | Display name. |

**`tickets`**

| Column | Type | Notes |
|---|---|---|
| `ticket` | `varchar(64)` | Primary key. Random 64-character hex string created at login. |
| `member_email` | `varchar(255)` | Email of the member who logged in. |

Signup inserts into `members`. Login reads `members`, then inserts into `tickets`. The browser saves `ticket`, `name`, and `email` in `localStorage`.

## Add a query

Put a new file in `backend/api`, include the shared connection, and use `?` placeholders. `s` means string, one letter per value, in the same order as the placeholders.

```php
<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Content-Type: application/json");

require __DIR__ . "/db.php";

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$stmt = $conn->prepare("SELECT email, name FROM members WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
```

From React:

```javascript
const response = await fetch("/api/your-file.php", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ email }),
});
const data = await response.json();
```
