# School Database Design

## 1. Tables

- **Students:** Stores each student's ID, name, and email. The `student_id` is the primary key, and each email must be unique and cannot be empty.
- **Courses:** Stores course IDs, names, and course codes. The `course_id` is the primary key, and each course code must be unique.
- **Enrolments:** Records which student takes which course and the student's grade. It contains foreign keys referencing the students and courses tables. The combination of `student_id` and `course_id` must be unique to prevent duplicate enrolments.

## 2. Relationships

- **Students to Enrolments (One-to-Many):** One student can have multiple enrolment records, but each enrolment belongs to one student.
- **Courses to Enrolments (One-to-Many):** One course can have multiple enrolment records, but each enrolment belongs to one course.
- **Students to Courses (Many-to-Many):** One student can take many courses, and each course can have many students. The enrolments table acts as a join table connecting students and courses.

## 3. Index

I would create an index on `course_id` in the enrolments table to improve the performance of queries that retrieve students taking a particular course or count enrolments per course.

```sql
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);
```

## 4. SQL or NoSQL?

I would choose a relational SQL database such as SQLite for this school system. Students, courses, and enrolments have clear relationships. SQL supports primary keys, foreign keys, unique constraints, and joins, which help maintain accurate data and retrieve related information efficiently. Since the records have a structured format, a relational database is suitable for this system.