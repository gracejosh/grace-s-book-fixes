-- roles
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_banned(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_banned FROM public.profiles WHERE id = _user_id), false)
$$;

CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- books
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_url TEXT,
  file_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  is_free BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "books_read" ON public.books FOR SELECT USING (true);
CREATE POLICY "books_admin" ON public.books FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_id TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_read" ON public.courses FOR SELECT USING (true);
CREATE POLICY "courses_admin" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- chat
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_rooms TO service_role;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_read" ON public.chat_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_admin" ON public.chat_rooms FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_read" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid())
    AND EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id AND NOT r.is_locked));
CREATE POLICY "messages_delete" ON public.messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quizzes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_read" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_admin" ON public.quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL DEFAULT 'A',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_read" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "questions_admin" ON public.quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- flyers
CREATE TABLE public.flyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'Event',
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flyers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flyers TO authenticated;
GRANT ALL ON public.flyers TO service_role;
ALTER TABLE public.flyers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flyers_read" ON public.flyers FOR SELECT USING (true);
CREATE POLICY "flyers_insert" ON public.flyers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "flyers_update_own" ON public.flyers FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "flyers_delete_own" ON public.flyers FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  file_url TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- blogs
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blogs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blogs TO authenticated;
GRANT ALL ON public.blogs TO service_role;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blogs_read" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "blogs_insert" ON public.blogs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "blogs_update_own" ON public.blogs FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "blogs_delete_own" ON public.blogs FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT ALL ON public.blog_comments TO service_role;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read" ON public.blog_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "comments_delete_own" ON public.blog_comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- likes
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);
GRANT SELECT ON public.likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_read" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t TEXT; eid UUID; delta INT;
BEGIN
  IF TG_OP = 'INSERT' THEN t := NEW.entity_type; eid := NEW.entity_id; delta := 1;
  ELSE t := OLD.entity_type; eid := OLD.entity_id; delta := -1; END IF;

  IF t = 'flyer' THEN UPDATE public.flyers SET likes_count = GREATEST(0, likes_count + delta) WHERE id = eid;
  ELSIF t = 'post' THEN UPDATE public.posts SET likes_count = GREATEST(0, likes_count + delta) WHERE id = eid;
  ELSIF t = 'blog' THEN UPDATE public.blogs SET likes_count = GREATEST(0, likes_count + delta) WHERE id = eid;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER likes_count_sync AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.sync_likes_count();

-- ads
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  link_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_read_active" ON public.ads FOR SELECT USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ads_admin" ON public.ads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- seed
INSERT INTO public.books (title, author, description, category, cover_url, file_url) VALUES
('The Pursuit of God','A.W. Tozer','A classic call to a deeper walk with God.','Devotional','https://covers.openlibrary.org/b/id/8231856-L.jpg','https://www.gutenberg.org/ebooks/16328.txt.utf-8'),
('Pilgrim''s Progress','John Bunyan','The allegorical journey of Christian to the Celestial City.','Classics','https://covers.openlibrary.org/b/id/9259256-L.jpg','https://www.gutenberg.org/ebooks/131.txt.utf-8'),
('Confessions','Augustine of Hippo','Augustine''s honest account of conversion and grace.','Theology','https://covers.openlibrary.org/b/id/8235116-L.jpg','https://www.gutenberg.org/ebooks/3296.txt.utf-8'),
('The Imitation of Christ','Thomas à Kempis','Devotional counsel on humility and the inner life.','Devotional','https://covers.openlibrary.org/b/id/8775437-L.jpg','https://www.gutenberg.org/ebooks/1653.txt.utf-8');

INSERT INTO public.courses (title, description, youtube_id, category) VALUES
('Foundations of Faith','A short teaching series on the basics of the Christian faith.','Nq1e2mzB0Hg','Discipleship'),
('How to Study the Bible','Practical tools for reading Scripture well.','JmvVsBpb-lU','Bible Study'),
('Prayer that Works','Learning to pray with confidence and consistency.','1zvyN2ZDaGA','Prayer');

INSERT INTO public.chat_rooms (name, description) VALUES
('General','Open fellowship for everyone.'),
('Prayer Requests','Share what you need prayer for.'),
('Bible Study','Discuss what you are reading.');

WITH q AS (
  INSERT INTO public.quizzes (title, description) VALUES ('Bible Basics','Test your knowledge of Scripture.') RETURNING id
)
INSERT INTO public.quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, position)
SELECT q.id, v.question, v.a, v.b, v.c, v.d, v.correct, v.pos FROM q, (VALUES
  ('How many books are in the Bible?','27','66','39','72','B',1),
  ('Who led Israel out of Egypt?','Moses','David','Elijah','Joshua','A',2),
  ('In which city was Jesus born?','Nazareth','Jerusalem','Bethlehem','Capernaum','C',3),
  ('Who wrote most of the New Testament letters?','Peter','John','James','Paul','D',4)
) AS v(question,a,b,c,d,correct,pos);

INSERT INTO public.ads (title, body, link_url) VALUES
('Support the ministry','Your giving keeps every book and course free for everyone.','/#donate');