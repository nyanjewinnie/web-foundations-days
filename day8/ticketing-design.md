
# TicketHub: Event Ticketing System Design

## 1. Requirements

### Functional Requirements

- Users can register, log in, and manage their accounts.
- Users can browse events and view event details.
- Users can view available seats and ticket prices.
- Users can temporarily hold available seats while completing payment.
- Users can pay for held seats and receive booking confirmation.
- Users can view their purchased tickets and order history.
- Administrators can create events, configure seating, and monitor sales.

### Non-Functional Requirements

- **Speed:** Event pages should load quickly, with a target of under 2 seconds for most normal requests.
- **Correctness:** A seat must never be sold to two different customers.
- **Fairness:** Seat holds must expire after a short period, such as 5 minutes, so abandoned bookings release seats.
- **Availability:** The website should remain usable during high-demand sales.
- **Security:** Payments and personal information must be protected using HTTPS, authentication, authorization, and secure payment-provider integration.
- **Scalability:** The system must support large traffic spikes without losing confirmed orders.
- **Reliability:** Failed payment callbacks and interrupted requests must be handled safely without creating duplicate orders.

## 2. Traffic and Capacity Estimates

### Normal Day

Given:
- 2 million registered users.
- 50,000 daily visitors.
- Each visitor views 10 pages.
- 5,000 tickets sold daily.

Page views per day:

50,000 × 10 = 500,000 page views/day.

Average page requests per second:

500,000 ÷ 86,400 ≈ 5.8 requests/second.

Average ticket sales per second:

5,000 ÷ 86,400 ≈ 0.058 tickets/second.

These are daily averages. Actual traffic varies throughout the day.

### Popular Concert Sale

Given:
- 200,000 people attempt to buy tickets.
- 20,000 seats are available.
- The rush happens within 10 minutes.

Average incoming buyers per second:

200,000 ÷ 600 ≈ 333 buyers/second.

Available seats per second if evenly sold:

20,000 ÷ 600 ≈ 33 seats/second.

The sale attracts 10 potential buyers for every available seat.

### Comparison

The big sale creates approximately 333 buyer attempts per second, compared with an average of about 5.8 page requests per second on a normal day. These figures measure different types of activity, so they are not a direct like-for-like comparison. The sale also creates intense contention for the same limited inventory.

The system should be load-tested above the estimated average, with extra capacity for sudden bursts, retries, seat browsing, and payment callbacks.

## 3. API Design

The API uses HTTPS and JSON. Protected endpoints require authentication.

| Method | Endpoint | Purpose | Success Status |
|---|---|---|---|
| GET | `/events` | Browse and search events | 200 OK |
| GET | `/events/{eventId}` | View event details | 200 OK |
| GET | `/events/{eventId}/seats` | View seat availability | 200 OK |
| POST | `/seats/{seatId}/holds` | Temporarily hold a seat | 201 Created |
| POST | `/orders` | Create an order from valid holds | 201 Created |
| POST | `/orders/{orderId}/payment` | Initiate payment with a payment provider | 202 Accepted |
| GET | `/tickets` | View the current user's tickets | 200 OK |
| GET | `/orders/{orderId}` | Check order and payment status | 200 OK |

### Seat Hold Request

`POST /seats/SEAT-101/holds`

Example request:

```json
{
  "eventId": "EVENT-10"
}
```

The server checks seat availability and creates a temporary hold with an expiry time. The response includes a hold ID and expiry timestamp.

If the seat is already sold or held by another user, the API returns `409 Conflict`.

### Payment Flow

1. The customer requests a seat hold.
2. The server reserves the seat temporarily.
3. The customer creates an order using the valid hold.
4. The system initiates payment with a payment provider.
5. The server verifies the provider's payment notification.
6. The order becomes confirmed and the ticket is issued only after verified successful payment.

Payment requests and callbacks must be idempotent so that retries do not create duplicate charges or tickets.

## 4. Data Model

The main tables are `users`, `events`, `seats`, and `orders`. A separate `seat_holds` table tracks temporary reservations, while `payments` records payment attempts.

### Users

- `id`: Primary key.
- `name`: Customer name.
- `email`: Unique email address.
- `password_hash`: Secure password hash.
- `created_at`: Account creation timestamp.

### Events

- `id`: Primary key.
- `name`: Event name.
- `venue`: Venue name.
- `starts_at`: Event start time.
- `status`: Draft, on sale, sold out, or cancelled.

### Seats

- `id`: Primary key.
- `event_id`: Foreign key referencing events.
- `seat_label`: Seat identifier, such as A-12.
- `price`: Ticket price.
- `status`: Available, held, or sold.

Constraint: `UNIQUE(event_id, seat_label)` prevents duplicate seat definitions for the same event.

### Orders

- `id`: Primary key.
- `user_id`: Foreign key referencing users.
- `status`: Pending, confirmed, failed, or cancelled.
- `total_amount`: Total order amount.
- `created_at`: Order creation timestamp.

### Seat_Holds

- `id`: Primary key.
- `seat_id`: Foreign key referencing seats.
- `user_id`: Foreign key referencing users.
- `expires_at`: Hold expiry time.
- `status`: Active, converted, or expired.

### Payments

- `id`: Primary key.
- `order_id`: Foreign key referencing orders.
- `provider_reference`: Unique payment-provider reference.
- `amount`: Payment amount.
- `status`: Pending, successful, or failed.

### Relationships

- One user can create many orders.
- One event can have many seats.
- One seat belongs to one event.
- One user can hold seats temporarily.
- An order belongs to one user and can contain multiple ticket items in a full implementation.
- An order can have multiple payment attempts, but each provider transaction reference must be unique.
### Preventing Double-Booking

The relational database is the final authority for seat availability. The application must not rely on cached data or the seat status displayed in the browser because multiple customers may request the same seat simultaneously.

**Seat-hold transaction:**

1. The application begins a database transaction.
2. It locks the requested seat row using `SELECT ... FOR UPDATE`.
3. It checks the seat's current status and verifies whether any existing hold has expired.
4. If the seat is available, it creates a temporary hold, records the expiry time, and changes the seat status to `held`.
5. It commits the transaction. If the seat is already sold or held by another customer, it rolls back the transaction and returns `409 Conflict`.

**How this prevents race conditions:**

Suppose customers A and B request the same seat at nearly the same time. Customer A obtains the row lock first. Customer B must wait until A's transaction finishes. After A commits the hold, B reads the updated seat status and cannot create another valid hold for that seat. Only one customer can successfully reserve it.

**Database safeguards:**

- Use a transaction for the availability check, hold creation, and seat-status update.
- Enforce `UNIQUE(event_id, seat_label)` on the seats table to prevent duplicate seat records.
- Enforce a database constraint or suitable partial unique index so that a seat cannot have multiple active holds.
- Check hold expiry using the database's current time. A cleanup worker can release expired holds, but the booking transaction must also check expiry itself.
- Use a consistent lock order and retry appropriate deadlock failures safely.

**Payment and confirmation:**

A successful seat hold is temporary and does not mean the ticket has been purchased. The customer must complete payment before the hold expires. The system verifies the payment provider's response and processes callbacks idempotently so that repeated notifications cannot issue duplicate tickets. A valid paid order is confirmed and the ticket is issued only once.

If payment succeeds after a hold has expired, the system must follow a defined recovery process, such as attempting a safe re-reservation or initiating a refund. It must never sell the same seat twice.

## 5. Architecture


flowchart TD
    U[Customers] --> CDN[CDN]
    CDN --> WAF[Web Application Firewall]
    WAF --> RP[Reverse Proxy]
    RP --> LB[Load Balancer]

    LB --> API1[Application Server 1]
    LB --> API2[Application Server 2]

    API1 --> Redis[(Redis Cache)]
    API2 --> Redis

    API1 --> DB[(Primary Relational Database)]
    API2 --> DB
    DB --> RR[(Read Replica)]

    API1 --> MQ[Message Queue]
    API2 --> MQ
    MQ --> W[Background Workers]
    W --> DB

    API1 --> PAY[Payment Provider]
    PAY --> API1


### Component Responsibilities

- **CDN:** Serves static assets close to customers and reduces repeated requests reaching the origin servers.
- **Web Application Firewall (WAF):** Filters malicious traffic and helps protect against common web attacks.
- **Reverse proxy:** Receives incoming HTTP requests, forwards them to the appropriate backend service, and can enforce request limits and routing rules.
- **Load balancer:** Distributes requests across healthy application servers and removes unhealthy instances from rotation.
- **Application servers:** Authenticate users, validate requests, coordinate seat holds and orders, and communicate with the database and payment provider.
- **Redis cache:** Stores frequently requested event details and other suitable read-heavy data to reduce database load. Cached availability is only an estimate; the primary database decides whether a seat can be held or sold.
- **Primary relational database:** Stores authoritative seat states, holds, orders, and payments. Transactions, row-level locks, and database constraints protect inventory from conflicting bookings.
- **Read replica:** Serves appropriate read-heavy queries, such as event listings. Replication lag must be considered, and the replica must not decide whether a seat is available for purchase.
- **Message queue:** Buffers asynchronous work, such as ticket delivery, notifications, and payment follow-up tasks, so temporary spikes do not overwhelm background services.
- **Background workers:** Process queued jobs, retry temporary failures safely, and record their results.
- **Payment provider:** Processes payments and sends payment notifications. The application verifies the notifications and handles retries idempotently.

### Surviving the Big Sale

The CDN and cache reduce repeated event-page reads. Multiple application servers behind a load balancer handle concurrent requests. Rate limits and a virtual waiting room can control bursts and give customers an orderly entry into the sale.

The primary database protects inventory through transactions and constraints. Seat availability displayed to customers is treated as provisional until the hold succeeds. The system monitors queue depth, database latency, errors, and payment delays, and it can scale application capacity as demand rises.

## 6. Trade-Offs

### Strong Consistency vs. Higher Throughput

Using database transactions and row locks protects seat correctness, but many customers competing for the same seats can wait longer. Correct inventory is more important than accepting two bookings for one seat. Caching and replicas can still serve non-critical browsing requests.

### Fairness vs. Fast Access

A virtual waiting room and rate limits reduce overload and can distribute access more fairly, but they add waiting time. A strict queue also needs rules for reconnects, bots, and customers who abandon the process.

### Short Holds vs. Payment Convenience

Short holds release abandoned seats quickly and improve inventory availability. However, a customer whose payment takes longer than expected may lose the hold. The system should clearly display the expiry time and use carefully defined payment and reservation rules.

### Availability vs. Immediate Confirmation

The system can keep browsing available during partial failures, but it should not confirm a ticket if it cannot verify the seat reservation and payment. Temporarily pausing checkout is safer than risking duplicate sales.

## Conclusion

TicketHub combines scalable web infrastructure with strict database transactions and constraints. The key design principle is that browsing can be cached and distributed, but seat allocation and final ticket confirmation must be coordinated through an authoritative, consistent booking process.
