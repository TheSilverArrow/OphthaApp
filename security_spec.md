# Security Specification & Red Team Audit Plan

## 1. Data Invariants
1. **Creator-Only Read/List/Update/Delete**: Only the verified app creator (`request.auth.token.email == 'gioalfer@gmail.com' && request.auth.token.email_verified == true`) or a pre-registered admin UID in `/admins/{uid}` may read, list, update, or delete `/feedback/{feedbackId}` documents.
2. **Strict Creation Schema**: Any submission to `/feedback/{feedbackId}` MUST pass `isValidId(feedbackId)` and `isValidFeedback(incoming())`, enforcing required keys (`category`, `message`, `status`, `createdAt`), allowed keys (`category`, `message`, `senderName`, `status`, `createdAt`), strict string size bounds (`message`: 3–1000 chars, optional `senderName`: 0–80 chars), valid `category` allowlist, initial `status == 'new'`, and server timestamp `createdAt == request.time`.
3. **Immutable Metadata on Update**: Creator updates may only modify `status` (`affectedKeys().hasOnly(['status'])`), keeping `category`, `message`, `senderName`, and `createdAt` immutable.
4. **Default Deny**: All unspecified paths and `/admins/{adminId}` deny all client reads and writes.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Be Denied)
1. **Unauthenticated List Scrape**: Non-admin executes `list` on `/feedback`.
2. **Unauthenticated Get Read**: Non-admin executes `get` on `/feedback/fb_123`.
3. **Authenticated Non-Creator Read**: Signed-in user with `other@example.com` tries to `get` or `list` `/feedback`.
4. **Email Spoofing Attack**: Token claims `email: "gioalfer@gmail.com"` with `email_verified: false` tries to `list` `/feedback`.
5. **Shadow / Ghost Field Injection**: `create` includes `{ category: "suggestion", message: "Great app", status: "new", createdAt: serverTimestamp, isAdmin: true }`.
6. **Status Pre-Spoofing on Create**: `create` attempts `status: "done"` instead of `"new"`.
7. **Timestamp Forgery on Create**: `create` provides a client-fabricated timestamp instead of `request.time`.
8. **Resource Exhaustion (Oversized Message)**: `create` sends `message` > 1000 characters.
9. **Resource Exhaustion (Oversized Sender Name)**: `create` sends `senderName` > 80 characters.
10. **ID Poisoning Attack**: `create` targets a document ID containing invalid characters or > 128 characters.
11. **Value Poisoning on Update**: Creator tries to update `status` to `"invalid_status"` or non-string type.
12. **Immutable Field Tampering / Non-Creator Delete**: Non-creator attempts `delete` or creator attempts updating `message` or `createdAt`.
