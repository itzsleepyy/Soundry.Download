# YouTube Cookies - TROUBLESHOOTING

## ⚠️ Cookie Rejected? Common Issues:

### 1. **Cookies Expired**
YouTube cookies typically last ~6 months but can expire sooner. 

**Solution**: Export fresh cookies from your browser.

### 2. **Wrong Cookie Format**
Coolify may mangle newlines in multiline environment variables.

**How to add cookies properly in Coolify:**

1. Export cookies using browser extension
2. Open the `.txt` file in a text editor
3. Copy **THE ENTIRE FILE** including:
   ```
   # Netscape HTTP Cookie File
   # This is a generated file! Do not edit.
   .youtube.com	TRUE	/	TRUE	...
   .youtube.com	TRUE	/	TRUE	...
   ```
4. In Coolify, add environment variable:
   - Name: `YOUTUBE_COOKIE_1`
   - Value: Paste entire content (don't add extra quotes)
5. Redeploy

### 3. **Account Not Active**
YouTube may reject cookies from accounts that haven't watched videos recently.

**Solution**: 
1. Log into YouTube in browser
2. Watch a video or two
3. Re-export cookies
4. Update environment variable

### 4. **Verification Logs**

After deployment, check startup logs for:
```
✓ Created /app/cookies/cookie-1.txt (15 lines)
✓ Valid Netscape cookie format detected
```

If you see:
```
⚠ Warning: Cookie file may not be in Netscape format
```

Then newlines were lost. Try:
- Don't wrap value in quotes in Coolify
- Use a different cookie export format
- Or manually SSH and create the file

### 5. **Testing Cookies**

To verify cookies work, SSH to server and run:
```bash
docker exec -it soundry_worker cat /app/cookies/cookie-1.txt
```

It should look like:
```
# Netscape HTTP Cookie File
# This is a generated file! Do not edit.
.youtube.com	TRUE	/	FALSE	1735819234	CONSENT	YES+
.youtube.com	TRUE	/	TRUE	1767355234	__Secure-YEC	...
```

NOT like:
```
# Netscape HTTP Cookie File # This is a generated file! Do not edit...
```
(all on one line = broken)

### 6. **Alternative: Direct File Method**

If environment variables keep failing, SSH to server:
```bash
docker exec -it soundry_worker sh
cd /app/cookies
cat > cookie-1.txt << 'EOF'
# Netscape HTTP Cookie File
[paste your cookie content]
EOF
exit
```

Then restart worker:
```bash
docker restart soundry_worker
```
