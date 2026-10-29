========================================================================
             BIG 2 POKER CHAMPIONSHIP - VS CODE RUN GUIDE
========================================================================

Welcome! Follow these instructions to run and play Big 2 Poker locally on
your computer using Visual Studio Code (VS Code).

------------------------------------------------------------------------
1. PREREQUISITES
------------------------------------------------------------------------
Make sure you have the following installed on your machine:

1. Node.js (Version 18 or higher recommended)
   - Download from: https://nodejs.org/
   - Verify installation in terminal: node -v

2. Visual Studio Code
   - Download from: https://code.visualstudio.com/

------------------------------------------------------------------------
2. OPENING THE PROJECT IN VS CODE
------------------------------------------------------------------------
1. Open VS Code.
2. Go to File -> Open Folder...
3. Select this project's root directory (the folder containing package.json).
4. Open the integrated terminal in VS Code:
   - Shortcut: Ctrl + ` (Windows/Linux) or Cmd + ` (Mac)
   - Or menu: Terminal -> New Terminal

------------------------------------------------------------------------
3. INSTALLING DEPENDENCIES
------------------------------------------------------------------------
In the VS Code terminal, run the following command to install all required
npm packages:

    npm install

Wait for the installation process to finish.

------------------------------------------------------------------------
4. STARTING THE DEVELOPMENT SERVER
------------------------------------------------------------------------
To launch the local development server, run:

    npm run dev

Once started, the terminal will show a local URL, such as:

    http://localhost:3000

------------------------------------------------------------------------
5. PLAYING THE GAME
------------------------------------------------------------------------
1. Hold Ctrl (or Cmd on Mac) and click the http://localhost:3000 link in the
   terminal, OR open your web browser and navigate to http://localhost:3000.
2. Select your chips, AI opponents count (1 to 4), and difficulty level.
3. Click "Start Big 2 Match" and enjoy playing!

------------------------------------------------------------------------
6. USEFUL COMMANDS
------------------------------------------------------------------------
- Stop the Dev Server: Press Ctrl + C in the terminal.
- Check Type Errors / Lint: npm run lint
- Build for Production:     npm run build
- Preview Production Build: npm run preview

========================================================================
                              HAPPY GAMING!
========================================================================
