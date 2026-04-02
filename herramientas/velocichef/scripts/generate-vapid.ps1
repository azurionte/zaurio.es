$ecdsa = New-Object System.Security.Cryptography.ECDsaCng 256
$params = $ecdsa.ExportParameters($true)

function To-Base64Url([byte[]]$bytes) {
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$publicRaw = New-Object byte[] 65
$publicRaw[0] = 4
[Array]::Copy($params.Q.X, 0, $publicRaw, 1, 32)
[Array]::Copy($params.Q.Y, 0, $publicRaw, 33, 32)

$result = [PSCustomObject]@{
  publicKey = To-Base64Url $publicRaw
  privateKey = To-Base64Url $params.D
}

$result | ConvertTo-Json
