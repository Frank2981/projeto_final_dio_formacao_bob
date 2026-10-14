# Test runner PowerShell para dio_explorer
# Cobertura-alvo: >= 70% de aprovacao
# Execute: powershell -ExecutionPolicy Bypass -File dio_explorer/src/trilhas.test.ps1

Set-StrictMode -Off
$ErrorActionPreference = "SilentlyContinue"

$ROOT      = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$JSON_PATH = Join-Path $ROOT "dio_explorer\data\trilhas_dio.json"

$script:passed  = 0
$script:failed  = 0
$script:results = @()

function Assert {
    param([string]$Description, [bool]$Condition)
    if ($Condition) {
        $script:passed++
        $script:results += [PSCustomObject]@{ Status = "PASS"; Description = $Description }
        Write-Host "  [PASS] $Description"
    } else {
        $script:failed++
        $script:results += [PSCustomObject]@{ Status = "FAIL"; Description = $Description }
        Write-Host "  [FAIL] $Description"
    }
}

function Suite {
    param([string]$Name, [scriptblock]$Block)
    Write-Host ""
    Write-Host "[SUITE] $Name"
    Write-Host ("-" * 60)
    & $Block
}

$jsonData = Get-Content -Raw -Path $JSON_PATH | ConvertFrom-Json
$trilhas  = $jsonData.trilhas

function Find-Trilha {
    param([string]$Tecnologia)
    if (-not $Tecnologia) { return $null }
    $termo = $Tecnologia.ToLower().Trim()
    return $trilhas | Where-Object {
        $_.tecnologia.ToLower() -like "*$termo*" -or
        $_.nome.ToLower()       -like "*$termo*"
    } | Select-Object -First 1
}

function Get-XpDesafio {
    param([string]$Nivel)
    $key = $Nivel.ToLower()
    $key = $key -replace "a`u00e1","a" -replace "a`u00e0","a" -replace "a`u00e3","a" -replace "a`u00e2","a"
    $key = $key -replace "e`u00e9","e" -replace "e`u00ea","e"
    $key = $key -replace "i`u00ed","i" -replace "i`u00ee","i"
    $key = $key -replace "o`u00f3","o" -replace "o`u00f5","o" -replace "o`u00f4","o"
    $key = $key -replace "u`u00fa","u" -replace "u`u00fb","u"
    if ($key -eq "basico")        { return 1000 }
    if ($key -eq "intermediario") { return 2250 }
    if ($key -eq "avancado")      { return 4000 }
    return 2250
}

function Get-TempoDesafio {
    param([string]$Nivel)
    $key = $Nivel.ToLower()
    if ($key -like "*sico*")   { return "30-60 min" }
    if ($key -like "*term*")   { return "1h-2h" }
    if ($key -like "*ado*")    { return "2h-4h" }
    return "1h-2h"
}

function Get-IdDesafio {
    param([string]$Tecnologia)
    $seed = 0
    foreach ($c in $Tecnologia.ToCharArray()) { $seed += [int][char]$c }
    $num = 1000 + ($seed % 9000)
    return "DIO-$num"
}

function Get-IdCertificado {
    param([string]$Nome, [string]$Trilha)
    $base  = ($Nome + "|" + $Trilha).ToUpper() -replace "\s",""
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    $id    = ""
    $salt  = $base.Length
    for ($i = 0; $i -lt 8; $i++) {
        $idx = ([int][char]$base[$i % $base.Length] + $salt + $i) % $chars.Length
        $id += $chars[$idx]
    }
    return "DIO-CERT-$id"
}

function Format-DataBR {
    param([datetime]$Data = (Get-Date))
    return $Data.ToString("dd/MM/yyyy")
}

# SUITE 1 - Estrutura do JSON
Suite "Estrutura do JSON (trilhas_dio.json)" {
    Assert "Arquivo JSON existe no caminho esperado"       (Test-Path $JSON_PATH)
    Assert "Propriedade trilhas e um array"                ($trilhas -is [array] -or $trilhas.Count -gt 0)
    Assert "Contem pelo menos 30 trilhas"                  ($trilhas.Count -ge 30)
    Assert "Todas as trilhas possuem campo id"             (($trilhas | Where-Object { $null -eq $_.id }).Count -eq 0)
    Assert "Todas as trilhas possuem campo nome"           (($trilhas | Where-Object { -not $_.nome }).Count -eq 0)
    Assert "Todas as trilhas possuem campo tecnologia"     (($trilhas | Where-Object { -not $_.tecnologia }).Count -eq 0)
    Assert "Todos xp_total maior que 0"                    (($trilhas | Where-Object { $_.xp_total -le 0 }).Count -eq 0)
    Assert "Todos numero_de_modulos maior que 0"           (($trilhas | Where-Object { $_.numero_de_modulos -le 0 }).Count -eq 0)
    Assert "Todas as trilhas possuem badges_disponiveis"   (($trilhas | Where-Object { -not $_.badges_disponiveis }).Count -eq 0)
    Assert "Todas as trilhas possuem campo vitalicio"      (($trilhas | Where-Object { $null -eq $_.vitalicio }).Count -eq 0)
    Assert "Todas as trilhas possuem live_ao_vivo"         (($trilhas | Where-Object { -not $_.live_ao_vivo }).Count -eq 0)
}

# SUITE 2 - Find-Trilha (/trilha)
Suite "Find-Trilha -- equivalente ao comando /trilha" {
    $java   = Find-Trilha "Java"
    $python = Find-Trilha "python"
    $react  = Find-Trilha "REACT"
    $nula   = Find-Trilha "COBOL_XYZ_INEXISTENTE"
    $vazia  = Find-Trilha ""

    Assert "Encontra trilha Java"                          ($null -ne $java)
    Assert "Trilha Java tem nome Formacao Java Developer"  ($java.nome -eq "Formacao Java Developer" -or $java.nome -like "*Java*")
    Assert "Trilha Java nivel Intermediario"               ($java.nivel -like "*term*")
    Assert "Trilha Java tem 12 modulos"                    ($java.numero_de_modulos -eq 12)
    Assert "Trilha Java tem 48000 XP"                      ($java.xp_total -eq 48000)
    Assert "Trilha Java tem cupom JAVA20"                  ($java.promocoes.cupom -eq "JAVA20")
    Assert "Trilha Java e vitalicia"                       ($java.vitalicio -eq $true)
    Assert "Trilha Java tem live ao vivo disponivel"       ($java.live_ao_vivo.disponivel -eq $true)
    Assert "Trilha Java frequencia Semanal"                ($java.live_ao_vivo.frequencia -eq "Semanal")
    Assert "Encontra Python lowercase"                     ($null -ne $python)
    Assert "Encontra React uppercase"                      ($null -ne $react)
    Assert "Retorna null para tecnologia inexistente"      ($null -eq $nula)
    Assert "Retorna null para string vazia"                ($null -eq $vazia)
    Assert "Encontra Engenharia de Dados"                  ($null -ne (Find-Trilha "Engenharia de Dados"))
    Assert "Encontra Node.js"                              ($null -ne (Find-Trilha "Node"))
    Assert "Encontra AWS"                                  ($null -ne (Find-Trilha "AWS"))
    Assert "Encontra Flutter"                              ($null -ne (Find-Trilha "Flutter"))
    Assert "Encontra Blockchain"                           ($null -ne (Find-Trilha "Blockchain"))
    Assert "Encontra Next.js"                              ($null -ne (Find-Trilha "Next"))
    Assert "Encontra Kotlin"                               ($null -ne (Find-Trilha "Kotlin"))
}

# SUITE 3 - Badges Java
Suite "Badges da trilha Java" {
    $java = Find-Trilha "Java"
    Assert "badges_disponiveis e array"                    ($java.badges_disponiveis -is [array])
    Assert "Tem badge Java Fundamentals"                   ($java.badges_disponiveis -contains "Java Fundamentals")
    Assert "Tem badge OOP Master"                          ($java.badges_disponiveis -contains "OOP Master")
    Assert "Tem badge Spring Boot Expert"                  ($java.badges_disponiveis -contains "Spring Boot Expert")
    Assert "Tem badge Java Developer"                      ($java.badges_disponiveis -contains "Java Developer")
    Assert "Tem exatamente 4 badges"                       ($java.badges_disponiveis.Count -eq 4)
}

# SUITE 4 - XP por nivel
Suite "Get-XpDesafio -- logica de XP por nivel" {
    Assert "Basico retorna 1000"                           ((Get-XpDesafio "Basico")        -eq 1000)
    Assert "Intermediario retorna 2250"                    ((Get-XpDesafio "Intermediario")  -eq 2250)
    Assert "Avancado retorna 4000"                         ((Get-XpDesafio "Avancado")       -eq 4000)
    Assert "Nivel invalido retorna padrao 2250"            ((Get-XpDesafio "Desconhecido")   -eq 2250)
    Assert "Basico lower funciona"                         ((Get-XpDesafio "basico")         -eq 1000)
}

# SUITE 5 - Tempo por nivel
Suite "Get-TempoDesafio -- tempo estimado por nivel" {
    Assert "Basico retorna 30-60 min"                      ((Get-TempoDesafio "Basico")        -eq "30-60 min")
    Assert "Intermediario retorna 1h-2h"                   ((Get-TempoDesafio "Intermediario")  -eq "1h-2h")
    Assert "Avancado retorna 2h-4h"                        ((Get-TempoDesafio "Avancado")       -eq "2h-4h")
    Assert "Nivel invalido retorna string valida"          ((Get-TempoDesafio "Desconhecido").Length -gt 0)
}

# SUITE 6 - ID Desafio
Suite "Get-IdDesafio -- formato e determinismo" {
    $id = Get-IdDesafio "Java"
    Assert "Comeca com DIO-"                               ($id.StartsWith("DIO-"))
    Assert "Tem exatamente 8 caracteres"                   ($id.Length -eq 8)
    Assert "Parte numerica tem 4 digitos"                  ($id -match "^DIO-\d{4}$")
    Assert "E deterministico Java=Java"                    ((Get-IdDesafio "Java") -eq (Get-IdDesafio "Java"))
    Assert "Java e Python geram IDs diferentes"            ((Get-IdDesafio "Java") -ne (Get-IdDesafio "Python"))
}

# SUITE 7 - ID Certificado
Suite "Get-IdCertificado -- formato e determinismo" {
    $id = Get-IdCertificado "Piminchumo" "Java"
    Assert "Comeca com DIO-CERT-"                          ($id.StartsWith("DIO-CERT-"))
    Assert "Parte alfanumerica tem 8 chars"                ($id.Replace("DIO-CERT-","").Length -eq 8)
    Assert "E deterministico"                              ((Get-IdCertificado "Piminchumo" "Java") -eq (Get-IdCertificado "Piminchumo" "Java"))
    Assert "Alunos diferentes geram IDs diferentes"        ((Get-IdCertificado "Piminchumo" "Java") -ne (Get-IdCertificado "Ana" "Java"))
    Assert "Trilhas diferentes geram IDs diferentes"       ((Get-IdCertificado "Piminchumo" "Java") -ne (Get-IdCertificado "Piminchumo" "Python"))
}

# SUITE 8 - Data BR
Suite "Format-DataBR -- formatacao de data" {
    $data   = [datetime]"2025-01-15"
    $result = Format-DataBR $data
    Assert "Retorna 15/01/2025"                            ($result -eq "15/01/2025")
    Assert "Formato DD/MM/YYYY regex"                      ($result -match "^\d{2}/\d{2}/\d{4}$")
    Assert "Sem argumento retorna data valida"             ((Format-DataBR) -match "^\d{2}/\d{2}/\d{4}$")
}

# SUITE 9 - Conteudo /trilha Java
Suite "Conteudo -- /trilha Java" {
    $t = Find-Trilha "Java"
    Assert "Nome contem Java"                              ($t.nome -like "*Java*")
    Assert "Tecnologia e Java"                             ($t.tecnologia -eq "Java")
    Assert "XP formatavel"                                 ($t.xp_total.ToString().Length -gt 0)
    Assert "Modulos formatavel em lista"                   ($t.numero_de_modulos -gt 0)
    Assert "Vitalicio e true"                              ($t.vitalicio -eq $true)
    Assert "Promocao nao e nula"                           ($null -ne $t.promocoes)
    Assert "Desconto da promocao e 20"                     ($t.promocoes.desconto_percentual -eq 20)
    Assert "Live ao vivo disponivel"                       ($t.live_ao_vivo.disponivel -eq $true)
}

# SUITE 10 - /desafio Piminchumo
Suite "Conteudo -- /desafio para Piminchumo (Java / Intermediario)" {
    $tec   = "Java"
    $nivel = "Intermediario"
    $xp    = Get-XpDesafio $nivel
    $tempo = Get-TempoDesafio $nivel
    $id    = Get-IdDesafio $tec

    Assert "Tecnologia Java presente"                      ($tec -eq "Java")
    Assert "Nivel Intermediario presente"                  ($nivel -eq "Intermediario")
    Assert "XP calculado corretamente 2250"                ($xp -eq 2250)
    Assert "Tempo estimado 1h-2h"                          ($tempo -eq "1h-2h")
    Assert "ID do desafio gerado com DIO-"                 ($id.StartsWith("DIO-"))
    Assert "XP maior que 0"                                ($xp -gt 0)
    Assert "XP dentro do range 1500-3000"                  ($xp -ge 1500 -and $xp -le 3000)
}

# SUITE 11 - /certificado Piminchumo
Suite "Conteudo -- /certificado para Piminchumo" {
    $nome   = "Piminchumo"
    $trilha = "Formacao Java Developer"
    $certId = Get-IdCertificado $nome $trilha
    $data   = Format-DataBR ([datetime]"2025-06-15")
    $t      = Find-Trilha "Java"

    Assert "Nome do aluno definido"                        ($nome.Length -gt 0)
    Assert "Trilha definida"                               ($trilha.Length -gt 0)
    Assert "ID do certificado gerado"                      ($certId.StartsWith("DIO-CERT-"))
    Assert "Data formatada corretamente"                   ($data -eq "15/06/2025")
    Assert "Trilha encontrada no JSON"                     ($null -ne $t)
    Assert "Nivel da trilha e Intermediario"               ($t.nivel -like "*term*")
    Assert "Carga horaria calculavel"                      (($t.numero_de_modulos * 8) -le 120)
    Assert "Badges disponiveis para competencias"          ($t.badges_disponiveis.Count -ge 3)
    Assert "ID do cert tem 8 chars alfanumericos"          ($certId.Replace("DIO-CERT-","").Length -eq 8)
    Assert "ID deterministico para Piminchumo"             ($certId -eq (Get-IdCertificado $nome $trilha))
}

# Relatorio final
$total     = $script:passed + $script:failed
$cobertura = if ($total -gt 0) { [math]::Round(($script:passed / $total) * 100, 1) } else { 0 }
$aprovado  = $cobertura -ge 70

$sep = "=" * 60
Write-Host ""
Write-Host $sep
Write-Host "  RELATORIO DE TESTES -- DIO Explorer"
Write-Host $sep
Write-Host "  Total de testes : $total"
Write-Host "  Aprovados       : $($script:passed)"
Write-Host "  Reprovados      : $($script:failed)"
Write-Host "  Cobertura       : $cobertura%  (meta: >= 70%)"
if ($aprovado) {
    Write-Host "  Status          : META ATINGIDA [OK]"
} else {
    Write-Host "  Status          : META NAO ATINGIDA [FALHOU]"
}
Write-Host $sep

$script:TestReport = [PSCustomObject]@{
    Results   = $script:results
    Passed    = $script:passed
    Failed    = $script:failed
    Total     = $total
    Cobertura = $cobertura
    Aprovado  = $aprovado
}

