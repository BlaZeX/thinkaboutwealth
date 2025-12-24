# ThinkAboutWealth.com

A minimalist, static "Daily Wealth Thought" website with zero backend dependencies.

## Features

- **Daily Thought**: Updates globally at 00:00 UTC using client-side logic.
- **Archive**: Searchable and filterable list of all thoughts.
- **Privacy**: No cookies, no tracking, no local storage.
- **Performance**: Vanilla JS + CSS, highly optimized assets.

## Project Structure

```
/
├── index.html        # Main daily view
├── archive.html      # Archive list view
├── about.html        # About page
├── css/
│   └── styles.css    # Master stylesheet
├── js/
│   ├── app.js        # Core logic (UTC day, countdown)
│   └── archive.js    # Archive search/filter logic
├── data/
│   └── thoughts.json # Database of thoughts
├── assets/
│   ├── favicon.svg
│   └── og.svg
└── robots.txt, sitemap.xml
```

## Deployment

### Option 1: Cloudflare Pages (Recommended)
1. **GitHub Intergration**: Push this repository to GitHub. Connect your Cloudflare account to the repo. It will auto-deploy.
2. **Direct Upload**: Go to Cloudflare Pages dashboard -> Create a project -> Upload the entire project folder.

### Option 2: Netlify
1. Drag and drop the project folder into the Netlify "Sites" area.

### Option 3: GitHub Pages
1. Push to a GitHub repository.
2. Go to Settings -> Pages -> Source: select the branch (e.g., `main`) and root folder `/`.

## Custom Domain
To connect a custom domain (e.g., `thinkaboutwealth.com`):
1. Buy domain from a registrar (Namecheap, GoDaddy, etc.).
2. In your hosting provider (Cloudflare/Netlify), go to "Custom Domains".
3. Follow the instructions to add CNAME/A records to your DNS settings.

## License
MIT
