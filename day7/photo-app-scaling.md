# SnapShare Photo-App Scaling Plan

## 1. Assumptions

- SnapShare has 10 million registered users.
- 10% of registered users are active each day.
- Each daily active user uploads 1 photo per day.
- Each daily active user views 50 feed pages per day.
- Each original photo is 2 MB, and each thumbnail is 50 KB.
- A year has 365 days.
- Peak feed traffic is estimated at 5 times the average traffic.
- For these estimates, traffic is averaged over 24 hours per day.
- Storage estimates use decimal units: 1 GB = 1,000 MB and 1 TB = 1,000 GB.
- The estimates exclude database records, backups, replicas, and other overhead unless stated.

## 2. Traffic and Storage Estimates

### Daily active users

Daily active users = Registered users × Daily active percentage

= 10,000,000 × 0.10

= **1,000,000 daily active users**

### Uploads per second

Each active user uploads 1 photo per day.

Daily uploads = 1,000,000 × 1 = 1,000,000 photos

Average uploads per second = 1,000,000 ÷ 86,400

= **11.57 uploads per second**, or approximately 12 uploads per second.

### Feed views per second

Each active user views 50 feed pages per day.

Daily feed views = 1,000,000 × 50

= 50,000,000 feed views per day

Average feed views per second = 50,000,000 ÷ 86,400

= **578.7 feed views per second**, or approximately 579.

Peak feed views per second = 578.7 × 5

= **2,893.5**, or approximately 2,894 feed views per second.

### Photo storage per year

Daily original-photo storage = 1,000,000 × 2 MB

= 2,000,000 MB = 2,000 GB = 2 TB per day.

Annual original-photo storage = 2 TB × 365

= **730 TB per year**.

Daily thumbnail storage = 1,000,000 × 50 KB

= 50,000,000 KB = 50 GB per day.

Annual thumbnail storage = 50 GB × 365

= **18,250 GB, or 18.25 TB per year**.

Total annual photo storage = 730 TB + 18.25 TB

= **748.25 TB per year**, approximately 0.75 PB.

This is the storage required for one year's newly uploaded originals and thumbnails. Actual total storage will grow over time and will be higher if versions, backups, or replicas are retained.

## 3. Read-Heavy or Write-Heavy?

SnapShare is **read-heavy** because users view 50 feed pages per day but upload only 1 photo per day. The system processes approximately 50 million feed views compared with 1 million uploads daily.

This means the architecture should prioritize fast feed delivery. A cache and content delivery network (CDN) can serve frequently requested data and photos without repeatedly querying the main database or application servers. A database read replica can handle read queries, while the primary database handles writes.

## 4. Why Photos Should Not Be Stored Inside the Database

Photos are large binary files. Storing them directly inside the database would increase database size, backup time, storage costs, and the amount of data transferred during queries.

Instead, the original photos and generated thumbnails should be stored in **object storage**. The database should store metadata such as photo ID, owner ID, upload time, caption, and object-storage key or URL. This separates large files from structured records and allows the files to be delivered efficiently through a CDN.

## 5. Architecture Diagram

```text
                       USERS
                         |
                         v
                        CDN
                (cached photos and
                 thumbnails)
                         |
                         v
                  LOAD BALANCER
                         |
              +----------+----------+
              |          |          |
              v          v          v
          APP SERVER  APP SERVER  APP SERVER
              |          |          |
              +----------+----------+
                         |
            +------------+-------------+
            |            |             |
            v            v             v
          CACHE       PRIMARY DB   OBJECT STORAGE
            |            |          (original photos
            |            |           and thumbnails)
            |            |
            |            v
            |        READ REPLICA
            |
            +---- supports fast feed reads

          APP SERVER
              |
              v
             QUEUE
              |
              v
        THUMBNAIL WORKER
              |
              v
        OBJECT STORAGE
        (generated thumbnails)
```

## 6. What Each Component Solves

- **CDN:** Delivers photos and thumbnails from locations closer to users, reducing latency and traffic to the origin servers.
- **Load balancer:** Distributes incoming requests across application servers so that no single server handles all the traffic.
- **Application servers:** Handle authentication, uploads, feed generation, follow relationships, and communication with other services.
- **Cache:** Stores frequently accessed feed data and metadata to reduce repeated database queries and improve response times.
- **Primary database:** Stores structured records such as users, photo metadata, follow relationships, and upload information, and handles database writes.
- **Read replica:** Handles eligible read queries so that the primary database has more capacity for writes.
- **Object storage:** Stores the large original photo files and generated thumbnails separately from the database.
- **Queue:** Holds thumbnail-generation jobs so uploads can finish without waiting for thumbnail processing.
- **Thumbnail worker:** Processes queued jobs, creates smaller versions of uploaded photos, and saves the thumbnails to object storage.

## 7. Step-by-Step Photo Upload Flow

1. A user selects a photo and submits it through the SnapShare application.
2. The load balancer directs the upload request to an available application server.
3. The application server authenticates the user and validates the file type, size, and permissions.
4. The original photo is uploaded to object storage, which returns or confirms its storage key.
5. The application server writes the photo metadata and storage key to the primary database.
6. The application server places a thumbnail-generation job on the queue.
7. The server confirms that the original photo has been accepted without waiting for thumbnail generation to finish.
8. A thumbnail worker retrieves the job from the queue and downloads or reads the original photo from object storage.
9. The worker generates a 50 KB thumbnail and saves it in object storage.
10. The worker updates the photo metadata to indicate that the thumbnail is ready, if the system tracks processing status.
11. When users view their feeds, the application retrieves relevant photo metadata and uses cached data or the read replica where appropriate.
12. The CDN delivers the original photos or thumbnails to users, reducing repeated requests to the application servers and object storage.

If thumbnail generation fails, the job can be retried. The application should also handle temporary failures, such as an original upload succeeding while the metadata write fails, so that incomplete uploads can be recovered or cleaned up.

## 8. Trade-Offs

### Trade-off 1: Caching versus Freshness

Caching feed data reduces database load and improves speed, but cached results may not reflect a newly uploaded photo or a recent follow change immediately. SnapShare can use short cache expiration times or invalidate affected cache entries, balancing freshness against performance.

### Trade-off 2: Asynchronous Thumbnail Generation versus Immediate Availability

Using a queue allows uploads to complete quickly and protects application servers from doing expensive image-processing work during the request. However, a thumbnail may not be available immediately after upload. The interface can show the original photo or a placeholder until the thumbnail is ready.

### Trade-off 3: Read Replica versus Consistency

A read replica increases read capacity, but replication may lag behind the primary database. A user might not immediately see a newly uploaded photo when feed queries use the replica. The application can read recent changes from the primary database when necessary.

### Trade-off 4: Object Storage and CDN versus Cost and Complexity

Object storage and a CDN scale photo delivery efficiently, but introduce additional services, configuration, monitoring, and transfer costs. SnapShare must manage access permissions, caching rules, storage lifecycle policies, and monitoring to control costs and protect users' photos.

## 9. Conclusion

SnapShare has approximately 1 million daily active users, 12 average uploads per second, 579 average feed views per second, and a peak of approximately 2,894 feed views per second. New originals and thumbnails require about 748.25 TB of storage per year under the stated assumptions.

Because SnapShare is read-heavy, the design uses caching, a CDN, and a database read replica to scale feed delivery. Object storage holds photo files, while a queue and thumbnail worker process thumbnails asynchronously. This architecture separates responsibilities and provides a foundation for scaling as usage grows.