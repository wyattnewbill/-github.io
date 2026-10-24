# Wyatt Newbill — writing site

## Put it online with GitHub Pages (free)

1. **Make a GitHub account** at github.com if you don't have one.
2. **Create a repository.** Click the **+** at the top right → **New repository**.
   - Name it `yourusername.github.io` (use your real GitHub username) if you want the site at `https://yourusername.github.io`.
     Any other name works too; the site will then live at `https://yourusername.github.io/that-name`.
   - Set it to **Public**, leave everything else as it is, and click **Create repository**.
3. **Upload the files.** On the new repository's page, click **uploading an existing file**.
   Unzip `wyatt-newbill-site.zip`, open the folder, select **everything inside it** (not the folder itself)
   and drag it all into the browser window. Wait for every file to finish, then click **Commit changes**.
   (`index.html` must end up at the top level of the repository, not inside another folder.)
4. **Turn on Pages.** In the repository go to **Settings → Pages**. Under **Build and deployment**, set
   **Source** to *Deploy from a branch*, **Branch** to `main` and the folder to `/ (root)`, then **Save**.
5. **Wait a minute or two**, then refresh the Pages settings screen. It shows your site's address at the top.

### Updating the site later
Open the file on GitHub, click the pencil icon, make your change, and click **Commit changes**.
To replace a file or add pictures, use **Add file → Upload files** and drop in the new version.
The live site updates by itself within a minute or two.

If you change `style.css` or `site.js`, also change the number in `?v=31` (to `?v=32`, and so on)
in each `.html` page that links to them, so visitors' browsers fetch the new version.

## Preview it on your computer
Open a terminal in this folder and run:

    python3 -m http.server 8000

then visit http://localhost:8000 . (Opening the HTML files by double-clicking will not work: the browser blocks the site from loading its data files.)

## Your details
Open `site.js`. The settings block at the very top holds your email, Instagram, LinkedIn and Medium links. Every page, the footer, the contact section and every "Request the full text" button read from it.

## Add a blog post
1. Write the post in a plain-text file inside `posts/`, named like `my-post-title.md`.
   Leave a blank line between paragraphs. `## A heading` makes a heading, `*words*` makes italics,
   and `\*` shows a real asterisk.
2. Add a line for it at the top of `posts/posts.json`, copying the one that's there:
   `slug` is the file name without `.md`, plus a `title`, a `date` (YYYY-MM-DD) and a short `excerpt`.

## Add or edit a work
1. Add an entry to `works.json` (copy an existing one). Fields: `slug` (letters and dashes, unique), `section` (`fiction`, `screenplays` or `essays`), `title`, `format`, `status`, `date`, `desc`, `notes`, `image`, `alt`, `accent` (a colour for that work), `access`, `featured` (true puts it first on the homepage).
2. `access` controls what visitors can read:
   - `"full"`  the whole text is on the site. Put it in `works/<slug>.html` (plain `<p>` paragraphs; for a script, copy the structure of an existing script file).
   - `"excerpt"`  `works/<slug>.html` holds only the excerpt; the page adds a "Request the full text" button. `shown` and `total` are the word counts it displays.
   - `"none"`  no text yet; the page shows the description and an email button.
3. Put the picture in `images/` and point `image` at it.

Never put the full text of a request-only work into the site folder: anything in this folder is public once published.

## Other pages
`about.html` holds your biography, the "Along the way" list and the photos under "Elsewhere".
`index.html` has the opening line and the "On the desk" note (both marked `EDIT`).
`admin.html` is an optional, untested helper for editing posts through the GitHub website; you don't need it.
