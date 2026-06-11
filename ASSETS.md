# SOKAK KRALI — Sprite Üretim Rehberi

Oyun, `assets/<stil>.png` + `assets/<stil>.json` bulduğu anda o karakteri
sprite ile çizer; bulamazsa vektör kuklaya döner. Yani **asset'ler karakter
karakter, hazır oldukça** eklenebilir. Stil anahtarları: `sokak`, `kickbox`,
`gures`, `sanat`, `submission`.

> Telif notu: Var olan oyun/anime karakterleri (Jinx, Ahri vb.) kopyalanamaz.
> Hedef, o **kalitede** özgün karakterler üretmek.

## 1. Atlas formatı

- Tek PNG, şeffaf arka plan. Izgara düzeni: her satır bir animasyon, her
  sütun bir kare. Önerilen kare boyutu **256×256** (karakter ~200px boy,
  ayaklar karenin alt kenarına basar, yatayda ortalanır).
- Karakter **sağa bakar** (oyun sola bakışı aynalar).
- Yanına aynı isimli JSON:

```json
{
  "frameW": 256, "frameH": 256, "scale": 0.85, "anchorY": 0.97,
  "anims": {
    "idle":      { "row": 0,  "frames": 6, "fps": 8,  "loop": true },
    "walk":      { "row": 1,  "frames": 8, "fps": 12, "loop": true },
    "run":       { "row": 2,  "frames": 8, "fps": 14, "loop": true },
    "jump":      { "row": 3,  "frames": 3, "fps": 10 },
    "punch":     { "row": 4,  "frames": 6, "sync": "attack" },
    "kick":      { "row": 5,  "frames": 6, "sync": "attack" },
    "block":     { "row": 6,  "frames": 2, "fps": 8 },
    "hit":       { "row": 7,  "frames": 4, "fps": 14 },
    "staggered": { "row": 8,  "frames": 4, "fps": 8, "loop": true },
    "down":      { "row": 9,  "frames": 4, "fps": 10 },
    "ko":        { "row": 10, "frames": 4, "fps": 10 },
    "grab":      { "row": 11, "frames": 4, "fps": 12 },
    "hold":      { "row": 12, "frames": 4, "fps": 8, "loop": true },
    "held":      { "row": 13, "frames": 2, "fps": 6, "loop": true },
    "thrown":    { "row": 14, "frames": 4, "fps": 12, "loop": true },
    "specialmove":{ "row": 15, "frames": 6, "fps": 14 },
    "blazinpose":{ "row": 16, "frames": 4, "fps": 10 }
  }
}
```

- `sync: "attack"` → kareler vuruşun hazırlık/isabet/toparlanma süresine
  otomatik yayılır (frame-data ile senkron kalır; fps yazmaya gerek yok).
- Satır eksikse sorun değil: oyun en yakın akrabasını kullanır
  (`runpunch`→`punch`, `launched`→`thrown`...). **Minimum başlangıç seti:
  idle, walk, punch, kick, hit, down** — 6 satırla karakter oynanabilir.

## 2. Stil kimlikleri (üretirken karaktere yansıt)

| Stil | Siluet | Kıyafet önerisi | Vuruş dili |
|---|---|---|---|
| sokak | atletik, dengeli | bere/şapka, atlet, kot | boksör kancaları |
| kickbox | uzun bacaklı | şort, el-ayak bandajı | diz ve yüksek tekmeler |
| gures | iri, geniş omuz | güreş mayosu, kel/bıyık | dalış, suplex kavisi |
| sanat | ince, uzun | kimono + kemer, topuz | dönüş tekmeleri, açık el |
| submission | sırım gibi | uzun kollu rash guard, mohawk | pençe, alçak süpürme |

## 3. AI üretim şablonu (boyalı anime hedefi)

Karakter tutarlılığı için: önce **tek bir karakter referans sayfası** üret
(ön/yan/arka görünüm), sonra her animasyon satırını o referansı girdi
vererek üret (image-to-image / character reference özelliği olan araçlar:
Midjourney `--cref`, Stable Diffusion + IPAdapter/LoRA, Nano Banana vb.).

Örnek prompt iskeleti (kare üretimi):

```
painted anime fighting game character sprite, [STIL KIMLIGI: örn. "burly
bald wrestler in red singlet"], full body, side view facing right,
[POZ: örn. "mid hook punch, weight on front foot"], dynamic pose,
clean silhouette, dramatic rim lighting, rich painterly shading,
transparent background, single character, feet on ground line,
consistent proportions, 2D game asset
```

Pratik akış:
1. Referans sayfası → onayla.
2. Animasyon başına 4-8 anahtar kare üret (yukarıdaki satır listesi).
3. Kareleri 256×256 ızgaraya diz (ImageMagick: `montage -tile 8x -geometry
   256x256+0+0 -background none kare*.png ../assets/gures.png`).
4. JSON'u doldur, `index.html`'i aç — karakter sprite'a döner.

## 4. Kontrol listesi

- [ ] Şeffaf arka plan (beyaz değil!)
- [ ] Tüm karelerde ayak yere (kare alt kenarına) basıyor
- [ ] Karakter boyu kareler arasında sabit (±%5)
- [ ] Sağa bakıyor
- [ ] PNG + JSON isimleri stil anahtarıyla aynı
