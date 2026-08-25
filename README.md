# Grace's Book Fixes

I've connected GitHub with token: @secret:GITHUB_PERSONAL_ACCESS_TOKEN 

Import my repository: gracejosh/grace-book-fixes

CONTINUE from where it stopped. Read existing files first.

FIX:
1. Books page - fetch from supabase.from('books').select('*'), FREE badge, download buttons
2. Courses page - fetch from supabase.from('courses').select('*'), YouTube player
3. Chat - fetch chat_rooms, realtime messages
4. Quiz - green correct, red wrong, auto-advance 2s
5. Admin - correct answer radio buttons (A/B/C/D)

ADD:
6. Home - replace stats with Gospel Radio player (play/pause, volume, station selector, LIVE badge)
   Remove testimonials
   Stations:
   - K-LOVE: https://maestro.emfcdn.com/stream/k-love/tunein/aac
   - Air1: https://maestro.emfcdn.com/stream/air1/tunein/aac
   - BBN: https://bbnradio-lh.akamaihd.net/i/BBNRadio_1@174570/master.mu3u8

7. Flyers page (/flyers) - grid, side-slide carousel, share, like, upload
   Table: flyers (id, user_id, title, description, images TEXT[], category, likes_count, created_at)

8. Posts page (/posts) - text, image, PDF, audio, share, like, download
   Table: posts (id, user_id, type, content, file_url, likes_count, created_at)

9. Blog page (/blog) - image/video cards, like, share, comments
   Tables: blogs, blog_comments

10. Profile image upload via Cloudinary
11. Popup ads every 30 min
12. Enhanced admin - live users, delete/ban, chat control, ads management
13. Contact + donate sections

ENV: import.meta.env.VITE_* only

Push to GitHub: gracejosh/grace-book-fixes

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0161c0d0-3081-472b-832d-61850a48cfbe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
