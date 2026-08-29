/*
 * REVIEW PACKAGES — the folder structure the site presents, per project.
 *
 * This is the hand-authored manifest used whenever a project has no live
 * Drive folder of its own — see Drive.loadPackages() in drive.js. Keyed by
 * project slug (matching a projects.js entry's `slug`) rather than one flat
 * list, since more than one project can be manifest-only at the same time —
 * a single list couldn't tell them apart. Each package is one review set —
 * a drawing issue, a rendering batch, a reference pack. Order within a
 * project's array is the order shown on the site.
 *
 * ── An item ────────────────────────────────────────────────────────────────
 *   {
 *     id:    "1AbC...",              Google Drive file ID  (use this OR src)
 *     src:   "./assets/foo.jpg",     local/absolute URL instead of Drive
 *     name:  "A1.0 — Site Plan",     display name
 *     type:  "pdf" | "image" | "video",  omitted → inferred from name/extension
 *     sheet: "A1.0",                 optional sheet number, shown as a tag
 *     note:  "Revised stair"         optional one-line description
 *   }
 *
 * ── Getting a Drive file ID ────────────────────────────────────────────────
 * Right-click the file in Drive → Share → Copy link:
 *   https://drive.google.com/file/d/1AbC...XyZ/view?usp=drivesdk
 * The ID is the part between /d/ and /view.
 *
 * ── Sharing ────────────────────────────────────────────────────────────────
 * Every file below must be shared "Anyone with the link → Viewer" or it can't
 * be embedded. Files that aren't show a "couldn't load — check sharing"
 * placeholder in the viewer rather than failing silently.
 */
window.PACKAGES = {

  /* ══════════════════════════════════════════════════════════════════════
   * clearview-deck
   * ══════════════════════════════════════════════════════════════════════ */
  "clearview-deck": [
    {
      slug: "set-1",
      title: "Review Set 1",
      issued: "",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1T2ocz3NUDHV64dBGm-X7C7AQ7aa3Nqu7", name: "Image 42", type: "image" },
        { id: "1LVjE89T7YGkTlokoYOIV6ARyGst4a73Q", name: "Image 43", type: "image" },
        { id: "1b13AtwsYNWU0PmIE5uPM-P5d61qHgcJC", name: "Image 44", type: "image" },
        { id: "1KBQ0Ptz5eRNH52jK8rrQ1pWj-wZ4yRs_", name: "Image 45", type: "image" }
      ]
    },

    {
      slug: "set-2",
      title: "Review Set 2",
      issued: "",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1_M5l8174bDU5HDsCsNExfPosTCeIUz7o", name: "Image 42", type: "image" },
        { id: "1PexKIBM96T1oTW4H0tzAvVBmoFlS1Y-w", name: "Image 43", type: "image" }
      ]
    },

    {
      slug: "set-3",
      title: "Review Set 3",
      issued: "",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1hN8ZWABhJVw4O1b89FUyiDFhMuALttGg", name: "Image 42", type: "image" }
      ]
    },

    {
      slug: "set-4",
      title: "Review Set 4",
      issued: "",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1FszemPbhqBegTYyUk1i9S8B64EXMVvF1", name: "Image 42", type: "image" },
        { id: "18wHaWWnWRIa3912DS-a1Y1OEWNGB8n5K", name: "Image 43", type: "image" },
        { id: "1iXRWBupSvdQXZdj1JR9gWd2MAHdFWbEH", name: "Image 44", type: "image" },
        { id: "1nd4D2rtX3r9roqcp1E4EuVpLqKngqBOk", name: "Image 45", type: "image" }
      ]
    },

    {
      slug: "set-5",
      title: "Review Set 5",
      issued: "",
      note: "",
      driveFolderId: "",
      items: [
        { id: "11Uxqmv6hEIvZydLekHh3OqRj2ysUaLzs", name: "Image 42", type: "image" },
        { id: "1ZWKzSzYR2bp5rqKVs8tKd6TRDQ4uCEI5", name: "Image 43", type: "image" },
        { id: "1qdz0pH1KoYUMOb6Xvvdndd7fV8kMV_Ib", name: "Image 44", type: "image" },
        { id: "10IQElsYiBFUeeLNMugyxftWzLcPQanaK", name: "Image 45", type: "image" }
      ]
    },

    // Confirmed against the real Drive folder structure (PROJECT
    // REVIEWS/CLEARVIEW DECK/20260821/V5.6): all 31 renderings — the AI pass
    // and the non-AI pass of the same 14 shots — live in one folder, so they're
    // one review set here too, named for that folder. Each shot appears twice,
    // non-AI then its AI pass, back to back.
    {
      slug: "v5-6",
      title: "V5.6",
      issued: "2026-08-21",
      note: "Shots 01–14, each with a non-AI and an AI-rendered pass.",
      driveFolderId: "",
      items: [
        { id: "1jj-pjf8C6ym4nhKPGDKdeKakBCSMMMtn", name: "Rendering 01", type: "image" },
        { id: "18c3KRYaJA46Ag4NiU3JahiRC01LSQvCq", name: "AI Rendering 01", type: "image" },
        { id: "1AJIj19lDEEMkyp801455gCdsf7nn9Fyt", name: "Rendering 02", type: "image" },
        { id: "1Fcx8a_uAD4Yn4JOJC3e68zP7pw0bS3Vs", name: "AI Rendering 02", type: "image" },
        { id: "1dH66XLYEt3B3Y_qYcyL33wNevC4ZEcSg", name: "Rendering 02.2", type: "image" },
        { id: "1L8e8uK4qESYyVA62RU0ACo-vngQiJqJJ", name: "AI Rendering 02.2", type: "image" },
        { id: "1rRIL9NdCDjdUQrkiVX3HfIskNHu191-0", name: "Rendering 03", type: "image" },
        { id: "12aftwj2tNqwniuFMiDcBPerbq0idZrWG", name: "Rendering 04", type: "image" },
        { id: "1ga7T3-iw7CHdcly_WAvrz9P0jd_QycoE", name: "AI Rendering 04", type: "image" },
        { id: "1TpgKtgzYA0MnuCt-CDTqP9fgDup_b248", name: "Rendering 04.2", type: "image" },
        { id: "1S7zcaQA-lOk6NFwT0--yUHnFS7jpvLIS", name: "AI Rendering 04.2", type: "image" },
        { id: "1jM_qPUFMn6I_ipgRFMmqBxe7pEAVSj2e", name: "Rendering 04.4", type: "image" },
        { id: "1UGZ-KCLSz_Zp96YD4BtAAW6Or-qYZ4jv", name: "AI Rendering 04.4", type: "image" },
        { id: "1MMpvoMnNXN6jYiSAbTNMzsGFH6sHwkRi", name: "Rendering 05", type: "image" },
        { id: "1B1oFPr0qgRgvapLSm9d963LGPhqge5wj", name: "AI Rendering 05", type: "image" },
        { id: "1lWwjoXwaWQWBWZGn44rN9t8ShWWHX-Y-", name: "Rendering 06", type: "image" },
        { id: "1JTWPFu0eU7i18sGrkeW5Gaar6KF8BdRe", name: "AI Rendering 06", type: "image" },
        { id: "1ST0U_hM0bEKMY94VfYHDDpyoNhq7Ml76", name: "Rendering 07", type: "image" },
        { id: "1W652wYDeDE0TQaTkLaZlTTD-koF-Y3Ku", name: "AI Rendering 07", type: "image" },
        { id: "1usvgaBm2sWaA6aJC_17OyzLFZocbDtHG", name: "Rendering 07.2", type: "image" },
        { id: "1AzMjJlIYKqXQRSRbaTj-8keE_5KZveCg", name: "Rendering 08", type: "image" },
        { id: "1JbBbJAoC-61Z6Useq8-sK1daD6eCybIU", name: "AI Rendering 08", type: "image" },
        { id: "1Zu09jT9T6ujrOQrooA0E_Sj1JeMl7p1l", name: "Rendering 09", type: "image" },
        { id: "1v-zyIn4eCpCkObrRYA7mutUVGJY6Cpp6", name: "AI Rendering 09", type: "image" },
        { id: "1ubAbHABInLHZMbthI_0hKwg1iSTdFJbT", name: "Rendering 10", type: "image" },
        { id: "19Mu6uZde8TofeZOU2GOZPfYrSIJZsiaI", name: "AI Rendering 10", type: "image" },
        { id: "1usgCozzZ3hIcANvEMMBPeyrsilLT3cI1", name: "Rendering 11", type: "image" },
        { id: "1UM-nwoLeAno8-TwrnucJ46s8oVg7jcqS", name: "Rendering 13", type: "image" },
        { id: "1CyI4qmtNLGQwFPg6HRA28FjU5aio66cR", name: "AI Rendering 13", type: "image" },
        { id: "1Jb78X7GGgh9ZtS7PuESBqinDqDhU5Kzq", name: "Rendering 14", type: "image" },
        { id: "1q6PFJcvi5T-uPmhgw5ZB2KaDqKUDcNuJ", name: "AI Rendering 14", type: "image" }
      ]
    },

    // Real folder: PROJECT REVIEWS/CLEARVIEW DECK/20260821/V5.6/VIDEO —
    // confirms these belong to Clearview Deck. `type: "video"` opens in the
    // same embedded viewer PDFs use — Drive's file preview plays video
    // natively there.
    {
      slug: "videos",
      title: "Videos",
      issued: "2026-08-21",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1zY0sjYSWF9mbO96UEX4y_7hSIddWXP9n", name: "Sequence 1", type: "video" },
        { id: "1sKCOANTFtoCcXvK9Ypl1Nn8zJL2quGqa", name: "Video 1", type: "video" },
        { id: "1OziikUCIZ4ynSpGED7PGlboqI9GAyVNX", name: "Video 2", type: "video" },
        { id: "1cjiTTyKSMe6QDsXPTz78le-WqmTAyYln", name: "Video 3", type: "video" },
        { id: "141djZgp8cR_7dqKjS86g4HK1ZmMFHQU0", name: "Video 4", type: "video" },
        { id: "1LKK4M9rm3DamWCZGY0cm_6JtwwGmLeEp", name: "Video 5", type: "video" },
        { id: "1z2UR9VWJWzlerJfRy4TZZ5kTTluoK4pV", name: "Video 6", type: "video" },
        { id: "1qtUaWzZgS0a6vxaeU46ZyE78nT3HWHH0", name: "Video 7", type: "video" }
      ]
    }
  ],

  /* ══════════════════════════════════════════════════════════════════════
   * la-costa — review sets below match the real Drive folder structure
   * (PROJECT REVIEWS/LA COSTA/20260826/V26, V26.b, V26.c, V28.1, V28.1.B) —
   * the same version-tag convention /clearview-deck's own version folders
   * use. See the matching entry in projects.js for this project's own
   * metadata.
   * ══════════════════════════════════════════════════════════════════════ */
  "la-costa": [
    {
      slug: "v26",
      title: "V26",
      issued: "2026-08-26",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1EGCsC6HqftAsbbgc8iJmT1eY-uiCI851", name: "V26 – 01", type: "image" },
        { id: "10GuBZ1D2Ani0VeE4VaPECkH9LLFVrYVb", name: "V26 – 02", type: "image" },
        { id: "1XGs7mNe-RUMZ1lRT41Pwv781mGqlH_cL", name: "V26 – 03", type: "image" },
        { id: "1_mlEWioSPz8visKEy7zW2M7abCsrvlMq", name: "V26 – 04", type: "image" }
      ]
    },

    {
      slug: "v26-b",
      title: "V26.b",
      issued: "2026-08-26",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1iOl_cNIugzl8kcR0w_KsluoG4xpXc6AA", name: "V26.b – 01", type: "image" },
        { id: "18VjVyFmPRqZ4Z8ESyvIKDUWryqNoE0RX", name: "V26.b – 02", type: "image" }
      ]
    },

    {
      slug: "v26-c",
      title: "V26.c",
      issued: "2026-08-26",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1bgJqSUsZSQAvQCKClNd6Yb3veu4qJ2HD", name: "V26.c – 01", type: "image" }
      ]
    },

    {
      slug: "v28-1",
      title: "V28.1",
      issued: "2026-08-26",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1dbUz_-4GWbmtqFwdIbtZFXQNOppxeQJJ", name: "V28.1 – 01", type: "image" },
        { id: "1WBrI6JUY4-R_dk18w2KDFSYQWIwO1FqB", name: "V28.1 – 02", type: "image" },
        { id: "1Z21dpZQnwrqhhEOEepwgVv_8ayHQm4y9", name: "V28.1 – 03", type: "image" },
        { id: "1Hd6vYKVy5As6URLZtyZtWZgEjy50zb32", name: "V28.1 – 04", type: "image" }
      ]
    },

    {
      slug: "v28-1-b",
      title: "V28.1.B",
      issued: "2026-08-26",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1ieehCLN4GQbd2NUg9__6JrcQf3Z31oJw", name: "V28.1.B – 01", type: "image" },
        { id: "1UP6g78ypDMZ5mK7miTAniS-LkR57QgdL", name: "V28.1.B – 02", type: "image" },
        { id: "1MTiZa5h6dV_gY0lZDTOovKy_ErfrB6_e", name: "V28.1.B – 03", type: "image" },
        { id: "1QzIn6P8HWSovF6yrKia6R6KjwsxN2MZv", name: "V28.1.B – 04", type: "image" }
      ]
    },

    // ── Bungalow A — a subfolder of LA COSTA with its own run of dated review
    // sets (PROJECT REVIEWS/LA COSTA/BUNGALOW A/...). How these nest under
    // "Bungalow A" (and, for the 20260416 set, its own ARCHIVE subfolder) is
    // described in folder-tree.js, not here — this array only ever holds flat
    // leaf sets, one per Drive folder, same as every set above.
    {
      slug: "ba-20260331",
      title: "20260331 — Bungalow A",
      issued: "2026-03-31",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1dG9mOjFCaCvBLZozowzecFisQ8BEq2Fs", name: "Image 01", type: "image" },
        { id: "1e5qrmq0KtOB_bI1Fkj4HNS_op2GyMD7P", name: "Image 02", type: "image" },
        { id: "1zGzUlMD0HW84QJZ4f7FLVZpeZkH5-S6I", name: "Image 03", type: "image" },
        { id: "1pVg-F9FWjVYj2bBeEMPCxCbxLbCD4X7B", name: "Image 04", type: "image" },
        { id: "1JIq7-aXgCM82cp8hYwTt-ehG8vFBy5Aw", name: "Image 05", type: "image" },
        { id: "1FvERppwwoH9_4sQQma1MkhCNmOfwRmmB", name: "Image 06", type: "image" },
        { id: "1xUEWBQBWIqfb6R13NWZN0FuE1mf8YpiB", name: "Image 07", type: "image" },
        { id: "1MilgNrEej78qszeBtZ3n6J_7mrMynpUl", name: "Image 08", type: "image" },
        { id: "1VX7seWESdCMAEHO91jK4wpbNqN3j3uqn", name: "Image 09", type: "image" },
        { id: "1w3ja8zQNITymYaatHlQOfh3NoR8ijX_8", name: "Image 10", type: "image" },
        { id: "1EKZE3ah2a8HzfSToY21o-qjAG61-O51I", name: "Image 11", type: "image" },
        { id: "1kJuDsTPvm1SiH-dcLIeYpRWcBsyI8dfd", name: "Image 12", type: "image" },
        { id: "1PTcMV3PAVr3E0yytP1MyxVUuGTYTjkp1", name: "Image 13", type: "image" },
        { id: "1C8V2U9v8drXpp6S_kowRmwCVAhcNbn6q", name: "Image 14", type: "image" },
        { id: "1vYLnwpNRp0rVUxmGnDxrhDyhazWtjI96", name: "Image 15", type: "image" }
      ]
    },

    {
      slug: "ba-20260416-ai",
      title: "20260416 — Bungalow A (AI)",
      issued: "2026-04-16",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1H7eKAS4g55yLTQL4q7syNRWUrpwQ5s05", name: "Bunks 1", type: "image" },
        { id: "117ClkuV8JIPuHFBbU6y1iVl4pbetPNoT", name: "Bunks 2", type: "image" },
        { id: "1K3S08aosv0IDWuX6qhLGyEIdVIljKDoV", name: "Dble Queen 3", type: "image" },
        { id: "1ydHrivG7GrmpT3GUdozIKZW5EzUGe7At", name: "Dble Queen 4", type: "image" },
        { id: "1oYful4FtdYrLUx4rw77pb3r0vqipvLhb", name: "Dining Bench 1", type: "image" },
        { id: "1kKYOD8cQA1KsNzBJvfOIJzn2ExoCnexJ", name: "Dining Bench 2", type: "image" },
        { id: "16KZ4aOXgzre-CwGZ9I_FTZQSe9qxxEWk", name: "King Bed 1", type: "image" },
        { id: "1iKJQILeZFk4ByNC9sJsLYBz8LlP6qkzB", name: "King Bed 2", type: "image" },
        { id: "1ivL0EFqwB2zjUPtCWRt6-MKwGc_OeBpG", name: "Living Rm 1", type: "image" },
        { id: "1ow3nCH35P5-uhluse_W3gtR17XaBY8Qn", name: "Living Rm 2", type: "image" },
        { id: "1i4UJiKZ1n4MWjowlS_FMfBYKQ_Nc5OXh", name: "Primary Bath 1", type: "image" },
        { id: "1SU25VNKi9cL-tIH7URCe3snI-d7E8ZR-", name: "Primary Bath 2", type: "image" },
        { id: "1SQw095DwMzHc64CVNDDVlGIDSZGbtBCd", name: "Primary Queen Bed 1", type: "image" }
      ]
    },

    // Nested one level deeper than every other set here — see
    // BUNGALOW A/20260416-BUNGALOW A-AI/ARCHIVE in the real folder tree.
    {
      slug: "ba-20260416-ai-archive",
      title: "Archive",
      issued: "2026-04-16",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1iHNwaCv3qeY3QYGZLfW13rzKGYc8Dm95", name: "Dble Queen 1", type: "image" },
        { id: "1cgl7-DAfhVFbaMxcPr2DZXMEP2m3Jx7N", name: "Dble Queen 2", type: "image" },
        { id: "13-B8hr9TJZ558EOEqx9F2DAXKwTIA_d5", name: "Dble Queen 5", type: "image" }
      ]
    },

    {
      slug: "ba-20260526-ai",
      title: "20260526 — Bungalow A (AI)",
      issued: "2026-05-26",
      note: "",
      driveFolderId: "",
      items: [
        { id: "10hj-IGBd9BVNucxdzhJNUKc2UFyF_WWW", name: "Exterior 1", type: "image" },
        { id: "1TFHOBtH57s4ku-7GYUksarNgTjsmjqK6", name: "Exterior 2", type: "image" },
        { id: "1fEnVAkD3DxfV1lye8SlPRG4g4uivstZv", name: "Exterior 3", type: "image" }
      ]
    },

    {
      slug: "ba-20260708-decks",
      title: "20260708 — Decks",
      issued: "2026-07-08",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1gCGdcg9ks7h1brGXREtcN3QwBPKkZkR_", name: "V20 – 01", type: "video" },
        { id: "1HDxRQJAdO6nC6PUwN8wbgsKdaDg3hchV", name: "V20 – 02", type: "image" }
      ]
    },

    {
      slug: "ba-20260824",
      title: "20260824 — Bungalow A",
      issued: "2026-08-24",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1q1UGiKkOKAnz15i8Ni-Yl_SwgBYtnJjN", name: "V24 – 01", type: "image" },
        { id: "1iU6L1JimEokziC26PkBtvCqjMk2t8wW4", name: "V24 – 02", type: "image" },
        { id: "1LNphh3EiZhyUCbfpmiMQghsQHEEnxJQK", name: "V25 – 01", type: "image" },
        { id: "1EBWd22e7pzIreasd_AZO6naA2WRdxxRP", name: "V25 – 02", type: "image" },
        { id: "1_1cUWPVHi8Pk7kcW2C8e-D4fKUDQithc", name: "V25b – 01", type: "image" },
        { id: "1MrZ9q3NCrqFCfNWEJPFiNNJZ2S1ljCa1", name: "V25b – 02", type: "image" }
      ]
    },

    // Nested one level deeper — BUNGALOW A/20260825-BUNGALOW A/V26.
    {
      slug: "ba-20260825-v26",
      title: "V26",
      issued: "2026-08-25",
      note: "",
      driveFolderId: "",
      items: [
        { id: "1ghZmggURBtCnofknflvUZ5ySX9i20bs9", name: "V26 – 01", type: "image" },
        { id: "1cCtygWiR7Ugf-nCJuvDig6ud2hhw4ZOP", name: "V26 – 02", type: "image" },
        { id: "1kXfm69VDrxBuvScccu592E-3bljqyVrf", name: "V26 – 03", type: "image" },
        { id: "1OzoO71l9eCDu-5yo4wKCLJ7YWiivQ9M5", name: "V26 – 04", type: "image" }
      ]
    }
  ]

};
