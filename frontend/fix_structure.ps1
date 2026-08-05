$file = 'src\App.jsx'
$content = Get-Content $file -Raw -Encoding UTF8

# Fix: the panel landed outside the main div. We need to restructure the closing.
# Current broken end:
#    </div>
#          <NotificationCenterPanel ... />   );
# }
# 
# We want:
#    </div>   (close outer flex div, which already has sidebar+main inside)
#       <NotificationCenterPanel ... />
#    </div>  -- BUT there's no wrapper. Actually the outer div is at line 4457
#
# Simplest fix: move the panel BEFORE the outer </div>, inside it.
# Find the broken section and fix it

$broken = "      </div>`r`n         <NotificationCenterPanel`r`n            isOpen={isNotifOpen}`r`n            onClose={() => setIsNotifOpen(false)}`r`n            alerts={alerts}`r`n            registryRequests={registryRequests}`r`n            onNavigate={(tab) => { setActiveTab(tab); setSubView(null); }}`r`n         />   );"

# Check if this broken pattern exists
if ($content.Contains("</div>`r`n         <NotificationCenterPanel")) {
    Write-Host "Found broken pattern - fixing..."
    # Replace the broken close with the correct structure
    $content = $content -replace [regex]::Escape("</div>`r`n         <NotificationCenterPanel`r`n            isOpen={isNotifOpen}`r`n            onClose={() => setIsNotifOpen(false)}`r`n            alerts={alerts}`r`n            registryRequests={registryRequests}`r`n            onNavigate={(tab) => { setActiveTab(tab); setSubView(null); }}`r`n         />   );`r`n}"), "</div>`r`n         <NotificationCenterPanel`r`n            isOpen={isNotifOpen}`r`n            onClose={() => setIsNotifOpen(false)}`r`n            alerts={alerts}`r`n            registryRequests={registryRequests}`r`n            onNavigate={(tab) => { setActiveTab(tab); setSubView(null); }}`r`n         />`r`n      </div>`r`n   );`r`n}"
    Set-Content $file -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Fixed!"
} else {
    Write-Host "Pattern not found as expected. Showing end of file:"
    Write-Host $content.Substring($content.Length - 500)
}
