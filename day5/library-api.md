
# Library Books REST API Design

## Overview

This API manages books in a library. It allows users to list books,
retrieve a single book, create books, update books, delete books,
and find books written by a particular author.

Base URL: `https://api.example.com`

## 1. List All Books

- **Method:** GET
- **Path:** `/books`
- **Description:** Retrieves a list of all books in the library.
- **Example request body:** None required.
- **Success status code:** `200 OK`

## 2. Get One Book

- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Retrieves a single book using its unique ID.
- **Example request body:** None required.
- **Success status code:** `200 OK`

Example: `GET /books/42`

## 3. Create a Book

- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

- **Success status code:** `201 Created`

## 4. Update a Book

- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Replaces the details of an existing book.
- **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

- **Success status code:** `200 OK`

Example: `PUT /books/42`

## 5. Delete a Book

- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Deletes a book using its unique ID.
- **Example request body:** None required.
- **Success status code:** `204 No Content`

Example: `DELETE /books/42`

## 6. List Books by Author

- **Method:** GET
- **Path:** `/books?author={authorName}`
- **Description:** Retrieves books written by the specified author.
- **Example request body:** None required.
- **Success status code:** `200 OK`

Example: `GET /books?author=Chinua%20Achebe`

## Error Responses

### 400 Bad Request

- **Meaning:** The request contains invalid data or parameters.
- **Example:** Creating a book with a missing title or an invalid year.
- **Example response:**

```json
{
  "error": "Invalid book details"
}
```

### 404 Not Found

- **Meaning:** The requested resource does not exist.
- **Example:** Requesting `GET /books/9999` when book 9999 does not exist.
- **Example response:**

```json
{
  "error": "Book not found"
}
```

## Summary of Endpoints

| Method | Path | Purpose | Success Status |
|---|---|---|---|
| GET | `/books` | List all books | 200 OK |
| GET | `/books/{id}` | Get one book | 200 OK |
| POST | `/books` | Create a book | 201 Created |
| PUT | `/books/{id}` | Update a book | 200 OK |
| DELETE | `/books/{id}` | Delete a book | 204 No Content |
| GET | `/books?author={authorName}` | List books by author | 200 OK |
