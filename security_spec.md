# Security Specification - Waseet Plus

## Data Invariants
1. Ads must belong to a user.
2. Comments must belong to an ad.
3. Messages must be part of a chat room.
4. Orders must involve a buyer and a seller.
5. Users can only read their own notifications.
6. Only admins can see reports.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempting to create an ad with someone else's `userId`.
2. **Privilege Escalation**: A user trying to set their own `role` to 'ADMIN'.
3. **PWS (PII) Leak**: An unauthenticated user attempting to read another user's profile which contains a phone number.
4. **Out-of-Order State**: Manually setting an order status to 'COMPLETED' without going through intermediate steps (if logic enforced, but here we check field modification).
5. **Orphaned Message**: Creating a message in a chat room the user is not part of.
6. **Shadow Field Injection**: Adding `isVerified: true` to an ad creation payload.
7. **Resource Poisoning**: Using a 1MB string as an ad `title`.
8. **Malicious ID**: Injecting a script tag or very long string into a document ID.
9. **Fake Timestamp**: Sending a `createdAt` from 2000 in the past.
10. **Notification Theft**: Reading `notifications` collection without `userId` filter.
11. **Illegal Report Resolution**: A regular user trying to update a report's status to 'RESOLVED'.
12. **Comment Hijacking**: Updating a comment text when the user is not the author.

## Test Runner Plan
I will implement `firestore.rules.test.ts` (conceptual for this environment, but I'll generate the rules and verify manually/via logic).

[Rules will follow in next step]
