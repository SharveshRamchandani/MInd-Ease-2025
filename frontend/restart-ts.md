# TypeScript Language Server Restart Instructions

If you're still seeing red line errors in your IDE, try these steps:

## VS Code / Cursor:
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

## Alternative Method:
1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Developer: Reload Window"
3. Press Enter

## Manual Steps:
1. Close your IDE
2. Delete the `.vscode` folder if it exists
3. Reopen your IDE
4. Navigate to the frontend folder: `MInd-Ease-2025/frontend`

## If Issues Persist:
1. Delete `node_modules` folder
2. Run `npm install`
3. Restart your IDE

The main fixes applied:
- ✅ Fixed TypeScript path mapping in `tsconfig.json`
- ✅ Fixed TypeScript path mapping in `tsconfig.app.json`
- ✅ Fixed sonner component (removed next-themes dependency)
- ✅ Added proper module resolution settings 