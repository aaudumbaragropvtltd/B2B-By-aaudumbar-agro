<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# User Preferences
- **Browser**: Always use Google Chrome when opening the browser or launching URLs.
- **Preview Command**: Whenever the user says "preview", invoke the browser subagent to open the browser, tour the changes, and present a recorded walkthrough.
- **Upfront Server Readiness**: When starting work requiring runtime verification or preview, immediately start the dev server (`npx next dev --webpack`) upfront as a daemon task so everything is already compiled, warm, and ready to execute at maximum speed without stalling.
