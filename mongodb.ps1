# MongoDB Management Script for role-manager
# Este script facilita la gestion de MongoDB en Windows

param(
    [Parameter(Position=0)]
    [ValidateSet('status', 'start', 'stop', 'restart', 'check', 'demo', 'help')]
    [string]$Action = 'help'
)

function Show-Header {
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host "  MongoDB Manager - role-manager Project" -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Status {
    Write-Host "Estado de MongoDB:" -ForegroundColor Yellow
    Write-Host ""
    
    $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    
    if ($null -eq $service) {
        Write-Host "MongoDB no esta instalado" -ForegroundColor Red
        Write-Host ""
        Write-Host "Descarga MongoDB desde:" -ForegroundColor Yellow
        Write-Host "https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
        return
    }
    
    $status = $service.Status
    $statusColor = if ($status -eq "Running") { "Green" } else { "Red" }
    
    Write-Host "Servicio: $status" -ForegroundColor $statusColor
    Write-Host "Nombre: $($service.Name)" -ForegroundColor Gray
    Write-Host "Display: $($service.DisplayName)" -ForegroundColor Gray
    Write-Host ""
    
    if ($status -eq "Running") {
        Write-Host "Probando conexion al puerto 27017..." -ForegroundColor Yellow
        $connection = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
        
        if ($connection.TcpTestSucceeded) {
            Write-Host "Puerto 27017: Abierto" -ForegroundColor Green
            Write-Host "URI: mongodb://localhost:27017/role-manager" -ForegroundColor Gray
        } else {
            Write-Host "Puerto 27017: Cerrado" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

function Start-MongoDBService {
    Write-Host "Iniciando MongoDB..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        Start-Service -Name "MongoDB" -ErrorAction Stop
        Write-Host "MongoDB iniciado correctamente" -ForegroundColor Green
        Start-Sleep -Seconds 2
        Show-Status
    } catch {
        Write-Host "Error al iniciar MongoDB: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Intenta ejecutar PowerShell como Administrador" -ForegroundColor Yellow
    }
}

function Stop-MongoDBService {
    Write-Host "Deteniendo MongoDB..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        Stop-Service -Name "MongoDB" -ErrorAction Stop
        Write-Host "MongoDB detenido correctamente" -ForegroundColor Green
    } catch {
        Write-Host "Error al detener MongoDB: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Intenta ejecutar PowerShell como Administrador" -ForegroundColor Yellow
    }
}

function Restart-MongoDBService {
    Write-Host "Reiniciando MongoDB..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        Restart-Service -Name "MongoDB" -ErrorAction Stop
        Write-Host "MongoDB reiniciado correctamente" -ForegroundColor Green
        Start-Sleep -Seconds 2
        Show-Status
    } catch {
        Write-Host "Error al reiniciar MongoDB: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Intenta ejecutar PowerShell como Administrador" -ForegroundColor Yellow
    }
}

function Check-Database {
    Write-Host "Verificando base de datos..." -ForegroundColor Yellow
    Write-Host ""
    
    $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    
    if ($null -eq $service -or $service.Status -ne "Running") {
        Write-Host "MongoDB no esta corriendo" -ForegroundColor Red
        Write-Host "Ejecuta: .\mongodb.ps1 start" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Ejecutando script de verificacion..." -ForegroundColor Gray
    Write-Host ""
    npm run check-db
}

function Run-Demo {
    Write-Host "Ejecutando demo..." -ForegroundColor Yellow
    Write-Host ""
    
    $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    
    if ($null -eq $service -or $service.Status -ne "Running") {
        Write-Host "MongoDB no esta corriendo" -ForegroundColor Red
        Write-Host "Ejecuta: .\mongodb.ps1 start" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Ejecutando demo del sistema RBAC..." -ForegroundColor Gray
    Write-Host ""
    npm run demo
}

function Show-Help {
    Write-Host "Uso: .\mongodb.ps1 [accion]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Acciones disponibles:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  status   - Mostrar estado de MongoDB" -ForegroundColor Green
    Write-Host "  start    - Iniciar servicio de MongoDB" -ForegroundColor Green
    Write-Host "  stop     - Detener servicio de MongoDB" -ForegroundColor Green
    Write-Host "  restart  - Reiniciar servicio de MongoDB" -ForegroundColor Green
    Write-Host "  check    - Verificar base de datos (npm run check-db)" -ForegroundColor Green
    Write-Host "  demo     - Ejecutar demo (npm run demo)" -ForegroundColor Green
    Write-Host "  help     - Mostrar esta ayuda" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ejemplos:" -ForegroundColor Cyan
    Write-Host "  .\mongodb.ps1 status" -ForegroundColor Gray
    Write-Host "  .\mongodb.ps1 start" -ForegroundColor Gray
    Write-Host "  .\mongodb.ps1 check" -ForegroundColor Gray
    Write-Host "  .\mongodb.ps1 demo" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
Show-Header

switch ($Action) {
    'status'  { Show-Status }
    'start'   { Start-MongoDBService }
    'stop'    { Stop-MongoDBService }
    'restart' { Restart-MongoDBService }
    'check'   { Check-Database }
    'demo'    { Run-Demo }
    'help'    { Show-Help }
    default   { Show-Help }
}

Write-Host ""
