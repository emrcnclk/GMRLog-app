Get-ChildItem -Path 'apps/backend/src' -Recurse -File -Include *.spec.ts |
  Where-Object { $_.FullName -match 'reputation|creator|profile-hero|collection-discover|because-you-played|feed-cache|feed\.controller|activity\.service' } |
  Select-Object -ExpandProperty FullName
