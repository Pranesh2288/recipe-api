# Recipe API

A secure, modern RESTful API for searching and listing recipes, built with Node.js, Express, and PostgreSQL. Designed with security best practices for a cybersecurity company assignment.

## Features

- **Pagination & Search:** List and search recipes with flexible filters (title, cuisine, calories, total time, rating).
- **Input Validation & Sanitization:** All user inputs are validated and sanitized to prevent SQL injection and other attacks.
- **CORS Restriction:** Only trusted origins can access the API.
- **Consistent Error Handling:** Centralized error middleware prevents leaking stack traces or sensitive info.
- **Modern UI:** Responsive frontend with partial star ratings for recipe scores.

### Docker Setup

1. **Ensure Docker and Docker Compose are installed.**
   - [Install Docker](https://docs.docker.com/get-docker/)
   - [Install Docker Compose](https://docs.docker.com/compose/install/)
2. **Change to Pranesh_IIIT Sricity_Recipes Assessment**
   ```bash
   cd pranesh_181_IIITSricity/
   ```
3. **Build and start the services:**
   ```bash
   docker-compose up --build
   ```
   Wait for the following message to appear in the terminal: app_1 | 🚀 Server is running on http://localhost:3000
   (It might take some time based on network speed.)
4. **Access the UI:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stopping the Docker Services

To stop and remove the containers, network, and volumes created by Docker Compose, run:

```bash
docker-compose down
```

## Endpoints

### `GET /api/recipes`

- **Query Params:**
  - `page` (int, optional): Page number (default: 1)
  - `limit` (int, optional): Results per page (default: 10, max: 50)
- **Returns:** Paginated list of recipes, ordered by rating (NULL ratings always last).

### `GET /api/recipes/search`

- **Query Params:**
  - `title` (string, optional): Partial match
  - `cuisine` (string, optional): Exact match
  - `calories`, `total_time`, `rating` (string, optional): Comparison, e.g. `>=100`
- **Returns:** Filtered list of recipes.

### Example API Requests

#### Get paginated recipes (page 2, 5 per page)

```http
GET /api/recipes?page=2&limit=15
```

#### Search by title

```http
GET /api/recipes/search?title=Sweet
```

#### Search by cuisine and minimum rating

```http
GET /api/recipes/search?cuisine=Southern Recipes&rating=>=4.5
```

#### Search by calories and total time

```http
GET /api/recipes/search?calories=<=500&total_time=<=30
```

#### Combined search

```http
GET /api/recipes/search?title=Sweet Potato Pie&cuisine=Southern Recipes&rating=>3.5&calories=<=600
```

## Security Highlights

- **SQL Injection Prevention:** Uses parameterized queries and input validation.
- **CORS:** Only allows requests from trusted origins (see `allowedOrigins` in `src/index.js`).
- **Error Handling:** All errors return generic messages to clients.

## CORS Protection

This API uses CORS protection to only allow requests from trusted origins.

### How to Test CORS

#### 1. Allowed Origin

If you send a request from an allowed origin (e.g., http://localhost:3000), the request will succeed.

#### 2. Disallowed Origin

If you send a request from a disallowed origin, the API will respond with a CORS error.

**Example using curl:**

```bash
curl -H "Origin: http://evil.com" --verbose http://localhost:3000/api/recipes
```

**Expected response:**

```json
{ "error": "CORS policy: This origin is not allowed." }
```

You can also test by opening your frontend from a different port or domain and making an API request. The browser will block the request and show a CORS error in the console if the origin is not allowed.

---

# How to Check if SQL Injection Protection is Working

---

## 1. Try a Malicious Input

Send a request with suspicious input, such as:

```
/api/recipes/search?title=' OR 1=1; --
```

or

```
/api/recipes/search?calories=>0;DROP TABLE recipes;--
```

---

## 2. Expected Behavior

- The API should **not** return all records or behave unexpectedly.
- The API should **not** execute any injected SQL (e.g., it should not drop tables).
- You should receive a validation error or a normal (safe) response.

---

## 3. Why This Works

API uses parameterized queries and input validation, so SQL injection attempts will either be blocked by validation or treated as plain text, not as executable SQL.

---

## 4. Check the Logs

- No SQL errors or suspicious activity appears in your server logs.
- The database remains intact.

---
