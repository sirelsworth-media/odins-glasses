param(
  [Parameter(Mandatory = $true)]
  [string]$GeneratedDirectory,
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\renderer\src\assets\monster-portraits")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type -Path (Join-Path $PSScriptRoot "PortraitProcessor.cs") -ReferencedAssemblies "System.Drawing"

$sources = [ordered]@{
  1498 = "exec-6eb47b7c-b064-4794-abe6-e0fdf0d351da.png"
  1499 = "exec-94f4828d-ddc4-42d6-8c53-367cdaddc3f3.png"
  1102 = "exec-5aef4081-4c35-4f2b-a49d-788e89378c8a.png"
  1169 = "exec-2dfcd95e-7095-47c4-b705-d32056af6d48.png"
  1193 = "exec-12bdb895-b313-48c2-8027-f5da7e67de4c.png"
  1243 = "exec-4e4e2a8b-240d-43b8-b131-29a80442c3f4.png"
  1493 = "exec-116c5305-919b-4ce0-8005-8442110a9458.png"
  1197 = "exec-4ea6ca2d-9c15-4353-88db-aa54cbe2bbaf.png"
  1256 = "exec-cfe43cc4-48f8-4564-8491-d672734699c9.png"
  1101 = "exec-084cb423-2de6-4254-b400-f448e062c1df.png"
  1131 = "exec-d492f841-6f03-411c-bad7-2c154cf8640f.png"
  1143 = "exec-6b954075-1db7-472b-a4d0-403dd54865a0.png"
  1270 = "exec-650b9088-70d6-40b8-adf4-cb9334b3b62e.png"
  1037 = "exec-c63a67db-c660-4668-a17d-9cd567ee3232.png"
  1112 = "exec-6fe78898-d37d-44e0-9010-dfa6731364d7.png"
  1196 = "exec-b8d0895a-72aa-4c5b-9ed7-a4b5af81887d.png"
  1261 = "exec-89edb352-e14e-4b74-a2d7-bb5d240d97ad.png"
  1046 = "exec-00fa2857-a068-46c1-ba17-3639241ed739.png"
  1159 = "exec-1435be71-249a-4778-b65a-b7abc4691fcb.png"
  1251 = "exec-35491da4-175d-489d-9a6a-5370fcc1eeb1.png"
  1320 = "exec-e000e55b-930b-4ca7-9275-5a26c48393e1.png"
  1377 = "exec-87acd693-958c-4dae-884b-b7f9442ad658.png"
  1092 = "exec-2082b384-ee8e-4e8e-8cfe-3b8e3d46f24a.png"
  1109 = "exec-b64f192e-1e08-42f5-8f93-3d6c2e62477e.png"
  1497 = "exec-e87e5f08-9af7-4c4c-9f20-f486019a482f.png"
  1515 = "exec-93c99cb7-fefe-4c42-8f31-7f039b9dc715.png"
  1257 = "exec-a6cd97f3-5cc9-42ca-9dd0-8e25114793cb.png"
  1272 = "exec-0583eb6a-e460-459c-96e0-c78825dd60d6.png"
  1302 = "exec-d914e01e-b3ad-44e3-9352-0fdb1e7a71f0.png"
  1099 = "exec-5dac0c4f-9b80-460d-bc69-65bd2758a5aa.png"
  1263 = "exec-5ecabc19-500c-4d14-bbd0-f08a446262de.png"
  1132 = "exec-16664447-c265-40be-a947-66ec798f5cc7.png"
  1151 = "exec-3274698a-8a27-4c8b-9889-4d930cc039c6.png"
  1198 = "exec-d924058b-d0f7-4007-bba4-d086ea687c71.png"
  1201 = "exec-bde0e0cb-1618-4b68-b98c-d1dd7767cd40.png"
  1252 = "exec-ceecf9a2-bdfc-4094-b1bd-6733a085b502.png"
  1096 = "exec-5880b24b-ecb0-4eea-8565-bc07ff743ca9.png"
  1120 = "exec-abbc19f6-fe82-4c08-a8e3-4104fefab50d.png"
  1253 = "exec-6a0666af-d49e-4b6b-be8c-4901d9fa80fa.png"
  1275 = "exec-63c26a83-3eaf-4185-bd35-e679ef53b945.png"
  1500 = "exec-579161d6-e5f6-4b76-a18c-ded62e586f30.png"
  1148 = "exec-10db69c8-7bbc-44cc-afc7-4c1f74dc1365.png"
  1202 = "exec-ecb93d3d-dab0-40a0-b2ca-8469e65262bb.png"
  1267 = "exec-3a52ad8f-9198-4df5-8dfc-ae2dfe48726f.png"
  1207 = "exec-a4f622f1-43ff-4fed-8573-06ef978b875f.png"
  1039 = "exec-0d6659ee-adbe-415e-b909-3ba9464dcb71.png"
  1098 = "exec-55531cf8-61d3-491d-9e63-7e796fff94ee.png"
  1178 = "exec-6c057093-5a70-4d88-a465-2b131c61c7d0.png"
  1200 = "exec-1d18fa03-e191-4778-8727-b739a96ed89c.png"
  20368 = "exec-05fce116-11ef-4df8-ac09-64e36a7ba831.png"
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
foreach ($entry in $sources.GetEnumerator()) {
  $sourcePath = Join-Path $GeneratedDirectory $entry.Value
  if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Missing generated image: $sourcePath" }
  [PortraitProcessor]::Convert($sourcePath, (Join-Path $OutputDirectory ($entry.Key.ToString() + ".png")))
}

Write-Output "Imported $($sources.Count) monster portraits."
