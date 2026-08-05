$file = 'src\App.jsx'
$content = Get-Content $file -Raw -Encoding UTF8

# Find the last occurrence of the closing section and inject before it
$panelCode = @"
         <NotificationCenterPanel
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            alerts={alerts}
            registryRequests={registryRequests}
            onNavigate={(tab) => { setActiveTab(tab); setSubView(null); }}
         />
"@

# The target is the last </div> before ); }
# We'll insert the panel before the closing `      </div>` at the very end
$lastDiv = "      </div>`r`n   );`r`n}"
$replacement = "      </div>`r`n" + $panelCode + "   );`r`n}"

# Replace only the LAST occurrence
$idx = $content.LastIndexOf($lastDiv)
if ($idx -ge 0) {
    $content = $content.Substring(0, $idx) + $replacement + $content.Substring($idx + $lastDiv.Length)
    Set-Content $file -Value $content -Encoding UTF8 -NoNewline
    Write-Host "SUCCESS: NotificationCenterPanel injected at index $idx"
} else {
    Write-Host "NOT FOUND. Showing last 30 chars of file:"
    Write-Host $content.Substring($content.Length - 200)
}
