# Translation review

Hindi, Bengali, Marathi and Telugu cover every string in the app. They have not yet been checked by native speakers, and they should be before anyone relies on them.

## How to review

1. Run `npm run i18n:sheet`. It writes `docs/translations.csv` with one row per string: the key, English, then each language side by side.
2. Open it in a spreadsheet. Text that takes a value shows it as `{name}`, for example `{n}` for a number or `{dept}` for a department.
3. Mark anything that reads stiffly, is wrong, or is too long for its place. Tab labels (`tabs.*`) must stay short, about 8 characters.
4. Send the corrections back as edits to `src/i18n/hi.ts`, `bn.ts`, `mr.ts` or `te.ts`. Every key must stay present in every language; `npx tsc` fails if one is missing.

## Look at these first

- **Short labels in context:** `appearance`, `simulate`, `relations.*`, the keypad's `deleteDigit`.
- **Gender and number:** Marathi `itsMe` and `notMe` use the masculine form; Hindi `readyLinked` changes its verb with the count.
- **Word order with values:** `stepOf`, `needYou`, `lastUpdated`, `workingDay`. Several languages reorder these.
- **Names in two scripts:** UIDAI, DigiLocker, Aadhaar Seva Kendra and Jeevan Pramaan appear in Latin script in some places and in the local script in others. Pick one per language.
- **The app's name:** Bengali writes it as আসান in newer strings and Aasaan in older ones.

## Style for every language

- Plain, everyday words people use in apps; common loanwords such as OTP, SIM, PIN and PF are fine.
- Sentence case, buttons as verb and object, no em dashes, no exclamation marks.
- Digits stay 0 to 9 with Indian grouping (₹6,38,720), as banking and UPI apps print them.
- Department records (offences, passbook months, request steps) stay in English, as the departments send them.
