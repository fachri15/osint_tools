$p = Join-Path $PSScriptRoot '..\..\osinttoolsscrap\src\components\modules\ForensicReportView.jsx'
$l = [System.Collections.Generic.List[string]](Get-Content $p -Encoding UTF8)
# Breach fallback: baris 331-359 -> return []
$l.RemoveRange(330, 29)
$l.Insert(330, '    return [];')
Set-Content $p $l -Encoding UTF8
