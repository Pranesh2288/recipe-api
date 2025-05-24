# Recipe API

A secure, modern RESTful API for searching and listing recipes, built with Node.js, Express, and PostgreSQL. Designed with security best practices for a cybersecurity company assignment.

## Features

- **Pagination & Search:** List and search recipes with flexible filters (title, cuisine, calories, total time, rating).
- **Input Validation & Sanitization:** All user inputs are validated and sanitized to prevent SQL injection and other attacks.
- **CORS Restriction:** Only trusted origins can access the API.
- **Consistent Error Handling:** Centralized error middleware prevents leaking stack traces or sensitive info.
- **Modern UI:** Responsive frontend with partial star ratings for recipe scores.

## Endpoints

### `GET /api/recipes`

- **Query Params:**
  - `page` (int, optional): Page number (default: 1)
  - `limit` (int, optional): Results per page (default: 10, max: 100)
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
GET /api/recipes?page=2&limit=5
```

#### Search by title
```http
GET /api/recipes/search?title=chicken
```

#### Search by cuisine and minimum rating
```http
GET /api/recipes/search?cuisine=Indian&rating=>=4.5
```

#### Search by calories and total time
```http
GET /api/recipes/search?calories=<=500&total_time=<=30
```

#### Combined search
```http
GET /api/recipes/search?title=pasta&cuisine=Italian&rating=>=3.5&calories=<=600
```

## Security Highlights

- **SQL Injection Prevention:** Uses parameterized queries and input validation.
- **CORS:** Only allows requests from trusted origins (see `allowedOrigins` in `src/index.js`).
- **Error Handling:** All errors return generic messages to clients.

### Docker Setup

1. **Ensure Docker and Docker Compose are installed.**
   - [Install Docker](https://docs.docker.com/get-docker/)
   - [Install Docker Compose](https://docs.docker.com/compose/install/)
2. **Build and start the services:**
   ```bash
   docker-compose up --build
   ```
3. **Access the UI:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stopping the Docker Services

To stop and remove the containers, network, and volumes created by Docker Compose, run:

```bash
docker-compose down
```

## Customization

- **CORS:** Add your production domain to the `allowedOrigins` array in `src/index.js`.
- **Frontend:** Edit `public/index.html` for UI changes. Partial stars are rendered for ratings (e.g., 3.8 shows 3 full and 1 partial star).

## License

MIT
