# One-Line v150 — Profile layout & dedicated editor

Based directly on v149. Deploy the entire One-Line-main directory. No new SQL required.

- Account overview header: name, verified phone and badge; guest text below the title removed.
- Profile is a compact shortcut, matching Cart/Orders/Addresses, above the other shortcuts.
- Clicking Profile opens a separate page (#profileDetails) with editable Name, Business/Institution and Post/Role; OTP-verified phone remains read-only.
- Save persists via existing customer-account update action, then returns to overview; Cancel discards unsaved draft.
- Profile screen has browser-history and back-navigation support.
- Mobile/desktop spacing improved.
- Cache updated to v150. No changes to catalogue, prices, admin, orders or OTP backend.

After deployment, log in, open Profile, edit fields, save, reload and verify persistence.
