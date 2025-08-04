Option Explicit

Dim objShell, objFSO, strPath, strCommand

' Create objects
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get current script directory
strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Change to project directory
objShell.CurrentDirectory = strPath

' Start Vite server in background (hidden)
strCommand = "cmd /c npm run dev >nul 2>&1"
objShell.Run strCommand, 0, False

' Wait for server to start
WScript.Sleep 5000

' Start Electron application in background (hidden)
strCommand = "cmd /c npm run electron >nul 2>&1"
objShell.Run strCommand, 0, False

' Clean up objects
Set objShell = Nothing
Set objFSO = Nothing

' Show success message
MsgBox "Clipboard Monitor started successfully!" & vbCrLf & vbCrLf & "The application is now running in background.", vbInformation, "Success" 