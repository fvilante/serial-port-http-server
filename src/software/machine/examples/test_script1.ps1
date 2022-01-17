$current_dir = Get-Location
$working_dir = "C:\Repositorios\StageArea\NodeSerialServer\src\software\machine\examples"

Write-Host 'Programando Job'
$job = Start-job { 
    #Set-Location $working_dir
    Write-Host "Iniciando job..."
    npx ts-node .\mexample-03.ts
    Write-Host "Job finalizado"
}
Write-Host 'Ok'
Write-Host 'Aguardando a finalizacao do job...'
try {
    Wait-Job -Job $job
}
finally {
    $r = Receive-Job -Job $job -Keep | Select-Object -Last 30    
} 


Write-Host $r
Write-Host '-------------'
Write-Host 'Para o resultado das ultimas 30 linhas, digite: $r e/ou Get-Error'





