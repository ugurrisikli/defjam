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
| Blok | S (basılı tut) | ↓ (basılı tut) |
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
- [ ] Sprint 2 — Grapple ve çevre etkileşimi *(ilk oynanabilir sürüm)*
- [ ] Sprint 3 — Stiller, momentum, BLAZIN
- [ ] Sprint 4 — AI rakip
- [ ] Sprint 5 — Juice ve sunum
- [ ] Sprint 6 — Kariyer modu *(tam oyun döngüsü)*
