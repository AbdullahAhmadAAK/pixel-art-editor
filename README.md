**Project Name:** Migration of Pixel Art Together App (SvelteKit) to the Basemint App (NextJS)

**Project Description**

I was tasked by a client to port the "Pixel Art Together" project by the Liveblocks team (original app: [Pixel Art Together](https://pixelart.liveblocks.app/)) into their Next.js app.

After carefully studying the original SvelteKit implementation, I migrated the entire app to Next.js, using best practices from both ecosystems. The goal wasn’t just a 1:1 migration — it was part of a longer-term vision to build a Web3-based collaborative art platform, where artists could collaborate on pixel art, share their work, and eventually sell digital shares of their drawings to speculators in the form of cryptocurrency. To better support this, I added TypeScript to the code, and rectified TypeScript errors wherever I observed them, leading to a stable product that could be extended and built upon.

The migration included full replication of complex functionalities, such as:

1. Canvas creation and drawing tools: brush, eraser, and fill tool.
2. Layer management: creating, deleting, moving (up, down, left, right), toggling visibility, and adjusting opacity.
3. Undo and redo capabilities for user actions.
4. Grid toggling for better pixel alignment.
5. Session sharing via QR code or direct link.

Initially, Liveblocks sessions were used for authentication, but I later upgraded the system to use authentication via ID tokens, providing a more secure and scalable solution (in the client's repo).

**What it entails:**
Brush tool, erase tool, fill tool, undo button, redo button, layers, layer opacities and blend modes, comments on drawings along with reacts and mentions, custom notifications, CRON jobs to keep drawings' statuses updated, ability to mark a drawing as complete v/s in-progress, inviting collaborators, speculator view v/s artist view, live previews for each drawing's history, social engagement stats of each drawing, and much more!

**What now?**

Future development for this project is ongoing in a private repository owned by the client, and can be seen at [basemint.fun](https://basemint.fun/). My role was to build up the UX to a stable point, which was successfully delivered in May 2025 to the client. The client, NPC Labs, aims to integrate crypto wallet functionalities into this so that users can mint their drawings as NFTs, as well as let buy and sell different shares of the drawings made. Stay tuned and keep following [the domain](https://basemint.fun/) for the latest info, or [NPC Labs' LinkedIn profile](https://www.linkedin.com/search/results/all/?keywords=npc%20labs&origin=GLOBAL_SEARCH_HEADER&sid=7X_).

**Live App Demonstration:** 

[🎥 Watch the Live App Demonstration](https://www.linkedin.com/posts/abdullah-ahmad-aak_been-cooking-for-the-past-couple-of-weeks-activity-7333960331016241154-tebk?utm_source=share&utm_medium=member_desktop&rcm=ACoAACIGBTsBFuHj96s-al5LEwhuaPOGcyJctrg)

**How to Run It Locally**

1. Clone it
2. Run npm install
3. Create a .env file, with LIVEBLOCKS_SECRET_KEY="SECRET_KEY" in it. SECRET_KEY will be the one you get from Liveblocks after creating an account there.
4. Run npm run dev
5. Open localhost:3000
6. Enjoy
