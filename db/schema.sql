-- Production relational model (PostgreSQL)
CREATE TYPE content_status AS ENUM ('DRAFT','EDITORIAL_REVIEW','ISLAMIC_SOURCE_REVIEW','VISUAL_REVIEW','APPROVED','SCHEDULED','PUBLISHED','ARCHIVED');
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN','CONTENT_ADMIN','ISLAMIC_REVIEWER','EDITOR','MEDIA_MANAGER','LIBRARY_MANAGER','SOCIAL_MEDIA_MANAGER','ANALYTICS_MANAGER','AUTHOR','VIEWER');
CREATE TABLE users (id uuid PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL, role user_role NOT NULL, active boolean DEFAULT true, created_at timestamptz DEFAULT now());
CREATE TABLE content (id text PRIMARY KEY, type text NOT NULL, slug text UNIQUE NOT NULL, title text NOT NULL, excerpt text, body jsonb NOT NULL DEFAULT '{}', language varchar(5) NOT NULL DEFAULT 'en', age_group text NOT NULL, status content_status NOT NULL DEFAULT 'DRAFT', source text, scheduled_at timestamptz, published_at timestamptz, created_by uuid REFERENCES users(id), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), version integer DEFAULT 1);
CREATE TABLE hadith_metadata (content_id text PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE, arabic text NOT NULL, translation text NOT NULL, collection text NOT NULL, book text, chapter text, reference_number text NOT NULL, grading text NOT NULL, grader text);
CREATE TABLE quran_metadata (content_id text PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE, surah integer NOT NULL CHECK (surah BETWEEN 1 AND 114), ayah integer NOT NULL, arabic text NOT NULL, translation text NOT NULL, translation_source text NOT NULL, locked boolean DEFAULT true);
CREATE TABLE reviews (id uuid PRIMARY KEY, content_id text REFERENCES content(id), reviewer_id uuid REFERENCES users(id), stage content_status NOT NULL, decision text NOT NULL, notes text, created_at timestamptz DEFAULT now());
CREATE TABLE audit_logs (id uuid PRIMARY KEY, user_id uuid REFERENCES users(id), action text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL, previous_value jsonb, new_value jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE media (id uuid PRIMARY KEY, filename text NOT NULL, mime_type text NOT NULL, title text, alt_text text, license text NOT NULL, ownership text NOT NULL, source text, uploaded_by uuid REFERENCES users(id), created_at timestamptz DEFAULT now());
CREATE TABLE tags (id uuid PRIMARY KEY, name text UNIQUE NOT NULL, slug text UNIQUE NOT NULL);
CREATE TABLE content_tags (content_id text REFERENCES content(id) ON DELETE CASCADE, tag_id uuid REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY(content_id,tag_id));
CREATE TABLE learning_paths (id text PRIMARY KEY, title text NOT NULL, slug text UNIQUE NOT NULL, age_group text NOT NULL, status content_status DEFAULT 'DRAFT');
CREATE TABLE learning_lessons (path_id text REFERENCES learning_paths(id), content_id text REFERENCES content(id), position integer NOT NULL, PRIMARY KEY(path_id,content_id));
CREATE TABLE progress (id uuid PRIMARY KEY, profile_id uuid NOT NULL, content_id text REFERENCES content(id), completed_at timestamptz, progress numeric(5,2), private boolean DEFAULT true);
CREATE INDEX content_search_idx ON content USING gin(to_tsvector('english', title || ' ' || coalesce(excerpt,'')));
CREATE INDEX content_status_idx ON content(status, published_at DESC);
CREATE INDEX audit_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);
