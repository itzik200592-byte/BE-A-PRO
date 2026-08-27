# פריסה, BE A PRO

**אתר חי (MVP לבדיקה):** https://itzik200592-byte.github.io/BE-A-PRO/
**קוד כניסה:** 100
**Repo:** https://github.com/itzik200592-byte/BE-A-PRO (ציבורי)

## איך זה עובד
- GitHub Pages, נבנה אוטומטית ב-GitHub Actions מהקובץ `.github/workflows/deploy.yml`.
- Vite `base` מוגדר ל-`/BE-A-PRO/` בבנייה (ב-`vite.config.ts`), כי Pages מגיש תחת תת-נתיב.
  כל נתיבי התמונות עוברים דרך `src/ui/asset.ts` (`asset()`), שמוסיף את ה-base, אז הם עובדים
  גם בשרת מקומי (root) וגם ב-Pages (subpath). **אם מוסיפים תמונה חדשה מ-`public/`, להשתמש ב-`asset('/...')`.**
- שער כניסה רך: `src/ui/screens/Gate.tsx`, קוד `100`, נשמר ב-localStorage `beapro.gate`.

## לעדכן את האתר (אחרי שינויים בקוד)
```
git add -A && git commit -m "..." && git push
```
ה-workflow ירוץ לבד ותוך ~2 דקות האתר מתעדכן באותה כתובת. לעקוב: `gh run watch`.

## הערה חד פעמית שכבר בוצעה
GitHub לא נתן ל-workflow להפעיל את Pages לבד בפעם הראשונה. הופעל ידנית עם:
`gh api repos/itzik200592-byte/BE-A-PRO/pages -X POST -f build_type=workflow`
זה כבר נעשה, לא צריך לחזור על זה.
