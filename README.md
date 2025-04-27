**Project Name:** 
**Migration of Pixel Art Together App (SvelteKit) to the Basemint App (NextJS)**

**Project Description**

I was tasked by a client to port the "Pixel Art Together" project by the Liveblocks team (original app: [Pixel Art Together](https://pixelart.liveblocks.app/)) into their Next.js app.

After carefully studying the original SvelteKit implementation, I migrated the entire app to Next.js, using best practices from both ecosystems. The goal wasn’t just a 1:1 migration — it was part of a longer-term vision to build a Web3-based collaborative art platform, where artists could collaborate on pixel art, share their work, and eventually sell digital shares of their drawings to speculators in the form of cryptocurrency.

The migration included full replication of complex functionalities, such as:

1 - Canvas creation and drawing tools: brush, eraser, and fill tool.
2 - Layer management: creating, deleting, moving (up, down, left, right), toggling visibility, and adjusting opacity.
3 - Undo and redo capabilities for user actions.
4 - Grid toggling for better pixel alignment.
5 - Session sharing via QR code or direct link.

Initially, Liveblocks sessions were used for authentication, but I later upgraded the system to use authentication via ID tokens, providing a more secure and scalable solution (in the client's repo).

Future development for this project is ongoing in a private repository owned by the client.

