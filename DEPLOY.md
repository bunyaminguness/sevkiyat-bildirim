# Production Deployment Guide

## Ortam
- **Development**: Mac (bu bilgisayar)
- **Production**: Windows makinesi (`C:\deploy\sevkiyat\publish`)

## Deployment Adımları

### Windows Makinesinde Yapılacaklar

#### 1. Kaynak Kodları Güncelleyin
```powershell
# Eğer git repo'su yoksa, ilk kurulum:
cd C:\deploy
git clone https://github.com/bunyaminguness/sevkiyat-bildirim.git sevkiyat-source
cd sevkiyat-source

# Eğer repo zaten varsa:
cd C:\deploy\sevkiyat-source
git pull origin main
```

#### 2. Backend Build
```powershell
cd C:\deploy\sevkiyat-source\apps\api
dotnet publish -c Release -o C:\deploy\sevkiyat\publish
```

#### 3. Frontend Build
```powershell
cd C:\deploy\sevkiyat-source\apps\web
npm install  # İlk kez veya package.json değiştiyse
npm run build
```

#### 4. Frontend'i Başlatın
```powershell
# Yeni terminal penceresi
cd C:\deploy\sevkiyat-source\apps\web
npm run start
# Port 3000'de çalışacak
```

#### 5. Backend'i Başlatın
```powershell
# Yeni terminal penceresi
cd C:\deploy\sevkiyat\publish
$env:ASPNETCORE_ENVIRONMENT="Production"
$env:Auth__FrontendBaseUrl="https://sevkiyat.toplumplatformu.com"
dotnet .\SevkiyatBildirimApi.dll
```

#### 6. Cloudflare Tunnel
Frontend port 3000'de çalıştığı için:
```powershell
cloudflared tunnel run sevkiyat
```

## Sorun Giderme

### Eski Versiyon Görünüyorsa
1. Tüm terminalleri kapatın (Ctrl+C)
2. `C:\deploy\sevkiyat-source\.next` klasörünü silin
3. `npm run build` ve `npm run start` tekrar yapın
4. Tarayıcıda Ctrl+Shift+R (hard refresh)

### Hızlı Deploy Scripti
Aşağıdaki komutu `C:\deploy\update-sevkiyat.ps1` olarak kaydedin:

```powershell
# update-sevkiyat.ps1
Write-Host "Updating source code..." -ForegroundColor Green
cd C:\deploy\sevkiyat-source
git pull origin main

Write-Host "Building backend..." -ForegroundColor Green
cd apps\api
dotnet publish -c Release -o C:\deploy\sevkiyat\publish

Write-Host "Building frontend..." -ForegroundColor Green
cd ..\web
npm run build

Write-Host "Deployment complete! Restart services now." -ForegroundColor Yellow
```

Kullanımı: `.\update-sevkiyat.ps1`
