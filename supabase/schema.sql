-- ====================================================================
-- AVS 12 LEARNING HUB — PRODUCTION POSTGRESQL & SUPABASE SCHEMA
-- Client: Dr. Joshua, Vice Principal, AVS Engineering College
-- Target: Tamil Nadu Class 12 (Computer Science & Biology)
-- ====================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. AVSCS26-0001, AVSBIO26-0001
    student_name VARCHAR(255) NOT NULL,
    register_number VARCHAR(100) NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    student_phone VARCHAR(50),
    stream VARCHAR(50) NOT NULL CHECK (stream IN ('Computer Science', 'Biology')),
    medium VARCHAR(20) NOT NULL DEFAULT 'English' CHECK (medium IN ('English', 'Tamil')),
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    profile_photo TEXT,
    active_status BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. STREAMS & SUBJECTS & BOOKS
CREATE TABLE IF NOT EXISTS streams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(50) PRIMARY KEY,
    stream_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    icon VARCHAR(50) DEFAULT 'book',
    description TEXT,
    order_index INT NOT NULL DEFAULT 1,
    total_chapters INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    volume VARCHAR(50),
    description TEXT,
    order_index INT NOT NULL DEFAULT 1
);

-- 4. CHAPTERS & TOPICS
CREATE TABLE IF NOT EXISTS chapters (
    id VARCHAR(50) PRIMARY KEY,
    subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    book_id VARCHAR(50) NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_tamil VARCHAR(255),
    description TEXT,
    total_notes INT NOT NULL DEFAULT 0,
    total_videos INT NOT NULL DEFAULT 0,
    total_mcqs INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS topics (
    id VARCHAR(50) PRIMARY KEY,
    chapter_id VARCHAR(50) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    title_tamil VARCHAR(255),
    order_index INT NOT NULL DEFAULT 1
);

-- 5. HANDWRITTEN NOTES & PAGES
CREATE TABLE IF NOT EXISTS handwritten_notes (
    id VARCHAR(50) PRIMARY KEY,
    chapter_id VARCHAR(50) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    topic_id VARCHAR(50) REFERENCES topics(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    title_tamil VARCHAR(255),
    description TEXT,
    badge VARCHAR(50) NOT NULL DEFAULT 'HANDWRITTEN' CHECK (badge IN ('HANDWRITTEN', 'IMPORTANT', 'REVISION', 'EXAM FOCUS')),
    page_count INT NOT NULL DEFAULT 1,
    download_allowed BOOLEAN NOT NULL DEFAULT true,
    is_published BOOLEAN NOT NULL DEFAULT true,
    views_count INT NOT NULL DEFAULT 0,
    pages JSONB NOT NULL DEFAULT '[]'::jsonb,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. VIDEO LESSONS (Gemini Notebook / NotebookLM Video Lessons)
CREATE TABLE IF NOT EXISTS video_lessons (
    id VARCHAR(50) PRIMARY KEY,
    chapter_id VARCHAR(50) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    topic_id VARCHAR(50) REFERENCES topics(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    title_tamil VARCHAR(255),
    description TEXT,
    video_url TEXT NOT NULL,
    embed_type VARCHAR(50) NOT NULL DEFAULT 'youtube',
    duration_seconds INT NOT NULL DEFAULT 600,
    thumbnail_url TEXT,
    teacher_name VARCHAR(150),
    source_label VARCHAR(150) NOT NULL DEFAULT 'Gemini Notebook / NotebookLM Video Lessons',
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. QUESTIONS (One Mark MCQ Engine: Book-In vs Book-Out)
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(50) PRIMARY KEY,
    chapter_id VARCHAR(50) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    topic_id VARCHAR(50) REFERENCES topics(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_text_tamil TEXT,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer VARCHAR(5) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    explanation_tamil TEXT,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    source_type VARCHAR(50) NOT NULL DEFAULT 'Book-In' CHECK (source_type IN ('Book-In', 'Book-Out')),
    status VARCHAR(50) NOT NULL DEFAULT 'Published' CHECK (status IN ('Draft', 'Teacher Review', 'Approved', 'Published')),
    stream VARCHAR(50) NOT NULL,
    subject_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. QUIZ TESTS & SESSIONS (Interactive Practice Engine)
CREATE TABLE IF NOT EXISTS quiz_tests (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id VARCHAR(50) NOT NULL,
    chapter_id VARCHAR(50) REFERENCES chapters(id) ON DELETE SET NULL,
    mode VARCHAR(50) NOT NULL DEFAULT 'quick',
    question_count INT NOT NULL DEFAULT 10,
    duration_mins INT NOT NULL DEFAULT 15,
    pass_percentage INT NOT NULL DEFAULT 60,
    negative_marking BOOLEAN NOT NULL DEFAULT false,
    allowed_attempts INT NOT NULL DEFAULT 999,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    test_id VARCHAR(50),
    chapter_id VARCHAR(50),
    subject_id VARCHAR(50) NOT NULL,
    mode VARCHAR(50) NOT NULL,
    source_filter VARCHAR(50) DEFAULT 'All',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    wrong_count INT NOT NULL DEFAULT 0,
    unanswered_count INT NOT NULL DEFAULT 0,
    time_taken_seconds INT NOT NULL DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false
);

-- 9. STUDENT PROGRESS & ANALYTICS
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) NOT NULL,
    chapter_id VARCHAR(50) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    notes_viewed INT NOT NULL DEFAULT 0,
    note_last_page INT NOT NULL DEFAULT 1,
    video_watch_percentage INT NOT NULL DEFAULT 0,
    mcqs_attempted INT NOT NULL DEFAULT 0,
    best_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    average_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(student_id, chapter_id)
);

-- 10. BOOKMARKS & ANNOUNCEMENTS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('note', 'video', 'question', 'chapter')),
    content_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, content_type, content_id)
);

CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High', 'Urgent')),
    target_stream VARCHAR(50) NOT NULL DEFAULT 'All',
    publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 11. AI GROUNDED RAG KNOWLEDGE CHUNKS (pgvector)
CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
    id VARCHAR(50) PRIMARY KEY,
    stream VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    chapter_title VARCHAR(255) NOT NULL,
    topic_title VARCHAR(255),
    chunk_text TEXT NOT NULL,
    chunk_text_tamil TEXT,
    source_type VARCHAR(100) NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR MAXIMUM QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_students_stream ON students(stream);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter_id ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_source_type ON questions(source_type);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_student ON quiz_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_stream ON ai_knowledge_chunks(stream);
