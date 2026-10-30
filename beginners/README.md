# Beginner Hindi stories

Open `index.html` to browse the 20 stories. Every story is a separate static HTML file. The main library index links here through **Beginners**.

`beginners.css` and `beginners.js` provide the shared beginner layout, reading toggles, and sentence audio. All 176 sentences have local MP3 recordings in `audio/`, generated with Microsoft Swara neural Hindi speech at a slightly slower pace. This is humanlike synthesized speech, not recordings by a human narrator. Service-supplied word boundaries are embedded in each page; highlighting follows the audio playback clock. No remote speech requests, speech library download, or installed system voice are required during playback. The old metallic eSpeak voice is no longer used by beginner pages.

`vocabulary.txt` contains reviewed word forms, pronunciation aids, and contextual meanings. `stories.json` records the sentence-level Hindi, romanization, English, and output filenames. Hindi is retained verbatim from the supplied collection, including titles and morals. A few romanization typos and the English wording “sat the monkey” have been corrected.

Regenerate the HTML and JSON with:

```powershell
node premchand_library/beginners/build.cjs
```

An alternative source path can be passed as the first argument. The default source is `C:/Users/srama/OneDrive/sankar/languages/hindi/absolute_beginner/short_stories.txt`.

Run browser verification with:

```powershell
node premchand_library/beginners/verify.cjs
```

The check uses the local bundled Playwright and Microsoft Edge. It verifies all story pages, exact Hindi preservation, local links, vocabulary columns, toggles, all 176 playable audio files and highlighted word order for a sample sentence, playback switching and stopping, mobile overflow, main navigation order, and an existing Premchand story. Desktop and mobile screenshots are saved beside this file. Audio quality has not been assessed by human listening.

Changes are local; no hosted deployment was requested or performed.

## Pictures and narration

Each story has an original watercolor illustration in `images/`, also used on its index card. `illustrations.json` records image filenames and descriptive alternative text. `image-prompts.json` records the prompts used with the built-in image generation tool. The images are AI generated.

To regenerate natural speech, install `edge-tts` into `premchand_work/tts_dependencies`, then run `generate_audio.py` with the bundled Python runtime. This generation step sends the supplied story sentences to the Microsoft Edge speech service; playback uses the saved local files. Existing complete recordings are reused. Run `build.cjs` after regenerating recordings to embed the word timings.

To replace artwork, generate the corresponding prompt from `image-prompts.json`, update its original path in `image-sources.json`, and run `prepare_images.py`. This creates optimized JPEG assets and `illustrations-contact-sheet.jpg` for visual review. Source PNGs are retained. The website itself needs only the saved JPEG files, not the original paths or generation scripts.

## Reading controls and floating reference

Visible content has a solid green toggle with a check mark. Hidden content has a pale dashed toggle with a plus sign. All toggles remain clickable. Hiding Original Hindi switches sentence blocks to one full-width column so pronunciation and English cannot fall into the narrow audio-button column.

Each story includes a floating Devanagari reference assembled by `script-reference.cjs` from the existing `hindi-basics.html` charts and local character audio. It contains vowels, vowel signs, consonants, additional sounds, and compound characters. The panel appears automatically when the story sentences reach the top reading area, and disappears over the introductory picture or after the vocabulary table. Its Hide/Show chart button preserves the reader's collapse choice while scrolling. Vowels, consonants, and additional sounds start expanded; compound characters start collapsed and can be expanded by clicking their heading. Desktop story sentences reserve a right-hand column, while vocabulary tables use the full page width. The complete panel uses a dense ten-column grid and scales to fit the viewport height, with no internal scrollbar; it stays at the upper right on smaller screens. Character and sentence audio share one playback controller to avoid overlap.

Verification includes the hidden-Hindi width regression at desktop and mobile sizes, visible/hidden button styling, automatic panel visibility, persistent manual collapse, character audio playback, and sentence/character switching.

The main-story editions use the same green/check-mark and pale/dashed/plus-sign visibility states as beginner pages. `premchand_work/consistent_button_style.cjs` applies the shared styling to source and library editions without changing their story content.

## Vocabulary audio

Every vocabulary row has a compact word playback button and a context playback button. Word buttons seek to the word's service-provided start time in its existing natural Hindi sentence recording and stop at its end time. Context buttons play the whole recording and highlight words directly within that row's Context cell. These controls share the sentence/character playback controller, so only one sound plays at a time. Clicking the active button stops playback; hiding the words table stops its audio and clears highlights. Hiding Original Hindi leaves the vocabulary controls usable.

Run `node premchand_library/beginners/verify_table_audio.cjs` to verify all 842 rows and 1,684 table buttons, sample word clip boundaries, context highlight order, playback switching/stopping, and mobile overflow.

The floating reference overlaps the full-width vocabulary table when visible. Collapse the chart to reveal the columns underneath it. Desktop table columns wrap to fit the page; smaller screens retain horizontal table scrolling.

## Selected Hindi playback

Selecting Hindi words or phrases in the story sentences or vocabulary Word/Context cells displays a compact Listen button next to the selection. It plays the matching natural-voice recording segments and highlights only the selected words. Selections spanning multiple sentences play their selected segments in order. Clicking Stop or pressing Escape ends playback; starting another audio control replaces selection playback. English selections do not display the player. The implementation is shared by all beginner pages in `beginners.js`.

Run `node premchand_library/beginners/verify_selection_audio.cjs` for selection playback, highlights, switching, multi-line selections, and mobile placement checks.
