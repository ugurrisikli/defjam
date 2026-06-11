# SOKAK KRALI

Def Jam: Fight for NY'dan ilham alan, tarayıcıda çalışan özgün bir yeraltı dövüş oyunu.
Tasarım ve sprint planı için bkz. [PLAN.md](PLAN.md).

## Nasıl çalıştırılır

Kurulum gerekmez: `index.html` dosyasını tarayıcıda aç, hepsi bu.

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

Tutma bloğu deler. Tutunca: **yumruk tuşu** = salla (en fazla 3),
**tutma tuşu** = fırlat (yön tuşuyla geriye de atılabilir). Duvara/hoparlöre
çarpan rakip büyük hasar alır; kalabalığa sert savrulan rakibi kalabalık
tutup sersemlemiş hâlde geri iter.

**Momentum & BLAZIN:** isabet aldıkça momentum barın dolar (hasar yedikçe boşalır).
Bar dolunca BLAZIN tuşuyla modu aç: 5 saniye güçlenirsin; bu sırada **tutma**
yaparsan sinematik BLAZIN hareketi patlar (ağır çekim + büyük hasar).

**Stiller:** maç öncesi 5 stilden birini seç — Sokak (dengeli), Kickbox (sert vuruş),
Güreş (ezici tutuş + yüksek can), Dövüş Sanatları (hız + momentum), Submission
(tutuşta can çalar).
| Başlat / Tekrar maç / Menü | Enter / ESC | |

## Testler

```
node --test test/combat.test.js
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
- [ ] Sprint 4 — AI rakip
- [ ] Sprint 5 — Juice ve sunum
- [ ] Sprint 6 — Kariyer modu *(tam oyun döngüsü)*
