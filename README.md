# SOKAK KRALI

Def Jam: Fight for NY'dan ilham alan, tarayıcıda çalışan özgün bir yeraltı dövüş oyunu.
Tasarım ve sprint planı için bkz. [PLAN.md](PLAN.md).

## Nasıl çalıştırılır

Kurulum gerekmez: `index.html` dosyasını tarayıcıda aç, hepsi bu.
Menüden **TEK OYUNCU** (stil kişilikli AI rakibe karşı) veya **IKI OYUNCU**
(aynı klavyede) seç.

## Kontroller

| | Oyuncu 1 | Oyuncu 2 |
|---|---|---|
| Yürü | A / D | ← / → |
| Zıpla | W | ↑ |
| Yumruk | J | , |
| Tekme | K | . |
| Tutma | L | / |
| Blok | S (basılı tut) | ↓ (basılı tut) |
| Koşu | ileri yöne çift dokun | ileri yöne çift dokun |
| BLAZIN | Boşluk | Sağ Shift |

Koşarken yumruk = **dalış yumruğu**, tekme = **uçan tekme**: yüksek hasar +
yere düşürür ama ıskalarsan uzun toparlanma cezası var.

**Stil hamleleri:** Her stilin kendi hızlı/güçlü vuruşu ve tutuş özel hamlesi
(tutuş sırasında tekme tuşu) var — Güreş'in Suplex'i pozisyon değiştirir,
Submission'ın Eklem Kilidi can çalar. **Kombo:** isabet eden vuruş, toparlanma
penceresinde tekrar basışla zincire bağlanır (hızlı stiller 3'lü, ağırlar 2'li).

Tutma bloğu deler. Tutunca: **yumruk tuşu** = salla (en fazla 3),
**tutma tuşu** = fırlat (yön tuşuyla geriye de atılabilir). Duvara/hoparlöre
çarpan rakip büyük hasar alır; kalabalığa sert savrulan rakibi kalabalık
tutup sersemlemiş hâlde geri iter.

**Momentum & BLAZIN:** vurdukça barın hızlı, hasar yedikçe yavaş dolar
(comeback şansı — kaybeden de BLAZIN görür).
Bar dolunca BLAZIN tuşuyla modu aç: 5 saniye güçlenirsin; bu sırada **tutma**
yaparsan sinematik BLAZIN hareketi patlar (ağır çekim + büyük hasar).

**Stiller:** maç öncesi 5 stilden birini seç — Sokak (dengeli), Kickbox (sert vuruş),
Güreş (ezici tutuş + yüksek can), Dövüş Sanatları (hız + momentum), Submission
(tutuşta can çalar).
| Başlat / Tekrar maç / Menü | Enter / ESC | |

## Testler

```
node --test test/combat.test.js test/ai.test.js
```

## Durum

- [x] **Sprint 0 — İskelet:** oyun döngüsü, sahneler (menü ↔ maç), klavye girişi,
      eklemli vektör dövüşçüler, kulüp arenası ve kalabalık
- [x] **Sprint 1 — Çekirdek dövüş:** yumruk/tekme (hazırlık-isabet-toparlanma kareleri),
      blok, can barları, savrulma, yere düşme/kalkma, K.O., hit-stop + ekran sarsıntısı,
      kıvılcım efektleri, maç akışı (HAZIR → DÖVÜŞ → K.O. → tekrar)
- [x] **Sprint 2 — Grapple ve çevre etkileşimi:** tutma/sallama/fırlatma, bloğu delen
      tutuş, duvara fırlatma hasarı, kalabalığın tutup geri itmesi, tutuştan kurtulma,
      yüzen olay yazıları ("DUVAR!", "KALABALIK TUTTU!") *(ilk oynanabilir sürüm)* ✅
- [x] **Sprint 3 — Stiller, momentum, BLAZIN, koşu:** 5 dövüş stili + seçim ekranı,
      momentum barı, BLAZIN modu + ağır çekim/zoom'lu özel hareket, BLAZIN K.O. finişi,
      çift dokunuş koşusu + dalış yumruğu / uçan tekme
- [x] **Sprint 4 — AI rakip:** stil bazlı kişilikler (Güreş tutma arar, Kickbox baskı kurar,
      Dövüş Sanatları blok/sabır oynar...), insansı reaksiyon gecikmesi ve hata payı,
      BLAZIN kullanımı, tutuşta duvara fırlatma zekâsı, tek oyunculu mod
- [x] **Sprint 4.5 — Stil hamleleri ve denge:** stile özel hızlı/güçlü vuruşlar ve tutuş
      özel hamleleri (Suplex, Eklem Kilidi...), kombo zinciri (2'li/3'lü), momentum
      comeback ekonomisi, AI kombo/özel hamle kullanımı
- [x] **Sprint 5 — Juice ve sunum:** prosedürel WebAudio (vuruş sesleri, kalabalık
      uğultusu/tezahürat, arena başına bas ritmi — M ile sustur), üç arena (Kulüp,
      Otopark, Metro), 2 round alan kazanır + round ışıkları ve portreler, K.O.
      tekrarı (ağır çekim + letterbox), anonsör satırları (İLK KAN, KOMBO x3...),
      coşan kalabalık (hype'a göre sallanır, kollar havaya kalkar)
- [ ] Sprint 5 — Juice ve sunum
- [ ] Sprint 6 — Kariyer modu *(tam oyun döngüsü)*
