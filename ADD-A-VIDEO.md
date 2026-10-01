<div dir="rtl" lang="ar">

# إزاي تضيف فيديو جديد للموقع

الموقع بيتبني لوحده من فولدر اسمه `work`. أي فيديو ترفعه هناك، ومعاه ملف صغير فيه عنوانه ووصفه، بيظهر في الموقع بعد ٣ لـ ٥ دقايق، وبيبقى ليه لينك خاص تقدر تبعته على واتساب أو إنستجرام.

مش محتاج تبرمج ولا تسطّب أي حاجة. كل ده بيتعمل من موقع github.com.

---

## ١. صدّر الفيديو

- الصيغة: **MP4 (H.264)**، بمقاس الفيديو الحقيقي: طولي ٩:١٦، ٤:٥، مربع أو عرضي. الموقع بيعرض كل فيديو بشكله، فمتحطّش حواف سودا ولا خلفية مموّهة عشان تكمّل مقاس تاني.
- الموقع بيضغط الفيديو تاني عشان يشتغل بسرعة على الموبايل، فمش محتاج تصدّر بجودة عالية جداً.
- لو هترفع من المتصفح، **حجم الملف لازم يكون أقل من ٢٥ ميجا**. استخدم الجدول ده في Premiere (Target Bitrate):

| مدة الفيديو | أقصى Bitrate عشان يفضل تحت ٢٥ ميجا |
|---|---|
| ٣٠ ثانية | 6 Mbps |
| دقيقة | 3 Mbps |
| دقيقة ونص | 1.8 Mbps |
| دقيقتين | 1.3 Mbps |

- الفيديوهات الأطول أو الأتقل من ٢٥ ميجا ارفعها من برنامج **GitHub Desktop** (بيقبل لحد ١٠٠ ميجا). الشرح تحت في «الفيديوهات الكبيرة».
- لو صوّرت HDR على الآيفون، صدّر الفيديو **SDR (Rec. 709)** عشان الألوان تطلع مظبوطة.

## ٢. اختار اسم للفيديو

الاسم ده هو اللينك. استخدم **حروف إنجليزي صغيرة وأرقام وشَرطة (-)** بس، من غير مسافات:

```
cafe-opening-2026.mp4
```

اللينك هيبقى:

```
…/work/cafe-opening-2026/
```

## ٣. ارفع الفيديو

1. افتح المستودع (repository) على github.com، وادخل فولدر **work**.
2. دوس **Add file** ← **Upload files**.
3. اسحب الفيديو جوه الصفحة.
4. تحت خالص دوس **Commit changes**.

## ٤. اكتب ملف المعلومات

1. في نفس الفولدر **work** دوس **Add file** ← **Create new file**.
2. سمّي الملف **بنفس اسم الفيديو بالظبط** بس آخره `.yml`، زي كده: `cafe-opening-2026.yml`
3. افتح الملف `_template.yml` اللي في نفس الفولدر، انسخ اللي فيه، والزقه في الملف الجديد.
4. غيّر النصوص. أهم سطر هو `title`:

```yaml
title: "افتتاح كافيه في الشيخ زايد"
title_en: "Café opening in Sheikh Zayed"
description: "تغطية يوم الافتتاح: التجهيزات، أول الزباين، وكلمة صاحب المكان."
description_en: "Opening-day coverage: the set-up, the first guests and a word from the owner."
type: event
client: "اسم الكافيه"
```

5. دوس **Commit changes**.

> **مهم:** خلّي كل نص جوه علامتين تنصيص `" "`، خصوصاً لو فيه علامة `:`.
> النوع `type` واحد من دول: `reel` (ريلز)، `event` (فعالية)، `brand` (براند أو إعلان)، `film` (سينمائي).

## ٥. استنى لحد ما يتنشر

1. افتح تبويب **Actions** فوق في المستودع.
2. هتلاقي تشغيل اسمه **Deploy site**:
   - 🟡 أصفر يعني شغّال (أول مرة لفيديو جديد بتاخد من ٣ لـ ٥ دقايق).
   - ✅ أخضر يعني اتنشر.
   - ❌ أحمر يعني في مشكلة. افتحه، وهتلاقي رسالة بالعربي والإنجليزي بتقولك إيه الغلط في أنهي ملف. صلّحه ودوس Commit تاني.
3. الموقع ممكن ياخد لحد ١٠ دقايق زيادة لحد ما يظهر التحديث عند الناس.

## ٦. ابعت اللينك

- بالعربي: `https://…/ar/work/cafe-opening-2026/`
- بالإنجليزي: `https://…/work/cafe-opening-2026/`

صورة المعاينة في الشات بتطلع بلغة اللينك: لينك `/ar/` بالعربي، والتاني بالإنجليزي.

في صفحة الفيديو في زرار **شارك الفيديو** بيفتح واتساب والتطبيقات التانية على طول.
واتساب بيحفظ شكل اللينك أول مرة يتبعت، فلو غيّرت الصورة بعدها، ممكن الشات القديم يفضل يعرض الشكل القديم.

---

## حاجات تانية ممكن تحتاجها

| عايز تعمل إيه | إزاي |
|---|---|
| تغيّر صورة الغلاف | في ملف الـ yml زوّد `cover: "0:12"` (الثانية اللي عاجباك) |
| تغيّر ترتيب الفيديوهات | زوّد `order: 1` (الرقم الأصغر بيظهر الأول). الفيديو الجديد من غير رقم بيظهر فوق خالص |
| تخبّي فيديو من غير ما تمسحه | زوّد `hidden: yes` |
| تغيّر الفيديو نفسه | ارفع الفيديو الجديد **بنفس الاسم**، واللينك هيفضل زي ما هو |
| تمسح فيديو | امسح الفيديو وملف الـ yml بتاعه (افتح الملف ← ⋯ ← Delete file) |
| تكتب إنت عملت إيه | زوّد `role: "تصوير ومونتاج"` و `role_en: "Shot and edited"` |

## الفيديوهات الكبيرة (أكتر من ٢٥ ميجا)

1. نزّل برنامج **GitHub Desktop** وسجّل دخول بحسابك.
2. من **File ← Clone repository** اختار المستودع.
3. انسخ الفيديو وملف الـ yml جوه فولدر **work** على الكمبيوتر.
4. في البرنامج اكتب وصف صغير ودوس **Commit to main** وبعدين **Push origin**.

الحد الأقصى هنا ١٠٠ ميجا للملف.

## لو حاجة مش شغالة

| اللي حصل | الحل |
|---|---|
| رسالة «السطر ده مكتوب بشكل غلط» | حط النص جوه `" "` واتأكد إن كل معلومة في سطر لوحدها |
| رسالة «مفيش فيديو للملف ده» | اسم ملف الـ yml لازم يكون نفس اسم الفيديو بالظبط |
| رسالة «قيمة type لازم تكون…» | استخدم `reel` أو `event` أو `brand` أو `film` |
| رسالة «مش قادر أقرا … كفيديو» | الملف بايظ أو صيغته غريبة. صدّره تاني MP4 (H.264) |
| الفيديو ظهر بعنوان إنجليزي من اسم الملف | نسيت ملف الـ yml، اعمله وهيتصلّح |
| مش قادر ترفع الملف | لو أكبر من ٢٥ ميجا استخدم GitHub Desktop. ولو المشكلة صلاحيات، اتأكد إن حسابك عنده صلاحية الكتابة على المستودع |

</div>

---

# Adding a new video (English)

The site builds itself from the `work` folder. Upload a video there with a small text file holding its
title and description, and within 3–5 minutes it is on the site with its own link to send on WhatsApp
or Instagram. Everything happens on github.com; nothing to install.

## 1. Export the video

- **MP4 (H.264)**, at the video's own shape (square, vertical or wide).
- The site re-compresses every video for phones, so a very high export bitrate is not needed.
- Uploading in the browser allows **files up to 25 MB**. Target bitrates that stay under it:

| Length | Highest bitrate for < 25 MB |
|---|---|
| 30 s | 6 Mbps |
| 1 min | 3 Mbps |
| 1 min 30 s | 1.8 Mbps |
| 2 min | 1.3 Mbps |

- Longer or heavier files go through **GitHub Desktop** (up to 100 MB); see "Big videos" below.
- iPhone HDR footage: export as **SDR (Rec. 709)** so colours look right.

## 2. Pick a name

The name becomes the link. Use **lowercase English letters, numbers and dashes** only, e.g.
`cafe-opening-2026.mp4` → `…/work/cafe-opening-2026/`.

## 3. Upload the video

In the repository on github.com, open **work** → **Add file** → **Upload files**, drop the video in,
then **Commit changes**.

## 4. Write the info file

In **work**: **Add file** → **Create new file**, name it exactly like the video but ending in `.yml`
(`cafe-opening-2026.yml`), paste the contents of `_template.yml`, edit the text, **Commit changes**.
Keep every text inside `"double quotes"`. `type` is one of `reel`, `event`, `brand`, `film`.

## 5. Wait for it to publish

Open the **Actions** tab and watch **Deploy site**: yellow is running, green is published, red means a
problem — open it for a message in Arabic and English naming the file and the fix. Visitors may see
the change up to 10 minutes later because of caching.

## 6. Send the link

`https://…/ar/work/<name>/` (Arabic) or `https://…/work/<name>/` (English); the preview picture in
the chat comes in the link's language. The **Share this video**
button on the page opens WhatsApp and other apps directly. WhatsApp remembers a link's preview the first
time it is sent, so an older chat may keep showing the old picture.

## More

| To… | Do this |
|---|---|
| Change the cover picture | Add `cover: "0:12"` (the second you like) |
| Reorder videos | Add `order: 1` — lower shows first; a new video without a number goes to the top |
| Hide without deleting | Add `hidden: yes` |
| Replace a video | Upload the new file with **the same name**; the link stays the same |
| Delete a video | Delete the video and its `.yml` (open the file → ⋯ → Delete file) |
| Say what you did | Add `role: "تصوير ومونتاج"` and `role_en: "Shot and edited"` |

**Big videos (over 25 MB):** install GitHub Desktop, clone the repository, copy the video and its `.yml`
into `work`, then **Commit to main** and **Push origin** (100 MB per file at most).
