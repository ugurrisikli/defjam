# SOKAK KRALI — Geliştirme Planı

> **Def Jam: Fight for NY**'dan ilham alan, tarayıcıda çalışan, özgün bir yeraltı dövüş oyunu.
> EA'in markası, karakterleri veya içeriği kullanılmaz — korunan şey **oynanış hissi ve bağımlılık döngüsüdür**.

---

## 1. Vizyon ve Tasarım Sütunları

Orijinal oyunu unutulmaz yapan dört şey vardı. Bu projenin dokunulmaz sütunları bunlar:

1. **Çevre bir silahtır.** Duvarlar, direkler ve kalabalık dövüşün parçasıdır. Rakibi duvara
   fırlatmak, kalabalığın rakibi tutup geri itmesi — arena pasif bir dekor değil.
2. **BLAZIN anı.** Momentum barı dolduğunda aktive edilen, maçın kaderini değiştiren sinematik
   özel hareket. Oyuncunun beklediği, biriktirdiği, patlattığı an.
3. **Stil taş-kağıt-makası.** Vuruş > Tutma > Blok > Vuruş üçgeni + beş dövüş stilinin
   güçlü/zayıf eşleşmeleri. Her maç bir stil okuma oyunudur.
4. **Yükseliş döngüsü.** Dövüş → kazan → para + RESPECT → stat/hamle satın al → daha güçlü
   rakibe çık. Bağımlılığı yaratan merdiven bu.

**Ton:** Karanlık yeraltı kulüpleri, neon, hip-hop havası. Arayüz Türkçe; **K.O., BLAZIN!,
RESPECT** gibi imza terimler İngilizce kalır.

---

## 2. Teknik Kararlar

| Karar | Seçim | Gerekçe |
|---|---|---|
| Platform | Tarayıcı (HTML5) | Tek tıkla her yerde çalışır, kurulum yok |
| Teknoloji | Saf Canvas 2D + vanilla JS (ES modules) | Sıfır bağımlılık, build adımı yok, `index.html`'i aç ve oyna |
| Perspektif | Yandan 2D dövüş | En hızlı okunur ve geliştirilir |
| Grafik | Kodla çizilen eklemli vektör/siluet dövüşçüler | Görsel dosya gerekmez, animasyon yumuşak, sonradan sprite'a geçilebilir |
| Ses | WebAudio ile prosedürel efektler | Ses dosyası gerekmez |
| Kayıt | `localStorage` | Kariyer ilerlemesi tarayıcıda saklanır |
| Test | `node:test` ile saf mantık testleri | Hasar, momentum, AI kararları ve maç simülasyonu görsel ortam olmadan doğrulanır |
| Döngü | Sabit zaman adımı (60 Hz update, render ayrık) | Deterministik dövüş mantığı = test edilebilirlik |

**Dosya iskeleti:**

```
index.html          # tek giriş noktası
src/
  main.js           # oyun döngüsü, sahne yöneticisi
  input.js          # klavye (P1: WASD + JKL, alternatif: oklar + ZXC)
  scenes/           # menü, karakter seçimi, maç, kariyer haritası, dükkan
  combat/           # dövüşçü state machine, hasar çözümü, hitbox, grapple, blazin
  ai/               # rakip beyni
  career/           # ilerleme, ekonomi, kayıt
  render/           # eklemli karakter çizimi, arena, kalabalık, partiküller, HUD
  audio/            # prosedürel ses
test/               # mantık testleri
```

---

## 3. Oynanış Spesifikasyonu

### 3.1 Temel üçgen
```
  VURUŞ  ──yener──►  TUTMA
    ▲                  │
    │                yener
  yener                │
    │                  ▼
  BLOK  ◄──yener──  (blok tutmayı durduramaz)
```
- **Vuruş** (yumruk/tekme): hızlı hasar, bloklanabilir. Bloklanan vuruş momentum kaybettirir.
- **Tutma (grapple):** bloğu deler. Tutunca: salla (hasar), **fırlat** (yöne göre — duvara denk
  gelirse büyük hasar + sersemletme), veya stil hamlesi.
- **Blok:** vuruşu keser, momentum kazandırır; tutmaya karşı çaresiz.
- **Kaçınma (dodge):** kısa pencereli; başarılı kaçınma karşı saldırı fırsatı verir.
- **Koşu:** ileri yöne çift dokunuş koşu başlatır (yön basılı kaldıkça sürer). Koşudan
  **yumruk = dalış yumruğu**, **tekme = uçan tekme**: yüksek hasar + yere düşürür ama
  ıskalarsa/bloklanırsa uzun toparlanma cezası vardır (yüksek risk, yüksek ödül).

### 3.2 Beş dövüş stili — her stilin kendi hamle seti var
| Stil | Hızlı vuruş | Güçlü vuruş | Tutuş özel hamlesi | Zincir |
|---|---|---|---|---|
| Sokak | Direkt | Çevirme Yumruk (düşürür) | Kafa Atma (sersemletir) | 3'lü |
| Kickbox | Hızlı Diz | Palet Tekme (en sert) | Diz Şovu | 3'lü |
| Güreş | Ağır Tokat (iter) | Omuz Şarjı (şarjlı düşürme) | Suplex (pozisyon değişimi) | 2'li |
| Dövüş Sanatları | Yıldırım Vuruş (en hızlı) | Dönen Tekme | Savurma (+momentum) | 3'lü |
| Submission | Pençe | Alçak Tekme (sersemletir) | Eklem Kilidi (can çalar) | 2'li |

- **Kombo zinciri:** isabet eden vuruş, toparlanma penceresinde tekrar vuruş tuşuyla
  zincire bağlanır. Hızlı stiller 3'lü, ağır stiller 2'li zincir yapar. Bloklanan/ıskalanan
  vuruş zinciri keser.
- **Tutuş özel hamlesi:** tutuş sırasında tekme tuşu — sallama ve fırlatmanın yanındaki
  üçüncü seçenek.
- Oyuncu kariyerde **ikinci bir stil** satın alıp hibrit kurabilir.

### 3.3 Momentum ve BLAZIN
- Momentum: isabetli vuruş + (büyük), **hasar yiyince de + (küçük — comeback mekaniği)**,
  başarılı blok +, bloklanınca −. Bar maç başına 1-2 kez dolacak şekilde ayarlanır;
  kaybeden taraf da BLAZIN'e ulaşıp maçı çevirebilmelidir.
- Bar dolunca **BLAZIN!** hazır: aktive et → kısa süreli güç modu; bu sırada grapple
  bağlarsan **sinematik özel hareket** (zaman yavaşlar, kamera yaklaşır, dev hasar).
- Rakibin canı kritik + BLAZIN hareketi = **K.O. finiş** (maç biter, kalabalık coşar).

### 3.4 Çevre etkileşimi
- Arena sınırları **kalabalık duvarı**: rakip kalabalığa savrulursa kalabalık onu tutar ve
  geri iter → kısa sersemletme penceresi (saldırı fırsatı).
- **Sert yüzeyler** (duvar, direk, bar tezgâhı): fırlatma hedefi; çarpınca ekstra hasar +
  yere düşme.
- Her arenanın **imza nesnesi** bir tehlike noktasıdır (aşağıda).

### 3.5 Üç arena
1. **Kulüp** — dar alan, her yer kalabalık duvarı; imza: sahne kenarı (yüksekten düşürme).
2. **Otopark** — geniş alan, beton direkler; imza: araba kaputu (fırlatınca alarm + cam patlama).
3. **Metro Peronu** — uzun dar arena; imza: tur nişanesi olarak periyodik geçen tren rüzgârı
   (kenara fırlatma riski/ödülü).

### 3.6 AI rakipler (kariyer merdiveni)
| # | Rakip (özgün) | Stil | Kişilik |
|---|---|---|---|
| 1 | "Çaylak" | Sokak | Pasif, öğretici niteliğinde |
| 2 | "Tekmeci" | Kickbox | Agresif baskı, mesafe tutar |
| 3 | "Ayı" | Güreş | Sürekli tutma arar, duvara sürükler |
| 4 | "Gölge" | Dövüş Sanatları | Kaçınma + karşı saldırı, sabır ister |
| 5 | "Kral" | Hibrit (hepsi) | Final boss: momentum yönetimi yapar, BLAZIN saklar |

AI = durum makinesi (yaklaş / baskı / bekle-oku / ceza kes) + stil bazlı ağırlıklar +
zorluk parametresi (reaksiyon gecikmesi, hata payı).

### 3.7 Kariyer döngüsü
- Maç kazan → **para** (dükkan) + **RESPECT** (kilit açma/ilerleme).
- **Dükkan:** stat puanı (güç, hız, dayanıklılık), yeni hamleler, ikinci stil.
- Kaybedince ilerleme yanmaz; aynı rakibe tekrar çıkılır (bağımlılık döngüsünü kırmamak için
  ceza hafif: küçük para kaybı).
- `localStorage` ile otomatik kayıt.

### 3.8 "Juice" (çekicilik) listesi
Hissi yaratan küçük şeyler — bunlar süs değil, sütun #2 ve #4'ün taşıyıcısı:
- **Hit-stop** (isabette 60–100 ms donma), **ekran sarsıntısı** (hasarla orantılı),
- vuruş partikülleri ve ter/kıvılcım efektleri,
- kalabalık silüetlerinin tepkisi (büyük hasarda zıplama, "OOOH!" yazısı),
- **anonsör metinleri** ("HOŞGELDİN!", "BLAZIN!", "K.O.!"),
- yavaşlatılmış K.O. tekrarı,
- prosedürel bas vuruşlu arka plan ritmi (WebAudio).

---

## 4. Sprint Planı

Her sprint sonunda çalışan, denenebilir bir şey çıkar. Oyun **Sprint 2 sonunda oynanabilir**,
**Sprint 6 sonunda tam döngüye** kavuşur.

### Sprint 0 — İskelet ve Sahne (temel altyapı)
- `index.html` + Canvas, sabit zaman adımlı oyun döngüsü, sahne yöneticisi (menü ↔ maç).
- Klavye girişi, iki eklemli vektör dövüşçünün çizimi, yürüme/zıplama, yere basma.
- Basit arena çizimi (zemin + kalabalık silüeti).
- **Kabul:** Menüden maça giriliyor, iki karakter sahnede yürüyor, 60 fps.

### Sprint 1 — Çekirdek Dövüş
- Dövüşçü state machine (idle, yürü, yumruk, tekme, blok, hasar alma, yere düşme, kalkma, K.O.).
- Hitbox/hurtbox sistemi, hasar çözümü, can barı, taş-kağıt-makasın vuruş–blok ayağı.
- Hit-stop + ekran sarsıntısı (juice'un çekirdeği baştan girer).
- **Test:** hasar hesabı, state geçişleri, K.O. koşulu `node:test` ile.
- **Kabul:** İki klavye oyuncusu birbirini dövüp K.O. edebiliyor.

### Sprint 2 — Grapple ve Çevre ✅ *İlk oynanabilir sürüm*
- Tutma/salla/fırlat; fırlatma yön ve mesafe mantığı.
- Duvar çarpışma hasarı + sersemletme; kalabalık duvarı tut-ve-geri-it mekaniği.
- Kulüp arenası tamamlanır (imza nesnesiyle).
- **Kabul:** Rakibi kalabalığa itip geri gelirken yakalamak ve duvara fırlatmak çalışıyor; oyun bu haliyle eğlenceli.

### Sprint 3 — Stiller, Momentum, BLAZIN, Koşu
- Çift dokunuşla koşu + koşuya özel dalış yumruğu / uçan tekme.
- 5 stilin stat ve hamle farkları; stil seçim ekranı.
- Momentum barı kuralları; BLAZIN modu + sinematik özel hareket (yavaşlatma, kamera yakınlaşma).
- K.O. finiş sahnesi.
- **Test:** momentum kazanım/kayıp kuralları, BLAZIN hasar çarpanları.
- **Kabul:** Bar doldur → BLAZIN bas → özel hareketle maçı çevir akışı tatmin edici.

### Sprint 4 — AI Rakip
- AI durum makinesi + stil kişilikleri + zorluk parametresi.
- 5 rakibin tamamı ayarlanır.
- **Test:** AI'ın karar dağılımı simülasyonla doğrulanır (ör. Ayı maç başına X kez tutma denemeli), AI vs AI maç simülasyonu çökmeden tamamlanmalı.
- **Kabul:** Tek başına oynanan maç zorlayıcı ve adil hissettiriyor.

### Sprint 5 — Juice ve Sunum ✅
- Partiküller, kalabalık tepkileri, anonsör metinleri, K.O. tekrarı.
- WebAudio prosedürel sesler (vuruş, kalabalık, bas ritmi).
- HUD cilası (can/momentum barları, portre kutuları, round sayacı).
- Otopark ve Metro arenaları.
- **Kabul:** Sesi açıp izleyen biri "bu bir oyun" diyor; üç arena da farklı hissettiriyor.

### Sprint 5.5 — Grafik Revizyonu
- Detaylı vektör karakterler: kafa/yüz, gövde hacmi, kıyafet, gölgelendirme;
  daha iri ve okunaklı siluetler.
- Arena derinliği ve ışıklandırma cilası.
- **Kabul:** Karakterler "çöp adam" değil "dövüşçü" gibi görünüyor.

### Sprint 6 — Kariyer Modu ✅ *Tam oyun döngüsü*
- Kariyer haritası (5 rakip merdiveni), maç sonu para/RESPECT ekranı.
- Dükkan: stat, hamle, ikinci stil satın alma.
- `localStorage` kayıt/yükleme, isim girme, yeni oyun.
- **Test:** ekonomi dengesi (toplam kazanç ile dükkan fiyatları), kayıt/yükleme bütünlüğü.
- **Kabul:** Sıfırdan başlayıp 5 rakibi yenip "Kral" olunabiliyor; tek oturumda bitirilebilir, tekrar oynamak cazip.

### Sprint 7 — Denge ve Cila (yedek)
- Oynanış testlerinden gelen denge ayarları (hasar, AI, ekonomi).
- Bug temizliği, kenar durumlar (aynı anda tutma, köşe durumları).
- Performans kontrolü.

---

## 5. Riskler ve Önlemler

| Risk | Önlem |
|---|---|
| Dövüş "hissi" tutmaz (en büyük risk) | Hit-stop/sarsıntı Sprint 1'de girer; her sprintte oynanış denemesi |
| Grapple çakışmaları (aynı anda iki tutma) | Deterministik öncelik kuralı + testler |
| AI ya aptal ya hileci hissettirir | Reaksiyon gecikmesi modeli (anlık değil, insansı gecikmeli tepki) |
| Kapsam şişmesi | Sütun listesi dışındaki her fikir Sprint 7 sonrası "gelecek" listesine |

## 6. Sürüm Sonrası Fikirler (kapsam dışı, not olarak)
- Yerel 2 oyunculu mod, karakter yaratma ekranı (saç/kıyafet/renk),
  ekstra arenalar, mobil dokunmatik kontroller, turnuva modu.
