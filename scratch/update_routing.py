import os

file_path = r"c:\Users\praka\Desktop\land-project\frontend\src\App.jsx"
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Add Edit3 to imports
    if 'TrendingUp, Zap,' in line:
        line = line.replace('TrendingUp, Zap,', 'TrendingUp, Zap, Edit3,')
    
    new_lines.append(line)
    
    # Add routing
    if 'if (activeTab === \'directives\')' in line:
        indent = line[:line.find('if')]
        new_lines.append(f"{indent}if (activeTab === 'updation') return <FormView title=\"Land Record Updation (Adangal)\" icon={{RefreshCcw}} fields={{[{{ label: 'Survey Number', placeholder: 'e.g. 142/A' }}, {{ label: 'Patta Number', placeholder: 'e.g. P-882' }}, {{ label: 'Owner Name', placeholder: 'Current owner...' }}, {{ label: 'Update Type', placeholder: 'e.g. Ownership Change, Area Correction' }}]}} />;\n")
        new_lines.append(f"{indent}if (activeTab === 'correction') return <FormView title=\"Registry Correction Module\" icon={{Edit3}} fields={{[{{ label: 'Survey Number', placeholder: 'e.g. 88/4' }}, {{ label: 'Current Entry', placeholder: 'Incorrect value...' }}, {{ label: 'Proposed Correction', placeholder: 'Corrected value...' }}, {{ label: 'Supporting Document ID', placeholder: 'Reference ID...' }}]}} />;\n")

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
