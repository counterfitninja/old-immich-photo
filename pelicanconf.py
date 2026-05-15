# pelicanconf.py — Pelican config used as a preview/production static file server
# for the React app built by Vite into dist/

AUTHOR = 'Admin'
SITENAME = 'Photo Combiner'
SITEURL = ''

# Pelican content directory — kept empty; Vite owns the actual app content
PATH = 'content'

# Serve the same directory Vite builds into
OUTPUT_PATH = 'dist'

TIMEZONE = 'UTC'
DEFAULT_LANG = 'en'

# ── Disable Pelican content generation ──────────────────────────────────────
# We only want Pelican to act as a static file server for the Vite build.
# Keeping these empty prevents Pelican from generating its own HTML pages
# that would interfere with the React app.
ARTICLE_PATHS = []
PAGE_PATHS = []
STATIC_PATHS = []

# IMPORTANT: do NOT let Pelican wipe the Vite build output
DELETE_OUTPUT_DIRECTORY = False

# ── Disable unused feed / pagination features ───────────────────────────────
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

DEFAULT_PAGINATION = False
